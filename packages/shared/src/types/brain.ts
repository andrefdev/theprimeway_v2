export type BrainEntryStatus = 'pending' | 'transcribing' | 'analyzing' | 'complete' | 'failed'

export type BrainCrossLinkTarget = 'task' | 'goal' | 'habit'
export type BrainCrossLinkType = 'related' | 'spawned_from' | 'action_for' | 'evidence_for'

export interface BrainActionItem {
  title: string
  description?: string
  priority?: 'low' | 'medium' | 'high'
  /** If the user clicked "Create task" and we persisted a Task, we keep the id so we don't duplicate. */
  appliedTaskId?: string
}

export interface BrainCrossLink {
  id: string
  entryId: string
  userId: string
  targetType: BrainCrossLinkTarget
  targetId: string
  linkType: BrainCrossLinkType
  aiGenerated: boolean
  createdAt: string
  /** Optional hydrated reference (target title) — only set when fetching a detail endpoint. */
  target?: { id: string; title: string } | null
}

// ─── Concept graph (Phase 2) ───────────────────────────────────────────

export type BrainConceptKind =
  | 'person'
  | 'place'
  | 'project'
  | 'idea'
  | 'emotion'
  | 'decision'
  | 'tool'

export type BrainEdgeRelationType =
  | 'co_mentioned'
  | 'related_to'
  | 'causes'
  | 'caused_by'
  | 'supports'
  | 'contradicts'
  | 'part_of'
  | 'contains'
  | 'precedes'

export interface BrainConceptNode {
  id: string
  name: string
  kind: BrainConceptKind
  mentionCount: number
  centralityScore: number
  /** ISO timestamp — drives recency-decay visuals in the 3D view. */
  lastMentionedAt: string
  clusterId: string | null
}

export interface BrainConceptEdgeDto {
  id: string
  sourceId: string
  targetId: string
  relationType: BrainEdgeRelationType
  weight: number
  mentionCount: number
  /** Confidence assigned by the LLM when typed (Phase 3). 0–1, null for raw co_mentioned. */
  llmConfidence: number | null
}

export interface BrainClusterDto {
  id: string
  label: string
  color: string
  conceptCount: number
  /** ISO timestamp — clients can use this to invalidate cached layouts. */
  computedAt: string
}

export interface BrainGraphResponse {
  concepts: BrainConceptNode[]
  edges: BrainConceptEdgeDto[]
  clusters: BrainClusterDto[]
  /** Cursor (ISO timestamp) clients echo back via `?since=` for delta sync. */
  cursor: string
}

export interface BrainEgoNetworkResponse {
  rootId: string
  concepts: BrainConceptNode[]
  edges: BrainConceptEdgeDto[]
}

export interface BrainEntry {
  id: string
  userId: string
  sourceType: string
  sourceDevice: string | null
  rawTranscript: string | null
  language: string | null
  title: string | null
  summary: string | null
  structuredContent: string | null
  topics: string[]
  sentiment: string | null
  actionItems: BrainActionItem[]
  aiMetadata: Record<string, unknown> | null
  status: BrainEntryStatus
  errorMessage: string | null
  processedAt: string | null
  userTitle: string | null
  isPinned: boolean
  isArchived: boolean
  deletedAt: string | null
  createdAt: string
  updatedAt: string
  crossLinks?: BrainCrossLink[]
}
