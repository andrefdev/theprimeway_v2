# Checkpoint — AI Chat History (Fenrir, Claude-style)

> **Date:** 2026-05-04
> **Branch:** `main`
> **Status:** ⚠️ Code complete — **NOT yet smoke-tested.** Requires `prisma db:push` + manual verification before merge.
> **Companion docs:** plan at `~/.claude/plans/arman-un-plan-detallado-golden-firefly.md`

---

## TL;DR

- **Goal:** Persistir las conversaciones con el asistente Fenrir para que el usuario pueda retomarlas (estilo Claude). Antes vivían solo en `useState` dentro del Sheet — se perdían al cerrar el panel.
- **Scope confirmado con el usuario (3 decisiones):**
  1. Persistencia + **streaming token-a-token** (cambio mayor en `ChatPanel`).
  2. Títulos generados por una **llamada extra a la IA** (Haiku/fastModel, 3-5 palabras).
  3. **Tool calls persistidos** en un campo JSON dentro de `ChatMessage`.
- **Reutilizado:** los modelos `ChatThread` / `ChatMessage` ya existían en `schema.prisma` pero estaban huérfanos (ningún servicio escribía en ellos). Se aprovecharon.
- **Reutilizado x2:** la página completa `routes/_app/ai.tsx` ya usaba `useChat` + `DefaultChatTransport` + `ToolCallCard`. La misma receta se aplicó al ChatPanel del Sheet.

---

## Estado de typecheck

- **`apps/api`** — los errores de chat son cero. Quedan errores preexistentes de implicit-any en `chat.service.ts` (`tasks.map((t) => ...)`) y faltantes de exports `Prisma`, `Task`, `HabitLog`, `UserSettings` desde `@prisma/client`. **Estos errores aparecen porque `prisma generate` no corrió en mi entorno** (no había `DATABASE_URL`). Una vez que el usuario corra `pnpm --filter api db:generate` desaparecen.
- **`apps/web`** — los archivos nuevos/modificados (`features/ai/*`) compilan limpio. El único error restante es `SmartSlotPicker.tsx:58` (`startTime`/`endTime` no encontrados) que es **pre-existente** y no relacionado con este trabajo.

---

## Cambios

### Backend — `apps/api`

#### Schema (`prisma/schema.prisma`)
```diff
 model ChatMessage {
   id        String    @id @default(uuid())
   threadId  String    @map("thread_id")
   role      String
   content   String
   model     String?
   toolName  String?   @map("tool_name")
+  toolCalls Json?     @map("tool_calls")
   createdAt DateTime? @default(now()) @map("created_at")

   thread ChatThread @relation(fields: [threadId], references: [id], onDelete: Cascade)

-  @@index([threadId])
+  @@index([threadId, createdAt])
   @@map("chat_messages")
 }
```
`ChatThread` quedó como estaba (ya tenía `title`, `lastMessageAt`, `updatedAt`).

#### Repositorio (`src/repositories/chat.repo.ts`)
Tipos exportados:
- `PersistedToolCall { toolCallId, toolName, args, result? }`

Métodos nuevos:
- `createThread(userId)`
- `findThreadById(userId, threadId)`
- `findThreads(userId)` → list ordenada por `lastMessageAt DESC`
- `findThreadWithMessages(userId, threadId)` → thread + mensajes ordenados ASC
- `appendMessage(threadId, { role, content, toolCalls?, model? })`
- `touchThread(threadId)` — actualiza `lastMessageAt = now()`
- `renameThread(userId, threadId, title)` (devuelve `boolean` por ownership)
- `deleteThread(userId, threadId)` (devuelve `boolean`)
- `deleteAllThreads(userId)` (devuelve `count`)
- `getFirstUserAndAssistantMessages(threadId)` — para generación de título

#### Servicio de títulos (nuevo: `src/services/chat-title.service.ts`)
- `chatTitleService.generate(userId, threadId)` — fire-and-forget.
- Usa `fastModel` (DeepSeek por ahora; cambiar a Haiku si quieres más calidad).
- System prompt: "Output ONLY 3 to 5 words. No quotes, no period."
- Limpia el resultado (quita comillas/punto final, trunca a 100).
- Try/catch silencioso — un título fallido no rompe el chat.

#### Servicio de chat (`src/services/chat.service.ts`)
Modificado `chatStream(userId, body: { messages, threadId? })`:
1. Resuelve thread (busca por id+userId; si no existe o falta, crea uno nuevo).
2. Persiste el último mensaje del usuario (`extractUiMessageText` extrae texto plano del UIMessage).
3. Pasa `onFinish` a `streamText` que:
   - Recorre `steps`, mapea `toolCalls` ↔ `toolResults` por `toolCallId`.
   - Persiste mensaje del asistente con `content + toolCalls[]`.
   - Hace `touchThread`.
   - Si el thread no tenía título, dispara `chatTitleService.generate` sin await.
4. Devuelve `{ stream, threadId }` (la ruta inyecta el threadId en el header).

`POST /` (non-stream) **no se tocó** — sigue usándose para `weeklyPlanning` y compañía.

