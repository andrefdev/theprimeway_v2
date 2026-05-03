import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useUpdateThreeYearGoal,
  useDeleteThreeYearGoal,
  useUpdateAnnualGoal,
  useDeleteAnnualGoal,
  useUpdateQuarterlyGoal,
  useDeleteQuarterlyGoal,
  useGoalDetail,
} from '../queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { useLocale } from '@/i18n/useLocale'
import { formatDate } from '@/i18n/format'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Label } from '@/shared/components/ui/label'
import { Progress } from '@/shared/components/ui/progress'
import { Badge } from '@/shared/components/ui/badge'
import { X, Trash2, Edit2, Save } from 'lucide-react'
import { toast } from 'sonner'

interface GoalDetailPanelProps {
  goalId: string
  onClose: () => void
}

type GoalType = 'three-year' | 'annual' | 'quarterly' | 'vision'

export function GoalDetailPanel({ goalId, onClose }: GoalDetailPanelProps) {
  const { t } = useTranslation('goals')
  const { locale } = useLocale()
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  const [editedDescription, setEditedDescription] = useState('')
  const [editedProgress, setEditedProgress] = useState(0)
  const [goalType, setGoalType] = useState<GoalType>('three-year')
  const goalDetail = useGoalDetail(goalId)
  const updateThreeYearGoal = useUpdateThreeYearGoal()
  const deleteThreeYearGoal = useDeleteThreeYearGoal()
  const updateAnnualGoal = useUpdateAnnualGoal()
  const deleteAnnualGoal = useDeleteAnnualGoal()
  const updateQuarterlyGoal = useUpdateQuarterlyGoal()
  const deleteQuarterlyGoal = useDeleteQuarterlyGoal()

  const goal = goalDetail.data

  useEffect(() => {
    if (goal) {
      setEditedTitle(goal.title || goal.name || '')
      setEditedDescription(goal.description || '')
      setEditedProgress(goal.progress ?? 0)
      if (goalDetail.goalType) {
        setGoalType(goalDetail.goalType)
      }
    }
  }, [goal, goalDetail.goalType])

  const handleSave = async () => {
    if (!goal) return
    try {
      const updateData = {
        title: editedTitle,
        description: editedDescription,
        progress: editedProgress,
      }

      switch (goalType) {
        case 'three-year':
          await updateThreeYearGoal.mutateAsync({ id: goalId, data: updateData as any })
          break
        case 'annual':
          await updateAnnualGoal.mutateAsync({ id: goalId, data: updateData as any })
          break
        case 'quarterly':
          await updateQuarterlyGoal.mutateAsync({ id: goalId, data: updateData as any })
          break
        case 'vision':
          break
      }

      toast.success(t('toast.updated', { defaultValue: 'Goal updated' }))
      setIsEditing(false)
    } catch {
      toast.error(t('toast.updateFailed', { defaultValue: 'Failed to update goal' }))
    }
  }

  const handleDelete = async () => {
    if (!confirm(t('toast.deleteConfirm', { defaultValue: 'Are you sure you want to delete this goal?' }))) return

    try {
      switch (goalType) {
        case 'three-year':
          await deleteThreeYearGoal.mutateAsync(goalId)
          break
        case 'annual':
          await deleteAnnualGoal.mutateAsync(goalId)
          break
        case 'quarterly':
          await deleteQuarterlyGoal.mutateAsync(goalId)
          break
        case 'vision':
          break
      }

      toast.success(t('toast.deleted', { defaultValue: 'Goal deleted' }))
      onClose()
    } catch {
      toast.error(t('toast.deleteFailed', { defaultValue: 'Failed to delete goal' }))
    }
  }

  if (goalDetail.isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-4 bg-muted rounded animate-pulse" />
        </CardHeader>
      </Card>
    )
  }

  if (!goal) {
    return (
      <Card>
        <CardHeader>
          <p className="text-sm text-muted-foreground">{t('toast.notFound', { defaultValue: 'Goal not found' })}</p>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="sticky top-6 h-fit">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base">Details</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X size={16} />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Type Badge */}
        <Badge variant="outline" className="w-fit">
          {goalType.replace('-', ' ').toUpperCase()}
        </Badge>

        {/* Title */}
        <div className="space-y-1.5">
          <Label className="text-xs">{isEditing ? 'Edit Title' : 'Title'}</Label>
          {isEditing ? (
            <Input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="text-sm"
            />
          ) : (
            <p className="text-sm font-medium text-foreground">{editedTitle}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label className="text-xs">Description</Label>
          {isEditing ? (
            <Textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              className="text-sm min-h-20"
              placeholder="Add notes..."
            />
          ) : (
            <p className="text-xs text-muted-foreground">
              {editedDescription || 'No description'}
            </p>
          )}
        </div>

        {/* Progress */}
        {['three-year', 'annual', 'quarterly'].includes(goalType) && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Progress</Label>
              <span className="text-xs font-medium">{editedProgress}%</span>
            </div>
            {isEditing ? (
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={editedProgress}
                onChange={(e) => setEditedProgress(Number(e.target.value))}
                className="w-full h-2 bg-border rounded-lg cursor-pointer accent-primary"
              />
            ) : (
              <Progress value={editedProgress} className="h-1.5" />
            )}
          </div>
        )}

        {/* Created Date */}
        <div className="space-y-1.5 text-xs">
          <Label className="text-xs">Created</Label>
          <p className="text-muted-foreground">
            {formatDate(goal.createdAt, locale)}
          </p>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          {isEditing ? (
            <>
              <Button
                size="sm"
                variant="default"
                onClick={handleSave}
                disabled={updateThreeYearGoal.isPending || updateAnnualGoal.isPending || updateQuarterlyGoal.isPending || !editedTitle.trim()}
              >
                <Save size={14} /> Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 size={14} /> Edit
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteThreeYearGoal.isPending || deleteAnnualGoal.isPending || deleteQuarterlyGoal.isPending}
              >
                <Trash2 size={14} /> Delete
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
