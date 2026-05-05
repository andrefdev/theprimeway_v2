/**
 * Concept extraction service — Phase 1 of the Second Brain concept graph.
 *
 * Pipeline (runs fire-and-forget after a BrainEntry is processed):
 *   1. Feature gate: skip silently if user lacks BRAIN_GRAPH.
 *   2. Pull top-80 user concepts (catalog) — stable prefix → DeepSeek prefix
 *      cache hit on repeated entries within the same week.
 *   3. generateObject with Zod schema asks the LLM to extract 5–15 atomic
 *      concepts from the entry text + topics. Includes salience and a verbatim
 *      quote per concept (for dual-coding hover later).
 *   4. embedMany batch-embeds all concept names in a single API round-trip.
 *   5. For each concept: try unique-name fast path, then HNSW vector lookup
 *      (cosine > 0.85 = same concept). Otherwise insert new row.
 *   6. Upsert per-concept BrainConceptOccurrence (concept × entry edges).
 *   7. Reinforce all concept-pair edges with Hebbian decay weighting.
 *   8. Bump aiMetadata.conceptExtraction with token cost telemetry.
 *
 * Failure here NEVER fails the parent entry — the caller wraps this in
 * fire-and-forget and only logs.
 */
import { prisma } from '../lib/prisma'
import { taskModel } from '../lib/ai-models'
import { embedConcepts, normalizeConcept } from '../lib/embeddings'
import { brainGraphRepo, type ConceptCandidate } from '../repositories/brain-graph.repo'
import { featuresService } from './features.service'
import { FEATURES } from '@repo/shared/constants'

const CONCEPT_KINDS = [
  'person',
  'place',
  'project',
  'idea',
  'emotion',
  'decision',
  'tool',
] as const

type ConceptKind = (typeof CONCEPT_KINDS)[number]

const SIMILARITY_THRESHOLD = 0.85
const RE_CLUSTER_NEW_CONCEPTS = 20
const RE_CLUSTER_DAYS = 7

interface ExtractEntryInput {
  entryId: string
  rawTranscript: string | null
  title: string | null
  summary: string | null
  topics: unknown
}

interface ExtractedConceptDraft {
  name: string
  kind: ConceptKind
  salience: number
  quote?: string
}

class ConceptExtractionService {
  /**
   * Entry point — call after BrainEntry processing succeeds. Fire-and-forget.
   */
  async extractAndStoreConcepts(userId: string, entry: ExtractEntryInput): Promise<void> {
    // 1. Feature gate
    const features = await featuresService.resolveFeatures(userId)
    if (!features[FEATURES.BRAIN_GRAPH]?.enabled) {
      return
    }

    if (!entry.rawTranscript || entry.rawTranscript.trim().length < 10) {
      return
    }

    // 2. Catalog (stable header for prefix cache)
    const catalog = await brainGraphRepo.getCatalog(userId, 80)

    // 3. LLM extraction
    const drafts = await this.extractConceptsWithLLM(entry, catalog)
    if (drafts.length === 0) return

    // 4. Embed all candidate names in one batch
    const { embeddings, indexFor, tokensUsed: embedTokens } = await embedConcepts(
      drafts.map((d) => d.name),
    )

    // 5. Build candidates and dedupe via pgvector
    const candidates: ConceptCandidate[] = drafts.map((draft, i) => ({
      name: draft.name,
      normalizedName: normalizeConcept(draft.name),
      kind: draft.kind,
      embedding: embeddings[indexFor[i]!]!,
      salience: draft.salience,
      quote: draft.quote,
    }))

    const resolved = await brainGraphRepo.resolveConcepts(
      userId,
      candidates,
      SIMILARITY_THRESHOLD,
    )

    // 6. Upsert occurrences (concept × entry)
    await brainGraphRepo.upsertOccurrences(
      resolved.map((r, i) => ({
        conceptId: r.id,
        entryId: entry.entryId,
        salience: candidates[i]!.salience,
        quote: candidates[i]!.quote,
      })),
    )

    // 7. Reinforce all concept-pair edges (Hebbian co-occurrence)
    const conceptIds = resolved.map((r) => r.id)
    const pairs: Array<[string, string]> = []
    for (let i = 0; i < conceptIds.length; i++) {
      for (let j = i + 1; j < conceptIds.length; j++) {
        pairs.push([conceptIds[i]!, conceptIds[j]!])
      }
    }
    await brainGraphRepo.reinforceEdges(userId, pairs, 'co_mentioned')

    // 8. Token cost telemetry on the parent entry
    await prisma.brainEntry
      .update({
        where: { id: entry.entryId },
        data: {
          aiMetadata: {
            conceptExtraction: {
              conceptsExtracted: drafts.length,
              conceptsCreated: resolved.filter((r) => r.inserted).length,
              conceptsReused: resolved.filter((r) => !r.inserted).length,
              embedTokens,
              edgesReinforced: pairs.length,
              ranAt: new Date().toISOString(),
            },
          } as any,
        },
      })
      .catch(() => {
        /* metadata write is best-effort */
      })
  }

