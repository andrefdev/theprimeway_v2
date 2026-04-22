#!/bin/bash
# Install ThePrimeWay cron schedule on the VPS.
# Idempotent — safe to re-run. Replaces the block between the BEGIN/END markers.
#
# Usage (on the VPS):
#   sudo bash /var/www/theprimeway/scripts/install-cron.sh
#
# Or remotely from a dev machine:
#   scp scripts/install-cron.sh user@host:/tmp/install-cron.sh
#   ssh user@host 'sudo bash /tmp/install-cron.sh'
#
# Requires CRON_SECRET to be set in /var/www/theprimeway/.env (installed by deploy).

set -euo pipefail

ENV_FILE="${ENV_FILE:-/var/www/theprimeway/.env}"
API_BASE="${API_BASE:-https://staging-api.theprimeway.app}"
LOG_FILE="${LOG_FILE:-/var/log/theprimeway-cron.log}"

BEGIN_MARKER="# BEGIN theprimeway-cron (managed by install-cron.sh)"
END_MARKER="# END theprimeway-cron"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE not found. Run a deploy first so the env file is installed." >&2
  exit 1
fi

# Load CRON_SECRET (strips surrounding single quotes written by deploy.yml)
CRON_SECRET="$(grep -E '^CRON_SECRET=' "$ENV_FILE" | head -1 | sed -E "s/^CRON_SECRET='?([^']*)'?$/\1/")"

if [ -z "$CRON_SECRET" ]; then
  echo "ERROR: CRON_SECRET is empty in $ENV_FILE." >&2
  echo "Add it to GitHub Actions secrets and redeploy, or append it manually to $ENV_FILE." >&2
  exit 1
fi

# Ensure log file exists and is writable by whoever runs the cron
touch "$LOG_FILE"
chmod 0644 "$LOG_FILE"

AUTH="Authorization: Bearer $CRON_SECRET"
CURL="curl -fsS --max-time 120 -X POST -H \"$AUTH\" -H 'Content-Length: 0'"

# Build the new block
NEW_BLOCK=$(cat <<EOF
$BEGIN_MARKER
# Minute-level reminders: tasks + habits (reminder window is per-user)
*/10 * * * * $CURL $API_BASE/api/cron/reminders >> $LOG_FILE 2>&1
# Daily motivation push (09:00 UTC)
0 9 * * * $CURL $API_BASE/api/cron/daily-motivation >> $LOG_FILE 2>&1
# Renew Google Calendar watch channels nearing expiry (04:00 UTC daily)
0 4 * * * $CURL $API_BASE/api/cron/calendar-watch-renew >> $LOG_FILE 2>&1
# Weekly review digest (Monday 00:15 UTC)
15 0 * * 1 $CURL $API_BASE/api/cron/weekly-review >> $LOG_FILE 2>&1
# Quarterly review — runs daily but internally early-returns unless last 3 days of quarter
0 2 * * * $CURL $API_BASE/api/cron/quarterly-review >> $LOG_FILE 2>&1
# Quarterly goal-setting nudge — first day of each quarter at 09:00 UTC
0 9 1 1,4,7,10 * $CURL $API_BASE/api/cron/quarterly-nudge >> $LOG_FILE 2>&1
$END_MARKER
EOF
)

# Capture existing crontab (empty string if none), strip any previous managed block.
CURRENT="$(crontab -l 2>/dev/null || true)"
STRIPPED="$(printf '%s\n' "$CURRENT" | awk -v b="$BEGIN_MARKER" -v e="$END_MARKER" '
  $0 == b { skip = 1; next }
  $0 == e { skip = 0; next }
  !skip   { print }
')"

# Re-install: previous non-managed lines + fresh managed block
{
  printf '%s' "$STRIPPED"
  # Ensure trailing newline before the block
  [ -n "$STRIPPED" ] && printf '\n'
  printf '%s\n' "$NEW_BLOCK"
} | crontab -

echo "Installed ThePrimeWay cron schedule. Hitting $API_BASE. Logs: $LOG_FILE"
echo "Verify with:  crontab -l"
