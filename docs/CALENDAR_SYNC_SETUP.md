# Calendar Sync + Realtime WebSocket — Setup

Environment variables and deployment steps required for the bidirectional Google Calendar sync, the `/api/sync` WebSocket channel, and the post-refactor scheduling pipeline (SchedulingFacade + idempotency keys + advisory locks).

## Architecture at a glance

- **`WorkingSession`** is the source of truth for "when a task runs". `Task.scheduledStart/End/Date` is a derived mirror maintained by `SchedulingFacade.syncTaskMirror` whenever sessions change. There is no `task_calendar_bindings` table — the link from a task to a Google event lives on the session as `WorkingSession.externalCalendarId` + `externalEventId`.
- **`CalendarEvent`** is the canonical "external events" cache. Both the scheduler (`gap-finder.collectBusyBlocks`) and the UI (`GET /api/calendar/google/events`) read from it. `syncCalendars` populates it on connect + on demand; Google webhooks keep it fresh via `upsertCalendarEventCache`.
- **`SchedulingFacade`** (`apps/api/src/services/scheduling/scheduling-facade.ts`) is the only place that mutates sessions. Routes, AI tools and drag/drop all funnel through it so deconflict, mirror, Google push, undo Command and sync events stay consistent.
- **Per-user advisory locks** serialize the read-gaps→write-sessions critical section (`pg_advisory_xact_lock`).
- **Idempotency keys** on `Command.idempotencyKey` make `POST /scheduling/auto-schedule` and `POST /scheduling/sessions/move` safe to retry.

## 1. Prisma migrations

Before deploying this code, ensure the following migrations are applied:

```bash
pnpm --filter api prisma migrate deploy
```

Relevant schema additions made by recent migrations:

- `calendar_accounts.default_target_calendar_id` (nullable text) — per-account default target calendar for `pushSessionToCalendar` when no per-channel binding is set.
- `calendar_watch_channels` — Google push-notification channels (`id`, `channel_id`, `resource_id`, `token`, `sync_token`, `expires_at`).
- `calendars.access_role` — owner/writer/reader/freeBusyReader. Read-only calendars are skipped when pushing sessions.
- `commands.idempotency_key` (nullable, unique) — supports the `Idempotency-Key` header on scheduling endpoints. A second request with the same key replays the cached result instead of re-executing.

## 2. Environment variables — API (`apps/api`)

| Variable | Required | Used by | Notes |
|---|---|---|---|
| `AUTH_GOOGLE_ID` | yes | OAuth connect + refresh | Shared with login OAuth. |
| `AUTH_GOOGLE_SECRET` | yes | OAuth token exchange | Shared with login OAuth. |
| `GOOGLE_CALENDAR_REDIRECT_URI` | yes | OAuth callback | Public URL of the web page that handles the `?code=` exchange. Must match exactly one of the OAuth client's Authorized redirect URIs in Google Cloud Console. Point it at the settings page — the web UI (`GoogleCalendarSettings` in `apps/web/src/features/calendar/components/GoogleCalendarSettings.tsx`) reads `code` from the query string on mount and POSTs it to `/api/calendar/google/callback`. Examples: prod `https://app.theprimeway.app/settings`, dev `http://localhost:5173/settings`. |
| `GOOGLE_CALENDAR_WEBHOOK_URL` | **new — required for Google→App sync** | `subscribeWatchChannel` | Public HTTPS base URL (no trailing slash). Example: `https://api.theprimeway.app`. Falls back to `API_BASE_URL` if unset. The webhook path `/api/calendar/google/webhook` is appended automatically. Google rejects non-HTTPS and IP addresses. |
| `API_BASE_URL` | optional | Fallback for webhook base | Used if `GOOGLE_CALENDAR_WEBHOOK_URL` is unset. |
| `JWT_SECRET` | yes | WebSocket auth + HTTP auth | Existing. WebSocket validates the same access-token JWT passed via `?token=` query parameter. |
| `CRON_SECRET` | yes | Watch-channel renewal cron | Existing. New endpoint `POST /api/cron/calendar-watch-renew` uses it. |

### Required Google Cloud setup

1. In Google Cloud Console → APIs & Services, ensure **Google Calendar API** is enabled.
2. In the OAuth client, the redirect URI from `GOOGLE_CALENDAR_REDIRECT_URI` must be listed.
3. The webhook domain (`GOOGLE_CALENDAR_WEBHOOK_URL` host) must be **verified** in Google Search Console and registered as a **domain verification** under the Google Cloud project (Domain verification section). Google refuses to send push notifications to unverified domains.

