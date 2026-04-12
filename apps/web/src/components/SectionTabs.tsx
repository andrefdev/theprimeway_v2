import { Link, useLocation } from '@tanstack/react-router'
import { cn } from '@/lib/utils'

interface TabItem {
  to: string
  label: string
}

interface SectionTabsProps {
  items: TabItem[]
  /** Base path for "exact match" on root tab (e.g. '/finances') */
  basePath?: string
}

export function SectionTabs({ items, basePath }: SectionTabsProps) {
  const location = useLocation()

  return (
    <nav className="border-b border-border">
      <div className="flex gap-1 overflow-x-auto px-6 no-scrollbar">
        {items.map((item) => {
          const isExact = basePath && item.to === basePath
          const isActive = isExact
            ? location.pathname === basePath || location.pathname === `${basePath}/`
            : location.pathname.startsWith(item.to)

          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
