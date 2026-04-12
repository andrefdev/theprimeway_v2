import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { goalsQueries } from '../queries'
import { GoalNode } from './GoalNode'
import { GoalDetailPanel } from './GoalDetailPanel'
import { SkeletonList } from '@/components/ui/skeleton-list'
import { EmptyState } from '@/components/ui/empty-state'
import { QueryError } from '@/components/query-error'
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
    return (
      <EmptyState
        title={t('noVision')}
        description={t('noVisionDescription')}
      />
    )
  }

  return (
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
  )
}
