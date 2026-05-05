# Checkpoint — Second Brain Concept Graph (Phase 1 done)

> **Date:** 2026-05-04
> **Branch:** `main`
> **Status:** ✅ Phase 1 code complete + tests passing — ⚠️ **NOT yet run against DB.** Needs migration + env setup before testing.
> **Companion docs:** plan at `~/.claude/plans/en-el-m-dulo-de-cozy-honey.md`

---

## TL;DR

Extender el módulo `brain` (que hoy guarda pensamientos sueltos analizados con DeepSeek) en un **segundo cerebro real**: la IA extrae conceptos atómicos recurrentes de cada entry, los deduplica via embeddings + pgvector, los guarda en un grafo con pesos Hebbianos, y eventualmente se renderizan como cerebro 3D navegable con `react-force-graph-3d`.

**Plan en 3 fases:**
- **Fase 1** (HECHA HOY): foundation backend — schema, migración, extracción de conceptos, dedupe vectorial, edges con decay. Sin UI nueva.
- **Fase 2** (próximo sprint): vista 3D con clustering + spreading activation + hover dual-coding.
- **Fase 3** (después): edge typing por LLM, PageRank, isolate-mode, merge manual, recency-decay visual.

**Decisiones fijadas:**
- Embeddings: **OpenAI `text-embedding-3-small`** (1536 dim, ~$0.0000008/entry).
- Generación: **DeepSeek** (ya integrado, prefix cache automática).
- **Vista gateada para planes pagos** (`FEATURES.BRAIN_GRAPH`); free se queda con la vista lista.
- Solo web por ahora; API queda lista para mobile después.
- Costo total estimado por entry (Fase 3 in-flight): **~$0.0004**.

---

## Estado de tests

- **`apps/api`**: 21/21 vitest passing. Incluye 9 tests de `embeddings.ts` (normalización + pgvector format) y 6 tests de `concept-extraction.service.ts` (gating, pipeline completo, edge cases).
- **Bonus:** se agregó `apps/api/vitest.config.ts` con aliases workspace que **también arregla el test preexistente de `timezone.test.ts`** que estaba roto en `main`.
- **Typecheck:** sin errores en archivos nuevos. Errores preexistentes en `habits.ts`, `notifications.ts`, `cron.service.ts` no son de este trabajo.

---

## Lo que se hizo (Fase 1)

### Schema (`apps/api/prisma/schema.prisma`)

4 modelos nuevos al final del bloque brain:

- **`BrainConcept`** — concepto atómico (id, name, normalizedName, kind, embedding `vector(1536)`, clusterId, centralityScore, mentionCount, lastMentionedAt, mergedIntoId).
  - `@@unique([userId, normalizedName])` — evita duplicados exactos sin tocar al LLM.
  - kinds: `person | place | project | idea | emotion | decision | tool`.
- **`BrainConceptEdge`** — relación entre 2 conceptos (sourceId, targetId, relationType, weight, mentionCount, lastReinforcedAt, llmConfidence).
  - relationType actual: `co_mentioned` (default). Fase 3 agregará `causes/caused_by/supports/contradicts/part_of/contains/precedes/related_to`.
  - weight = mentionCount × exp(-days/30) — Hebbian + recency decay.
- **`BrainConceptOccurrence`** — concepto × entry (salience, quote verbatim para hover dual-coding después).
- **`BrainCluster`** — tema/lóbulo (label, color, centroidEmbedding `vector(1536)`, conceptCount). Vacío hasta Fase 2.

Back-relations agregadas en `User` (`brainConcepts`, `brainConceptEdges`, `brainClusters`) y en `BrainEntry` (`occurrences`).

También se agregó `hasBrainGraph Boolean` a `SubscriptionPlan` para el feature gate.

### Migración (`apps/api/prisma/migrations/20260504230723_add_brain_concept_graph/migration.sql`)

**Hand-edited** porque Prisma 7 no emite DDL de pgvector. Hace:

1. `CREATE EXTENSION IF NOT EXISTS vector`
2. `ALTER TABLE subscription_plans ADD COLUMN has_brain_graph BOOLEAN DEFAULT false`
3. `CREATE TABLE` para los 4 modelos con FKs.
4. `CREATE INDEX ... USING hnsw (embedding vector_cosine_ops) WITH (m=16, ef_construction=200)` para `brain_concepts.embedding` y `brain_clusters.centroid_embedding`.

