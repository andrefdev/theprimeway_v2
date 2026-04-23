import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/components/ui/button'
import { Plus, Play } from 'lucide-react'
import { TaskDialog } from '@/features/tasks/components/TaskDialog'

export function DashboardQuickActions() {
  const { t } = useTranslation('dashboard')
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)

  return (
    <>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button
          variant="ghost"
          onClick={() => setTaskDialogOpen(true)}
          className="w-full justify-start gap-3 border py-6 border-border hover:bg-muted/40"
        >
          <Plus className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{t('addTask', { ns: 'tasks' })}</span>
        </Button>
        <Link to="/pomodoro">
          <Button variant="ghost" className="w-full justify-start gap-3 border py-6 :border-border hover:bg-muted/40">
            <Play className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{t('startFocus')}</span>
          </Button>
        </Link>
        {/*
        <Link to="/notes">
          <Button variant="ghost" className="w-full justify-start gap-3 border border-transparent py-6 hover:border-border hover:bg-muted/40">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{t('addNote')}</span>
          </Button>
        </Link>
        */}
      </div>
      <TaskDialog open={taskDialogOpen} onClose={() => setTaskDialogOpen(false)} />
    </>
  )
}
