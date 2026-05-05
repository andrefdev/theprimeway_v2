-- Second Brain — Concept Graph (Phase 5)
-- Hand-edited migration: Prisma 7 cannot emit pgvector DDL natively, so we
-- enable the extension and add HNSW indexes ourselves. The CREATE TABLE blocks
-- mirror what `prisma migrate diff` would emit; the `embedding` columns use
-- the `vector(1536)` type referenced in schema.prisma via Unsupported(...).

-- 1. Enable pgvector (Neon supports this natively).
CREATE EXTENSION IF NOT EXISTS vector;

-- 1b. New plan flag — Pro+ tiers unlock the 3D concept graph view + the
--     concept extraction pipeline that feeds it.
ALTER TABLE "subscription_plans"
    ADD COLUMN IF NOT EXISTS "has_brain_graph" BOOLEAN DEFAULT false;

-- 2. brain_clusters
CREATE TABLE "brain_clusters" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "centroid_embedding" vector(1536),
    "concept_count" INTEGER NOT NULL DEFAULT 0,
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brain_clusters_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "brain_clusters_user_id_idx" ON "brain_clusters"("user_id");

ALTER TABLE "brain_clusters"
    ADD CONSTRAINT "brain_clusters_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- 3. brain_concepts
CREATE TABLE "brain_concepts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'idea',
    "embedding" vector(1536),
    "cluster_id" TEXT,
    "centrality_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mention_count" INTEGER NOT NULL DEFAULT 0,
    "last_mentioned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "merged_into_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brain_concepts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "brain_concepts_user_id_normalized_name_key"
    ON "brain_concepts"("user_id", "normalized_name");
CREATE INDEX "brain_concepts_user_id_last_mentioned_at_idx"
    ON "brain_concepts"("user_id", "last_mentioned_at");
CREATE INDEX "brain_concepts_user_id_cluster_id_idx"
    ON "brain_concepts"("user_id", "cluster_id");

ALTER TABLE "brain_concepts"
    ADD CONSTRAINT "brain_concepts_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "brain_concepts"
    ADD CONSTRAINT "brain_concepts_cluster_id_fkey"
    FOREIGN KEY ("cluster_id") REFERENCES "brain_clusters"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- 4. brain_concept_edges
CREATE TABLE "brain_concept_edges" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "source_concept_id" TEXT NOT NULL,
    "target_concept_id" TEXT NOT NULL,
    "relation_type" TEXT NOT NULL DEFAULT 'co_mentioned',
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "mention_count" INTEGER NOT NULL DEFAULT 1,
    "last_reinforced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "llm_confidence" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brain_concept_edges_pkey" PRIMARY KEY ("id")
);

-- Index names follow Prisma's auto-generated convention so `prisma migrate
-- diff` reports zero divergence between this migration and schema.prisma.
CREATE UNIQUE INDEX "brain_concept_edges_source_concept_id_target_concept_id_rel_key"
    ON "brain_concept_edges"("source_concept_id", "target_concept_id", "relation_type");
CREATE INDEX "brain_concept_edges_user_id_last_reinforced_at_idx"
    ON "brain_concept_edges"("user_id", "last_reinforced_at");
CREATE INDEX "brain_concept_edges_source_concept_id_idx"
    ON "brain_concept_edges"("source_concept_id");
CREATE INDEX "brain_concept_edges_target_concept_id_idx"
    ON "brain_concept_edges"("target_concept_id");

ALTER TABLE "brain_concept_edges"
    ADD CONSTRAINT "brain_concept_edges_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "brain_concept_edges"
    ADD CONSTRAINT "brain_concept_edges_source_concept_id_fkey"
    FOREIGN KEY ("source_concept_id") REFERENCES "brain_concepts"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "brain_concept_edges"
    ADD CONSTRAINT "brain_concept_edges_target_concept_id_fkey"
    FOREIGN KEY ("target_concept_id") REFERENCES "brain_concepts"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- 5. brain_concept_occurrences
CREATE TABLE "brain_concept_occurrences" (
    "id" TEXT NOT NULL,
    "concept_id" TEXT NOT NULL,
    "entry_id" TEXT NOT NULL,
    "salience" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "quote" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brain_concept_occurrences_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "brain_concept_occurrences_concept_id_entry_id_key"
    ON "brain_concept_occurrences"("concept_id", "entry_id");
CREATE INDEX "brain_concept_occurrences_entry_id_idx"
    ON "brain_concept_occurrences"("entry_id");

ALTER TABLE "brain_concept_occurrences"
    ADD CONSTRAINT "brain_concept_occurrences_concept_id_fkey"
    FOREIGN KEY ("concept_id") REFERENCES "brain_concepts"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "brain_concept_occurrences"
    ADD CONSTRAINT "brain_concept_occurrences_entry_id_fkey"
    FOREIGN KEY ("entry_id") REFERENCES "brain_entries"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- 6. HNSW indexes for cosine similarity searches are NOT created here.
--    Reason: Prisma cannot represent HNSW indexes in schema.prisma, so leaving
--    them in the migration would make `prisma migrate diff` report permanent
--    divergence (it would emit DROP INDEX every time, and CI fails on diff).
--    They are created idempotently by ensureVectorIndexes() at API boot
--    (see apps/api/src/lib/vector-indexes.ts) using CREATE INDEX IF NOT EXISTS.
