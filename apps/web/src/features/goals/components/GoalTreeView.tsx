import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { goalsQueries } from '../queries'
import { GoalNode } from './GoalNode'
import { GoalDetailPanel } from './GoalDetailPanel'
import { GoalDialog, type GoalDialogPrefillParent } from './GoalDialog'
import { Button } from '@/shared/components/ui/button'
import { SkeletonList } from '@/shared/components/ui/skeleton-list'
import { QueryError } from '@/shared/components/QueryError'
import { PlusIcon } from '@/shared/components/Icons'
import { useTranslation } from 'react-i18next'
import type { PrimeVision, ThreeYearGoal, AnnualGoal, QuarterlyGoal, WeeklyGoal } from '@repo/shared/types'

interface ExpandedState {
  [key: string]: boolean
}

interface GoalWithNesting extends PrimeVision {
  threeYearGoals?: Array<
    ThreeYearGoal & {
      annualGoals?: Array<
        AnnualGoal & {
          quarterlyGoals?: Array<
            QuarterlyGoal & {
              weeklyGoals?: WeeklyGoal[]
            }
          >
        }
      >
    }
  >
}

export function GoalTreeView() {
  const { t } = useTranslation('goals')
  const treeQuery = useQuery(goalsQueries.tree())
  const [expandedNodes, setExpandedNodes] = useState<ExpandedState>({})
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [prefillParent, setPrefillParent] = useState<GoalDialogPrefillParent | null>(null)

  const visions = (treeQuery.data ?? []) as GoalWithNesting[]

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }))
  }

  if (treeQuery.isLoading) {
    return <SkeletonList lines={6} />
  }

  if (treeQuery.isError) {
    return (
      <QueryError
        message={t('failedToLoad')}
        onRetry={() => treeQuery.refetch()}
      />
    )
  }

  if (!visions || visions.length === 0) {
    // VisionEditor above the tree already prompts the user to create one.
    return null
  }

  function levelOf(goalId: string): GoalDialogPrefillParent['level'] | null {
    for (const v of visions) {
      if (v.id === goalId) return 'vision'
      for (const ty of v.threeYearGoals ?? []) {
        if (ty.id === goalId) return 'three-year'
        for (const an of ty.annualGoals ?? []) {
          if (an.id === goalId) return 'annual'
        }
      }
    }
    return null
  }

  function openAddChild(parentId: string) {
    const lvl = levelOf(parentId)
    if (!lvl) return
    setPrefillParent({ level: lvl, id: parentId })
    setDialogOpen(true)
  }

  function openCreateRoot() {
    setPrefillParent(null)
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
    setPrefillParent(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button onClick={openCreateRoot}>
          <PlusIcon /> {t('newGoal')}
        </Button>
      </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Tree View */}
      <div className="lg:col-span-2 space-y-6">
        {visions.map((vision) => (
          <div key={vision.id} className="space-y-2">
            {/* Vision Node */}
            <GoalNode
              id={vision.id}
              title={vision.title}
              progress={0}
              level="vision"
              hasChildren={!!(vision.threeYearGoals && vision.threeYearGoals.length > 0)}
              isExpanded={expandedNodes[vision.id] ?? true}
              onToggle={() => toggleNode(vision.id)}
              onSelect={() => setSelectedGoalId(vision.id)}
              onAddChild={openAddChild}
            />

            {/* Three-Year Goals */}
            {expandedNodes[vision.id] !== false &&
              vision.threeYearGoals?.map((threeYearGoal: any) => (
                <div key={threeYearGoal.id} className="space-y-2">
                  <GoalNode
                    id={threeYearGoal.id}
                    title={threeYearGoal.title || threeYearGoal.name}
                    progress={threeYearGoal.progress ?? 0}
                    level="three-year"
                    hasChildren={!!(threeYearGoal.annualGoals && threeYearGoal.annualGoals.length > 0)}
                    isExpanded={expandedNodes[threeYearGoal.id] ?? true}
                    onToggle={() => toggleNode(threeYearGoal.id)}
                    onSelect={() => setSelectedGoalId(threeYearGoal.id)}
                    onAddChild={openAddChild}
                  />

                  {/* Annual Goals */}
                  {expandedNodes[threeYearGoal.id] !== false &&
                    threeYearGoal.annualGoals?.map((annualGoal: any) => (
                      <div key={annualGoal.id} className="space-y-2">
                        <GoalNode
                          id={annualGoal.id}
                          title={annualGoal.title}
                          progress={annualGoal.progress ?? 0}
                          level="annual"
                          hasChildren={!!(annualGoal.quarterlyGoals && annualGoal.quarterlyGoals.length > 0)}
                          isExpanded={expandedNodes[annualGoal.id] ?? false}
                          onToggle={() => toggleNode(annualGoal.id)}
                          onSelect={() => setSelectedGoalId(annualGoal.id)}
                          onAddChild={openAddChild}
                        />

                        {/* Quarterly Goals */}
                        {expandedNodes[annualGoal.id] &&
                          annualGoal.quarterlyGoals?.map((quarterlyGoal: any) => (
                            <div key={quarterlyGoal.id} className="space-y-2">
                              <GoalNode
                                id={quarterlyGoal.id}
                                title={quarterlyGoal.title}
                                progress={quarterlyGoal.progress ?? 0}
                                level="quarterly"
                                hasChildren={!!(quarterlyGoal.weeklyGoals && quarterlyGoal.weeklyGoals.length > 0)}
                                isExpanded={expandedNodes[quarterlyGoal.id] ?? false}
                                onToggle={() => toggleNode(quarterlyGoal.id)}
                                onSelect={() => setSelectedGoalId(quarterlyGoal.id)}
                              />

                              {/* Weekly Goals */}
                              {expandedNodes[quarterlyGoal.id] &&
                                quarterlyGoal.weeklyGoals?.map((weeklyGoal: any) => (
                                  <GoalNode
                                    key={weeklyGoal.id}
                                    id={weeklyGoal.id}
                                    title={weeklyGoal.title}
                                    progress={0}
                                    level="weekly"
                                    hasChildren={false}
                                    isExpanded={false}
                                    onToggle={() => {}}
                                    onSelect={() => setSelectedGoalId(weeklyGoal.id)}
                                  />
                                ))}
                            </div>
                          ))}
                      </div>
                    ))}
                </div>
              ))}
          </div>
        ))}
      </div>

      {/* Detail Panel */}
      {selectedGoalId && (
        <GoalDetailPanel goalId={selectedGoalId} onClose={() => setSelectedGoalId(null)} />
      )}
    </div>
      <GoalDialog
        open={dialogOpen}
        onClose={closeDialog}
        goal={null}
        prefillParent={prefillParent}
      />
    </div>
  )
}
