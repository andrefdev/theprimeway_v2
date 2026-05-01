# Checkpoint — Optimistic Updates + Web Architecture Refactor

**Fecha:** 2026-04-30
**Branch:** main
**Status:** trabajo incremental, sin commit. Typecheck `pnpm -F web typecheck` limpio.

## Contexto

Sesión iniciada por el problema "secciones lentas, marcar hábito tarda mucho". Diagnóstico: todas las mutations en 25+ features usaban `invalidateQueries` puro — UI esperaba round-trip antes de reflejar cambios. Solo `notifications` tenía optimistic correcto.

Plan completo en: `C:\Users\andre\.claude\plans\quiero-que-en-la-async-mist.md`

## Lo que ya está hecho

### 1. Optimistic Updates (TanStack Query)

**Primitivas compartidas** — `apps/web/src/shared/lib/optimistic.ts`
- `snapshotQueries<T>(qc, key)` — cancela in-flight + snapshot
- `patchQueries<T>(qc, key, updater)` — patch sobre todas las variantes que matchean prefix
- `rollbackQueries<T>(qc, snapshots)` — restaura
- `listOps.{upsert, remove, patch}` — helpers para arrays `{id}`

**QueryClient defaults** — `apps/web/src/main.tsx`
- Añadido `mutations: { retry: 0 }` para evitar mutaciones duplicadas con UI optimista

**Features migradas a optimistic:**
- `habits/queries.ts` — toggle log + create/update/delete + linkHabitToGoal
- `tasks/queries.ts` — create/update/delete (incluye temp ID generation para create)
- `subtasks/queries.ts` — toggle/create/update/delete
- `brain/queries.ts` — create/update/delete (reprocess y applyActionItem siguen invalidate-only)
- `goals/queries.ts` — update + delete para vision/3y/annual/quarterly/weekly (creates siguen invalidate-only por linkage de IDs server-side). Helpers `optimisticListPatch` y `optimisticListRemove`
- `calendar/queries.ts` — googleEvent update/delete
- `rituals/queries.ts` — update/delete (instance + reflection siguen invalidate)
- `recurring/queries.ts` — update/delete
- `pomodoro/queries.ts` — update/delete session
- `scheduling/queries.ts` — delete working session
- `personalization/queries.ts` — refactor para usar shared helpers (no cambio de comportamiento)
- `notifications/queries.ts` — refactor para usar shared helpers (ya era optimista)

### 2. Refactor estructural — `routes/_app/ai.tsx`

De **483 → 244 líneas**. Extraído todo `executeTool` (240 líneas, 13 tools, 30 `as any`) a `features/ai/`:
- `features/ai/tools/types.ts` — `ToolHandler`, `ToolContext`, `ToolResult`
- `features/ai/tools/registry.ts` — dispatch table
- `features/ai/tools/handlers/{tasks,habits,goals,calendar,pomodoro,scheduling}.ts` — handlers tipados con args interfaces
- `features/ai/hooks/useExecuteTool.ts` — el hook que consume la ruta

Preservados: `no_google_account` toast branch en calendar handlers, `autoScheduleTask` Success/Failure dispatch, `createGoal`/`deleteGoal` por `level`.

### 3. Memoizaciones

**`GoalMetricsView.tsx`** — `threeYear/annual/quarterly/weekly` arrays + bloque de métricas + `weeklyStreak` en `useMemo`. `isArchived`/`isCompleted` movidos a scope de módulo.

**`GoogleCalendarView.tsx` (TimeGrid + MonthGrid)** — `dayBuckets` con `getItemsForDay + filter + layoutItems` en `useMemo` (antes corría 3× por día por render). `MonthGrid` también memoiza `days` y `dayBuckets`.

### 4. Type safety en APIs

**`features/ai/api.ts`** — añadidos `WeeklyPlanDay`, `WeeklyPlan`. Eliminado `result: any` en `WeeklyPlanCard`.

**`features/calendar/api.ts`** — 14 nuevos tipos (`UpdateCalendarBody`, `UpdateAccountBody`, `CreateTimeBlockInput`, `CreateTimeBlockResult`, `UpdateGoogleEventBody`, `CreateHabitBlockInput`, `CreateHabitBlockResult`, `FreeSlot`, `SmartSlot`, `SmartSlotsResult`, `FreeTimeAnalysis`, `TimeBlocksAnalysis`, `ConnectGoogleResult`). Eliminados todos los `{ data: any }` (8 ocurrencias). `SmartSlotPicker` migrado a `SmartSlot`.

### 5. Migración a TanStack Query — currency settings

**`features/settings/hooks/use-currency-settings.ts`** — reescrito sobre `useQuery`+`useMutation`, key `['settings', 'currency']`, `staleTime: CACHE_TIMES.long`. API pública preservada (`settings/loading/error/updateSettings/resetSettings/refresh`). `settingsApi` extendido con 3 métodos (`getCurrencySettings`, `updateCurrencySettings`, `resetCurrencySettings`).

**`BrainCaptureCard.tsx`** — eliminadas ~15 líneas de manejo manual 401/403. Ahora delega al axios interceptor + `MutationCache.onError` global.

**`AiRitualSummary.tsx`** — `useState(loading)` + try/catch → `useMutation`.

### 6. CACHE_TIMES estandarizados

