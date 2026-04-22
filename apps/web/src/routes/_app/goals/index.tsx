import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/goals/')({
  beforeLoad: () => {
    throw redirect({ to: '/goals/mine' })
  },
})
