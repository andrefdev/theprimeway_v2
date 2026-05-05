import { useMemo, useRef, useState, useEffect } from 'react'
import ForceGraph3D from 'react-force-graph-3d'
import type {
  BrainGraphResponse,
  BrainConceptNode,
  BrainConceptEdgeDto,
} from '@repo/shared/types'
import { ConceptHoverCard } from './ConceptHoverCard'

interface BrainGraph3DProps {
  data: BrainGraphResponse
}

const FALLBACK_COLOR = 'oklch(0.708 0 0)' // muted-foreground equivalent

interface NodeDatum extends BrainConceptNode {
  /** force-graph mutates these — keep them on the node so layout persists. */
  x?: number
  y?: number
  z?: number
}

interface LinkDatum {
  source: string
  target: string
  weight: number
}

export function BrainGraph3D({ data }: BrainGraph3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 800, h: 600 })
  const [hovered, setHovered] = useState<{ node: BrainConceptNode; x: number; y: number } | null>(
    null,
  )

  // Resize observer so the canvas tracks card width.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry!.contentRect
      setSize({ w: Math.max(320, Math.floor(width)), h: Math.max(400, Math.floor(height)) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Build cluster→color map. Concepts without a cluster fall back to muted.
  const colorByCluster = useMemo(() => {
    const m = new Map<string, string>()
    for (const c of data.clusters) m.set(c.id, c.color)
    return m
  }, [data.clusters])

  const graphData = useMemo(() => {
    const nodes: NodeDatum[] = data.concepts.map((c) => ({ ...c }))
    const links: LinkDatum[] = data.edges.map((e: BrainConceptEdgeDto) => ({
      source: e.sourceId,
      target: e.targetId,
      weight: e.weight,
    }))
    return { nodes, links }
  }, [data])

  // Track mouse for hover-card positioning. force-graph's onNodeHover doesn't
  // hand us the MouseEvent so we keep the latest coords ourselves.
  const mouseRef = useRef({ x: 0, y: 0 })
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handler = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    el.addEventListener('mousemove', handler)
    return () => el.removeEventListener('mousemove', handler)
  }, [])

  return (
    <div ref={containerRef} className="relative h-[600px] w-full">
      <ForceGraph3D
        graphData={graphData}
        width={size.w}
        height={size.h}
        backgroundColor="rgba(0,0,0,0)"
        showNavInfo={false}
        nodeId="id"
        nodeLabel={(n: NodeDatum) => n.name}
        nodeVal={(n: NodeDatum) => Math.log(Math.max(1, n.mentionCount) + 1) * 4}
        nodeColor={(n: NodeDatum) =>
          (n.clusterId && colorByCluster.get(n.clusterId)) || FALLBACK_COLOR
        }
        nodeOpacity={0.9}
        linkWidth={(l: LinkDatum) => Math.min(4, 0.5 + l.weight * 0.8)}
        linkOpacity={0.4}
        linkColor={() => 'oklch(0.708 0 0 / 0.5)'}
        onNodeHover={(node) => {
          if (node) {
            setHovered({
              node: node as BrainConceptNode,
              x: mouseRef.current.x,
              y: mouseRef.current.y,
            })
          } else {
            setHovered(null)
          }
        }}
      />
      {hovered && <ConceptHoverCard concept={hovered.node} x={hovered.x} y={hovered.y} />}
    </div>
  )
}
