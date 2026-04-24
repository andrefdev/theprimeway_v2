import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { goalsQueries } from '@/features/goals/queries'
import { useVision } from '../queries'
import type { PrimeVision, ThreeYearGoal, AnnualGoal, QuarterlyGoal, WeeklyGoal } from '@repo/shared/types'

interface GoalWithNesting extends PrimeVision {
  threeYearGoals?: Array<
    ThreeYearGoal & {
      annualGoals?: Array<
        AnnualGoal & {
          quarterlyGoals?: Array<
            QuarterlyGoal & { weeklyGoals?: WeeklyGoal[] }
          >
        }
      >
    }
  >
}

interface Node {
  id: string
  title: string
  ring: number // 0 center, 1 3yr, 2 annual, 3 quarter, 4 weekly
  startAngle: number
  endAngle: number
  parentId: string | null
}

// Concentric ring radii (as % of viewBox half-width).
const RADII = [0, 130, 220, 300, 370]
const RING_COLORS = ['hsl(var(--primary))', '#6366f1', '#0ea5e9', '#10b981', '#f59e0b']
const RING_LABELS = ['Vision', '3 Year', '1 Year', 'Quarter', 'Week']

function buildNodes(vision: GoalWithNesting | null): Node[] {
  if (!vision) return []
  const nodes: Node[] = []
  const rootId = `v_${vision.id}`
  nodes.push({ id: rootId, title: vision.title, ring: 0, startAngle: 0, endAngle: 2 * Math.PI, parentId: null })

  const threeYr = vision.threeYearGoals ?? []
  if (threeYr.length === 0) return nodes
  const sliceA = (2 * Math.PI) / threeYr.length
  threeYr.forEach((ty, i) => {
    const a0 = i * sliceA
    const a1 = a0 + sliceA
    const tyId = `ty_${ty.id}`
    nodes.push({ id: tyId, title: (ty as any).name ?? (ty as any).title ?? 'Untitled', ring: 1, startAngle: a0, endAngle: a1, parentId: rootId })

    const annuals = ty.annualGoals ?? []
    if (annuals.length === 0) return
    const sliceB = sliceA / annuals.length
    annuals.forEach((an, j) => {
      const b0 = a0 + j * sliceB
      const b1 = b0 + sliceB
      const anId = `an_${an.id}`
      nodes.push({ id: anId, title: (an as any).title ?? 'Untitled', ring: 2, startAngle: b0, endAngle: b1, parentId: tyId })

      const quarters = an.quarterlyGoals ?? []
      if (quarters.length === 0) return
      const sliceC = sliceB / quarters.length
      quarters.forEach((q, k) => {
        const c0 = b0 + k * sliceC
        const c1 = c0 + sliceC
        const qId = `q_${q.id}`
        nodes.push({ id: qId, title: (q as any).title ?? 'Untitled', ring: 3, startAngle: c0, endAngle: c1, parentId: anId })

        const weeks = q.weeklyGoals ?? []
        if (weeks.length === 0) return
        const sliceD = sliceC / weeks.length
        weeks.forEach((w, m) => {
          const d0 = c0 + m * sliceD
          const d1 = d0 + sliceD
          nodes.push({ id: `w_${w.id}`, title: (w as any).title ?? 'Untitled', ring: 4, startAngle: d0, endAngle: d1, parentId: qId })
        })
      })
    })
  })

  return nodes
}

function angleToXY(angle: number, radius: number): [number, number] {
  // Start at top (angle 0 = -π/2 offset), clockwise.
  const a = angle - Math.PI / 2
  return [Math.cos(a) * radius, Math.sin(a) * radius]
}

function arcPath(startA: number, endA: number, rInner: number, rOuter: number): string {
  const [x1o, y1o] = angleToXY(startA, rOuter)
  const [x2o, y2o] = angleToXY(endA, rOuter)
  const [x1i, y1i] = angleToXY(endA, rInner)
  const [x2i, y2i] = angleToXY(startA, rInner)
  const large = endA - startA > Math.PI ? 1 : 0
  return [
    `M ${x1o} ${y1o}`,
    `A ${rOuter} ${rOuter} 0 ${large} 1 ${x2o} ${y2o}`,
    `L ${x1i} ${y1i}`,
    `A ${rInner} ${rInner} 0 ${large} 0 ${x2i} ${y2i}`,
    'Z',
  ].join(' ')
}

function centroid(startA: number, endA: number, ring: number): [number, number] {
  const midA = (startA + endA) / 2
  const rInner = RADII[ring - 1] ?? 0
  const rOuter = RADII[ring] ?? 0
  return angleToXY(midA, (rInner + rOuter) / 2)
}

