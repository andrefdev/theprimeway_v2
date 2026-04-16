import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { tasksQueries } from '@/features/tasks/queries'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Sparkles, ArrowRight } from 'lucide-react'

export function NextTaskCard() {
  const { t } = useTranslation('dashboard')
  const { data, isLoading } = useQuery(tasksQueries.nextTask())

  if (isLoading || !data) return null

  return (
    <Card className="border-blue-500/20 bg-gradient-to-br from-card to-blue-950/5">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="size-4 text-blue-500 shrink-0" />
              <span className="text-xs font-medium text-blue-500">{t('nextTaskSuggestion')}</span>
            </div>
            <h4 className="text-sm font-semibold text-foreground truncate">{data.title}</h4>
            <p className="text-xs text-muted-foreground mt-0.5">{data.reason}</p>
          </div>
          <Button variant="ghost" size="sm" asChild className="shrink-0">
            <Link to="/tasks/today">
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
