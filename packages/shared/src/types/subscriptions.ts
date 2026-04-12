export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: number
  currency: string
  interval: 'monthly' | 'yearly'
  variantId: string
  features: string[]
}

export interface SubscriptionStatus {
  tier: 'free' | 'trial' | 'premium'
  isActive: boolean
  trialEndsAt: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
}