### Embeddings (`apps/api/src/lib/embeddings.ts` + `apps/api/src/lib/ai-models.ts`)

- `embeddingModel = openai.textEmbeddingModel('text-embedding-3-small')`.
- `normalizeConcept(name)` — NFKC + lowercase + strip punctuation + collapse whitespace + smart-quote → ascii. Usado tanto para `normalizedName` en DB como para hashing antes de embeddings.
- `embedConcepts(names)` — wrapper de `embedMany` con dedupe interna; devuelve `{ embeddings, indexFor, tokensUsed }`. Cuesta ~$0.0000008 por entry (10 conceptos × 4 tokens).
- `toPgVector(arr)` — formato `[0.123,0.456,...]` para parámetros raw SQL. Throws si la dimensión != 1536.

### Repositorio (`apps/api/src/repositories/brain-graph.repo.ts`)

Toda interacción con la columna `vector` va aquí (Prisma no la soporta nativamente).

- `getCatalog(userId, limit=80)` — top conceptos por centralidad + recencia. Usado como header del prompt → DeepSeek prefix cache hit.
- `resolveConcepts(userId, candidates, threshold=0.85)` — para cada candidato:
  1. Fast path: lookup por `(userId, normalizedName)` unique constraint.
  2. Fallback: HNSW similarity search `embedding <=> $1::vector`. Si `1 - distance > 0.85`, reusa.
  3. Else: `INSERT ... ON CONFLICT DO UPDATE` con embedding.
- `upsertOccurrences(rows)` — concepto × entry, idempotente.
- `reinforceEdges(userId, pairs, relationType='co_mentioned')` — per-pair upsert en transacción única. Recomputa weight via Hebbian decay en el `ON CONFLICT DO UPDATE` directamente en SQL.
- `newConceptsSince(userId, since)` + `lastClusterRunAt(userId)` — usados por trigger de re-clustering en Fase 2.

### Servicio de extracción (`apps/api/src/services/concept-extraction.service.ts`)

Pipeline post-`processEntry`:

1. **Gate**: si `!features[BRAIN_GRAPH].enabled` → return silencioso (free tier no consume tokens).
2. Skip si `rawTranscript.trim().length < 10`.
3. **Catálogo**: pull top-80 conceptos del usuario para el header del prompt.
4. **LLM extraction**: `generateObject` con DeepSeek + Zod schema `{ concepts: [{ name, kind, salience, quote }] }`, 5–15 conceptos máx. System prompt fija reglas: nombres canónicos, sin demonstrativos, salience 0–1, quote verbatim ≤25 palabras.
5. **Embed batch**: `embedConcepts` en una sola llamada.
6. **Resolve**: `brainGraphRepo.resolveConcepts` con threshold cosine 0.85.
7. **Upsert occurrences**: concept × entry.
8. **Reinforce edges**: para cada par C(N,2) generar edge `co_mentioned`. Si existe, weight se recomputa con Hebbian.
9. **Telemetría**: `aiMetadata.conceptExtraction = { conceptsExtracted, conceptsCreated, conceptsReused, embedTokens, edgesReinforced, ranAt }`.

Errores capturados — falla nunca rompe el entry padre.

### Wire al pipeline (`apps/api/src/services/brain.service.ts`)

Al final del `processEntry` exitoso (después de `awardXp` y `gamificationEvents.emit`), fire-and-forget:

```ts
import('./concept-extraction.service')
  .then(({ conceptExtractionService }) =>
    conceptExtractionService.extractAndStoreConcepts(userId, {
      entryId, rawTranscript: entry.rawTranscript,
      title: out.title, summary: out.summary, topics: out.topics,
    }))
  .catch((err) => console.error('[BRAIN_CONCEPTS]', entryId, err))
```

Dynamic import evita inflar el bundle del entry path en el cold start.

### Feature flag (`packages/shared/src/constants/features.ts` + `apps/api/src/services/features.service.ts`)

