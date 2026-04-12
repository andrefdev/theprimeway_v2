import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { useAuthStore } from '@/features/auth/store'
import { LogOut } from 'lucide-react'
import { Button } from '@repo/ui'

function RootLayout() {
  const { user, logout } = useAuthStore()

  if (!user) {
    return <Outlet />
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <h1 className="text-lg font-bold">ThePrimeWay Admin</h1>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                logout()
                window.location.href = '/login'
              }}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-background">
        <Outlet />
      </main>
    </div>
  )
}

export const Route = createRootRoute({
  component: RootLayout,
})
