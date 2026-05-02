import { OpenAPIHono } from '@hono/zod-openapi'
import { authMiddleware } from '../middleware/auth'
import { ambassadorService, type ApplyInput } from '../services/ambassador.service'
import type { AmbassadorPlatform } from '@prisma/client'

export const ambassadorRoutes = new OpenAPIHono()
export const referralPublicRoutes = new OpenAPIHono()

// ─── Public — referral code validation ─────────────────────────────────────

referralPublicRoutes.get('/validate/:code', async (c) => {
  const code = c.req.param('code')
  if (!code) return c.json({ error: 'code required' }, 400)
  const data = await ambassadorService.validateCode(code)
  if (!data) return c.json({ data: null, valid: false })
  return c.json({ data, valid: true })
})

// ─── Authenticated routes ──────────────────────────────────────────────────

ambassadorRoutes.use('*', authMiddleware)

const VALID_PLATFORMS = ['YOUTUBE', 'INSTAGRAM', 'TIKTOK', 'TWITTER', 'NEWSLETTER', 'BLOG', 'PODCAST', 'LINKEDIN', 'OTHER'] as const

function asString(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim() : null
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
}

ambassadorRoutes.get('/me', async (c) => {
  const userId = (c as any).get('user').userId
  const data = await ambassadorService.getMine(userId)
  return c.json({ data })
})

ambassadorRoutes.post('/apply', async (c) => {
  const userId = (c as any).get('user').userId
  const body = await c.req.json().catch(() => ({}))

  const fullName = asString(body.fullName)
  const country = asString(body.country)
  const primaryPlatform = asString(body.primaryPlatform)
  const primaryHandle = asString(body.primaryHandle)
  const motivation = asString(body.motivation)

  if (!fullName) return c.json({ error: 'fullName requerido' }, 400)
  if (!country || country.length !== 2) return c.json({ error: 'country inválido (ISO-2)' }, 400)
  if (!primaryPlatform || !(VALID_PLATFORMS as readonly string[]).includes(primaryPlatform)) {
    return c.json({ error: 'primaryPlatform inválido' }, 400)
  }
  if (!primaryHandle) return c.json({ error: 'primaryHandle requerido' }, 400)
  if (!motivation || motivation.length < 100) return c.json({ error: 'motivation mínimo 100 caracteres' }, 400)
  if (motivation.length > 1500) return c.json({ error: 'motivation máximo 1500 caracteres' }, 400)
  if (body.agreedToTerms !== true) return c.json({ error: 'Debes aceptar los términos' }, 400)

  const input: ApplyInput = {
    fullName,
    contactPhone: asString(body.contactPhone),
    country: country.toUpperCase(),
    primaryPlatform: primaryPlatform as AmbassadorPlatform,
    primaryHandle,
    audienceSize: typeof body.audienceSize === 'number' ? body.audienceSize : null,
    niche: asString(body.niche),
    motivation,
    promoChannels: asStringArray(body.promoChannels),
    sampleUrls: asStringArray(body.sampleUrls).slice(0, 3),
    socialLinks: typeof body.socialLinks === 'object' && body.socialLinks ? body.socialLinks : null,
    agreedToTerms: true,
  }

  try {
    const ambassador = await ambassadorService.apply(userId, input)
    return c.json({ data: ambassador }, 201)
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400)
  }
})

ambassadorRoutes.get('/dashboard', async (c) => {
  const userId = (c as any).get('user').userId
  const data = await ambassadorService.dashboard(userId)
  if (!data) return c.json({ error: 'No eres embajador aprobado' }, 403)
  return c.json({ data })
})

ambassadorRoutes.get('/referrals', async (c) => {
  const userId = (c as any).get('user').userId
  const skip = Number(c.req.query('skip') || 0)
  const take = Number(c.req.query('take') || 50)
  const data = await ambassadorService.listReferrals(userId, { skip, take })
  return c.json({ data })
})

ambassadorRoutes.get('/commissions', async (c) => {
  const userId = (c as any).get('user').userId
  const skip = Number(c.req.query('skip') || 0)
  const take = Number(c.req.query('take') || 100)
  const data = await ambassadorService.listCommissions(userId, { skip, take })
  return c.json({ data })
})

ambassadorRoutes.patch('/payout-method', async (c) => {
  const userId = (c as any).get('user').userId
  const body = await c.req.json().catch(() => ({}))
  const method = asString(body.method)
  if (!method || !['paypal', 'wise', 'bank'].includes(method)) {
    return c.json({ error: 'method inválido (paypal|wise|bank)' }, 400)
  }
  const details = typeof body.details === 'object' && body.details ? body.details : {}
  try {
    const data = await ambassadorService.setPayoutMethod(userId, method, details)
    return c.json({ data })
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400)
  }
})

// ─── Referral redemption (authenticated, used by onboarding) ───────────────

ambassadorRoutes.post('/referral/redeem', async (c) => {
  const userId = (c as any).get('user').userId
  const body = await c.req.json().catch(() => ({}))
  const code = asString(body.code)
  if (!code) return c.json({ error: 'code requerido' }, 400)
  try {
    const data = await ambassadorService.redeemCode(userId, code)
    return c.json({ data })
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400)
  }
})
