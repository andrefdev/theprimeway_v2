# Calendar Sync + Realtime WebSocket — Setup

Environment variables and deployment steps required for the bidirectional Google Calendar sync and the `/api/sync` WebSocket channel introduced in the Sync & Calendar sprint.

## 1. Prisma migration

Before deploying this code, run:

```bash
pnpm --filter api prisma migrate dev --name calendar_watch_and_target
```

Schema changes:

- `calendar_accounts.default_target_calendar_id` (nullable text) — per-account target calendar for new tasks.
- New table `calendar_watch_channels` — Google push-notification channels (id, channel_id, resource_id, token, sync_token, expires_at).

## 2. Environment variables — API (`apps/api`)

| Variable | Required | Used by | Notes |
|---|---|---|---|
| `GOOGLE_CLIENT_ID` | yes | OAuth connect + refresh | Existing. |
| `GOOGLE_CLIENT_SECRET` | yes | OAuth token exchange | Existing. |
| `GOOGLE_CALENDAR_REDIRECT_URI` | yes | OAuth callback | Existing. |
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

1. Connect Google account from web UI → `calendar_watch_channels` row appears for each `is_selected_for_sync` calendar.
2. Create a scheduled task → Google Calendar event appears within ~3s; `task_calendar_bindings` row is written.
3. Edit event title in Google → web UI reflects change within ~5s (requires public webhook URL).
4. Open two browser tabs for the same user, mutate a task in tab A → tab B's lists update without refresh. Inspect `Network → WS` to confirm the frame.
5. Hit `POST /api/cron/calendar-watch-renew` with `CRON_SECRET` → expiring channels are renewed.
