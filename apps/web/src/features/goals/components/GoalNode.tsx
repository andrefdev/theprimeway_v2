import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/shared/utils/cn'

interface GoalNodeProps {
  id: string
  title: string
  progress: number
  level: 'vision' | 'three-year' | 'annual' | 'quarterly' | 'weekly'
  hasChildren: boolean
  isExpanded: boolean
  onToggle: () => void
  onSelect: (goalId: string) => void
}

type HealthStatus = 'green' | 'yellow' | 'red'

function getHealthStatus(progress: number): HealthStatus {
  if (progress >= 75) return 'green'
  if (progress >= 50) return 'yellow'
  return 'red'
}

function getHealthColor(status: HealthStatus): string {
  switch (status) {
    case 'green':
      return 'bg-green-500'
    case 'yellow':
      return 'bg-yellow-500'
    case 'red':
      return 'bg-red-500'
  }
}

function getLevelLabel(level: string): string {
  switch (level) {
    case 'vision':
      return 'Vision'
    case 'three-year':
      return '3-Year'
    case 'annual':
      return 'Annual'
    case 'quarterly':
      return 'Quarterly'
    case 'weekly':
      return 'Weekly'
    default:
      return ''
  }
}

function getLevelIndent(level: string): number {
  switch (level) {
    case 'vision':
      return 0
    case 'three-year':
      return 1
    case 'annual':
      return 2
    case 'quarterly':
      return 3
    case 'weekly':
      return 4
    default:
      return 0
  }
}

export function GoalNode({
  id,
  title,
  progress,
  level,
  hasChildren,
  isExpanded,
  onToggle,
  onSelect,
}: GoalNodeProps) {
  const [isHovered, setIsHovered] = useState(false)
  const healthStatus = getHealthStatus(progress)
  const indent = getLevelIndent(level)
  const levelLabel = getLevelLabel(level)

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ marginLeft: `${indent * 1.5}rem` }}
      className="space-y-1"
    >
      {/* Node Header */}
      <div
        className={cn(
          'group rounded-lg border transition-colors p-3',
          isHovered ? 'border-primary/50 bg-primary/5' : 'border-border bg-card'
        )}
      >
        <div className="flex items-start gap-2">
          {/* Toggle Button */}
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 shrink-0"
              onClick={onToggle}
            >
              {isExpanded ? (
                <ChevronDown size={16} className="text-muted-foreground" />
              ) : (
                <ChevronRight size={16} className="text-muted-foreground" />
              )}
            </Button>
          )}
          {!hasChildren && <div className="h-6 w-6 shrink-0" />}

          {/* Content */}
          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => onSelect(id)}
          >
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] shrink-0">
                {levelLabel}
              </Badge>
              <h4 className="text-sm font-medium text-foreground truncate">
                {title}
              </h4>
            </div>

            {/* Progress Bar */}
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  {progress}%
                </span>
                <div
                  className={cn(
                    'h-2 w-2 rounded-full shrink-0',
                    getHealthColor(healthStatus)
                  )}
                />
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
