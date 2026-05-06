# Checkpoint — Scheduler & Calendar Refactor

**Fecha:** 2026-05-06
**Branch:** main
**Status:** trabajo en árbol sin commit. Typecheck API/web/shared limpio. 53/53 tests del API pasan. Migración pendiente de aplicar (ver al final).

## Contexto

`/tasks/today` no agendaba bien (Plan day fallaba con "couldn't fit" sin razón) y los eventos creados desde la página de calendar / IA no aparecían en la UI aunque sí llegaban a Google. Diagnóstico: tres mundos desincronizados (UI live de Google, scheduler con cache vacío, espejo `Task.scheduledStart` desactualizado), bug de timezone en la entrada del scheduler, schema OpenAPI sin `autoSchedule`, `syncCalendars` vacío, push a Google sin fallback de calendario destino, y el frontend descartaba `reason` del backend.

Plan completo: `C:\Users\andre\.claude\plans\estuve-viendo-lo-que-humble-globe.md`

## Fase A — Hotfix P0

1. **Timezone en entrada del scheduler.** Nuevo `ymdToLocalDayUtc(ymd, tz)` en `packages/shared/src/utils/timezone.ts:53`. `autoSchedule(taskId, day, opts)` acepta `Date | string` y resuelve `UserSettings.timezone` internamente. Misma corrección en `deconflict.ts`, `early-completion-reflow.ts`, `late-timer-detector.ts` (todos usaban `dt.startOfDay(...)` con tz default UTC).
2. **`autoSchedule` en `createTaskSchema`** — `apps/api/src/routes/tasks.ts:55-57`. Antes Zod lo eliminaba antes del service.
3. **`syncCalendars` real** — `calendar.service.ts:355-440`. Pull paginado de Google (-7d → +60d, hasta 20 páginas) y upsert vía `upsertCalendarEventCache`. Disparo automático al final de `handleGoogleCallback`.
4. **Fallback `findTargetCalendarForUser`** en `pushSessionToCalendar` (`calendar.service.ts:1320`). Antes exigía `Channel.timeboxToCalendarId`; ahora cae al `defaultTargetCalendarId` o al primary.
5. **Razón estructurada en Plan Day** — `TasksToday.tsx:164-200` agrupa fallos por `NO_WORKING_HOURS` / `NO_GAPS` / `WOULD_NOT_FIT` con toasts diferenciados.
6. **`timeZone` real (no `'UTC'`)** en body del POST/PATCH a Google — `pushSessionToCalendar` y `updateSessionOnCalendar`.

## Fase B — Refactor estructural P1

1. **`SchedulingFacade`** — nuevo `apps/api/src/services/scheduling/scheduling-facade.ts`. Único orquestador para `scheduleTask`, `createSession`, `moveSession`, `removeSession`, `syncTaskMirror`, `reflowEarlyCompletion`, `onTimerStart`, `deconflict`. Cada operación: persistencia → espejo `Task.scheduled*` → push a Google → `Command` para undo → publish `session.*` en sync server.
2. **Callers migrados:** `routes/scheduling.ts` (incluye nuevo `POST /scheduling/sessions/move`), `routes/working-sessions.ts`, `services/working-sessions.service.ts`, `services/tasks.service.ts` createTask con `autoSchedule:true`.
3. **`WorkingSession` como verdad en la UI** — `apps/web/src/features/calendar/hooks/use-calendar-items.ts` carga `useWorkingSessionsRange`, mapea sesiones a `CalendarItem` con `type:'session'`, dedupea contra `Task.scheduledStart`. El branch legacy de Task queda como fallback.
4. **Drag/drop usa la fachada** — `TasksToday.tsx` `placeTaskAt`: si la tarea ya tiene sesión visible la mueve (`sessionId`), si no crea una nueva (`taskId`). Hook `useMoveSession`.
5. **Duplicados eliminados:** `apps/api/src/services/schedule-optimizer.ts` y `apps/web/src/features/tasks/hooks/use-auto-scheduling.ts`. `getScheduleSuggestion`, `getFreeSlots`, `analyzeFreeTime` reescritos sobre `gap-finder.collectBusyBlocks` + `computeGaps`.
6. **AI tools alimentadas con gaps reales** — `generateTimeBlocks` y `findSmartSlots` reciben gaps pre-computados; el AI solo asigna/puntúa, no descubre huecos. Bye bye bugs de timezone propios.
7. **`CalendarEvent` cache como fuente única para externos** — nuevo `listCachedEventsForUi`. `GET /api/calendar/google/events` lee del cache; trigger background `syncCalendars` si está vacío.
8. **Realtime** — `SyncEventType` extendido con `session.created/updated/deleted`. `use-sync-socket.ts` invalida `working-sessions` y `tasks`. `task.*` también invalida `calendar`.
9. **Invalidaciones cruzadas correctas** en `tasks/queries.ts` (create/update/delete invalidan `calendar` + `working-sessions`).

