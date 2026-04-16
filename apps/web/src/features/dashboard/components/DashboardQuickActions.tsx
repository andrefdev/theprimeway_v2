import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/components/ui/button'
import { Plus, Play, Wallet, FileText } from 'lucide-react'

export function DashboardQuickActions() {
  const { t } = useTranslation('dashboard')

  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
      <Link to="/tasks/today">
        <Button variant="ghost" className="w-full justify-start gap-3 border border-transparent py-6 hover:border-border hover:bg-muted/40">
          <Plus className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{t('addTask', { ns: 'tasks' })}</span>
        </Button>
      </Link>
      <Link to="/pomodoro">
        <Button variant="ghost" className="w-full justify-start gap-3 border border-transparent py-6 hover:border-border hover:bg-muted/40">
          <Play className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{t('startFocus')}</span>
        </Button>
      </Link>
      <Link to="/finances/history">
        <Button variant="ghost" className="w-full justify-start gap-3 border border-transparent py-6 hover:border-border hover:bg-muted/40">
          <Wallet className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{t('addTransaction')}</span>
        </Button>
      </Link>
      <Link to="/notes">
        <Button variant="ghost" className="w-full justify-start gap-3 border border-transparent py-6 hover:border-border hover:bg-muted/40">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{t('addNote')}</span>
        </Button>
      </Link>
    </div>
  )
}
