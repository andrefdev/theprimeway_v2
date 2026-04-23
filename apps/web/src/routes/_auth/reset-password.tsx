import { createFileRoute, redirect } from '@tanstack/react-router'

// Legacy link-based reset is replaced by the in-page OTP flow in /forgot-password.
export const Route = createFileRoute('/_auth/reset-password')({
  beforeLoad: () => {
    throw redirect({ to: '/forgot-password' })
  },
})
