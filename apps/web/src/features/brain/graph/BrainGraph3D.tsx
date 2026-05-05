import { useMemo, useRef, useState, useEffect } from 'react'
import ForceGraph3D, { type ForceGraphMethods } from 'react-force-graph-3d'
import type {
  BrainGraphResponse,
  BrainConceptNode,
  BrainConceptEdgeDto,
} from '@repo/shared/types'
import { ConceptHoverCard } from './ConceptHoverCard'

interface BrainGraph3DProps {
  data: BrainGraphResponse
  focusedId: string | null
  onFocus: (id: string | null) => void
}

const FALLBACK_COLOR = 'oklch(0.708 0 0)' // muted-foreground equivalent

interface NodeDatum extends BrainConceptNode {
  /** force-graph mutates these — keep them on the node so layout persists. */
  x?: number
  y?: number
  z?: number
}

interface LinkDatum {
  source: string | NodeDatum
  target: string | NodeDatum
  weight: number
}

function endpointId(end: string | NodeDatum): string {
  return typeof end === 'string' ? end : end.id
}

export function BrainGraph3D({ data, focusedId, onFocus }: BrainGraph3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const fgRef = useRef<ForceGraphMethods<NodeDatum, LinkDatum> | undefined>(undefined)
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

  // Direct neighbours of the focused node — drives the highlight.
  const neighborIds = useMemo(() => {
    if (!focusedId) return null
    const set = new Set<string>([focusedId])
    for (const e of data.edges) {
      if (e.sourceId === focusedId) set.add(e.targetId)
      else if (e.targetId === focusedId) set.add(e.sourceId)
    }
    return set
  }, [focusedId, data.edges])

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

  // When focus changes via search (not direct click), pull the camera toward
  // the node. We look up the actual NodeDatum from graphData because that
  // instance carries the live coords mutated by the force simulation.
  useEffect(() => {
    if (!focusedId || !fgRef.current) return
    const node = graphData.nodes.find((n) => n.id === focusedId)
    if (!node) return
    if (typeof node.x === 'number' && typeof node.y === 'number' && typeof node.z === 'number') {
      const distance = 120
      const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z || 1)
      fgRef.current.cameraPosition(
        { x: node.x * distRatio, y: node.y * distRatio, z: (node.z || 1) * distRatio },
        { x: node.x, y: node.y, z: node.z },
        600,
      )
    } else {
      fgRef.current.zoomToFit(600, 80, (n: NodeDatum) => n.id === focusedId)
    }
  }, [focusedId, graphData])

  return (
    <div
      ref={containerRef}
      className="relative h-[600px] w-full bg-gradient-to-br from-muted/30 to-background"
    >
      <ForceGraph3D
        ref={fgRef as never}
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
        nodeVisibility={(n: NodeDatum) => (neighborIds ? neighborIds.has(n.id) : true)}
        linkVisibility={(l: LinkDatum) => {
          if (!neighborIds) return true
          return endpointId(l.source) === focusedId || endpointId(l.target) === focusedId
        }}
        linkWidth={(l: LinkDatum) => {
          const base = Math.min(4, 0.5 + l.weight * 0.8)
          if (!neighborIds) return base
          return base + 0.6
        }}
        linkOpacity={neighborIds ? 0.7 : 0.4}
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
        onNodeClick={(node) => {
          const id = (node as NodeDatum).id
          onFocus(id)
        }}
        onBackgroundClick={() => onFocus(null)}
        nodeThreeObjectExtend={false}
      />
      {hovered && (!neighborIds || neighborIds.has(hovered.node.id)) && (
        <ConceptHoverCard concept={hovered.node} x={hovered.x} y={hovered.y} />
      )}
    </div>
  )
}