- `FEATURES.BRAIN_GRAPH = 'BRAIN_GRAPH'`.
- `planDefaults` lee `hasBrainGraph` del SubscriptionPlan.
- Free tier por defecto = false.

### Tests

- `apps/api/src/lib/embeddings.test.ts` — 9 tests de normalización (lowercase, NFKC, smart quotes, punctuation, whitespace, unicode/Spanish, idempotencia) + format pgvector.
- `apps/api/src/services/concept-extraction.service.test.ts` — 6 tests con mocks completos:
  1. Skip silencioso cuando feature off.
  2. Skip cuando transcript muy corto.
  3. Pipeline completo con 3 conceptos → 3 occurrences + C(3,2)=3 edges.
  4. 1 concepto → 0 edges.
  5. LLM devuelve 0 conceptos → no downstream calls.
  6. LLM throws → swallow gracefully.

### Bonus

- `apps/api/vitest.config.ts` — aliases para `@repo/shared/*` que arregla `timezone.test.ts` preexistente.
- `apps/api/.env.example` — agregada sección `OPENAI_API_KEY` con explicación.
- `apps/api/package.json` — `@ai-sdk/openai ^2.0.0` instalado (versión real: 2.0.106).

---

## Para poder TESTEAR mañana

### Prerrequisitos en tu lado

1. **Setear `OPENAI_API_KEY`** en el env de dev (en tu `.env` local de `apps/api/`).
   - Sin esta key, la extracción falla pero el entry sigue completo (solo no se generan conceptos).
2. **Correr la migración contra Neon dev:**
   ```bash
   cd apps/api && pnpm db:migrate
   ```
   Esto va a:
   - `CREATE EXTENSION vector` (Neon lo soporta).
   - Crear `brain_concepts`, `brain_concept_edges`, `brain_concept_occurrences`, `brain_clusters`.
   - Construir índices HNSW (rápido porque las tablas están vacías).
   - Agregar `has_brain_graph` a `subscription_plans`.

   Si prefieres iterar sin migración formal: `pnpm db:push` aplica el schema sin crear el archivo (pero perderías el SQL hand-edited de pgvector → mejor `db:migrate`).

3. **Activar la flag en tu plan de prueba:**
   ```sql
   UPDATE subscription_plans SET has_brain_graph = true WHERE name ILIKE 'pro%';
   -- o, para tu user específico (si usas overrides por user):
   -- INSERT INTO user_feature_overrides (user_id, feature_key, enabled) VALUES ('<tu_user_id>', 'BRAIN_GRAPH', true);
   ```

### Validación end-to-end (qué buscar)

1. **Crear 3–5 entries en `/brain`** con texto sustancioso y conceptos compartidos. Ejemplos para forzar dedupe + edges:
   - "Hoy hablé con María sobre el proyecto Falcon, vamos a lanzar en Q3."
   - "María me confirmó que el equipo de Falcon necesita un product designer."
   - "El plan de lanzamiento de Falcon depende del approval de María."
2. **Esperar 5–10 segundos** después de cada submit (procesamiento es fire-and-forget).
3. **Verificar en DB:**
   ```sql
   -- Conceptos creados (debería haber: María [person], Falcon [project], lanzamiento [idea], etc.)
   SELECT name, kind, mention_count, last_mentioned_at FROM brain_concepts WHERE user_id = '<tu_user_id>' ORDER BY mention_count DESC;

   -- Occurrences (concepto × entry)
   SELECT bc.name, bce.title, bco.salience, bco.quote
   FROM brain_concept_occurrences bco
   JOIN brain_concepts bc ON bc.id = bco.concept_id
   JOIN brain_entries bce ON bce.id = bco.entry_id
   WHERE bc.user_id = '<tu_user_id>';

   -- Edges (María ↔ Falcon debería tener mention_count >= 2 después del 2do entry)
   SELECT s.name AS source, t.name AS target, e.weight, e.mention_count, e.last_reinforced_at
   FROM brain_concept_edges e
   JOIN brain_concepts s ON s.id = e.source_concept_id
   JOIN brain_concepts t ON t.id = e.target_concept_id
   WHERE e.user_id = '<tu_user_id>'
   ORDER BY e.weight DESC;

   -- Telemetría de costo
   SELECT id, ai_metadata->'conceptExtraction' FROM brain_entries WHERE user_id = '<tu_user_id>' ORDER BY created_at DESC LIMIT 5;
   ```
