# Second Brain Module — ThePrimeWay

## Context

Transformar TPW de tracker de productividad a "segundo cerebro". Inspirado en Memorae: audio → IA procesa → mapa mental visual. Diferenciador clave: cero fricción + integración con módulos existentes (Tasks, Goals, Habits, Notes) que ningún competidor standalone tiene.

**Decisiones confirmadas:**
- Transcripción: **Deepgram Nova-3** (~$0.004/min, streaming, ES+EN)
- Storage audio: **Cloudflare R2** (zero egress, S3-compatible)
- Grafo visual: **@xyflow/react** (React Flow)
- AI: **Claude sonnet** (ya integrado)

---

## UX Flow

### Captura (< 3 seg para empezar)

1. **FAB único** en dashboard → tap → graba audio (o escribe texto)
2. Waveform pulsante + contador de tiempo mientras graba
3. Tap "Listo" o auto-stop tras 3s silencio
4. Card muestra "Procesando tu idea..." shimmer → usuario puede navegar sin esperar
5. Notificación push cuando completo → card revela título AI, topic pills, items vinculados

### Vistas

| Vista | Descripción |
|-------|-------------|
| **Feed** | Lista cronológica inversa. Cards con título, timestamp, topics, audio player mini |
| **Grafo** | Mapa mental interactivo. Nodos = conceptos/ideas. Edges = relaciones. Zoom, pan, filtros |
| **Búsqueda** | Full-text en transcripciones y títulos |

### Estados de procesamiento

```
pending → transcribing → analyzing → complete
                                   → failed (retry button)
```

### Interacción del Grafo

- **Click nodo** → sidebar con transcript, audio player, items vinculados
- **Doble click** → centrar + expandir vecinos
- **Drag entre nodos** → crear edge manual
- **Panel filtros** → por topic, fecha, tipo de nodo, fuente
- **Búsqueda** → highlight nodos matching, dim el resto

---

## Ventaja Competitiva (Moat)

### 1. Inteligencia cross-módulo (nadie tiene esto)
Ninguna app standalone tiene acceso simultáneo a tasks, goals, habits, finanzas y reading del usuario. Claude puede decir "Esta idea conecta con tu meta Q2 de carrera" en vez de solo tagging genérico.

### 2. Loop de productividad cerrado
`Captura pensamiento → AI extrae tarea → tarea aparece en plan semanal → tarea vinculada a pensamiento original`. No existe en ningún competidor.

### 3. Knowledge graph compuesto
Después de 100+ entradas, AI detecta patrones de pensamiento, temas recurrentes, puntos ciegos. Switching cost altísimo porque pierdes todo tu grafo.

### 4. Red de captura multi-plataforma
Voz desde 4 plataformas (web, mobile, desktop, messaging) + texto. Difícil de replicar para apps single-platform.

### 5. Zero-config vs competidores
- **Obsidian**: requiere linking manual
- **Notion**: requiere estructura manual
- **Apple Notes**: sin estructura
- **Memorae**: aún requiere curación
- **TPW Second Brain**: auto-organiza sin esfuerzo del usuario

---

## Arquitectura Técnica

### Schema Prisma (4 modelos nuevos)

#### BrainEntry — Entrada principal (audio/texto)

```prisma
model BrainEntry {
  id                String    @id @default(uuid())
  userId            String    @map("user_id")
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  sourceType        String    @default("audio") @map("source_type")     // audio | text | whatsapp | import
  sourceDevice      String?   @map("source_device")                     // web | mobile | desktop | widget
  audioUrl          String?   @map("audio_url")
  audioDuration     Int?      @map("audio_duration")                    // seconds
  audioSize         Int?      @map("audio_size")                        // bytes
  rawTranscript     String?   @map("raw_transcript")
  language          String?   @default("en")
  title             String?
  summary           String?
  structuredContent String?   @map("structured_content")
  topics            Json      @default("[]")
  sentiment         String?
  actionItems       Json      @default("[]") @map("action_items")
  aiMetadata        Json?     @map("ai_metadata")
  status            String    @default("pending")                       // pending | transcribing | analyzing | complete | failed
  errorMessage      String?   @map("error_message")
  processedAt       DateTime? @map("processed_at")
  userTitle         String?   @map("user_title")
  isPinned          Boolean   @default(false) @map("is_pinned")
  isArchived        Boolean   @default(false) @map("is_archived")
  deletedAt         DateTime? @map("deleted_at")
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")

  nodes             BrainNode[]
  crossLinks        BrainCrossLink[]

  @@index([userId])
  @@index([userId, status])
  @@index([userId, deletedAt])
  @@index([userId, createdAt])
  @@map("brain_entries")
}
```

