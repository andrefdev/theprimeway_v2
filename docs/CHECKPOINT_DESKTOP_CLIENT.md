# Checkpoint — Cliente Desktop (Tauri)

**Fecha:** 2026-04-30
**Plan de referencia:** `C:\Users\andre\.claude\plans\revisa-el-estado-actual-iridescent-wand.md`
**PRD:** `docs/PRODUCT_REQUIREMENTS.md` §7 (DSK-F01..F40)

## Estado global

P0 casi completo. Solo falta WebSocket sync (P0-7) para cumplir el bloque mínimo "MVP cumple PRD". P1 y P2 sin tocar.

## Hecho en esta sesión

### P0-1 — Token persistente (DSK-F02 / NFR-S01 parcial)
- `apps/desktop/src-tauri/src/lib.rs`: `set_auth_token` / `clear_auth_token` ahora persisten en `tauri-plugin-store` (`auth.json`). `setup()` hidrata `AppState` desde disco al arranque.
- `Cargo.toml`: ya tenía `tauri-plugin-store`; ahora se registra.
- `capabilities/default.json`: + `store:default`.
- **Limitación:** JSON plano sin cifrado. Para cumplir NFR-S01 estricto se necesita `tauri-plugin-stronghold` o keyring OS.

### P0-2 — Bubble colapsado real (DSK-F15)
- `overlay/src/components/Bubble.tsx`: muestra ring SVG de progreso, mm:ss, título de tarea activa truncado, dot de focus mode. Sin sesión activa cae a "P".

### P0-3 — Drag + posición persistente (DSK-F17, F22)
- `Bubble.tsx` y `ExpandedPanel.tsx`: `onMouseDown` invoca `getCurrentWebviewWindow().startDragging()`. Inputs/botones excluidos vía `data-no-drag`.
- `lib.rs`: ya no fuerza `BottomRight` cada arranque — solo si la posición es la default (20,20). `tauri-plugin-window-state` restaura la posición persistida.

### P0-4 — Atajos globales completos (DSK-F23..F28)
- `lib.rs`: registrados los 6 atajos:
  - `Ctrl+Shift+O` → toggle overlay
  - `Ctrl+Shift+T` → start timer (`tray-start-timer`)
  - `Ctrl+Shift+P` → pause timer (`tray-pause-timer`)
  - `Ctrl+Shift+N` → quick capture (`tray-quick-capture`)
  - `Ctrl+Shift+F` → toggle focus mode (`tray-toggle-focus`)
  - `Ctrl+Shift+D` → complete current task (`tray-complete-current`)
- Frontend listener centralizado en `overlay/src/hooks/use-tray-events.ts`.
- `overlay.store.ts`: + `quickCaptureOpen`, `focusMode`.

### P0-5 — Quick capture + check-in hábitos (DSK-F20, F21)
- `ExpandedPanel.tsx`:
  - Input quick capture (autofocus al recibir evento `tray-quick-capture` o click). `POST /tasks` con `scheduledDate=hoy`.
  - Bloque "Hábitos hoy" con chips clickables. `POST /habits/:id/logs` con `{date, completedCount: 1}` (cuadra con `upsertHabitLogBody` del API).
  - Botón pausar timer + botón posponer tarea (`scheduledDate=mañana`).
  - Badge "Focus" cuando `focusMode` está activo.
- `overlay-queries.ts`: añadida `todayHabits()` (GET `/habits?isActive=true&includeLogs=true&applicableDate=…`).

### P0-6 — Tray menu completo + icono dinámico (DSK-F10, F11)
- `lib.rs`:
  - Menú: Abrir App, Ver Tareas, Abrir Dashboard, sep, Toggle Overlay, Iniciar / Pausar / Detener Pomodoro, sep, Salir.
  - "Ver Tareas" / "Abrir Dashboard" emiten `tray-navigate` con path → web app navega.
  - Comando `set_tray_icon_state(state: "idle"|"timer"|"tasks")` con `include_bytes!` (los 3 slots reusan `tray-icon.png` por ahora — ver TODO de design).
- `use-tray-events.ts`: `useEffect` llama al comando cuando cambia `session.id`/`isCompleted` o conteo de tareas abiertas.
- `apps/web/src/routes/__root.tsx`: listener `tray-navigate` → `router.navigate({ to: payload })`.

### P0-8 — Limpieza
- `overlay-queries.ts` y `use-live-timer.ts`: importan `Task`, `PomodoroSession`, `Habit`, `HabitLog` de `@repo/shared` en lugar de redefinir stubs.
- `apps/desktop/package.json`: + `concurrently`. Nuevo script `dev:web+overlay`.
- `tauri.conf.json`: `beforeDevCommand: "pnpm dev:web+overlay"` (cross-shell, ya no `&` bash).
- Texto "Phase 2…" eliminado de UI.
- `setTimerStartTrigger` (singleton hack) sustituido por listener limpio en `use-tray-events`.

## Qué falta — orden recomendado al retomar

