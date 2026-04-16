import { Card } from '@/shared/components/ui/card'
import { Link } from '@tanstack/react-router'

interface StatCardProps {
  title: string
  value: string
  subtitle?: string
  to?: string
}

export function StatCard({ title, value, subtitle, to }: StatCardProps) {
  const content = (
    <Card className="p-5 transition-colors hover:bg-muted/40">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
      <p className="mt-1.5 text-2xl font-semibold text-foreground">{value}</p>
      {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
    </Card>
  )

  if (to) {
    return <Link to={to}>{content}</Link>
  }

  return content
}