- `channels/queries.ts`: `30_000` → `CACHE_TIMES.short`
- `auth/queries.ts`: `5 * 60 * 1000` → `CACHE_TIMES.standard`
- `brain/queries.ts`: dejado intencional (10s + refetchInterval para polling de procesamiento AI)

### 7. Refactor de monstruos

**`FocusMode.tsx`** — 367 → 249 líneas. Extraídos 4 hooks en `features/focus/hooks/`:
- `use-focus-task.ts` (13L) — query
- `use-focus-timer.ts` (25L) — tick + cómputo elapsed
- `use-focus-actions.ts` (127L) — start/pause/resume/complete/saveNextStep + loading states
- `use-focus-keyboard.ts` (30L) — atajos espacio/enter/escape

Eliminados todos los `any` del componente. `closeKeepingTimer` redundante quitado. `PRESET_DURATIONS` extraído.

**`GoogleCalendarView.tsx`** — 712 → 281 líneas (–60%). Extraído a `features/calendar/components/calendar-grid/`:
- `constants.ts` (65L) — constantes + `LaidOutItem` + `layoutItems()`
- `TimeGrid.tsx` (251L) — vista week/day + `AllDayChip` colocado
- `MonthGrid.tsx` (139L) — vista mes

Eliminado `e: any` en handler de delete event.

## Lo que falta del punch list

### Componentes monstruo restantes
- `EventEditDialog.tsx` (450L) — form + dialog state + save logic. Patrón: extraer `useEventForm` hook (validación + state) y `useSaveEvent` (mutation con todos los branches: create/update, addGoogleMeet, attendees, etc).
- `GoalDialog.tsx` (354L) — similar al pattern de `useFocusActions`. Form + create/update mutation.

### Type safety
~95 ocurrencias restantes de `any` en features. Hotspots:
- `goals/queries.ts:147-152` — `toArray` + 4 `(g: any) =>` en `useGoalDetail`. Fácil de tipar.
- `goals/components/GoalMetricsView.tsx` — varios `(g as any).progress`, `(g as any).status`
- `calendar/hooks/use-calendar-items.ts:102-149` — `event as any` con normalización defensiva (Google raw shape vs typed). Justificado pero podría tiparse mejor con union.
- `focus/components/FocusSubtasksPanel.tsx` (no revisado)

### Otros patrones detectados pero no atacados
- Más componentes >300L podrían tener hooks extraídos (revisar al avanzar otros)
- Algunos features podrían beneficiarse de invalidaciones más granulares (hoy invalidan `feature.all()` cuando `feature.lists()` bastaría)

## Cómo retomar

1. **Validar UX en browser primero**: golden path para habits toggle, tasks toggle, brain create, calendar event delete. Verificar que UI flipea instantáneo y que rollback en error funciona (DevTools → throttle Offline).
2. **Si UX OK, seguir con monstruos**: empezar por `GoalDialog` (más simple que `EventEditDialog`).
3. **Tipos `any`**: barrer `goals/queries.ts` + `goals/components/GoalMetricsView.tsx` en una sola pasada (mismo dominio).
4. **No tocado, considerar**: tests. Las primitivas en `shared/lib/optimistic.ts` son puras y testeables — buen candidato para primer test del repo si se decide introducir testing.

## Archivos clave creados/modificados

**Nuevos:**
- `apps/web/src/shared/lib/optimistic.ts`
- `apps/web/src/features/ai/tools/{types,registry}.ts`
- `apps/web/src/features/ai/tools/handlers/{tasks,habits,goals,calendar,pomodoro,scheduling}.ts`
- `apps/web/src/features/ai/hooks/useExecuteTool.ts`
- `apps/web/src/features/focus/hooks/use-focus-{task,timer,actions,keyboard}.ts`
- `apps/web/src/features/calendar/components/calendar-grid/{constants.ts,TimeGrid.tsx,MonthGrid.tsx}`

**Modificados (sustantivo):**
- `apps/web/src/main.tsx` (mutations.retry: 0)
- `apps/web/src/features/{habits,tasks,subtasks,brain,goals,calendar,rituals,recurring,pomodoro,scheduling,personalization,notifications,channels,auth}/queries.ts`
- `apps/web/src/features/settings/{api.ts,hooks/use-currency-settings.ts}`
- `apps/web/src/features/{ai,calendar}/api.ts`
- `apps/web/src/features/calendar/components/SmartSlotPicker.tsx`
- `apps/web/src/features/brain/components/BrainCaptureCard.tsx`
- `apps/web/src/features/rituals/components/AiRitualSummary.tsx`
- `apps/web/src/features/goals/components/GoalMetricsView.tsx`
- `apps/web/src/features/focus/components/FocusMode.tsx`
- `apps/web/src/features/calendar/components/GoogleCalendarView.tsx`
- `apps/web/src/routes/_app/ai.tsx`

## Verificación pendiente

```bash
# Typecheck (limpio en último run)
pnpm -F web typecheck

# Smoke manual:
# - /habits → toggle hábito → UI flipea inmediato
# - /tasks → marcar done → tachado inmediato
# - /brain → capturar pensamiento → aparece en feed inmediato
# - /calendar → eliminar event Google → desaparece inmediato
# - /ai → pedir "create task X" → click accept → toast + lista actualizada
# - DevTools Network → Offline → toggle hábito → revierte + toast error
```
