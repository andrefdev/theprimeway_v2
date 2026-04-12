import { z } from 'zod'

export const subscriptionActionSchema = z.object({
  action: z.enum(['start_trial']),
})

export const checkoutSchema = z.object({
  variantId: z.string().min(1),
})

export type SubscriptionActionInput = z.infer<typeof subscriptionActionSchema>
export type CheckoutInput = z.infer<typeof checkoutSchema>