export function VisionMap() {
  const { data: vision } = useVision()
  const treeQuery = useQuery(goalsQueries.tree())
  const [hoverId, setHoverId] = useState<string | null>(null)

  const nodes = useMemo(() => {
    const visions = (treeQuery.data ?? []) as GoalWithNesting[]
    return buildNodes(visions[0] ?? null)
  }, [treeQuery.data])

  const highlighted = useMemo(() => {
    if (!hoverId) return new Set<string>()
    const set = new Set<string>([hoverId])
    const byId = new Map(nodes.map((n) => [n.id, n]))
    // Climb parents
    let cur = byId.get(hoverId)
    while (cur?.parentId) {
      set.add(cur.parentId)
      cur = byId.get(cur.parentId)
    }
    // Descend children
    const queue = [hoverId]
    while (queue.length) {
      const id = queue.shift()!
      for (const n of nodes) {
        if (n.parentId === id) {
          set.add(n.id)
          queue.push(n.id)
        }
      }
    }
    return set
  }, [hoverId, nodes])

  if (treeQuery.isLoading) return <div className="text-xs text-muted-foreground p-6">Loading map…</div>

  if (!vision) {
    return (
      <div className="rounded-md border border-border/50 p-6 text-center text-sm text-muted-foreground">
        Write your 10-year vision first — the map grows around it.
      </div>
    )
  }

  if (nodes.length <= 1) {
    return (
      <div className="rounded-md border border-border/50 p-6 text-center text-sm text-muted-foreground">
        Add 3-year goals to start seeing the map.
      </div>
    )
  }

  const size = 800
  const viewBox = `-${size / 2} -${size / 2} ${size} ${size}`

  return (
    <div className="rounded-md border border-border/50 bg-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold">Vision map</h3>
          <p className="text-xs text-muted-foreground">Radial view of your full hierarchy. Hover any node to highlight its chain.</p>
        </div>
        <div className="flex gap-2 text-[10px]">
          {RING_LABELS.map((l, i) => (
            <span key={l} className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: RING_COLORS[i] }} />
              {l}
            </span>
          ))}
        </div>
      </div>

      <div className="w-full overflow-hidden">
        <svg viewBox={viewBox} className="w-full h-[600px]" onMouseLeave={() => setHoverId(null)}>
          {/* Ring guides */}
          {RADII.slice(1).map((r) => (
            <circle key={r} r={r} fill="none" stroke="currentColor" strokeOpacity={0.08} strokeDasharray="2 4" />
          ))}

          {/* Slices for rings 1..4 */}
          {nodes
            .filter((n) => n.ring > 0)
            .map((n) => {
              const rInner = RADII[n.ring - 1]!
              const rOuter = RADII[n.ring]!
              const active = highlighted.has(n.id)
              const dim = hoverId != null && !active
              const [cx, cy] = centroid(n.startAngle, n.endAngle, n.ring)
              const sliceAngle = n.endAngle - n.startAngle
              const showLabel = sliceAngle > 0.15 && n.ring <= 3
              return (
                <g key={n.id}>
                  <path
                    d={arcPath(n.startAngle, n.endAngle, rInner, rOuter)}
                    fill={RING_COLORS[n.ring]}
                    fillOpacity={active ? 0.35 : dim ? 0.06 : 0.15}
                    stroke={RING_COLORS[n.ring]}
                    strokeOpacity={active ? 0.9 : 0.3}
                    strokeWidth={active ? 2 : 1}
                    onMouseEnter={() => setHoverId(n.id)}
                    style={{ cursor: 'pointer', transition: 'fill-opacity 120ms, stroke-opacity 120ms' }}
                  />
                  {showLabel && (
                    <text
                      x={cx}
                      y={cy}
                      fill="currentColor"
                      fillOpacity={dim ? 0.3 : 0.85}
                      fontSize={n.ring === 1 ? 14 : n.ring === 2 ? 11 : 9}
                      textAnchor="middle"
                      dominantBaseline="central"
                      style={{ pointerEvents: 'none', fontWeight: n.ring === 1 ? 600 : 400 }}
                    >
                      {n.title.slice(0, n.ring === 1 ? 24 : n.ring === 2 ? 18 : 14)}
                    </text>
                  )}
                </g>
              )
            })}

          {/* Center vision */}
          <circle r={RADII[1]! - 10} fill="hsl(var(--background))" stroke={RING_COLORS[0]} strokeWidth={2} />
          <text
            y={-10}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={11}
            fill="currentColor"
            fillOpacity={0.5}
          >
            VISION
          </text>
          <foreignObject x={-RADII[1]! + 20} y={-10} width={(RADII[1]! - 20) * 2} height={90}>
            <div className="h-full flex items-center justify-center px-2 text-center text-xs leading-snug font-medium">
              {vision.statement.length > 140 ? vision.statement.slice(0, 140) + '…' : vision.statement}
            </div>
          </foreignObject>
        </svg>
      </div>

      {hoverId && (
        <div className="rounded-md bg-muted/50 p-2 text-xs">
          {nodes.find((n) => n.id === hoverId)?.title}
        </div>
      )}
    </div>
  )
}
