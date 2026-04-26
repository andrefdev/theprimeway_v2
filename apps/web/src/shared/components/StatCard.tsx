import { Card } from '@/shared/components/ui/card'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { Link } from '@tanstack/react-router'

interface StatCardProps {
  title: string
  value: string
  subtitle?: string
  to?: string
  loading?: boolean
}

export function StatCard({ title, value, subtitle, to, loading }: StatCardProps) {
  const content = (
    <Card className="p-5 transition-colors hover:bg-muted/40">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
      {loading ? (
        <>
          <Skeleton className="mt-1.5 h-7 w-20" />
          <Skeleton className="mt-2 h-3 w-28" />
        </>
      ) : (
        <>
          <p className="mt-1.5 text-2xl font-semibold text-foreground">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
        </>
      )}
    </Card>
  )

  if (to) {
    return <Link to={to}>{content}</Link>
  }

  return content
}
