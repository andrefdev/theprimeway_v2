import { Link } from '@tanstack/react-router'
import { Users, BarChart3, CreditCard, Bell, Sparkles } from 'lucide-react'
import { cn } from '@repo/ui'

const navItems = [
  {
    label: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
  },
  {
    label: 'Users',
    href: '/users',
    icon: Users,
  },
  {
    label: 'Plans',
    href: '/plans',
    icon: CreditCard,
  },
  {
    label: 'Notifications',
    href: '/notifications',
    icon: Bell,
  },
  {
    label: 'Ambassadors',
    href: '/ambassadors',
    icon: Sparkles,
  },
] as const

export function Sidebar() {
  return (
    <aside className="w-64 border-r bg-card">
      <div className="space-y-4 p-4">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.href} to={item.href as any}>
              {({ isActive }) => (
                <div
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </div>
              )}
            </Link>
          )
        })}
      </div>
    </aside>
  )
}