  // ─── LLM extraction ─────────────────────────────────────────────────────

  private async extractConceptsWithLLM(
    entry: ExtractEntryInput,
    catalog: Array<{ name: string; kind: string }>,
  ): Promise<ExtractedConceptDraft[]> {
    const { generateObject } = await import('ai')
    const { z } = await import('zod')

    const schema = z.object({
      concepts: z
        .array(
          z.object({
            name: z
              .string()
              .min(1)
              .max(80)
              .describe('canonical proper noun or short noun phrase, 1–4 words'),
            kind: z.enum(CONCEPT_KINDS),
            salience: z
              .number()
              .min(0)
              .max(1)
              .describe('how central this concept is to this thought, 0–1'),
            quote: z
              .string()
              .max(240)
              .optional()
              .describe('verbatim ≤25-word excerpt from the thought that mentions this concept'),
          }),
        )
        .min(0)
        .max(15),
    })

    // Stable prefix — keep this string identical across entries to maximize
    // DeepSeek's automatic prefix cache hit rate. Any per-entry data must come
    // AFTER the catalog block.
    const catalogBlock =
      catalog.length === 0
        ? '(no concepts yet — this is one of the user\'s first entries)'
        : catalog.map((c) => `- ${c.name} [${c.kind}]`).join('\n')

    const topicsArray = Array.isArray(entry.topics) ? (entry.topics as string[]) : []

    const system = `You are a knowledge graph builder. Your job is to extract atomic, recurring concepts from the user's thoughts so they accumulate into a personal "second brain" over time.

Concept rules — read carefully:
- Concepts are atomic recurring units: people, places, projects, ideas, emotions, decisions, tools.
- Prefer canonical proper nouns and short noun phrases. NEVER use demonstratives ("this project", "my idea") — write the actual name.
- If a concept already exists in the user's catalog (below), use the EXACT same name so it merges.
- Skip filler ("today", "thing", "stuff", "something").
- Salience: 1.0 = the entry is fundamentally about this concept; 0.3 = mentioned in passing.
- Quote: a verbatim ≤25-word excerpt from the thought where the concept appears. Use the user's exact words.
- Output 0–15 concepts. Quality over quantity. If the entry is trivial (e.g. "feeling tired"), 1–2 concepts is fine.`

    const userPrompt = `USER CONCEPT CATALOG (use exact names when matching):
${catalogBlock}

USER THOUGHT:
"""
${entry.rawTranscript}
"""

ENTRY TITLE: ${entry.title ?? '(none)'}
ENTRY SUMMARY: ${entry.summary ?? '(none)'}
ENTRY TOPICS: ${topicsArray.join(', ') || '(none)'}

Extract the concepts.`

    try {
      const result = await generateObject({
        model: taskModel,
        schema,
        system,
        prompt: userPrompt,
      })
      return result.object.concepts as ExtractedConceptDraft[]
    } catch (err) {
      console.error('[CONCEPT_EXTRACTION] generateObject failed', err)
      return []
    }
  }

  // ─── Public helpers used by cron / manual triggers (Phase 2 will expand) ─

  /**
   * True if this user is overdue for a clustering refresh — used by the cron
   * job in Phase 2 to decide which users to re-cluster.
   */
  async shouldRecluster(userId: string): Promise<boolean> {
    const lastRun = await brainGraphRepo.lastClusterRunAt(userId)
    if (!lastRun) return true

    const daysSince = (Date.now() - lastRun.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSince >= RE_CLUSTER_DAYS) return true

    const newCount = await brainGraphRepo.newConceptsSince(userId, lastRun)
    return newCount >= RE_CLUSTER_NEW_CONCEPTS
  }
}

export const conceptExtractionService = new ConceptExtractionService()
