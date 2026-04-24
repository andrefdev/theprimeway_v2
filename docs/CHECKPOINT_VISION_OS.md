# Checkpoint — Vision-to-Execution OS migration

> **Date:** 2026-04-24
> **Branch:** `feat/google-calendar-settings`
> **Status:** Phase 1 ✅ · Phase 2 ✅ · Phase 3 ✅ · Phase 4 🟡 (scoped AI done; integrations/mobile pending)
> **Architecture:** routes → services → repos (clean; all session-introduced prisma imports moved out of routes)
> **Companion docs:** `docs/NEW_FEATURES_GUIDE.md`, `docs/TASK_SCHEDULER_ALGO.md`

---

## TL;DR

- **Schema unified.** Vision/Goal/Task/WorkingSession/Channel/Context/Ritual live in one coherent model. Legacy models (PrimeVision, ThreeYearGoal, AnnualGoal, QuarterlyGoal, WeeklyGoal, Habit, PomodoroSession, PomodoroDailyStat, focus links, GoalHealthSnapshot, UserWorkPreferences) all dropped. Only `HabitLog` retained as intentional per-day completion marker FK'd to Task.
- **Scheduling engine complete.** Auto-schedule + splitting + deconflict + early-completion-reflow + late-timer-detector, all wrapped in granular Command undo. Bidirectional Google Calendar sync (CalendarEvent ingest + WorkingSession push via `Channel.timeboxToCalendarId`).
- **Today / Compass / Vision / Library surfaces** live. Compass with drag-drop 15-min snap + calendar-event collision validation. Cmd+K capture (NL parser). Cmd+Z granular undo. X/⇧X/C/F task shortcuts. Focus Mode fullscreen.
- **4 rituals** (Daily Plan, Daily Shutdown with rollover, Weekly Plan with objective creation, Weekly Review with alignment %) + scoped AI (summary + suggest objectives) + snapshot persistence.
- **Recurring series** CRUD + opportunistic materialization on /rituals/today.
- **Clean architecture.** All session-added routes refactored: zero `prisma` imports in `/routes/*` (except 3 pre-existing legacy files outside this work's scope).

**API TS baseline:** 108 (pre-migration) → 98 → **90** (current, after admin/dashboard refactor)
**Web TS:** **0**
**Migrations applied:** 3 → **9** (last: `add_brain_entries_phase1`)

---

## Schema state (`apps/api/prisma/schema.prisma`)

### Migrations in order
1. `20260423062107_add_vision_execution_os` — additive (15 models, 15 enums, 10 Task fields, 18 UserSettings fields).
2. `20260423063916_drop_legacy_orphans` — PrimeVision, ThreeYearGoal, AnnualGoal, focus links, GoalHealthSnapshot, UserWorkPreferences dropped.
3. `20260424013924_drop_legacy_quarterly_weekly` — **QuarterlyGoal + WeeklyGoal dropped**; `Task.weeklyGoalId` removed; `Goal.objectives Json?` added.
4. `20260424020000_drop_habit_keep_habitlog` — **Habit dropped**; `HabitLog.habit_id → task_id` FK to Task.
5. `20260424020500_add_task_habit_meta` — `Task.habitMeta Json?` (category, color, targetFrequency, frequencyType, weekDays).
6. `20260424030000_drop_pomodoro_tables` — **PomodoroSession + PomodoroDailyStat dropped**; `WorkingSession.completed Boolean` + `WorkingSession.notes String?` added. Pomodoros live as `WorkingSession{kind:POMODORO|BREAK}` with sessionType encoded in `notes` prefix `[pd:N][st:xxx]`.

### Active unified models
- `Vision` (singleton per user).
- `Goal` + `GoalHorizon {THREE_YEAR | ONE_YEAR | QUARTER | WEEK}`, `GoalStatus`.
- `TaskGoal` (M2M).
- `Context`, `Channel` (with `timeboxToCalendarId`).
- `WorkingSession` (kind + createdBy + externalEventId/CalendarId + completed + notes).
- `WorkingHours` (per-weekday; `channelId=null` = user default).
- `RecurringSeries` + `RecurrencePattern`.
- `CalendarEvent` (cache from Google).
- `Ritual`, `RitualInstance`, `ReflectionEntry`.
- `Command` + `CommandSource` (undo pattern).
- `TimerEvent`, `Subtask`.

### Legacy retained
- `HabitLog` (per-day completion marker, now FKs `Task`). Only intentional survivor.

---

## Architecture — routes → services → repos

**All session-introduced routes cleaned.** Every prisma query lives in a repo; routes are pure HTTP controllers.

| Route | Service | Repo |
|---|---|---|
| `/api/commands` | `commands.service.ts` | `commands.repo.ts` |
| `/api/channels` | `channels.service.ts` | `channels.repo.ts` |
| `/api/working-sessions` | `working-sessions.service.ts` | `working-sessions.repo.ts` |
| `/api/working-hours` | `working-hours.service.ts` | `working-hours.repo.ts` |
| `/api/vision` | `vision.service.ts` | `vision.repo.ts` |
| `/api/rituals` | `rituals.service.ts` | `rituals.repo.ts` |
| `/api/recurring-series` | `recurring.service.ts` | `recurring.repo.ts` |
| `/api/goals` | `goals.service.ts` (existing; `getWeeklyAlignment` added) | `goals.repo.ts` |
| `/api/calendar` | `calendar.service.ts` (existing; `listEventsInRange`, push/remove/update session methods) | `calendar.repo.ts` |
| `/api/scheduling` | `services/scheduling/{auto-schedule,deconflict,early-completion-reflow,late-timer-detector,CommandManager,gap-finder}.ts` | uses prisma directly inside scheduling services (cohesive engine) |

**Service error-handling convention:**
```ts
return { ok: true, ...payload }
// or
return { ok: false, reason: 'not_found' | 'ai_failed' | ..., message?: string }
```
Routes translate to HTTP 404/409/500 by reason.

**Not touched (pre-existing tech debt, not introduced this session):** `routes/dashboard.ts`, `routes/user.ts`, `routes/admin.ts` still query prisma directly. Cleanup candidate for a follow-up pass.

---

## API state (`apps/api/src/`)

### Mounted routes
| Mount | Notes |
|---|---|
| `/api/vision` | GET/PUT/DELETE singleton + `GET /thread/:taskId` |
| `/api/channels` | Context + Channel CRUD + `POST /seed-defaults` |
| `/api/working-sessions` | CRUD + range filters. PATCH fires `calendarService.updateSessionOnCalendar` |
| `/api/working-hours` | CRUD + bulk PUT |
| `/api/recurring-series` | CRUD + `POST /materialize` |
| `/api/rituals` | CRUD + `GET /today` (auto-ensure DAILY_PLAN+DAILY_SHUTDOWN + materialize opportunistic) + `GET /week` (WEEKLY_PLAN+WEEKLY_REVIEW) + `GET /quarter` (QUARTERLY_REVIEW scheduled last day of quarter) + `GET /year` (ANNUAL_REVIEW scheduled Dec 31) + `POST /reflections` + `POST /instances/:id/ai-summary` + `POST /ai/suggest-weekly-objectives` |
| `/api/commands` | List + `POST /:id/undo` (real) |
| `/api/scheduling` | `POST /auto-schedule`, `/deconflict`, `/tasks/:id/complete-early`, `/tasks/:id/timer-start` |
| `/api/calendar` | `GET /events?from&to` for Compass |
| `/api/goals/weekly-alignment` | `?weekStart=YYYY-MM-DD` → `{total, aligned, alignmentPct, sampleUnaligned}` |

### Translation layers (adapters, not schema)
- **`goals.repo.ts`** — `QuarterlyGoal` ↔ `Goal{horizon:QUARTER, periodKey:"YYYY-QN", objectives, visionContribution}`. `WeeklyGoal` ↔ `Goal{horizon:WEEK}` with legacy status encoded in description prefix `[ws:xxx]`. Tree endpoint hydrates weeklyGoals via TaskGoal joins.
- **`habits.repo.ts`** — `Habit` ↔ `Task{kind:HABIT, habitMeta}`. `HabitLog` renamed field `habitId → taskId`, legacy DTO shape preserved.
- **`tasks.repo.ts`** — `weeklyGoalId` DTO field derived from first WEEK TaskGoal link; writes sync via `syncWeeklyLink`.
- **`pomodoro.repo.ts`** — `PomodoroSession` DTO over `WorkingSession{kind:POMODORO|BREAK}`. `encodeNotes/decodeNotes` preserve sessionType + plannedDuration. `updateSession` with `actualDuration` truncates `end`.

### Scheduling engine (`apps/api/src/services/scheduling/`)
| File | Purpose |
|---|---|
| `gap-finder.ts` | `getEffectiveWorkingHours`, `collectBusyBlocks` (events + sessions, gap-expanded), `computeGaps`, `findCalendarEventOverlapping`, dt utils |
| `auto-schedule.ts` | `autoSchedule(taskId, day, opts)` — intent-whole → split → Overcommitted. Writes `$transaction`, records Command. Fires `pushSessionToCalendar` per chunk (fire-and-forget) |
| `deconflict.ts` | `deconflict(anchorSessionId)` — deletes conflicting sessions, autoSchedules with `earliestStart=anchor.end`. Removes from GCal first. |
| `early-completion-reflow.ts` | `onTaskCompletedEarly(taskId, at)` — truncates active session, shifts contiguous group (`contiguityThresholdMinutes`), skips on CalendarEvent collision. GCal update per move. |
| `late-timer-detector.ts` | `onTimerStart(taskId, at)` — PROMPT/AUTO modes. `moveSessionToNow` cascades deconflict as child command. |
| `CommandManager.ts` | `record()` + **`undo()` real**: replays changes in reverse, children first. Handlers for `WorkingSession` (create/update/delete) + `Task` (update). Remove handler removes from GCal first. |

### Google Calendar sync (bidirectional)
- **Ingest (read)**: `handleWatchNotification` → `upsertCalendarEventCache` mirrors events into `CalendarEvent` (isBusy, isDeclined, isAllDay). Scheduling engine reads from cache.
- **Push (write)**: `pushSessionToCalendar(sessionId)` uses `task.channel.timeboxToCalendarId` → Google events.insert with `extendedProperties.private.theprimewaySessionId`. `updateSessionOnCalendar` PATCHes on move. `removeSessionFromCalendar` DELETEs (tolerant 404/410).

---

## Frontend state (`apps/web/src/`)

### Sidebar nav (`shared/components/layout/Sidebar.tsx`)
- **Primary:** Today (`/tasks/today`) · Compass (`/compass`) · Vision (`/goals` → tree).
- **Library:** Habits · Channels · Recurring.
- **Tools:** Dashboard · Pomodoro · AI.
- **More collapsible:** Finances · Notes · Reading.

### Vision surface
- `/goals` redirects to `/goals/tree`.
- Tree page renders `<VisionEditor />` + `<GoalTreeView />`. Tabs: Tree · Mine · Quarterly · Weekly · Metrics.
- `VisionThreadChip` wired in `TaskItem` (card + sm layouts), shows breadcrumb `↳ WEEK → QUARTER → ONE_YEAR → THREE_YEAR`.

### Today surface (`features/tasks/components/TasksToday.tsx`)
- `WorkloadCounter` badge (emerald/amber/rose).
- `WorkingSessionsPanel` — today's blocks with Remove.
- `SelectedTaskBar` with kbd hints.
- `DayPlanner` with per-task `[X]` AutoScheduleButton.
- `[Plan day (N)]` bulk button.
- Auto-opens DailyPlan ritual (on mount) + DailyShutdown (time-gated).

### Compass surface (`features/compass/components/CompassView.tsx`)
- Weekly 7-day × hours grid (06:00–22:00, 48 px/h).
- Sessions = draggable blocks (`@dnd-kit`). 15-min snap. Validates working window + CalendarEvent collision. On drop: PATCH + GCal update + deconflict.
- Calendar events = muted read-only blocks.
- Hover block → `[×]` remove.
- Week navigation ◀ / Today / ▶.
- Auto-opens Weekly Plan / Weekly Review by scheduled time.

### Scheduling frontend (`features/scheduling/`)
- `api.ts`, `working-sessions-api.ts`, `calendar-events-api.ts`.
- `queries.ts` — useAutoSchedule, useDeconflict, useCompleteEarly, useTimerStart, useRecentCommands, useUndoCommand, useWorkingSessionsForDay/Range, useCalendarEventsRange, useDeleteWorkingSession.
- `hooks/use-undo-shortcut.ts` — global Cmd+Z in `_app.tsx`.
- `hooks/use-today-shortcuts.ts` — `↑/↓` selection, `X/⇧X` schedule, `C` complete + completeEarly, `F` → FocusStore.start.
- `components/WorkingSessionsPanel.tsx`, `AutoScheduleButton.tsx`, `WorkloadCounter.tsx`.

### Capture (`features/capture/`)
- `parser.ts` — NL: `1h30m|1h|30m`, `#channel`, `@today|@tomorrow|@mon..sun|@YYYY-MM-DD`.
- `CaptureDialog` — live preview, Cmd+K global, Enter capture / Shift+Enter capture & schedule.

### Focus mode (`features/focus/`)
- `focus-store.ts` Zustand.
- `FocusMode.tsx` fullscreen overlay. Preflight (acceptance + duration) → running timer (Space pause / Enter complete / Esc cut). Overtime tone. Triggers `timerStart` + `completeEarly`.

### Rituals (`features/rituals/`)
- `api.ts` — `today()`, `week()`, `updateInstance`, `addReflection`, `aiSummary(instanceId)`, `suggestWeeklyObjectives(instanceId?)`.
- `components/PromptRitualDialog.tsx` — reusable iterative prompts + optional `finalStep` render prop.
- `components/AiRitualSummary.tsx` — shared AI summary block with cache support (`cached` + `cachedAt` props).
- `components/DailyPlanDialog.tsx` — 3 steps (highlight → confirm → plan autoSchedule bulk).
- `components/DailyShutdownDialog.tsx` — prompts + rollover-to-tomorrow final step + AI summary.
- `components/WeeklyRitualDialog.tsx`:
  - `WeeklyPlanDialog` — vision check-in + objectives list (3–5 inputs) creating `Goal{horizon:WEEK}`. AI "Suggest with AI" prefills + persists to instance.snapshot.
  - `WeeklyReviewDialog` — uses `PromptRitualDialog`; hint shows alignment % + AI summary block.

### Channels / Recurring managers
- `features/channels/ChannelsManager.tsx` — contexts + channels CRUD inline. Calendar linking dropdown sets `timeboxToCalendarId`.
- `features/recurring/RecurringManager.tsx` — series CRUD with pattern/day toggles + `Materialize due` button.

### Global wiring in `_app.tsx`
- `useUndoShortcut()`, `useCaptureShortcut()`, `<CaptureDialog />`, `<FocusMode />` mounted globally.

---

## Phase 4 progress

| Item | Status |
|---|---|
| Scoped AI in rituals | ✅ DailyShutdown + WeeklyReview (summary) + WeeklyPlan (suggest objectives) |
| AI snapshot persistence | ✅ persists to `RitualInstance.snapshot.{aiSummary,aiSummaryAt,aiSuggestedObjectives,aiSuggestedAt}`. Dialogs pre-fill from cache + "Re-run" button |
| Slack/Linear/Notion read-only | ⛔ |
| Public API keys + webhooks (task.completed etc.) | ⛔ |
| Mobile companion (React Native) | ⛔ |
| Offline + CRDT sync | ⛔ |
| Vision Map radial visualization | ⛔ |
| pgvector / semantic search | ⛔ (discussed; deferred until concrete use case) |

---

## Pending (ordered by leverage)

1. ~~**Onboarding polish**~~ ✅ 2026-04-24 — `POST /user/onboarding/complete` now seeds default contexts (Work/Personal) + General channel + Mon–Fri 09:00–17:00 working-hours on finish. Wired in `OnboardingWizard` via `onboardingApi.completeOnboarding`.
2. ~~**Public API keys + webhook on `task.completed`**~~ ✅ 2026-04-24 — `ApiKey` + `Webhook` schema + migration `20260424151518_add_api_keys_and_webhooks`. `POST /api/api-keys` (returns plaintext once, `pk_live_…`), `DELETE /api/api-keys/:id` (revoke). `/api/webhooks` CRUD with HMAC-SHA256 signatures (`X-Primeway-Signature: sha256=…`). Events whitelist: `task.completed|task.created|task.updated|goal.completed`. `webhooksService.dispatch(userId, event, data)` fire-and-forget with 5s timeout, records `lastDeliveryCode`. Wired in `tasks.service.updateTask` on completion transition. Middleware `apiKeyOrJwtMiddleware` available for public-API surfaces (not yet applied).
3. ~~**Cron materializer (formal)**~~ ✅ 2026-04-24 — `POST /cron/materialize-daily` runs `ritualsService.ensureDailyForAllUsers` + `recurringService.materializeForAllUsers`. Opportunistic call retained as safety net.
4. ~~**Refactor pre-existing direct-prisma routes**~~ ✅ 2026-04-24 — `dashboard.ts` (→ `dashboard.service` + `dashboard.repo`), `user.ts` (sectionCustomizations moved into `userService`), `admin.ts` (→ new `admin.service` + `admin.repo` covering role check, user list/get, subscription CRUD, analytics aggregation). All three routes no longer import prisma.
5. ~~**Vision Map radial viz**~~ ✅ 2026-04-24 — `VisionMap` component at `/goals/map` (new tab in `GoalsNav`). Radial SVG with concentric rings (Vision center · 3-year · 1-year · Quarter · Week), hover highlights ancestor + descendant chain with dim everything else. Uses existing `goalsApi.getGoalTree`.
6. ~~**Focus Mode polish**~~ ✅ 2026-04-24 — post-complete "smallest next step" prompt (creates backlog task). Subtasks panel now live: left sidebar in running phase (hidden on mobile) with checklist, inline add, hover-to-delete. Backend: `subtasks.repo` + `subtasks.service` + `/api/tasks/:taskId/subtasks` (GET/POST) + `/api/subtasks/:id` (PATCH/DELETE). Web: `features/subtasks/{api,queries}` with optimistic toggle.
7. **Mobile companion app** (multi-week scope).
8. **pgvector + RAG** for AI context retrieval across reflections (only when concrete use case emerges).
9. ~~**Ritual customization UI**~~ ✅ 2026-04-24 — `RitualsManager` mounted in `/settings`. CRUD over user-owned rituals (create / edit kind+cadence+scheduledTime+steps+isEnabled / delete). System defaults shown read-only.

12. ~~**Public API docs page**~~ ✅ 2026-04-24 — `/api-docs` page with endpoint list, auth instructions (X-API-Key + Bearer), webhook payload shape, HMAC-SHA256 verification snippet (Node.js), limits. Linked from ApiKeysCard + WebhooksCard in `/settings`.

14. ~~**Second Brain Module — Phase 1 MVP**~~ ✅ 2026-04-24 — text-only capture + AI pipeline + cross-links. Schema: `BrainEntry` + `BrainCrossLink` (migration `add_brain_entries_phase1`). Backend: `brain.repo` + `brain.service` (fire-and-forget `processEntry` with `generateObject` on `taskModel` that fuzzy-resolves cross-link titles against user tasks/goals/habits/notes via new `lib/fuzzy-match.ts`) + `/api/brain/entries` CRUD + `/entries/:id/reprocess` + `/entries/:entryId/action-items/:index/apply` (one-click creates Task with `source: 'brain_entry'` + `action_for` cross-link). Feature gate `BRAIN_MODULE` active from day 1. `BRAIN_ENTRIES_LIMIT: 20` on free tier. +10 XP via `gamificationService.awardXp` + `brain.entry.created` event. Web: `/brain` route (capture card + feed + detail split), polling 2–3s while `status ∈ {pending,transcribing,analyzing}`, sidebar entry with gate. Sin audio/grafo (Fase 2).

13. ~~**Anti-fatigue signals**~~ ✅ 2026-04-24 — `fatigueService.analyze(userId, windowDays=7)` computes ratio of low-priority + goal-unlinked completions, returns `{level: clear|mild|strong, message}`. `GET /api/fatigue?windowDays=N`. `FatigueSignal` component surfaces inline in Daily Shutdown ritual hint + card on Dashboard above GoalsSummary. Non-shaming copy (roadmap §10 risk on childish gamification).

11. ~~**Quarterly + Annual review rituals**~~ ✅ 2026-04-24 — `QUARTERLY_REVIEW` + `ANNUAL_REVIEW` templates with default prompts, `ensureQuarterlyInstance` / `ensureAnnualInstance` helpers (scheduled last day of quarter / Dec 31 at 17:00). `GET /rituals/quarter` + `GET /rituals/year`. Web: `PeriodReviewDialog` shared shell, `PeriodReviewLauncher` card on Vision surface, `PeriodReviewAutoOpen` triggers within last 7 days (quarter) / last 14 days (year). Uses existing `PromptRitualDialog` + `AiRitualSummary`. Completes the ritual cadence pyramid (daily → weekly → quarterly → annual).
10. **Slack/Linear/Notion read-only integrations.**

---

## Known debt

- `goals.repo.ts` — `area` encoded in THREE_YEAR `description` as `[area:xxx]`; WEEK status encoded as `[ws:planned|in_progress|completed|canceled]`. Clean with dedicated columns in a follow-up.
- `habitMeta` JSON on Task carries category/color/targetFrequency/frequencyType/weekDays. `RecurringSeries` integration would formalize frequency.
- API has ~98 pre-existing TS7006/TS6133/TS18004 errors (predate this work, safe to ignore).
- `currentHabits` usage stat column — pre-existing, no explicit updater. If a sync job populates it, repoint to `prisma.task.count{kind:HABIT}`.
- Pre-existing direct-prisma routes: `dashboard.ts`, `user.ts`, `admin.ts`. Candidate for follow-up refactor.
- `scripts/gen-routes.cjs` must be run manually after adding a new TanStack route when no vite dev server is up.

---

## Files to start from when resuming

| Concern | Path |
|---|---|
| Schema | `apps/api/prisma/schema.prisma` |
| Goals translation | `apps/api/src/repositories/goals.repo.ts` |
| Habits translation | `apps/api/src/repositories/habits.repo.ts` |
| Pomodoro translation | `apps/api/src/repositories/pomodoro.repo.ts` |
| Scheduling engine | `apps/api/src/services/scheduling/*` |
| Calendar sync | `apps/api/src/services/calendar.service.ts` (pushSessionToCalendar / upsertCalendarEventCache / updateSessionOnCalendar / removeSessionFromCalendar) |
| Rituals | `apps/api/src/{routes,services,repositories}/rituals.*` (AI summary + suggest-objectives live here) |
| Recurring materializer | `apps/api/src/services/recurring.service.ts` |
| Scheduling client | `apps/web/src/features/scheduling/*` |
| Capture | `apps/web/src/features/capture/*` |
| Focus | `apps/web/src/features/focus/*` |
| Rituals UI | `apps/web/src/features/rituals/components/*` |
| Compass | `apps/web/src/features/compass/components/CompassView.tsx` |
| Today | `apps/web/src/features/tasks/components/TasksToday.tsx` |
| Channels | `apps/web/src/features/channels/*` |
| Recurring UI | `apps/web/src/features/recurring/*` |
| Route regen script | `apps/web/scripts/gen-routes.cjs` |

## Verification

```bash
pnpm --filter api exec prisma validate
pnpm --filter api exec prisma migrate status
pnpm --filter api exec tsc --noEmit   # 98 pre-existing errors
pnpm --filter web exec tsc --noEmit   # 0 errors
```

## Session log (Fase 2-A → 2-X)

1. **2-A** — QuarterlyGoal/WeeklyGoal → Goal{horizon}. Task.weeklyGoalId → TaskGoal M2M.
2. **2-B** — Scheduling engine (auto-schedule, splitting, deconflict, early-completion-reflow, late-timer, CommandManager.undo real).
3. **2-C** — Habit → Task{kind:HABIT, habitMeta}. HabitLog.habit_id → task_id.
4. **2-D** — CalendarEvent ingest from Google watch. Scheduling frontend (api + queries).
5. **2-E** — WorkingSessionsPanel + per-task X in Today.
6. **2-F** — `pushSessionToCalendar` (+update, +remove) wired across engine + WorkloadCounter.
7. **2-G** — Capture modal Cmd+K with NL parser + channels lookup.
8. **2-H** — Sidebar reorg, X/⇧X/C/F shortcuts, VisionThreadChip in TaskItem.
9. **2-I** — Compass weekly grid.
10. **2-J** — Vision surface = tree landing.
11. **2-K** — Channels manager UI.
12. **2-L** — Daily Plan ritual + `GET /rituals/today`.
13. **2-M** — Compass drag-drop with 15-min snap + GCal update on PATCH.
14. **2-N** — Daily Shutdown + Weekly Plan + Weekly Review (generic PromptRitualDialog).
15. **2-O** — Focus Mode fullscreen with Zustand store.
16. **2-P** — Weekly objectives create real `Goal{horizon:WEEK}`. Checkpoint update.
17. **2-Q** — Pomodoro → WorkingSession{kind:POMODORO|BREAK} port.
18. **2-R** — RecurringSeries materialization service + opportunistic call in `/rituals/today`.
19. **2-S** — Weekly alignment % endpoint + WeeklyReview metric + Recurring UI.
20. **2-T** — `POST /rituals/instances/:id/ai-summary` (scoped AI).
21. **2-U** — `AiRitualSummary` shared component, wired in DailyShutdown + WeeklyReview.
22. **2-V** — `POST /rituals/ai/suggest-weekly-objectives` + button in WeeklyPlan.
23. **2-W** — AI snapshot persistence (`RitualInstance.snapshot.aiSummary`, `.aiSuggestedObjectives`).
24. **2-X** — Architecture refactor: 7 new repo+service pairs. Zero direct `prisma` imports in session-introduced routes.
