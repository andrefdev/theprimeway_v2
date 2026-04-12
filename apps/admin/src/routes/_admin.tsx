import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useAuthStore } from '@/features/auth/store'
import { Sidebar } from '@/components/layout/sidebar'

function AdminLayout() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    if (!user) {
      navigate({ to: '/login' })
    }
  }, [user, navigate])

  if (!user) {
    return null
  }

  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_admin')({
  component: AdminLayout,
})
