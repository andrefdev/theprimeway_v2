# Vision-to-Execution OS — Data Migration Scripts (v2)

Run order is strict. Each script supports `--dry-run` and is idempotent.

| # | Script | Purpose |
|---|---|---|
| 001 | `001-create-vision-singleton.ts` | `PrimeVision[]` per user → `Vision` (singleton, dedupe) |
| 002 | `002-collapse-goals.ts` | `ThreeYearGoal/Annual/Quarterly/Weekly` → `Goal` rows with `horizon` + `parentGoalId` |
| 003 | `003-seed-channels.ts` | Default `Context` (Work + Personal) + `Channel` (General) per user |
| 004 | `004-tasks-link-goals.ts` | `Task.weeklyGoalId` + `FocusTaskLink` → `TaskGoal` rows |
| 005 | `005-habits-to-tasks.ts` | `Habit` → `Task{kind:HABIT}` + `RecurringSeries`. `HabitLog` → `WorkingSession{kind:HABIT_LOG}` |
| 006 | `006-pomodoro-to-workingsession.ts` | `PomodoroSession` → `WorkingSession{kind:POMODORO}` (compute end = startedAt + plannedDuration) |
| 007 | `007-workpreferences-to-workinghours.ts` | `UserWorkPreferences` → per-day `WorkingHours` rows |
| 008 | `008-drop-legacy.ts` | Prisma migration that DROPS legacy tables. Run only after 001–007 verified. |

## Usage

```bash
pnpm --filter api tsx scripts/migrations/v2/001-create-vision-singleton.ts --dry-run
pnpm --filter api tsx scripts/migrations/v2/001-create-vision-singleton.ts
```

Logs land in `_logs/`. Rollback drill: dump DB before step 001, re-run after restore.

## Status

- [ ] 001
- [ ] 002
- [ ] 003
- [ ] 004
- [ ] 005
- [ ] 006
- [ ] 007
- [ ] 008 (destructive — last step)