4. **Verificar dedupe**: si una entry dice "vehículo" y otra "auto", el cosine ≥ 0.85 debería reusar el mismo concepto. Si no funciona, bajar threshold a 0.82 en `concept-extraction.service.ts:36` (`SIMILARITY_THRESHOLD`).

### Checks rápidos sin DB real

- Tests pasan: `cd apps/api && pnpm test` → debería decir 21/21.
- Schema válido: `cd apps/api && DATABASE_URL='postgresql://fake:fake@localhost:5432/fake' npx prisma validate`.

### Si algo falla

| Síntoma | Probable causa | Fix |
|---|---|---|
| `column "embedding" of relation ... does not exist` | migración no corrió | `pnpm db:migrate` |
| `extension "vector" does not exist` | Neon plan no lo permite (raro) | habilitar en dashboard de Neon o cambiar a otra DB |
| `OpenAI API error 401` | falta `OPENAI_API_KEY` | setear en `.env` |
| `BRAIN_CONCEPTS` log error pero no concepts en DB | feature flag off | `UPDATE subscription_plans SET has_brain_graph = true ...` |
| Conceptos duplicados ("auto" + "vehículo" como filas separadas) | threshold muy alto | bajar a 0.82 en el servicio |
| Demasiados conceptos triviales ("hoy", "cosa") | system prompt no se respetó | revisar `concept-extraction.service.ts:148-169` y ajustar reglas |

---

## Lo que falta (Fase 2 + Fase 3)

### Fase 2 — Vista 3D + spreading activation (siguiente sprint)

**Backend:**
- `apps/api/src/services/brain-graph.service.ts` — `getGraph`, `getEgoNetwork`, `runClustering`.
- `apps/api/src/lib/clustering.ts` — agglomerative cosine 0.55, min-size 3.
- Endpoints `GET /api/brain/graph` y `GET /api/brain/concepts/:id/ego`.
- Cron `POST /brain-cluster` para re-clustering nightly.

**Shared:**
- DTOs `BrainConceptNode`, `BrainConceptEdgeDto`, `BrainClusterDto`, `BrainGraphResponse` en `packages/shared/src/types/brain.ts`.

**Web:**
- Refactor de routing: `apps/web/src/routes/_app/brain.tsx` → folder con `index.tsx` (lista) + `route.tsx` (layout + toggle) + `graph.tsx` (vista nueva).
- Instalar `react-force-graph-3d ^1.26+`, `three ^0.160+`, `d3-force-3d ^3.0.5+`.
- Componentes en `apps/web/src/features/brain/graph/`:
  - `BrainGraph.tsx` (lazy container).
  - `BrainGraph3D.tsx` (three.js scene + bloom + cluster forceRadial).
  - `BrainGraph2D.tsx` (fallback).
  - `useGraphInteractions.ts` (spreading activation BFS).
  - `ConceptHoverCard.tsx` (dual-coding).
  - `GraphSearchBar.tsx`, `BrainViewToggle.tsx`.
- Query `useBrainGraph` con delta sync (`?since=<cursor>`).
- i18n keys `graph.*` en `en/brain.json` + `es/brain.json`.

### Fase 3 — Relaciones inteligentes + polish

- LLM edge typing batched (taxonomía de 6 tipos).
- `apps/api/src/lib/centrality.ts` — power-iteration PageRank.
- Progressive disclosure (top-N → load more al zoom).
- `ConceptMergeDialog` + `POST /api/brain/concepts/merge`.
- Recency-decay visual (opacity + z-offset).
- Isolate-ego mode + 2D fallback respetando `prefers-reduced-motion`.

---

## Mapeo neurociencia → código (recordatorio)

