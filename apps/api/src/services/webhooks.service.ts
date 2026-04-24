import { randomBytes, createHmac } from 'node:crypto'
import { webhooksRepo, type WebhookCreate } from '../repositories/webhooks.repo'

export type WebhookEvent = 'task.completed' | 'task.created' | 'task.updated' | 'goal.completed'

const ALLOWED_EVENTS: WebhookEvent[] = ['task.completed', 'task.created', 'task.updated', 'goal.completed']

class WebhooksService {
  list(userId: string) { return webhooksRepo.list(userId) }

  async create(userId: string, input: { url: string; events: string[]; isActive?: boolean }) {
    const events = input.events.filter((e): e is WebhookEvent => ALLOWED_EVENTS.includes(e as WebhookEvent))
    if (events.length === 0) return { ok: false as const, reason: 'invalid_events' as const }
    const secret = `whsec_${randomBytes(24).toString('base64url')}`
    const record = await webhooksRepo.create(userId, {
      url: input.url,
      events,
      secret,
      isActive: input.isActive ?? true,
    })
    return { ok: true as const, webhook: record }
  }

  async update(userId: string, id: string, data: Partial<WebhookCreate>) {
    if (data.events) {
      data.events = data.events.filter((e): e is WebhookEvent => ALLOWED_EVENTS.includes(e as WebhookEvent))
    }
    const record = await webhooksRepo.update(id, userId, data)
    if (!record) return { ok: false as const, reason: 'not_found' as const }
    return { ok: true as const, webhook: record }
  }

  delete(userId: string, id: string) { return webhooksRepo.delete(id, userId) }

  allowedEvents(): WebhookEvent[] { return [...ALLOWED_EVENTS] }

  /**
   * Fire-and-forget delivery. Iterates active webhooks matching the event,
   * signs payload with HMAC-SHA256, POSTs JSON, records response code.
   * Errors are logged but never thrown.
   */
  async dispatch(userId: string, event: WebhookEvent, data: unknown) {
    const hooks = await webhooksRepo.findActiveForEvent(userId, event)
    if (hooks.length === 0) return
    const body = JSON.stringify({ event, occurredAt: new Date().toISOString(), data })
    await Promise.all(
      hooks.map(async (hook: { id: string; url: string; secret: string }) => {
        const signature = createHmac('sha256', hook.secret).update(body).digest('hex')
        try {
          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 5000)
          const res = await fetch(hook.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Primeway-Signature': `sha256=${signature}`,
              'X-Primeway-Event': event,
              'User-Agent': 'theprimeway-webhooks/1.0',
            },
            body,
            signal: controller.signal,
          })
          clearTimeout(timeout)
          webhooksRepo.recordDelivery(hook.id, res.status).catch(() => undefined)
        } catch (err) {
          console.error('[WEBHOOK_DISPATCH]', hook.id, (err as Error).message)
          webhooksRepo.recordDelivery(hook.id, 0).catch(() => undefined)
        }
      }),
    )
  }
}

export const webhooksService = new WebhooksService()
