import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

function IndexPage() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate({ to: '/users' })
  }, [navigate])

  return null
}

export const Route = createFileRoute('/')({
  component: IndexPage,
})