| Principio | Origen | Implementación |
|---|---|---|
| Spreading activation | Collins & Loftus 1975 | Fase 2 — BFS pulse en `useGraphInteractions.ts` |
| Plasticidad Hebbiana | "fire together, wire together" | ✅ Fase 1 — `weight = mentionCount × exp(-days/30)` |
| Consolidación hipocampal | recencia vs remoto | Fase 3 — opacity + z-offset por `lastMentionedAt` |
| Redes semánticas → lóbulos | semantic networks | Fase 2 — `BrainCluster` + `forceRadial` |
| Dual-coding theory | Paivio 1971 | Fase 2 — hover muestra concepto + quote verbatim |
| Centrality / hub neurons | connector hubs corticales | Fase 3 — PageRank → tamaño y brillo |

---

## Tareas (TaskList del harness)

```
✅ Fase 1: Agregar modelos BrainConcept/Edge/Occurrence/Cluster a schema.prisma
✅ Fase 1: Crear migración SQL hand-edited con pgvector + HNSW
✅ Fase 1: Instalar @ai-sdk/openai en apps/api
✅ Fase 1: Crear apps/api/src/lib/embeddings.ts
✅ Fase 1: Agregar embeddingModel a apps/api/src/lib/ai-models.ts
✅ Fase 1: Crear concept-extraction.service.ts
✅ Fase 1: Crear apps/api/src/repositories/brain-graph.repo.ts
✅ Fase 1: Wire concept extraction al final de brain.service.ts processEntry
✅ Fase 1: Aplicar gating BRAIN_GRAPH al extractor
✅ Fase 1: Tests unitarios para concept-extraction
⬜ Fase 2: Crear brain-graph.service.ts (getGraph, getEgo, runClustering)
⬜ Fase 2: Crear apps/api/src/lib/clustering.ts
⬜ Fase 2: Endpoints GET /brain/graph y /brain/concepts/:id/ego
⬜ Fase 2: Cron nightly para clustering
⬜ Fase 2: Tipos compartidos en packages/shared
⬜ Fase 2: Refactor de routing — promover brain.tsx a folder
⬜ Fase 2: Instalar react-force-graph-3d, three, d3-force-3d en web
⬜ Fase 2: Componentes de grafo en features/brain/graph/
⬜ Fase 2: useBrainGraph query con delta sync
⬜ Fase 2: i18n keys para graph
⬜ Fase 3: LLM edge typing batched + taxonomía de 6 tipos
⬜ Fase 3: Crear apps/api/src/lib/centrality.ts (PageRank)
⬜ Fase 3: Progressive disclosure + isolate-ego mode + 2D fallback
⬜ Fase 3: ConceptMergeDialog + POST /brain/concepts/merge
⬜ Fase 3: Recency-decay visual (consolidación hipocampal)
⬜ Verificación end-to-end (integration tests + manual QA)
```

---

## Inventario completo de archivos

### Nuevos
```
apps/api/prisma/migrations/20260504230723_add_brain_concept_graph/migration.sql
apps/api/src/lib/embeddings.ts
apps/api/src/lib/embeddings.test.ts
apps/api/src/repositories/brain-graph.repo.ts
apps/api/src/services/concept-extraction.service.ts
apps/api/src/services/concept-extraction.service.test.ts
apps/api/vitest.config.ts
```

### Modificados
```
apps/api/.env.example                                     # + OPENAI_API_KEY
apps/api/package.json                                     # + @ai-sdk/openai
apps/api/prisma/schema.prisma                             # + 4 models, + hasBrainGraph, + back-relations
apps/api/src/lib/ai-models.ts                             # + embeddingModel
apps/api/src/services/brain.service.ts                    # + fire-and-forget extraction call
apps/api/src/services/features.service.ts                 # + BRAIN_GRAPH in planDefaults
packages/shared/src/constants/features.ts                 # + BRAIN_GRAPH key
```

---

## Próximos comandos para mañana

```bash
# 1. Setear OPENAI_API_KEY en apps/api/.env
# 2. Migrar
cd apps/api && pnpm db:migrate

# 3. Activar feature en DB (Neon SQL editor)
# UPDATE subscription_plans SET has_brain_graph = true WHERE ...;

# 4. Levantar dev
cd ../.. && pnpm dev

# 5. Crear 3-5 entries en /brain con conceptos compartidos
# 6. Inspeccionar brain_concepts / brain_concept_edges (queries arriba)
# 7. Si todo OK → arrancar Fase 2 (decir a Claude: "arranca fase 2")
```
