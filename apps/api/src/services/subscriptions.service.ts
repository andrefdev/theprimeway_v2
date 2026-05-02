import { subscriptionsRepo } from '../repositories/subscriptions.repo'
import { bustFeatureCache } from './features.service'
import { commissionService } from './commission.service'
import * as crypto from 'crypto'

function verifyLemonSqueezySignature(rawBody: string, signature: string): boolean {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET
  if (!secret) return false

  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(rawBody)
  const digest = hmac.digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))
}

function mapLsStatus(lsStatus: string): string {
  switch (lsStatus) {
    case 'active':
      return 'active'
    case 'on_trial':
      return 'trialing'
    case 'paused':
      return 'paused'
    case 'past_due':
      return 'past_due'
    case 'cancelled':
      return 'cancelled'
    case 'expired':
      return 'expired'
    default:
      return lsStatus
  }
}

class SubscriptionsService {
  async getPlans() {
    return subscriptionsRepo.findActivePlans()
  }

  async getStatus(userId: string) {
    const subscription = await subscriptionsRepo.findLatestSubscription(userId)

    if (!subscription) {
      return {
        status: 'none',
        plan: null,
        trial_ends_at: null,
        current_period_end: null,
      }
    }

    return {
      status: subscription.status,
      plan: subscription.plan || null,
      trial_ends_at: subscription.trialEndsAt?.toISOString() || null,
      current_period_end: subscription.endsAt?.toISOString() || null,
      cancel_at_period_end: !!subscription.cancelledAt,
      lemon_squeezy_id: subscription.lemonSqueezySubscriptionId || null,
    }
  }

  async startTrial(userId: string) {
    const existing = await subscriptionsRepo.findSubscriptionByUser(userId)
    if (existing) {
      return { error: 'already_exists' as const }
    }

    const trialDays = 7
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + trialDays)

    const sub = await subscriptionsRepo.createSubscription({
      userId,
      status: 'trialing',
      trialStartsAt: new Date(),
      trialEndsAt,
      endsAt: trialEndsAt,
      amount: 0,
      billingInterval: 'monthly',
      startsAt: new Date(),
    })

    return { data: sub }
  }

  async createCheckout(userId: string, userEmail: string, variantId: string) {
    const lsApiKey = process.env.LEMON_SQUEEZY_API_KEY
    const lsStoreId = process.env.LEMON_SQUEEZY_STORE_ID

    if (!lsApiKey || !lsStoreId) {
      return { error: 'not_configured' as const }
    }

    const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${lsApiKey}`,
        'Content-Type': 'application/vnd.api+json',
        Accept: 'application/vnd.api+json',
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            custom_price: null,
            product_options: {
              redirect_url: `${process.env.APP_URL || 'https://app.theprimeway.app'}/settings?subscription=success`,
            },
            checkout_data: {
              email: userEmail,
              custom: { user_id: userId },
            },
          },
          relationships: {
            store: { data: { type: 'stores', id: lsStoreId } },
            variant: { data: { type: 'variants', id: String(variantId) } },
          },
        },
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('[CHECKOUT] Lemon Squeezy error:', errText)
      return { error: 'checkout_failed' as const }
    }

    const result = (await response.json()) as { data: { attributes: { url: string } } }
    return { url: result.data.attributes.url }
  }

  async handleWebhook(rawBody: string, signature: string) {
    if (!verifyLemonSqueezySignature(rawBody, signature)) {
      return { error: 'invalid_signature' as const }
    }

    const payload = JSON.parse(rawBody) as {
      meta: { event_name: string; custom_data?: { user_id?: string } }
      data: {
        id: string
        attributes: {
          status: string
          variant_id: number
          trial_ends_at?: string
          renews_at?: string
          ends_at?: string
          cancelled?: boolean
        }
      }
    }

    const eventName = payload.meta.event_name
    const userId = payload.meta.custom_data?.user_id
    const subData = payload.data.attributes
    const lemonSqueezySubscriptionId = payload.data.id

    if (!userId) {
      console.error('[WEBHOOK] No user_id in custom_data')
      return { ok: true }
    }

    switch (eventName) {
      case 'subscription_created':
      case 'subscription_updated': {
        await subscriptionsRepo.upsertSubscriptionByLsId(
          lemonSqueezySubscriptionId,
          {
            status: mapLsStatus(subData.status),
            endsAt: subData.renews_at ? new Date(subData.renews_at) : null,
            trialEndsAt: subData.trial_ends_at ? new Date(subData.trial_ends_at) : null,
            cancelledAt: subData.cancelled ? new Date() : null,
          },
          {
            userId,
            lemonSqueezySubscriptionId,
            status: mapLsStatus(subData.status),
            amount: 0,
            billingInterval: 'monthly',
            startsAt: new Date(),
            endsAt: subData.renews_at ? new Date(subData.renews_at) : null,
            trialEndsAt: subData.trial_ends_at ? new Date(subData.trial_ends_at) : null,
          },
        )
        bustFeatureCache(userId)
        if (mapLsStatus(subData.status) === 'active') {
          commissionService.onSubscriptionPaymentSuccess(userId).catch((e) => console.error('[REFERRAL_HOOK]', e))
        }
        break
      }
      case 'subscription_payment_success': {
        commissionService.onSubscriptionPaymentSuccess(userId).catch((e) => console.error('[REFERRAL_HOOK]', e))
        break
      }
      case 'subscription_cancelled':
      case 'subscription_expired': {
        await subscriptionsRepo.updateManyByLsId(lemonSqueezySubscriptionId, {
          status: eventName === 'subscription_cancelled' ? 'cancelled' : 'expired',
          cancelledAt: new Date(),
        })
        bustFeatureCache(userId)
        commissionService.onSubscriptionCancelled(userId).catch((e) => console.error('[REFERRAL_HOOK]', e))
        break
      }
    }

    return { ok: true }
  }
}

export const subscriptionsService = new SubscriptionsService()
