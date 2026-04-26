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