#### BrainNode — Nodo del grafo

```prisma
model BrainNode {
  id          String    @id @default(uuid())
  userId      String    @map("user_id")
  entryId     String?   @map("entry_id")
  label       String
  nodeType    String    @default("concept") @map("node_type")     // concept | idea | value | goal | question | decision | person | project
  description String?
  topics      Json      @default("[]")
  importance  Int       @default(1)                               // 1-5
  posX        Float?    @map("pos_x")
  posY        Float?    @map("pos_y")
  color       String?
  isArchived  Boolean   @default(false) @map("is_archived")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  entry       BrainEntry? @relation(fields: [entryId], references: [id], onDelete: SetNull)
  edgesFrom   BrainEdge[] @relation("EdgeFrom")
  edgesTo     BrainEdge[] @relation("EdgeTo")

  @@index([userId])
  @@index([entryId])
  @@index([userId, nodeType])
  @@map("brain_nodes")
}
```

#### BrainEdge — Conexión entre nodos

```prisma
model BrainEdge {
  id          String    @id @default(uuid())
  userId      String    @map("user_id")
  fromNodeId  String    @map("from_node_id")
  toNodeId    String    @map("to_node_id")
  edgeType    String    @default("related") @map("edge_type")     // related | causes | supports | contradicts | elaborates | part_of
  strength    Float     @default(1.0)
  label       String?
  aiGenerated Boolean   @default(true) @map("ai_generated")
  createdAt   DateTime  @default(now()) @map("created_at")

  fromNode    BrainNode @relation("EdgeFrom", fields: [fromNodeId], references: [id], onDelete: Cascade)
  toNode      BrainNode @relation("EdgeTo", fields: [toNodeId], references: [id], onDelete: Cascade)

  @@unique([fromNodeId, toNodeId, edgeType])
  @@index([userId])
  @@index([fromNodeId])
  @@index([toNodeId])
  @@map("brain_edges")
}
```

#### BrainCrossLink — Puente a otros módulos TPW

```prisma
model BrainCrossLink {
  id          String    @id @default(uuid())
  userId      String    @map("user_id")
  entryId     String    @map("entry_id")
  targetType  String    @map("target_type")                       // task | goal | note | habit | quarterly_goal | weekly_goal
  targetId    String    @map("target_id")
  linkType    String    @default("related") @map("link_type")     // related | spawned_from | action_for | evidence_for
  aiGenerated Boolean   @default(true) @map("ai_generated")
  createdAt   DateTime  @default(now()) @map("created_at")

  entry       BrainEntry @relation(fields: [entryId], references: [id], onDelete: Cascade)

  @@unique([entryId, targetType, targetId])
  @@index([userId])
  @@index([entryId])
  @@index([targetType, targetId])
  @@map("brain_cross_links")
}
```

### API Endpoints (`/api/brain`)

```
POST   /entries              — Crear entrada (texto)
GET    /entries              — Listar (paginado, filtrable)
GET    /entries/:id          — Detalle con nodos, edges, cross-links
PUT    /entries/:id          — Editar (título, topics)
DELETE /entries/:id          — Soft-delete

POST   /upload-url           — Presigned URL para R2 + crear entry pending
POST   /entries/:id/process  — Trigger procesamiento post-upload
POST   /entries/:id/reprocess — Re-analizar transcript existente

GET    /graph                — Todos nodos + edges del usuario
POST   /nodes                — Crear nodo manual
PUT    /nodes/:id            — Actualizar posición/label
DELETE /nodes/:id            — Eliminar nodo

POST   /edges                — Crear edge manual
DELETE /edges/:id            — Eliminar edge

GET    /topics               — Topics únicos con conteos
GET    /search?q=...         — Full-text search
```

### Upload de Audio (Two-Phase)

Audio NUNCA pasa por API server:

1. Client → `POST /upload-url` → recibe presigned R2 URL + entry ID
2. Client → upload directo a R2
3. Client → `POST /entries/:id/process` → trigger pipeline async
4. Server procesa en background → push notification al completar

