/**
 * Embeddings — thin wrapper around the AI SDK's embedMany for the brain
 * concept graph pipeline.
 *
 * Responsibilities:
 *   1. Normalize concept strings (lowercase + NFKC + trim + collapse spaces).
 *      Same normalization rule used in BrainConcept.normalizedName, so the
 *      DB unique constraint and embedding lookups stay aligned.
 *   2. Dedupe input within a single call (embedMany happens to do this for
 *      free, but we surface the mapping so callers can re-expand).
 *   3. Return a fixed 1536-dim vector per input (text-embedding-3-small).
 *
 * Cost: ~$0.02 / 1M tokens. A typical brain entry produces 5-15 concepts;
 * each concept name averages 3-5 tokens. Round-trip cost per entry ≈ $0.000001.
 */
import { embedMany } from 'ai'
import { embeddingModel } from './ai-models'

export const EMBEDDING_DIMENSIONS = 1536

/** Normalize a concept name into the canonical key used for dedupe + storage. */
export function normalizeConcept(name: string): string {
  return name
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[‘’“”]/g, "'") // smart quotes → ascii
    .replace(/[^\p{L}\p{N}\s'-]/gu, ' ') // strip punctuation, keep letters/digits/spaces/'-'
    .replace(/\s+/g, ' ')
    .trim()
}

export interface EmbedConceptResult {
  /** Original normalized strings, in input order. */
  normalized: string[]
  /** Embedding for each unique normalized string. */
  embeddings: number[][]
  /** Index in `embeddings` for each input position (handles dupes). */
  indexFor: number[]
  /** Token count actually billed (not counting de-duplicated repeats). */
  tokensUsed: number
}

/**
 * Embed a batch of concept names. Inputs are normalized and de-duplicated
 * before the API call so repeated concepts in the same entry only cost once.
 */
export async function embedConcepts(names: string[]): Promise<EmbedConceptResult> {
  if (names.length === 0) {
    return { normalized: [], embeddings: [], indexFor: [], tokensUsed: 0 }
  }

  const normalized = names.map(normalizeConcept)

  const uniqueMap = new Map<string, number>()
  const uniqueValues: string[] = []
  const indexFor: number[] = []
  for (const n of normalized) {
    const existing = uniqueMap.get(n)
    if (existing !== undefined) {
      indexFor.push(existing)
    } else {
      const idx = uniqueValues.length
      uniqueMap.set(n, idx)
      uniqueValues.push(n)
      indexFor.push(idx)
    }
  }

  const { embeddings, usage } = await embedMany({
    model: embeddingModel,
    values: uniqueValues,
  })

  return {
    normalized,
    embeddings,
    indexFor,
    tokensUsed: usage?.tokens ?? 0,
  }
}

/**
 * Format a JS number[] into the Postgres `vector(1536)` literal pgvector
 * accepts via parameter binding: `'[0.123,0.456,...]'`.
 *
 * Use this when constructing raw SQL with `prisma.$queryRaw` / `Prisma.sql`.
 * pgvector also accepts the array with explicit cast: `$1::vector`.
 */
export function toPgVector(embedding: number[]): string {
  if (embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Embedding dimension mismatch: expected ${EMBEDDING_DIMENSIONS}, got ${embedding.length}`,
    )
  }
  return `[${embedding.join(',')}]`
}
