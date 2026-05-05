/**
 * Concept extraction unit tests.
 *
 * The service has three external dependencies we mock:
 *   - features.service (gating)
 *   - embeddings (LLM-free vector return)
 *   - brain-graph.repo (DB access)
 *   - ai/generateObject (LLM call)
 *
 * We don't talk to a real DB or any AI provider — these tests cover the
 * orchestration logic: gating, dedupe, occurrence wiring, pair generation,
 * and the empty-input edge cases.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ─── Mocks ─────────────────────────────────────────────────────────────────

vi.mock('../lib/prisma', () => ({
  prisma: {
    brainEntry: {
      update: vi.fn().mockResolvedValue({}),
    },
  },
}))

vi.mock('../lib/ai-models', () => ({
  taskModel: { id: 'mock-task' },
  embeddingModel: { id: 'mock-embed' },
}))

const mockEmbed = vi.fn()
vi.mock('../lib/embeddings', async () => {
  const actual: any = await vi.importActual('../lib/embeddings')
  return {
    ...actual,
    embedConcepts: (...args: unknown[]) => mockEmbed(...args),
  }
})

const mockResolveFeatures = vi.fn()
vi.mock('./features.service', () => ({
  featuresService: {
    resolveFeatures: (...args: unknown[]) => mockResolveFeatures(...args),
  },
}))

const mockGetCatalog = vi.fn()
const mockResolveConcepts = vi.fn()
const mockUpsertOccurrences = vi.fn()
const mockReinforceEdges = vi.fn()
vi.mock('../repositories/brain-graph.repo', () => ({
  brainGraphRepo: {
    getCatalog: (...a: unknown[]) => mockGetCatalog(...a),
    resolveConcepts: (...a: unknown[]) => mockResolveConcepts(...a),
    upsertOccurrences: (...a: unknown[]) => mockUpsertOccurrences(...a),
    reinforceEdges: (...a: unknown[]) => mockReinforceEdges(...a),
    lastClusterRunAt: vi.fn(),
    newConceptsSince: vi.fn(),
  },
}))

const mockGenerateObject = vi.fn()
vi.mock('ai', () => ({
  generateObject: (...args: unknown[]) => mockGenerateObject(...args),
}))

// ─── Suite ─────────────────────────────────────────────────────────────────

import { conceptExtractionService } from './concept-extraction.service'

// Inlined to avoid the same vitest workspace-resolution issue that breaks
// timezone.test.ts. Must match packages/shared/src/constants/features.ts.
const FEATURES = { BRAIN_GRAPH: 'BRAIN_GRAPH' } as const

const dim1536 = (seed: number) => {
  const v = new Array(1536)
  for (let i = 0; i < 1536; i++) v[i] = Math.sin(seed + i) * 0.01
  return v
}

const enabledFeature = {
  [FEATURES.BRAIN_GRAPH]: { enabled: true },
  // Other features are looked up by key — undefined means not enabled.
}

const baseEntry = {
  entryId: 'entry-1',
  rawTranscript: 'Working on the Falcon project today, talking with María about the launch plan.',
  title: 'Falcon launch sync',
  summary: 'Caught up with María about Falcon.',
  topics: ['falcon', 'launch'],
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetCatalog.mockResolvedValue([])
  mockResolveFeatures.mockResolvedValue(enabledFeature)
  mockEmbed.mockImplementation(async (names: string[]) => ({
    normalized: names.map((n) => n.toLowerCase()),
    embeddings: names.map((_, i) => dim1536(i)),
    indexFor: names.map((_, i) => i),
    tokensUsed: names.length * 5,
  }))
  mockResolveConcepts.mockImplementation(async (_userId: string, candidates: unknown[]) =>
    (candidates as Array<{ name: string }>).map((_, i) => ({
      id: `concept-${i}`,
      inserted: true,
    })),
  )
})

describe('conceptExtractionService.extractAndStoreConcepts', () => {
  it('skips silently when feature is disabled', async () => {
    mockResolveFeatures.mockResolvedValueOnce({
      [FEATURES.BRAIN_GRAPH]: { enabled: false },
    })
    await conceptExtractionService.extractAndStoreConcepts('user-1', baseEntry)

    expect(mockGenerateObject).not.toHaveBeenCalled()
    expect(mockEmbed).not.toHaveBeenCalled()
    expect(mockResolveConcepts).not.toHaveBeenCalled()
  })

  it('skips when transcript is too short', async () => {
    await conceptExtractionService.extractAndStoreConcepts('user-1', {
      ...baseEntry,
      rawTranscript: 'meh',
    })

    expect(mockGenerateObject).not.toHaveBeenCalled()
  })

  it('runs the full pipeline: extract → embed → resolve → upsert → reinforce', async () => {
    mockGenerateObject.mockResolvedValueOnce({
      object: {
        concepts: [
          { name: 'Falcon project', kind: 'project', salience: 1, quote: 'the Falcon project' },
          { name: 'María', kind: 'person', salience: 0.7, quote: 'with María' },
          { name: 'launch plan', kind: 'idea', salience: 0.5 },
        ],
      },
    })

    await conceptExtractionService.extractAndStoreConcepts('user-1', baseEntry)

    expect(mockGenerateObject).toHaveBeenCalledOnce()
    expect(mockEmbed).toHaveBeenCalledWith(['Falcon project', 'María', 'launch plan'])
    expect(mockResolveConcepts).toHaveBeenCalledOnce()
    expect(mockUpsertOccurrences).toHaveBeenCalledWith([
      { conceptId: 'concept-0', entryId: 'entry-1', salience: 1, quote: 'the Falcon project' },
      { conceptId: 'concept-1', entryId: 'entry-1', salience: 0.7, quote: 'with María' },
      { conceptId: 'concept-2', entryId: 'entry-1', salience: 0.5, quote: undefined },
    ])
    // 3 concepts → C(3,2) = 3 edges
    expect(mockReinforceEdges).toHaveBeenCalledWith(
      'user-1',
      [
        ['concept-0', 'concept-1'],
        ['concept-0', 'concept-2'],
        ['concept-1', 'concept-2'],
      ],
      'co_mentioned',
    )
  })

  it('produces zero edges for a single concept', async () => {
    mockGenerateObject.mockResolvedValueOnce({
      object: {
        concepts: [{ name: 'sleep', kind: 'idea', salience: 0.4 }],
      },
    })

    await conceptExtractionService.extractAndStoreConcepts('user-1', baseEntry)

    expect(mockUpsertOccurrences).toHaveBeenCalledOnce()
    expect(mockReinforceEdges).toHaveBeenCalledWith('user-1', [], 'co_mentioned')
  })

  it('exits early when LLM returns no concepts', async () => {
    mockGenerateObject.mockResolvedValueOnce({ object: { concepts: [] } })

    await conceptExtractionService.extractAndStoreConcepts('user-1', baseEntry)

    expect(mockEmbed).not.toHaveBeenCalled()
    expect(mockUpsertOccurrences).not.toHaveBeenCalled()
    expect(mockReinforceEdges).not.toHaveBeenCalled()
  })

  it('swallows LLM errors gracefully (no concepts → no downstream calls)', async () => {
    mockGenerateObject.mockRejectedValueOnce(new Error('rate limited'))

    await expect(
      conceptExtractionService.extractAndStoreConcepts('user-1', baseEntry),
    ).resolves.toBeUndefined()

    expect(mockUpsertOccurrences).not.toHaveBeenCalled()
    expect(mockReinforceEdges).not.toHaveBeenCalled()
  })
})
