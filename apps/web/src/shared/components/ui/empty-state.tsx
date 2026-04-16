import { cn } from "@/shared/lib/utils"

interface EmptyStateProps {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 px-6 py-12 text-center",
      className
    )}>
      {icon && <div className="mb-3 text-muted-foreground">{icon}</div>}
      <p className="text-[15px] font-medium text-foreground">{title}</p>
      {description && <p className="mt-1 text-sm text-muted-foreground max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