#### Rutas (`src/routes/chat.ts`)
Endpoints nuevos bajo `/api/chat`:
- `GET /threads` — lista del usuario.
- `GET /threads/:id` — thread + mensajes (404 si no es del usuario).
- `PATCH /threads/:id` — renombrar (`{ title }`, validado con `threadRenameSchema`).
- `DELETE /threads/:id` — eliminar uno.
- `DELETE /threads` — eliminar todos.

`POST /stream` modificado: acepta `threadId?` en el body, agrega header `X-Thread-Id` a la respuesta.

#### CORS (`src/app.ts`)
Añadido `exposeHeaders: ['X-Thread-Id']` para que el cliente pueda leer el header.

#### Validators (`packages/shared/src/validators/chat.ts`)
- `chatMessageSchema` ahora acepta `threadId: z.string().uuid().optional()`.
- Nuevo `threadRenameSchema = z.object({ title: z.string().min(1).max(100) })`.
- Re-exportados desde `validators/index.ts`.

### Frontend — `apps/web`

#### API (`src/features/ai/api.ts`)
Tipos exportados nuevos: `ChatThreadSummary`, `PersistedToolCall`, `PersistedChatMessage`, `ChatThreadWithMessages`.

Métodos nuevos:
- `aiApi.listThreads()`
- `aiApi.getThread(id)`
- `aiApi.renameThread(id, title)`
- `aiApi.deleteThread(id)`
- `aiApi.deleteAllThreads()`

#### Queries (`src/features/ai/queries.ts`)
Refactor al patrón factory (igual a `tasks/queries.ts`):
- `aiQueries.threads()` — list, `staleTime: CACHE_TIMES.standard`.
- `aiQueries.thread(id)` — detail, `enabled: !!id`.

Mutations (con optimistic updates):
- `useRenameThreadMutation()`
- `useDeleteThreadMutation()`
- `useDeleteAllThreadsMutation()`

#### ChatPanel (`src/features/ai/components/ChatPanel.tsx`)
Reescrito completo. Estructura:
- Estado: `view: 'chat' | 'history'`, `activeThreadId: string | undefined`.
- Header del Sheet con dos botones: **Historial** (icono `History`) y **Nueva conversación** (icono `Plus`).
- Vista historial → `<ChatHistoryList>`.
- Vista chat → `<ChatThreadView key={activeThreadId ?? 'new'}>` (forzar remount al cambiar de thread).

`ChatThreadView`:
- `useQuery(aiQueries.thread(threadId))` para hidratar `initialMessages`.
- Convierte mensajes persistidos a UIMessages con `parts: [TextUIPart, ...ToolUIPart]` (helper `persistedToUIMessages`).
- `DefaultChatTransport` con:
  - `api: '/api/chat/stream'`
  - `headers`: lee Bearer token de `useAuthStore` en cada request.
  - `body`: incluye `threadId` (lee desde un ref para no quedar stale) + `locale`.
  - `fetch`: custom — captura `X-Thread-Id` del response y llama `onThreadCreated(id)`.
- `useChat({ transport, messages: initialMessages, id: threadId ?? 'new', onError })`.
- Botón Stop visible mientras `status === 'streaming' | 'submitted'`.
- `MessageBubble` renderiza `parts`: TextUIPart → markdown (asistente) o whitespace-pre (usuario); ToolUIPart → `ToolCallCard` con mapeo de estado AI SDK v5 → API antigua de la tarjeta (`output-available` → `result`, `input-streaming` → `partial-call`).
- Tool calls: `addToolResult` (write tools client-side via `useExecuteTool`).

#### ChatHistoryList (nuevo: `src/features/ai/components/ChatHistoryList.tsx`)
- Lista de threads (`useQuery(aiQueries.threads())`).
- Cada fila muestra título (`untitled` por defecto) + fecha relativa (`today`/`yesterday`/`daysAgo {{count}}`/local date).
- Dropdown por fila con **Renombrar** (abre `Dialog` con `Input` autoFocus, Enter para guardar) y **Eliminar**.
- Footer con **Borrar todo** dentro de `AlertDialog`.

#### i18n (`src/i18n/locales/{en,es}/ai.json`)
14 keys nuevas: `newChat`, `history`, `back`, `delete`, `rename`, `actions`, `stop`, `deleteConfirm`, `clearAll`, `clearAllConfirmTitle`, `clearAllConfirm`, `noHistory`, `historyEmpty`, `untitled`, `today`, `yesterday`, `daysAgo`.

---

## Lo que NO se hizo (intencional)

- **`POST /chat` (non-stream)** se mantiene tal cual. Ya no lo usa el ChatPanel; sigue disponible para otros consumidores.
- **`routes/_app/ai.tsx`** (la página de chat full-page) **no se modificó**. Sigue funcionando con su propio `useChat` aislado y NO persiste — usa la misma URL `/api/chat/stream` pero sin enviar `threadId`, así que el server crea un thread fantasma cada vez. **TODO opcional:** integrar `aiQueries.threads` ahí también para reutilizar la misma persistencia. No lo hice porque no estaba en el plan acordado.
- **Borrado por desactivar `aiDataSharing`**: el flag bloquea escritura/inferencia (`/stream` retorna 403) pero la lectura del historial **no** está bloqueada por el flag. Si el usuario quiere "ocultar" el historial al desactivar el flag, hay que añadir esa lógica al `GET /threads` y `GET /threads/:id`.
- **Streaming durante navegación entre threads**: si el usuario abre el historial mientras el stream está activo, el stream sigue (no se aborta). El `key={activeThreadId ?? 'new'}` remonta el view solo cuando se selecciona otro thread.

