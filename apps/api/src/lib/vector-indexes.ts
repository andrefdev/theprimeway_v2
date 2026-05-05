/**
 * pgvector HNSW index bootstrap.
 *
 * Why this lives here and not in a Prisma migration:
 *   Prisma's `migrate diff` reports any DB-side index that isn't declared in
 *   schema.prisma as a divergence. HNSW indexes use the `vector_cosine_ops`
 *   operator class on `Unsupported("vector(...)")` columns, which Prisma
 *   currently cannot represent. So we put the structural DDL (tables, FKs,
 *   constraint indexes) in the Prisma migration and create the vector indexes
 *   here at boot — idempotently — so CI's diff check stays clean.
 *
 * Cost: CREATE INDEX IF NOT EXISTS on an already-built HNSW index is a fast
 * catalog lookup, so calling this on every boot is cheap. Build cost only
 * applies on the very first run, when the table is empty anyway.
 *
 * Tuning: m=16 / ef_construction=200 is the standard sweet spot for 1536-dim
 * text-embedding-3-small vectors per pgvector docs.
 */
import { prisma } from './prisma'

const HNSW_INDEXES: Array<{ name: string; sql: string }> = [
  {
    name: 'brain_concepts_embedding_hnsw_idx',
    sql: `CREATE INDEX IF NOT EXISTS "brain_concepts_embedding_hnsw_idx"
            ON "brain_concepts" USING hnsw ("embedding" vector_cosine_ops)
            WITH (m = 16, ef_construction = 200)`,
  },
  {
    name: 'brain_clusters_centroid_hnsw_idx',
    sql: `CREATE INDEX IF NOT EXISTS "brain_clusters_centroid_hnsw_idx"
            ON "brain_clusters" USING hnsw ("centroid_embedding" vector_cosine_ops)
            WITH (m = 16, ef_construction = 200)`,
  },
]

let ensured = false

export async function ensureVectorIndexes(): Promise<void> {
  if (ensured) return
  for (const ix of HNSW_INDEXES) {
    try {
      await prisma.$executeRawUnsafe(ix.sql)
    } catch (err) {
      // Most common cause: pgvector extension not installed. The brain graph
      // feature is gracefully gated by FEATURES.BRAIN_GRAPH; the rest of the
      // API works without these indexes, so we log and continue.
      console.warn('[VECTOR_INDEX]', ix.name, err)
    }
  }
  ensured = true
}