## Fase C — Hardening P2

1. **Idempotency keys** — migración `20260505210000_add_command_idempotency_key` añade `commands.idempotency_key TEXT UNIQUE`. `commandManager.record(...)` acepta `idempotencyKey` + `result`. Helper `resolveIdempotency` en `routes/scheduling.ts` aplica a `POST /auto-schedule` y `POST /sessions/move`. Frontend genera UUID v4 (`crypto.randomUUID` con fallback) por mutación en `useAutoSchedule` y `useMoveSession` y lo manda en header `Idempotency-Key`. Replays devuelven `{ data, replayed: true }`.
2. **Advisory locks por usuario** — `apps/api/src/services/scheduling/user-lock.ts` con `withUserLock(userId, fn)` → `pg_advisory_xact_lock(sha1(userId).int64)`. Aplicado en `scheduleTask`, `createSession`, `moveSession`. Refactor menor: `*Inner` privadas para mantener firma pública.
3. **Refresh proactivo de tokens Google** — `calendarService.refreshExpiringGoogleTokens()` busca cuentas con `expiresAt < now+1h` y refresca. Nuevo cron `POST /api/cron/refresh-google-tokens` (cada 30 min recomendado).
4. **Tests** — `apps/api/src/services/scheduling/scheduling.test.ts` con 12 tests puros para `computeGaps`, `mergeOverlapping`, `planSplit`. 53/53 pasan en total.
5. **Docs actualizadas** — `docs/CALENDAR_SYNC_SETUP.md` reescrito con la arquitectura post-refactor (sin `task_calendar_bindings`, con `SchedulingFacade`, idempotency, locks, mapping hook→endpoint). `docs/TASK_SCHEDULER_ALGO.md` con callout al inicio apuntando al facade.

## Hotfix posterior — write-through al cache

Después de B5, eventos creados desde la página de calendar o desde la IA llegaban a Google pero no aparecían en la UI: el cache solo se llenaba por webhook (no funciona en dev) o sync inicial.

**Fix** en `calendar.service.ts`:
- `createTimeBlock` → `upsertCalendarEventCache(targetCal.id, event)` con la respuesta de Google.
- `updateGoogleEvent` → write-through del evento patcheado.
- `deleteGoogleEvent` → `prisma.calendarEvent.deleteMany({ calendarId, externalId })`.
- `createHabitBlock` (recurrentes) → trigger `syncCalendars` en background para que pulle las instancias expandidas.
- `upsertCalendarEventCache` ahora **filtra eventos con `extendedProperties.private.theprimewaySessionId`**: son sesiones que ya rendereamos desde la tabla `WorkingSession`, cachearlas duplicaría el bloque en la grid.

## Acción pendiente para deploy

1. La migración `20260505210000_add_command_idempotency_key` está creada manualmente (Prisma migrate dev quería resetear la DB local por drift previo en `brain_*`, no relacionado con este trabajo). Aplicar con:
   ```bash
   pnpm --filter @repo/api prisma migrate deploy
   ```
2. Configurar cron en producción:
   - `POST /api/cron/calendar-watch-renew` cada ≤24h (ya existía).
   - `POST /api/cron/refresh-google-tokens` cada 30min (nuevo).

## Archivos clave para el próximo paso

- `apps/api/src/services/scheduling/scheduling-facade.ts` — única entrada para mutaciones de scheduling.
- `apps/api/src/services/scheduling/gap-finder.ts` — única lógica de gaps/working-hours/tz.
- `apps/api/src/services/scheduling/user-lock.ts` — advisory lock helper.
- `apps/api/src/services/calendar.service.ts` — sync, push/update/delete a Google con write-through.
- `apps/web/src/features/calendar/hooks/use-calendar-items.ts` — render unificado sessions + events + tasks legacy.
- `apps/api/prisma/migrations/20260505210000_add_command_idempotency_key/migration.sql` — pendiente de aplicar.