---

## Pendientes ANTES de testear (orden importa)

1. **Cargar `DATABASE_URL`** en el entorno (cualquier shell con acceso al `.env` del api).
2. **`pnpm --filter @repo/api db:push`** — aplica la nueva columna `tool_calls` y el índice. Es destructivo solo en el sentido de que ALTER TABLE; no hay datos previos en `chat_messages` (la tabla estaba huérfana).
3. **`pnpm --filter @repo/api db:generate`** — regenera el Prisma Client con el nuevo campo.
4. **`pnpm --filter @repo/api typecheck`** — debería bajar de ~80+ errores a 0 (o casi).
5. **`pnpm dev`** — arranca api + web.

---

## Plan de smoke test (mañana)

### Golden path
1. Abrir el botón Fenrir (esquina inferior derecha).
2. Mandar: *"Crea una tarea para revisar el reporte mañana"*.
   - ✔ Streaming token-a-token visible.
   - ✔ Aparece tarjeta de tool call con botones aceptar/rechazar.
   - ✔ Aceptar → la tarea aparece en `/tasks`.
3. Cerrar el Sheet, reabrirlo.
4. Click en icono **Historial** (header).
   - ✔ Aparece la conversación. Esperar 2-5s y refrescar (TanStack Query revalida) — el título debe pasar de "Untitled" a algo como "Crear tarea revisar reporte".
5. Click en la conversación.
   - ✔ Mensajes se rehidratan en orden.
   - ✔ La tarjeta del tool call aparece como **Applied** (no botones de aceptar/rechazar).
6. Click en **Nueva conversación** (icono +).
   - ✔ Se vacía. Mandar otro mensaje → crea otro thread (no contamina el anterior).

### Renombrar / eliminar
7. En historial: dropdown de una fila → **Renombrar** → escribir y Enter.
   - ✔ Cambio inmediato (optimistic).
8. Dropdown → **Eliminar** → desaparece.
9. **Borrar todo** (footer) → confirmar en el `AlertDialog`.
   - ✔ Lista vacía.

### Edge cases
10. Cortar internet a mitad de un stream → la respuesta del asistente no se persiste (`onFinish` no dispara). Mensaje del usuario sí queda guardado. Reintentar funciona.
11. Multi-tab: abrir dos pestañas, hacer cambios en una y refrescar la otra → sincronizado vía cache invalidation (el TanStack Query no escucha eventos cross-tab por defecto, así que requiere refresh manual).
12. Settings → desactivar **AI Data Sharing** → mandar mensaje → toast "AI is disabled" (403). Historial previo sigue accesible.
13. Mensaje muy largo (>5 steps por `stopWhen`) → ver que el stream para limpio.

### Cosas a vigilar
- Que el header `X-Thread-Id` se esté propagando: en DevTools → Network → request a `/api/chat/stream` → Response Headers debe tener `X-Thread-Id: <uuid>`. Si no está, el primer mensaje de una nueva conversación NO va a quedar asociado al thread del lado del cliente (el server sí lo persiste, pero el cliente no sabe el id, así que la próxima vez crea otro thread).
- Que `prisma generate` haya corrido: si `chat.service.ts` sigue mostrando errores de implicit-any tras typecheck, no corrió.

---

## Archivos tocados

**Backend (10):**
- `apps/api/prisma/schema.prisma`
- `apps/api/src/repositories/chat.repo.ts` (rewrite)
- `apps/api/src/services/chat.service.ts` (modify chatStream, add helpers/imports)
- `apps/api/src/services/chat-title.service.ts` (nuevo)
- `apps/api/src/routes/chat.ts` (rewrite)
- `apps/api/src/app.ts` (CORS expose)
- `packages/shared/src/validators/chat.ts`
- `packages/shared/src/validators/index.ts`

**Frontend (6):**
- `apps/web/src/features/ai/api.ts` (rewrite)
- `apps/web/src/features/ai/queries.ts` (rewrite)
- `apps/web/src/features/ai/components/ChatPanel.tsx` (rewrite)
- `apps/web/src/features/ai/components/ChatHistoryList.tsx` (nuevo)
- `apps/web/src/i18n/locales/en/ai.json`
- `apps/web/src/i18n/locales/es/ai.json`

**Reutilizado tal cual:**
- `apps/web/src/features/ai/components/ToolCallCard.tsx`
- `apps/web/src/features/ai/components/Markdown.tsx`
- `apps/web/src/features/ai/components/ChatInput.tsx`
- `apps/web/src/features/ai/components/FenrirLauncher.tsx`
- `apps/web/src/features/ai/hooks/useExecuteTool.ts`
- `apps/api/src/middleware/auth.ts` y `feature-gate.ts`
