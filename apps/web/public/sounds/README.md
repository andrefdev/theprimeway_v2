# Sound Assets

Place gamification sound effects here. All keys defined in
`apps/web/src/shared/lib/sound/sounds.ts` must have a matching `.mp3` file.

## Required files

| File | Trigger |
|------|---------|
| `task-complete.mp3` | Task marked done |
| `habit-complete.mp3` | Habit log toggled completed |
| `pomodoro-start.mp3` | Pomodoro / task timer started |
| `pomodoro-end.mp3` | Pomodoro / task timer ended |
| `goal-complete.mp3` | Goal marked completed |
| `ui-click.mp3` | Sidebar navigation click |
| `error.mp3` | Mutation error feedback |

## Where to download (free, commercial use OK, no attribution required)

- https://pixabay.com/sound-effects/ — Pixabay Content License
- https://mixkit.co/free-sound-effects/game/ — Mixkit License

Pick short clips (< 1.5s for UI, < 3s for completion fanfares). Compress to
mono 96–128 kbps `.mp3` to keep payload small (< 30 KB ideally).

If a file is missing the engine logs a warning and silently skips — adding
sounds incrementally is safe.
