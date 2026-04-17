import { cn } from '@/shared/lib/utils'

interface TabItem<T extends string> {
  key: T
  label: string
}

interface SectionTabsLocalProps<T extends string> {
  items: TabItem<T>[]
  value: T
  onChange: (key: T) => void
}

export function SectionTabsLocal<T extends string>({ items, value, onChange }: SectionTabsLocalProps<T>) {
  return (
    <nav className="border-b border-border">
      <div className="flex gap-1 overflow-x-auto px-6 no-scrollbar">
        {items.map((item) => {
          const isActive = item.key === value
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onChange(item.key)}
              className={cn(
                'whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {item.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