## 3. Cron schedule

Add to the deployment cron scheduler (or existing scheduler hitting `/api/cron/*`):

```
POST /api/cron/calendar-watch-renew
Authorization: Bearer ${CRON_SECRET}
```

Frequency: at least once every 24 hours. Google calendar watch channels expire after ~7 days; the handler re-subscribes any channel within 24h of expiry.

```
POST /api/cron/refresh-google-tokens
Authorization: Bearer ${CRON_SECRET}
```

Frequency: every 30 minutes. Proactively refreshes any `CalendarAccount.access_token` that expires within the next hour. Without this, tokens that expire between user requests force the next push to Google to pay a refresh round-trip while the user waits.

## 4. WebSocket

- Server endpoint: `GET /api/sync` (WebSocket upgrade).
- Auth: `?token=<accessToken>` query parameter (same JWT as HTTP Bearer).
- Heartbeat: server pings every 30s.
- Behavior: single-node in-memory pub/sub. No Redis required for single-container deployment.

### Reverse-proxy / nginx

WebSocket upgrade headers must be forwarded. Confirm your nginx (or equivalent) `location /api/` block includes:

```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
proxy_read_timeout 3600s;
```

Vite dev proxy already forwards WS (`ws: true` in `apps/web/vite.config.ts`).

## 5. Verification checklist

1. Connect Google account from web UI → `calendar_watch_channels` row appears for each `is_selected_for_sync` calendar **and** `calendar_events` is populated by the initial `syncCalendars` pull (-7d → +60d window).
2. Create a task with `autoSchedule: true` (or click **Plan day**) → a `working_sessions` row is created, `tasks.scheduled_start/end` mirrors it, and a Google Calendar event appears within ~3s with `working_sessions.external_event_id` set.
3. Drag a task to a calendar slot → `POST /api/scheduling/sessions/move` records a Command (`type='MOVE_SESSION'` or `'CREATE_SESSION'`) and the Google event is patched/created in place.
4. Send the same `POST /scheduling/auto-schedule` twice with the same `Idempotency-Key` header → second response includes `replayed: true` and no new sessions are created.
5. Edit event title in Google → `calendar_events.title` updates via webhook within ~5s and the right-side calendar grid in `/tasks/today` reflects the change. Requires public `GOOGLE_CALENDAR_WEBHOOK_URL`.
6. Open two browser tabs for the same user, drag a task in tab A → tab B's grid updates without refresh thanks to the `session.updated` event published by `SchedulingFacade.moveSession`. Inspect `Network → WS` to confirm the frame.
7. Hit `POST /api/cron/calendar-watch-renew` with `CRON_SECRET` → expiring channels are renewed.
8. Hit `POST /api/cron/refresh-google-tokens` with `CRON_SECRET` → response shows `{ refreshed, failed, skipped }` for accounts whose tokens were within 1h of expiry.

## 6. Endpoint reference (post-refactor)

Frontend → backend mapping for the scheduling/calendar surface:

| Frontend hook | Endpoint | Notes |
|---|---|---|
| `useAutoSchedule` | `POST /api/scheduling/auto-schedule` | Sends `Idempotency-Key`. Returns `{ type: 'Success' | 'Overcommitted', reason?, options? }`. |
| `useMoveSession` | `POST /api/scheduling/sessions/move` | Drag/drop. Pass `sessionId` to move, `taskId` to create. Sends `Idempotency-Key`. |
| `useDeconflict` | `POST /api/scheduling/deconflict` | Manual cascade-rescheduling against an anchor session. |
| `useCompleteEarly` | `POST /api/scheduling/tasks/:id/complete-early` | Truncates active session and shifts the contiguous group earlier. |
| `useTimerStart` | `POST /api/scheduling/tasks/:id/timer-start` | Triggers late-timer detector. |
| `useWorkingSessionsRange` | `GET /api/working-sessions?from=...&to=...` | Source of truth for the calendar grid. |
| `useCalendarItems` | `GET /api/calendar/google/events?timeMin=...&timeMax=...` | Reads from `calendar_events` cache; triggers background `syncCalendars` if empty. |
| `useSyncCalendar` | `POST /api/calendar/sync` | Manual full pull into `calendar_events`. |