### Pipeline AI

```
Audio → Deepgram (transcribe) → Claude (analyze con contexto usuario)
                                         ↓
                            Extrae: título, summary, topics, sentiment,
                            action items, nodos de grafo, edges,
                            cross-links a tasks/goals/habits/notes existentes
                                         ↓
                            Persiste: BrainEntry + BrainNodes + BrainEdges + BrainCrossLinks
                            Fuzzy-match cross-links contra items existentes del usuario
```

---

## Integración con Módulos Existentes

| Módulo | Integración |
|--------|-------------|
| **Tasks** | Action items → auto-crear Tasks. Cross-link bidireccional |
| **Goals** | AI detecta lenguaje de metas → vincula a QuarterlyGoal/ThreeYearGoal |
| **Notes** | "Promover" brain entry a Note completa. Importar Note al grafo |
| **Habits** | AI detecta reflexiones sobre hábitos → cross-link a Habit |
| **Chat** | Nuevos tools: `searchBrain`, `addToBrain`. Context de entries recientes en system prompt |
| **Gamification** | XP source: `brain_entry`. Achievements: "First Thought", "Brain Storm" (10), "Neural Network" (50 connections) |

---

## Captura Multi-Plataforma

| Plataforma | Método | Tecnología |
|------------|--------|------------|
| **Web** | FAB → modal con Record/Type/Upload | `MediaRecorder` API + `Web Audio API` (waveform) |
| **Mobile** | FAB en dashboard + home widget + share sheet | `expo-av` (audio) + `expo-widgets` (Android) |
| **Desktop** | Botón en overlay + shortcut Ctrl+Shift+B + tray menu | Extender `useVoiceListener` existente en Tauri overlay |
| **Telegram** | Bot: user vincula ID → envía audio/texto → webhook procesa | Telegram Bot API (sin verificación business) |
| **WhatsApp** | Fase posterior al Telegram | WhatsApp Business Cloud API |

---

## Plan de Fases

### Fase 1: MVP — Texto + AI + Feed (4-6 semanas)
- Schema Prisma (4 modelos)
- Backend: `brain.repo.ts`, `brain.service.ts`, `brain.ts` (routes)
- Frontend web: feature `brain/` con api, queries, components (feed, detail, text capture)
- Ruta: `/_app/brain`
- Feature gate: `SECOND_BRAIN`
- **Sin audio, sin grafo** — valida propuesta de valor core

### Fase 2: Audio + Grafo (4-6 semanas)
- Integración Deepgram + R2
- Audio recording (web MediaRecorder + mobile expo-av)
- React Flow graph view con custom nodes
- Desktop: capture en overlay

### Fase 3: Inteligencia + Widgets (4-6 semanas)
- Insights endpoint (patrones de pensamiento)
- Telegram bot
- Mobile widgets (Android/iOS)
- Chat tools (searchBrain, addToBrain)
- Gamification XP + achievements

### Fase 4: Avanzado (ongoing)
- Vector embeddings (pgvector) para búsqueda semántica
- "Daily Brain Digest" — resumen AI de pensamientos recientes
- "Connection Suggestions" — AI propone links entre nodos no conectados
- Export a Obsidian/Notion
- Spaced repetition (resurfacing de pensamientos antiguos)

---

## Archivos Críticos para Implementación

| Archivo | Acción |
|---------|--------|
| `apps/api/prisma/schema.prisma` | Agregar 4 modelos + campos en User y SubscriptionPlan |
| `apps/api/src/services/chat.service.ts` | Referencia para patrón AI (generateObject) |
| `packages/shared/src/constants/features.ts` | Agregar SECOND_BRAIN, BRAIN_ENTRIES_LIMIT |
| `apps/api/src/app.ts` | Registrar brain routes |
| `apps/desktop/overlay/src/hooks/use-voice-listener.ts` | Extender para brain capture |

## Verificación

1. Crear entry texto → verificar AI genera título, topics, nodos
2. Ver feed con entries procesadas
3. Verificar cross-links detectados correctamente contra tasks/goals existentes
4. (Fase 2) Grabar audio → verificar transcripción + análisis
5. (Fase 2) Ver grafo con nodos y edges correctos
6. Feature gate bloquea acceso sin suscripción