### P0 restante
- **P0-7 WebSocket sync** (sección 7.6 / NFR-P03)
  - Añadir gateway WS en `apps/api` (Hono + ws). Eventos: `task.updated`, `pomodoro.tick`, `habit.logged`.
  - Cliente WS en `overlay/src/lib/api-client.ts` que invalida queries al recibir evento.
  - Reemplazar polling 15-30s en `overlay-queries.ts` (mantener fallback de polling con interval mayor).
  - Misma conexión consumida desde `apps/web` → reemplaza necesidad de refetch manual.

### P1 (después de P0-7)
1. **Auto-updates** (DSK-F04) — `tauri-plugin-updater` + endpoint releases (S3 / GitHub Releases).
2. **Shortcuts customizables** (DSK-F29, F30) — UI en settings + persistencia en `tauri-plugin-store`. Re-registrar en runtime.
3. **Opacidad configurable** (DSK-F18) — slider en settings → `setIgnoreCursorEvents` + CSS opacity.
4. **Settings panel desktop** (DSK-F06–F08) — sección en main app: autostart toggle (`tauri-plugin-autostart`), opacidad, shortcuts, tema.
5. **Deep-link routing real** (DSK-F05) — listener de URL → router push. Plugin ya configurado.
6. **DSK-F16 completo** — agregar nota inline en task del overlay, "siguiente tarea" del backlog.

### P2
7. **Offline SQLite + cache cifrado** (DSK-F03, NFR-S02) — `tauri-plugin-sql` con SQLCipher.
8. **Smart productivity** (DSK-F31–F34, AI-F09/F10) — crates `active-win-pos-rs`, `user-idle`. Endpoint API que recibe contexto.
9. **Iconos tray dinámicos reales** — generar `tray-icon-timer.png` y `tray-icon-tasks.png` (dot rojo / dot azul) y enlazarlos en `lib.rs` líneas const.

## Verificación pendiente

Testing bloqueado en Windows por Application Control policy (error 4551 al ejecutar cargo). Correr en WSL:

```bash
cd apps/desktop
pnpm install         # para que tome `concurrently` recién añadido
pnpm tauri dev
```

Checklist e2e tras WSL:
1. Login en main → cerrar app del todo → reabrir → overlay autenticado (DSK-F02).
2. Iniciar pomodoro → bubble muestra ring + mm:ss + título tarea (DSK-F15).
3. Drag de bubble a otra esquina → cerrar app → reabrir → posición conservada (DSK-F17, F22).
4. Probar 6 atajos: O, T, P, N, F, D.
5. Click en chip de hábito → endpoint responde 200 → chip pasa a verde con ✓.
6. Tray menu → "Ver Tareas" → main window navega a `/tasks`.
7. Iniciar timer → tray icon llama `set_tray_icon_state("timer")` (visualmente igual hasta que haya PNG distinto).
8. `pnpm --filter @repo/desktop typecheck && cargo check` (cero errores).

## Archivos tocados en la sesión

- `apps/desktop/src-tauri/src/lib.rs` — comandos store, atajos extendidos, tray menu, `set_tray_icon_state`, hidratación auth.
- `apps/desktop/src-tauri/capabilities/default.json` — permiso store.
- `apps/desktop/src-tauri/tauri.conf.json` — `beforeDevCommand`.
- `apps/desktop/package.json` — `concurrently` + script `dev:web+overlay`.
- `apps/desktop/overlay/src/App.tsx` — usa `useTrayEvents`.
- `apps/desktop/overlay/src/components/Bubble.tsx` — ring de progreso + drag.
- `apps/desktop/overlay/src/components/ExpandedPanel.tsx` — quick capture, hábitos, pausar/posponer, focus badge, drag.
- `apps/desktop/overlay/src/hooks/use-tray-events.ts` — nuevo, listener centralizado + tray-icon updater.
- `apps/desktop/overlay/src/hooks/use-live-timer.ts` — type from `@repo/shared`.
- `apps/desktop/overlay/src/lib/overlay-queries.ts` — types compartidos + `todayHabits`.
- `apps/desktop/overlay/src/stores/overlay.store.ts` — `quickCaptureOpen`, `focusMode`.
- `apps/web/src/routes/__root.tsx` — listener `tray-navigate`.

## Cambios en API

Ninguno todavía. P0-7 abrirá un gateway WS — ese será el primer cambio en `apps/api/src/`.

## Notas para el siguiente agente

- **No re-bundlear como nuevo:** el código ya cumple muchos requisitos; verificar antes de duplicar.
- **Antes de tocar `lib.rs`:** ya hay 6 atajos y tray menu con 9 items + separadores. Solo añadir, no rehacer.
- **Iconos PNG:** P2-9 es trivial una vez existan los assets — solo cambiar la const `TRAY_ICON_TIMER` / `TRAY_ICON_TASKS` para apuntar a los nuevos archivos.
- **WebSocket:** decidir primero si abrir un endpoint genérico `/ws` con auth por query param `?token=` o por header en handshake (más correcto). Hono soporta `upgradeWebSocket` desde su adapter de Node.
