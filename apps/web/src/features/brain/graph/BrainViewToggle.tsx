import { Link, useLocation } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { List, Network } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

export function BrainViewToggle() {
  const { t } = useTranslation('brain')
  const { pathname } = useLocation()
  const onGraph = pathname.startsWith('/brain/graph')

  return (
    <div className="inline-flex items-center rounded-md border bg-background p-0.5 text-sm">
      <Link
        to="/brain"
        className={cn(
          'flex items-center gap-1.5 rounded px-3 py-1 transition-colors',
          !onGraph ? 'bg-muted font-medium' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <List className="h-3.5 w-3.5" />
        {t('graph.listTabLabel')}
      </Link>
      <Link
        to="/brain/graph"
        className={cn(
          'flex items-center gap-1.5 rounded px-3 py-1 transition-colors',
          onGraph ? 'bg-muted font-medium' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <Network className="h-3.5 w-3.5" />
        {t('graph.tabLabel')}
      </Link>
    </div>
  )
}
