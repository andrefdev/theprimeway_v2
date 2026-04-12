import { createFileRoute, Navigate } from '@tanstack/react-router'

function IndexPage() {
  return <Navigate to="/_admin/users" />
}

export const Route = createFileRoute('/')({
  component: IndexPage,
})
