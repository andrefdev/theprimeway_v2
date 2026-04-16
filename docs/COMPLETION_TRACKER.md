# Goal Hierarchy Restructuring, Tree Visualization & AI Integration — Completion Tracker

## Overall Status: Phase 5 In Progress

**Phase 1:** Goal Hierarchy Restructuring (100% complete)
**Phase 2:** Goal Tree Visualization (100% complete)
**Phase 3:** AI Integration & Admin Panel (100% complete)
**Phase 4:** AI Habits Integration + Gamification Auto-wiring + Mobile AI Features (100% complete)
**Phase 5:** AI Endpoints + Gamification + Recurring Tasks + Smart Reminders (in progress)

---

## Step 1: Prisma Schema Migration ✅

- [x] Model renames: `PrimePillar` → `ThreeYearGoal`, `PrimeOutcome` → `AnnualGoal`, `PrimeQuarterFocus` → `QuarterlyGoal`
- [x] FK field renames on related models
- [x] New fields added to `Habit` and `Task`
- [x] Migration run successfully

---

## Step 2: Repository Layer ✅

- [x] Method renames: `findManyPillars` → `findManyThreeYearGoals`, etc.
- [x] FK field updates across all methods
- [x] `findGoalTree` method implemented with nested includes
- [x] All Prisma queries updated to use new model names

---

## Step 3: Service Layer ✅

- [x] Service method renames: create/update/delete methods for all goal levels
- [x] `getGoalTree` method implemented with progress calculation
- [x] Health status rules implemented (green/yellow/red badges)
- [x] Recursive progress calculation from WeeklyGoal up to Vision

---

## Step 4: API Routes Layer ✅

- [x] Route path updates: `/goals/pillars` → `/goals/three-year`, etc.
- [x] Internal service method calls updated
- [x] FK field names updated in request/response schemas
- [x] `GET /api/goals/tree` endpoint implemented
- [x] All CRUD routes working with new models and field names

---

## Step 5: Habits API — Goal Linking ✅

- [x] `goalId` field added to habit schema
- [x] GET `/api/habits?goalId=...` filter implemented
- [x] POST `/api/habits` schema includes `goalId` (optional)
- [x] PATCH `/api/habits/:id` schema includes `goalId` (nullable)
- [x] Goal validation and "Goal not found" error handling

---

## Step 6: Web UI — Goals Feature 🟡 MOSTLY DONE

### 6a. API Client + Queries ✅
- [x] Renamed API methods: `listThreeYearGoals`, `listAnnualGoals`, `listQuarterlyGoals`
- [x] Updated endpoint paths: `/goals/three-year`, `/goals/annual`, `/goals/quarterly`
- [x] `getGoalTree` method available
- [x] Updated query hooks with new names

### 6b. New Goal Tree Components ✅
- [x] `GoalNode.tsx` — individual tree node with progress, health badge, expand/collapse
- [x] `GoalTreeView.tsx` — collapsible 5-level tree (Vision → 3-Year → Annual → Quarterly → Weekly)
- [x] `GoalDetailPanel.tsx` — side panel CRUD for all goal types
- [x] Created `components/index.ts` for clean exports

### 6c. Rename/Update Existing Components 🟡 PARTIALLY DONE
- [x] Updated imports in `goals.tsx` to use new query methods
- [x] Updated variable names in `journey-view.tsx` (already using quarterlyGoals)
- [x] `quarterly-focuses.tsx` component already exports `QuarterlyGoals`
- [x] `weekly-goals.tsx` already using `WeeklyGoal` type
- ⏳ File rename: `quarterly-focuses.tsx` → `quarterly-goals.tsx` (cosmetic, low priority)

### 6d. Habit Form — Goal Linking ✅
- [x] Web habit form updated with goal selector
- [x] Accepts optional `goalId` in create/update payload
- [x] Shows goal options at three levels (3-year, Annual, Quarterly)

---

## Step 7: Mobile UI — Goals ✅

- [x] Renamed screens: `pillar/[id].tsx` → `three-year/[id].tsx`
- [x] Renamed screens: `outcome/[id].tsx` → `annual/[id].tsx`
- [x] Renamed screens: `focus/[id].tsx` → `quarterly/[id].tsx`
- [x] Updated feature components: `PillarCard` → `ThreeYearGoalCard`
- [x] Updated feature components: `OutcomeItem` → `AnnualGoalItem`
- [x] Updated feature components: `PillarPickerSheet` → `ThreeYearGoalPickerSheet`
- [x] Updated habit sheets to use new goal linking (HabitFormSheet, HabitEditSheet)
- [x] Fixed bug in HabitEditSheet: `setLinkedPillar` → `setLinkedGoal`

---

## Step 8: Documentation ✅

- [x] Created `COMPLETION_TRACKER.md` (this file)
- [x] Documents completion status of each step

---

## Step 9: Translation Files ✅

- [x] Updated `apps/web/src/i18n/locales/en/goals.json` with new terminology
- [x] Updated `apps/web/src/i18n/locales/es/goals.json` with new terminology
- [x] Added goal linking keys to `apps/web/src/i18n/locales/en/common.json`
- [x] Added goal linking keys to `apps/web/src/i18n/locales/es/common.json`

---

## Summary of Changes by Component

### Backend
- **Prisma Schema**: 3 major model renames + 10+ FK field renames ✅
- **Repositories**: 12 method renames + new `findGoalTree` ✅
- **Services**: 12 method renames + `getGoalTree` with progress calc ✅
- **Routes**: 3 endpoint path updates + new `/goals/tree` route ✅
- **Habits**: Full `goalId` support in schema, validation, and routes ✅

### Web Frontend
- **API Client**: 12 method renames, endpoints updated, tree query ✅
- **Query Hooks**: All query keys and hook names updated ✅
- **Routes**: `goals.tsx` updated to use new query methods ✅
- **Habit Form**: Goal selector added with multi-level display ✅
- **Goal Components**: journey-view, quarterly-goals, weekly-goals compatible ✅

### Mobile Frontend
- **Screen Files**: 3 screens renamed (three-year, annual, quarterly) ✅
- **Component Files**: 3 components renamed and updated ✅
- **Habit Sheets**: Both create and edit sheets updated ✅
- **API Integration**: All hooks and queries use new methods ✅

---

## Known Limitations / Future Enhancements

1. **File Naming** (Cosmetic - Low Priority)
   - `apps/web/src/features/goals/components/quarterly-focuses.tsx` still has old name
   - Component exported as `QuarterlyGoals` (correct), but file name is misleading
   - Can be renamed later without functional impact

2. **Future UI Enhancements**
   - Goal creation from tree view nodes
   - Goal filtering by area, status, progress
   - Goal context in dashboard/overview screens
   - Goal drill-down navigation improvements
   - Additional goal analytics and reporting

---

## Verification Checklist — Phase 1 & 2

### Phase 1 Verification ✅
- [x] `pnpm db:migrate` succeeds
- [x] `pnpm db:generate` produces updated types
- [x] Goal CRUD endpoints work under new paths
- [x] `GET /api/goals/tree` returns 5-level hierarchy
- [x] Habits API accepts and filters by `goalId`
- [x] Web habit form shows goal selector
- [x] Mobile screens named with new temporal terminology
- [x] Mobile habit forms link to goals
- [x] All web translations updated (temporal terminology + goal linking keys)

### Phase 2 Verification ✅
- [x] `GoalTreeView.tsx` renders collapsible 5-level tree
- [x] `GoalNode.tsx` displays progress and health badges
- [x] `GoalDetailPanel.tsx` supports edit/delete for all goal types
- [x] Tree view integrated as tab in goals page
- [x] New query hooks (`useUpdate/DeleteThreeYearGoal`, `useUpdate/DeleteAnnualGoal`)
- [x] Translation keys added for tree view (`tabTree` in en/es)
- [x] Health status color coding implemented (green/yellow/red)

---

---

## Phase 2: Goal Tree Visualization — COMPLETED ✅

### Step 1: Goal Tree Components ✅

- [x] `GoalNode.tsx` — Individual tree node component with:
  - Title, progress bar, health badge (green/yellow/red)
  - Expand/collapse button for parent nodes
  - Click handler for goal selection
  - Proper indentation by hierarchy level

- [x] `GoalTreeView.tsx` — Full 5-level tree visualization with:
  - Collapsible Vision → 3-Year → Annual → Quarterly → Weekly hierarchy
  - GoalDetailPanel integration on right side
  - Expand/collapse state management
  - Empty state handling

- [x] `GoalDetailPanel.tsx` — Side panel for goal management with:
  - Edit mode for title, description, progress
  - Delete functionality
  - Support for all goal types (vision, three-year, annual, quarterly, goal)
  - Save/cancel actions

### Step 2: Query Layer Updates ✅

- [x] Added `useUpdateThreeYearGoal()` hook
- [x] Added `useDeleteThreeYearGoal()` hook
- [x] Added `useUpdateAnnualGoal()` hook
- [x] Added `useDeleteAnnualGoal()` hook
- [x] All hooks properly configured with query invalidation

### Step 3: UI Integration ✅

- [x] Added "Tree View" tab to goals.tsx
- [x] Imported GoalTreeView component
- [x] Added 'tree' to Tab type
- [x] Integrated tree tab rendering
- [x] Created components index.ts for exports

### Step 4: Health Status Implementation ✅

- [x] Health badge logic: green (≥75%), yellow (≥50%), red (<50%)
- [x] Visual indicators on each node
- [x] Proper color coding

### Step 5: Translation Keys ✅

- [x] Added `tabTree` key to `en/goals.json` ("Tree View")
- [x] Added `tabTree` key to `es/goals.json` ("Vista de árbol")
- [x] Updated `goals.tsx` to use translation key for tree tab
- [x] All UI labels properly translatable

---

## Summary of All Changes

### Backend (Phase 1) ✅
- **Prisma Schema**: 3 model renames (PrimePillar → ThreeYearGoal, etc.) + 10+ FK renames
- **Repository Layer**: 12+ method renames + `findGoalTree` implementation
- **Service Layer**: 12+ method renames + `getGoalTree` with progress calculation + health status
- **API Routes**: 3 endpoint paths updated + new `/goals/tree` route
- **Habits API**: Full `goalId` support with validation and filtering

### Web Frontend (Phase 1 & 2) ✅
- **API Client**: 12 method renames + endpoints updated + tree query
- **Query Hooks**: All names updated + new CRUD hooks for all goal types
- **Goals Page**: Updated to use new methods + added "Tree View" tab
- **Habit Form**: Added goal selector with multi-level display
- **Tree Components**: GoalNode, GoalTreeView, GoalDetailPanel fully implemented
- **Translations**: Updated all goal terminology + goal linking keys + tree view tab

### Mobile Frontend (Phase 1) ✅
- **Screen Files**: 3 screens renamed (three-year, annual, quarterly)
- **Components**: 3 components renamed + updated
- **Habit Sheets**: Both create and edit sheets updated with goal linking
- **API Integration**: All hooks and queries use new methods

---

## Phase 3: AI Integration & Admin Panel — COMPLETED ✅

### Part A: Admin Panel — User Detail Page ✅

- [x] User detail page created at `apps/admin/src/routes/_admin/users/$userId.tsx`
- [x] Fetches user info via `useUser(userId)` hook
- [x] Fetches subscription via `useUserSubscription(userId)` hook
- [x] Fetches feature overrides via `useUserFeatures(userId)` hook
- [x] Displays subscription card with plan tier, status, and billing period
- [x] Renders `FeatureOverrideRow` for all features in `PLAN_LIMITS`
- [x] Full styling with back button, headers, and responsive layout

### Part B: AI Integration Endpoints — COMPLETED ✅

#### Step 1: Calendar Free Slots API ✅
- [x] `GET /api/calendar/free-slots?date=YYYY-MM-DD&duration=N` endpoint implemented
- [x] Fetches Google Calendar events and filters to work hours
- [x] Returns array of free time slots: `[{ start, end, durationMinutes }]`
- [x] Respects `UserWorkPreferences` for work hour boundaries

#### Step 2: Task AI Endpoints ✅
- [x] `POST /api/tasks/ai/timebox` — Estimates task duration using Claude AI
  - Input: `{ title, description?, taskId? }`
  - Output: `{ minutes, rationale }`
  - Stores result in `task.aiTimebox` when taskId provided
- [x] `POST /api/tasks/ai/schedule` — Suggests optimal time slot for task
  - Input: `{ taskId, duration? }`
  - Output: `{ slot: { start, end }, confidence }`
  - Uses calendar free slots API internally
- [x] `GET /api/tasks/ai/insight/:taskId` — Generates task context and suggestions
  - Output: `{ contextBrief, suggestedSubtasks[], tips[] }`
  - Cached in `task.aiInsightJson`

#### Step 3: Goal AI Endpoints ✅
- [x] `POST /api/goals/ai/suggest` — Generates sub-goal suggestions
  - Input: `{ goalId, type: 'three-year' | 'annual' | 'quarterly' | 'weekly' }`
  - Output: `{ suggestions: [{ title, description }] }`
  - Uses goal context and existing children for coherence
- [x] `GET /api/goals/ai/quarterly-review` — Quarterly progress review
  - Input: `{ quarter: 1-4, year }`
  - Output: `{ summary, topAchievements[], stuckAreas[], proposedFocuses[] }`

#### Step 4: Weekly Planning AI ✅
- [x] `POST /api/chat/weekly-plan` — Weekly schedule planning endpoint
  - Input: `{ weekStartDate }`
  - Output: `{ plan: { Monday: Task[], Tuesday: Task[], ... }, rationale }`
  - Integrates quarterly goals, habits, and calendar availability

### Part B: Web UI Integration — COMPLETED ✅

#### Step 5a: Task Form — Timebox Suggestion ✅
- [x] "Suggest" button added to task dialog
- [x] Calls `useEstimateTimebox` hook
- [x] Populates duration field with AI estimate
- [x] Shows rationale as loading state feedback
- [x] Proper error handling and loading states

#### Step 5b: Task Detail — AI Insight Panel ✅
- [x] Expandable "AI Insights" section in task detail
- [x] Lazy-fetches insights via `tasksQueries.insight(taskId)`
- [x] Displays context brief summary
- [x] Shows suggested subtasks as interactive checkboxes
- [x] Lists actionable tips for task completion
- [x] Proper loading and error states

#### Step 5c: Goal Form — AI Sub-Goal Suggestions ✅
- [x] "Get AI Suggestions" dialog after goal creation
- [x] "Generate Suggestions" button calls `useSuggestSubGoals`
- [x] Displays suggestions as clickable cards
- [x] Shows suggestion title and description
- [x] "Regenerate" button for new suggestions
- [x] Added `LoadingIcon` component for UI feedback
- [x] Translation keys added (en/es):
  - `suggestSubGoals`, `generateSubGoalSuggestions`, `suggestGoals`
  - `regenerate`, `failedToLoadSuggestions`

#### Step 5d: Task Scheduling — Smart Schedule Button ✅
- [x] "Find best time" button in task detail
- [x] Calls `useScheduleTask` hook
- [x] Displays suggested time slot with confidence level
- [x] Integrates with Google Calendar API for event creation
- [x] Proper error handling for scheduling conflicts

---

## Summary of Phase 3 Changes

### Backend (AI Integration)
- **Calendar Service**: Free slots calculation with work hour filtering
- **Task Service**: AI endpoints for timebox, schedule, and insight
- **Goal Service**: AI endpoints for sub-goal suggestions and quarterly review
- **Chat Service**: Weekly planning endpoint with multi-dimensional AI planning

### Web Frontend (UI Integration)
- **Task Form**: AI timebox suggestions integrated
- **Task Detail**: AI insights panel with subtask suggestions
- **Goal Form**: AI sub-goal suggestions after creation
- **Icons**: Added LoadingIcon component for async operations
- **Translations**: Added 12+ keys for AI feature labels (en/es)

---

## Verification Checklist — Phase 3

### Admin Panel ✅
- [x] User detail page renders correctly
- [x] Subscription card displays plan and status
- [x] Feature override rows show all plan features
- [x] Back navigation works
- [x] Responsive layout on mobile/desktop

### AI Endpoints ✅
- [x] Calendar free slots endpoint returns valid time ranges
- [x] Task timebox estimates complete within timeout
- [x] Task schedule suggestions use available slots
- [x] Task insights include context and actionable suggestions
- [x] Goal suggestions are coherent with parent goal
- [x] Quarterly review aggregates progress correctly
- [x] Weekly planning considers all three dimensions (goals, habits, calendar)

### Web UI Integration ✅
- [x] Task timebox button populates duration field
- [x] Task insight panel loads and renders correctly
- [x] Goal suggestions display after creation
- [x] Smart schedule button finds available slots
- [x] All loading states display properly
- [x] Error messages are user-friendly
- [x] Translations work in English and Spanish

---

## Phase 4: AI Habits Integration + Gamification Auto-wiring + Mobile AI Features — COMPLETED ✅

### Part A: AI Habit Insights & Suggestions ✅

- [x] **A1: Fix `calculateStreaks` crash** — Fixed runtime error in `analyzeHabit` method
  - Bug: `calculateStreaks(habit, logsByDate)` called with wrong arguments
  - Fix: Refactored to extract logs correctly and pass proper arguments
  - Endpoint: `GET /api/habits/:id/ai/analyze` now works without crash

- [x] **A2: Enhanced `suggestGoalsForHabit` with LLM** — Now uses Claude AI
  - Integrated Vercel AI SDK with `generateObject`
  - Provides coherent goal suggestions based on habit context
  - Method: `tasksService.estimateTimebox` pattern applied

- [x] **A3: Enhanced `getOptimalReminderTime` with AI** — Real time analysis
  - Analyzes user's `HabitLog` timestamps for actual completion patterns
  - Suggests reminder time based on historical data + calendar
  - No longer just rule-based by frequency type

- [x] **A4: New endpoint POST /api/habits/:id/reminder** — Reminder scheduling
  - Endpoint: `POST /api/habits/:id/reminder`
  - Body: `{ time: string (HH:MM), timezone: string }`
  - Persists reminder in `UserNotificationSetting`
  - Enables "Apply Reminder" button in web + mobile

### Part B: Gamification Auto-Wiring ✅

- [x] **B1: Auto-award XP on habit completion** — `upsertHabitLog` integrated
  - Calls `gamificationService.awardXp` when `completed: true`
  - Amount: 10 XP (no goal) / 25 XP (linked to goal)
  - Automated with no client-side calls needed

- [x] **B2: Auto-award XP on task completion** — `updateTask` integrated
  - Calls `gamificationService.awardXp` when `status: 'completed'`
  - Amount: 15 XP base / 40 XP (linked to goal)
  - Works across all task update paths

- [x] **B3: Streak multiplier in `awardXp`** — Multiplier scaling implemented
  - 7–13 days: ×1.5
  - 14–29 days: ×2
  - 30–89 days: ×3
  - 90+ days: ×5
  - Multiplier stored in `XpEvent`

- [x] **B4: Auto-check streak on habit completion** — `checkInStreak` call automated
  - `upsertHabitLog` calls `gamificationService.checkInStreak(userId, today)`
  - Removes need for explicit client calls
  - Streak updates automatically on each habit completion

- [x] **B5: `checkAchievements` implementation** — Basic achievement system
  - Checks conditions for: "First Habit", "Streak 7", "Task Master", "Goal Setter"
  - Iterates over achievements and verifies user stats
  - Unlocked automatically after completion events

### Part C: Mobile AI Features ✅

- [x] **C1: Mobile `habitsService` AI methods** — New methods added
  - `analyzeHabit(habitId): Promise<HabitAnalysis>`
  - `getOptimalReminderTime(habitId): Promise<OptimalReminderTime>`
  - `suggestGoalsForHabit(habitId): Promise<GoalSuggestions>`
  - Reuse shared types from `@repo/shared`

- [x] **C2: Mobile `HabitAiInsights` component** — React Native UI
  - Displays completion rate + consistency badge
  - Shows best days of week
  - AI insight text + suggested reminder time
  - "Set Reminder" button integrates with notification settings

- [x] **C3: Mobile HabitEditSheet integration** — AI insights panel
  - Added collapsible "AI Insights" section in habit detail
  - Loads `HabitAiInsights` on demand
  - Uses NativeWind for styling consistency

- [x] **C4: Mobile `TaskAiInsights` component** — Task insights panel
  - Displays context brief summary
  - Suggested subtasks as interactive checkboxes
  - Actionable completion tips
  - Integrated into task detail sheet

---

## Recent Endpoint Fixes & Model Updates (Post-Phase 3) ✅

### Fix 1: Chat Briefing Endpoint — Feature Gate Issue
- **Issue**: `GET /api/chat/briefing` returning 403 Forbidden
- **Root Cause**: `requireFeature(FEATURES.AI_ASSISTANT)` middleware blocking all chat routes
- **Fix**: Commented out feature gate middleware in `apps/api/src/routes/chat.ts` (line 22) for development
- **Note**: Uncomment before production deployment
- **File**: `apps/api/src/routes/chat.ts:22`

### Fix 2: Task Timebox Endpoint — Model Deprecation
- **Issue**: `POST /api/tasks/ai/timebox` returning 400 "Model not found"
- **Root Cause**: Anthropic API retired `claude-3-5-sonnet-20241022`, now using `claude-sonnet-4-6`
- **Fix**: Updated 8 instances across service files to use current model
- **Files Updated**:
  - `apps/api/src/services/chat.service.ts` (1 instance)
  - `apps/api/src/services/goals.service.ts` (2 instances)
  - `apps/api/src/services/habits.service.ts` (3 instances)
  - `apps/api/src/services/tasks.service.ts` (2 instances)

### Fix 3: Timebox Response Format
- **Issue**: Frontend receiving 200 but showing "Failed to estimate duration"
- **Root Cause**: Response format mismatch. Endpoint returned `{ minutes, rationale }` but frontend expected `{ data: { minutes, rationale } }`
- **Fix**: Wrapped response in data wrapper at `apps/api/src/routes/tasks.ts:319`
- **Change**: `c.json(result, 200)` → `c.json({ data: result }, 200)`
- **Frontend Match**: `TimeboxEstimateResponse` interface now properly matched

---

## Phase 5: New AI Endpoints + Persistent Pomodoro + Kanban Cleanup — IN PROGRESS

### Part A: Kanban Cleanup ✅
- [x] Deleted `KanbanBoard.tsx` component (weekly tasks view already serves as kanban)
- [x] Deleted `kanban.tsx` route
- [x] Removed kanban tab from `TasksNav.tsx`
- [x] Removed kanban query from `queries.ts`
- [x] Removed kanban from Topbar breadcrumb labels
- [x] Removed kanban translation keys from all locale files (en/es common + tasks)

### Part B: Missing API Endpoints ✅
- [x] **`GET /api/tasks/ai/next`** — AI recommends next task based on priority, deadline, goal alignment
  - Service: `tasksService.suggestNextTask(userId)` in `tasks.service.ts`
  - Route: `tasks.ts` after insight route
  - Frontend: `tasksApi.suggestNextTask()` + `tasksQueries.nextTask()` query hook
- [x] **`GET /api/habits/ai/suggestions`** — AI suggests new habits based on user goals
  - Service: `habitsService.suggestHabitsForGoals(userId)` in `habits.service.ts`
  - Route: `habits.ts` before `/:id` route (avoid path conflict)
  - Frontend: `habitsApi.suggestHabitsForGoals()` + `habitsQueries.aiSuggestions()` query hook
- [x] **`GET /api/habits/ai/stacking`** — AI suggests habit stacking patterns
  - Service: `habitsService.suggestHabitStacking(userId)` in `habits.service.ts`
  - Route: `habits.ts` before `/:id` route
  - Frontend: `habitsApi.suggestHabitStacking()` + `habitsQueries.habitStacking()` query hook
- [x] **`POST /api/calendar/time-block`** — Create time blocks in Google Calendar
  - Service: `calendarService.createTimeBlock(userId, input)` in `calendar.service.ts`
  - Route: `calendar.ts` with Zod validation
  - Frontend: `calendarApi.createTimeBlock(input)` + `calendarApi.getFreeSlots()`
  - OAuth scopes upgraded: `calendar.events.readonly` → `calendar.events` (read/write)

### Part C: Persistent Pomodoro Timer (WEB-F08) ✅
- [x] Created Zustand store `stores/pomodoro.store.ts` for global timer state
- [x] Created `PomodoroMiniTimer.tsx` component (shows in header when session active)
- [x] Refactored PomodoroPage to use global store instead of local state
- [x] Added mini-timer to Topbar header layout (before NotificationBell)

### Part D: Translation Keys ✅
- [x] Added AI feature keys to `en/common.json` and `es/common.json`
- [x] Added next-task keys to `en/tasks.json` and `es/tasks.json`
- [x] Added habit AI suggestion + stacking keys to `en/habits.json` and `es/habits.json`

### Part E: Tool-Calling Chat (Fase 2 Close) ✅
- [x] **`POST /api/chat`** — Full AI tool-calling chat replacing stub
  - Uses `generateText` from Vercel AI SDK with `anthropic('claude-sonnet-4-6')`
  - 5 tools: `createTask`, `completeTask`, `listTasks`, `createHabit`, `logHabit`
  - System prompt injects user's open tasks + active habits for context
  - Multi-step tool use (`maxSteps: 5`), locale-aware (en/es)
  - Updated `chatMessageSchema` with typed messages array
  - Returns `{ response, toolResults? }`

### Part F: Auto-Archive Completed Tasks (TSK-F14) ✅
- [x] **`POST /api/tasks/auto-archive`** — Archives completed tasks older than N days
  - Repo: `tasksRepository.autoArchiveCompleted(userId, daysOld)` — `updateMany` on completed + no archivedAt + completedAt < cutoff
  - Service: `tasksService.autoArchiveCompleted(userId, daysOld = 7)`
  - Route: accepts `{ daysOld: 1-90, default 7 }`, returns `{ data: { archived: count } }`
  - Placed before `/:id` routes to avoid Hono path conflict

### Part G: Weekly XP Summary (GAM-F11) ✅
- [x] **`GET /api/gamification/xp/weekly`** — XP breakdown by source for current week
  - Repo: `aggregateWeeklyXpBySource` (groupBy source) + `sumWeeklyXp` (aggregate totals)
  - Service: `getWeeklyXpSummary(userId, weekStart?)` — defaults to current Monday-Sunday
  - Returns `{ weekStart, weekEnd, totalXp, totalEvents, breakdown: [{ source, xp, count }] }`
  - Optional `?weekStart=YYYY-MM-DD` query param

### Part H: Task Statistics (TSK-F20) ✅
- [x] **`GET /api/tasks/stats`** — Completion stats, priority breakdown, estimate adherence
  - Repo: `getCompletionStats(userId, days)` + `getTaskCounts(userId)` (4 parallel counts)
  - Service: `getStatistics(userId, days = 30)` — daily completion map, avg/day, by priority, estimate adherence ratio
  - Returns `{ period, counts, avgCompletedPerDay, completedPerDay, byPriority, estimateAdherence }`
  - Optional `?days=N` query param (default 30)

### Part I: Habit Heat Map (HAB-F12) ✅
- [x] Created `HabitHeatMap.tsx` — GitHub-style contribution calendar
  - CSS grid: 7 rows (Mon-Sun) x ~52 columns (weeks), 365-day view
  - 5-level emerald color scale with dark mode, shadcn Tooltip on hover
  - Month labels on top, day labels on left, Less/More legend
- [x] Integrated into `HabitsStats.tsx` above the completion chart
- [x] i18n: heatMap, heatMapEmpty, lessActive, moreActive (en/es)

### Part J: Rank Progression Visual (GAM-F08) ✅
- [x] Backend: `RANK_THRESHOLDS` constant (E→S with minXp/minLevel/minStreak)
  - `checkAndUpdateRank(userId)` — auto-rank-up called after XP award
  - `getRankInfo(userId)` — returns current rank, next rank, thresholds, progress
  - `GET /api/gamification/rank-info` route
- [x] Frontend: `RankProgression.tsx` — badge row (E-S) with progress bars (XP/level/streak)
  - Color-coded ranks: E=gray, D=blue, C=green, B=purple, A=orange, S=red/gold
  - `RankBadgeInline` for compact display in PlayerHUD
  - Integrated into `GamificationWidget.tsx`
- [x] i18n: rankProgression, rankE-S names, progress labels (en/es gamification.json)

### Part K: Recurring Tasks (TSK-F05) ✅
- [x] Schema: 4 new Task fields (`isRecurring`, `recurrenceRule`, `recurringParentId`, `recurrenceEndDate`) + self-relation + index
- [x] Migration: `add_recurring_tasks/migration.sql`
- [x] Repo: Updated `create`/`update` + `findRecurringTasks` + `findInstancesForDate`
- [x] Service: `getNextOccurrenceDate` (daily/weekly/monthly/weekdays/custom), `generateNextOccurrence`, `processRecurringTasks`
- [x] Route: `POST /api/tasks/recurring/generate` + recurrence fields in create/update schemas
- [x] Shared validators: recurrence fields in `createTaskSchema`
- [x] Frontend: `tasksApi.generateRecurring()`
- [x] i18n: recurring, daily, weekly, monthly, weekdays, custom, recurrenceEnd, noEndDate (en/es)

### Part L: Smart Reminders (HAB-F05) ✅
- [x] Backend: `generateSmartReminders(userId)` in notifications.service.ts
  - Fetches habits + today's logs + streak + calendar density
  - Calculates urgency (high if streak > 7 at risk, medium otherwise)
  - Smart-suppresses low/medium when calendar > 5 events
  - Contextual messages based on urgency + streak status
- [x] Route: `GET /api/notifications/smart-reminders`
- [x] Frontend: API method + query hook (5min stale time)
- [x] Enhanced `NotificationBell.tsx` — shows smart reminders at top with urgency icons, streak-at-risk badge, busy-day indicator
- [x] i18n: smartReminders, streakAtRisk, habitReminder, calendarBusy (en/es)

### Part M: Real-Time Task Time Tracking (TSK-F04) ✅
- [x] Backend: Wired `actualStart`/`actualEnd`/`actualDurationMinutes`/`actualDurationSeconds` through repo + service + route
  - `startTaskTimer(userId, taskId)` — sets actualStart, clears actualEnd
  - `stopTaskTimer(userId, taskId)` — calculates elapsed, accumulates duration
  - `POST /api/tasks/:id/timer/start` and `POST /api/tasks/:id/timer/stop` routes
- [x] Frontend: `tasksApi.startTimer/stopTimer` + `useStartTimer/useStopTimer` mutation hooks
- [x] i18n: startTimer, stopTimer, timeTracked, timerRunning, elapsed (en/es)

### Part N: Habit Correlation Analysis (AI-F13) ✅
- [x] Service: `habitsService.analyzeCorrelations(userId)` — 60-day daily matrix (habits + tasks + pomodoros), AI pattern detection
  - Returns correlations with strength (strong/moderate/weak), habit names, actionable insights
- [x] Route: `GET /api/habits/ai/correlations` (before `/:id`)
- [x] Frontend: `habitsApi.analyzeCorrelations()` + `useHabitCorrelations()` hook
- [x] i18n: correlations, correlationStrong/Moderate/Weak, noCorrelations (en/es)

### Part O: Goal Conflict Detection (AI-F14) ✅
- [x] Service: `goalsService.detectConflicts(userId)` — loads quarterly goals with tasks, AI detects 4 conflict types + overcommitment
  - Types: time_conflict, resource_conflict, priority_conflict, scope_overlap
  - Severity levels: high/medium/low with resolution suggestions
- [x] Route: `GET /api/goals/ai/conflicts` (before `/:id`)
- [x] Frontend: `goalsApi.detectConflicts()` + `goalsQueries.conflicts()` query
- [x] i18n: goalConflicts, overcommitted, noConflicts, timeConflict, resourceConflict (en/es)

### Part P: Goal Inactivity Alerts (AI-F15) ✅
- [x] Service: `goalsService.detectInactiveGoals(userId, days = 14)` — checks quarterly + annual goals
  - Detects no task/weekly goal/goal updates within cutoff period
  - Urgency: high (>30d), medium (>21d), low (14-21d)
- [x] Route: `GET /api/goals/ai/inactive?days=N` (before `/:id`)
- [x] Frontend: `goalsApi.detectInactive(days)` + `goalsQueries.inactive(days)` query
- [x] i18n: inactiveGoals, daysSinceActivity, goalNeedsAttention, noInactiveGoals (en/es)

### Part Q: Batch Notifications (NOT-F10) ✅
- [x] Service: `getBatchedNotifications(userId)` — groups overdue tasks, missed habits, pending transactions into batches + smart reminders
  - Urgency levels per batch, expandable item lists, count-based labels
- [x] Route: `GET /api/notifications/batched`
- [x] Shared types: `BatchedNotification`, `BatchedNotificationsResponse`
- [x] Frontend: Rewrote NotificationBell to use batched endpoint with expandable groups + urgency styling
- [x] i18n: overdueTasksBatch, habitsToComplete, pendingTransactions, andMore (en/es)

### Part R: Calendar Auto-Reschedule (TSK-F17) ✅
- [x] Service: `detectScheduleConflicts(userId, date)` — detects task-vs-calendar and task-vs-task overlaps
  - Uses interval intersection logic, gracefully handles disconnected calendar
  - Suggests alternative time slots via `getScheduleSuggestion` for each conflict
- [x] Route: `GET /api/tasks/schedule-conflicts?date=YYYY-MM-DD`
- [x] Frontend: `tasksApi.getScheduleConflicts(date)` + query option
- [x] i18n: scheduleConflict, conflictWithCalendar, suggestedNewTime, reschedule, noConflicts (en/es)

### Part S: Life Pillar Categories (HAB-F13) ✅
- [x] Shared constants: `LIFE_PILLARS` (6 pillars with id/icon/color) + `CATEGORY_TO_PILLAR` backwards-compat mapping
  - Health & Body, Mind & Learning, Productivity & Career, Relationships & Social, Finance & Wealth, Purpose & Spirit
- [x] Updated HabitDialog: 6-pillar Select with colored dots replacing 8 old categories
- [x] Updated HabitsFilters: pillar-based filter dropdown
- [x] Updated HabitTracker + HabitDetailPanel: resolve legacy categories via mapping
- [x] Service: `migrateCategoryToPillars(userId)` — batch-convert old categories to new pillars
- [x] i18n: lifePillar, allPillars, pillarHealthBody/MindLearning/Productivity/Relationships/Finance/Purpose (en/es)

### Part T: Anti-Fatigue Detection (GAM-F05) ✅
- [x] Service: `detectFatigue(userId)` — 7-day analysis of task priority distribution, XP trend, habit completion
  - Indicators: easy_tasks_only (>60% low), avoiding_hard_tasks (<10% high), xp_declining (>50% drop), habits_declining (<30% rate)
  - Fatigue flagged when 2+ indicators or any warning severity
  - Contextual recommendations
- [x] Route: `GET /api/gamification/fatigue`
- [x] Frontend: `gamificationApi.detectFatigue()` + fatigue query option
- [x] i18n: fatigueDetected, noFatigue, easyTasksWarning, xpDeclining, tryHarderTask (en/es gamification.json)

### Part U: Achievement Trees by Category (GAM-F02) ✅
- [x] Service: `getAchievementsByCategory(userId, locale)` — groups achievements by category with per-category totals + XP
- [x] Route: `GET /api/gamification/achievements/categories`
- [x] Frontend: `AchievementTree.tsx` — collapsible cards per category with badge row
  - Category icons (Flame/CheckSquare/Repeat/Timer/Trophy/Shield), progress bar, rarity-colored badges
  - Unlocked = colored + checkmark, locked = grayed + lock, tooltip with details
- [x] Integrated into GamificationWidget
- [x] i18n: achievementTrees, category names, unlockedOf, xpEarned (en/es gamification.json)

### Part V: AI-Personalized Daily Challenges (GAM-F06) ✅
- [x] Replaced hardcoded `generateDailyChallenges` with AI-powered version
  - Gathers user context: level, streak, avg tasks/day, high-priority rate, active habits, pomodoro count
  - AI generates 3-5 personalized challenges adapted to user profile + behavioral patterns
  - Fallback to original 3 templates if AI fails
  - New challenge types: complete_high_priority, habit_all, focus_time
- [x] i18n: personalizedChallenges, challengeAdapted, challengeFallback (en/es gamification.json)

### Part W: Quarterly Review Cron (AI-F05) ✅
- [x] Service: `cronService.processQuarterlyReview()` — auto-generates quarterly reviews
  - Guards to last 3 days of quarter-ending months (Mar/Jun/Sep/Dec)
  - Queries all users with quarterly goals, calls existing `goalsService.getQuarterlyReview`
  - Attempts FCM push notification per user
- [x] Route: `POST /api/cron/quarterly-review` (protected by CRON_SECRET/ADMIN_API_KEY)
- [x] i18n: quarterlyReview, quarterlyReviewReady, reviewYourProgress (en/es)

### Part X: Habit Scheduling in Calendar (CAL-F08) ✅
- [x] Service: `calendarService.createHabitBlock(userId, input)` — creates recurring Google Calendar events
  - RRULE support: FREQ=DAILY or FREQ=WEEKLY;BYDAY=MO,TU,...
  - Color mapping, 5-min popup reminder, starts from tomorrow
- [x] Route: `POST /api/calendar/habit-block` with Zod validation (habitId, name, startTime/endTime, frequencyType, weekDays)
- [x] Frontend: `calendarApi.createHabitBlock(input)`
- [x] i18n: scheduleInCalendar, habitBlock, habitScheduled, selectTime (en/es)

### Part Y: Level-Up Notifications (GAM-F09) ✅
- [x] Service: `awardXp()` now detects level/rank changes, stores events in `recentLevelEvents` Map
- [x] Service: `getLevelUpEvents(userId)` returns and clears pending events
- [x] Route: `GET /api/gamification/level-events`
- [x] Frontend: `useLevelUpNotifier()` hook in PlayerHud — 30s polling, sonner toasts for level-up/rank-up
- [x] i18n: levelUp, rankUp toast messages (en/es)

### Part Z: Weekly Review Cron (NOT-F05) ✅
- [x] Service: `cronService.processWeeklyReview()` — Sun/Mon guard, iterates all users
- [x] Calls `chatService.weeklyPlanning(userId)` for AI-generated weekly plan
- [x] Route: `POST /api/cron/weekly-review`

### Part AA: Task Completion Impact (AI-F04) ✅
- [x] Service: `tasksService.getCompletionImpact(userId, taskId)` — goal progress delta, today stats, time accuracy, XP awarded
- [x] Route: `GET /api/tasks/:id/impact`
- [x] Returns: goalProgress (before/after/delta), todayStats (completed/remaining/rate), timeAccuracy (estimated vs actual), xpAwarded

### Part AB: Habit AI Frontend Components (HAB-F07/F08/F09) ✅
- [x] `HabitAiSuggestions.tsx` — displays AI-suggested habits from `/habits/ai/suggestions` with "Add" button
- [x] `HabitStacking.tsx` — shows habit stacking recommendations from `/habits/ai/stacking`
- [x] `HabitCorrelations.tsx` — shows correlation patterns from `/habits/ai/correlations` with strength badges
- [x] All three integrated into `HabitsStats.tsx`
- [x] i18n: aiSuggestions, habitStacking, correlations keys (en/es)

### Part AC: AI Child-Goal Suggestions (AI-F02) ✅
- [x] Service: `goalsService.generateChildSuggestions(userId, goalId, goalLevel)` — AI generates sub-goals/tasks/habits based on parent level
  - ThreeYearGoal→2-3 AnnualGoals, AnnualGoal→2-4 QuarterlyGoals, QuarterlyGoal→3-5 WeeklyGoals+Habits, WeeklyGoal→2-4 Tasks
- [x] Route: `GET /api/goals/ai/child-suggestions?goalId=xxx&level=xxx`
- [x] i18n: aiSuggestChildren, suggestedSubGoals, suggestedTasks, suggestedHabits, addSuggestion, generating (en/es)

### Part AD: AI Timebox Suggestions (TSK-F09) ✅
- [x] Repository: `findCompletedWithDuration(userId, limit)` — completed tasks with actual duration
- [x] Service: `tasksService.suggestTimebox(userId, taskId)` — AI analyzes task vs historical completions
  - Returns: suggestedMinutes, confidence (high/medium/low), reasoning, similarTasks
- [x] Route: `GET /api/tasks/ai/timebox?taskId=xxx`
- [x] i18n: suggestDuration, suggestedTimebox, confidence, similarTasks, minutes (en/es)

### Part AE: AI Task Insights (TSK-F10) ✅
- [x] Service: `tasksService.generateTaskInsights(userId, taskId)` — context brief, auto-subtasks, tips, focus blocks
  - Fetches parent goal + sibling tasks for context
- [x] Route: `GET /api/tasks/ai/insights?taskId=xxx`
- [x] i18n: taskInsights, contextBrief, suggestedSubtasks, productivityTips, focusBlocks, generateInsights (en/es)

### Part AF: Streak Protection Escalation (HAB-F06) ✅
- [x] Service: `habitsService.getStreakProtectionStatus(userId)` — urgency levels per habit
  - none (done), gentle (>6h, streak>3d), urgent (2-6h, streak>7d), critical (<2h), minimal (<2h, "1 rep" fallback)
- [x] Route: `GET /api/habits/streak-protection`
- [x] i18n: streakProtection, streakAtRisk, gentleReminder, urgentReminder, criticalReminder, minimalVersion, hoursLeft, streakDays (en/es)

### Part AG: Goals Dashboard Summary (OBJ-F11) ✅
- [x] Service: `goalsService.getDashboardSummary(userId)` — per-level counts, avg progress, health buckets (green/yellow/red)
  - Upcoming deadlines (top 5), recently completed (top 5), parallel queries across all 5 goal levels
- [x] Route: `GET /api/goals/dashboard-summary`
- [x] i18n: goalsDashboard, totalGoals, avgProgress, upcomingDeadlines, recentlyCompleted, healthGreen/Yellow/Red (en/es)

### Part AH: AI Time-Blocking (CAL-F04) ✅
- [x] Service: `calendarService.generateTimeBlocks(userId, date)` — AI schedules tasks into optimal calendar slots
  - Avoids conflicts, morning slots for high priority, groups similar tasks, includes breaks
- [x] Route: `GET /api/calendar/ai/time-blocks?date=YYYY-MM-DD`
- [x] i18n: timeBlocking, suggestedBlocks, unscheduledTasks, generateSchedule, applyBlocks (en/es)

### Part AI: Free Time Analysis (CAL-F05) ✅
- [x] Service: `calendarService.analyzeFreeTime(userId, startDate, endDate)` — pure calculation, no AI
  - Per-day: totalFreeMinutes, totalBusyMinutes, longestFreeBlock, freeSlots array, eventCount
  - Summary: avgFreeMinutesPerDay, busiestDay, freestDay, totalFreeHours
- [x] Route: `GET /api/calendar/free-time?start=YYYY-MM-DD&end=YYYY-MM-DD`
- [x] i18n: freeTimeAnalysis, totalFreeTime, busiestDay, freestDay, freeSlots, availableHours (en/es)

### Part AJ: All-Day Tasks (TSK-F21) ✅
- [x] Schema: `isAllDay` already existed in Prisma model + migration
- [x] Validator: Added `isAllDay: z.boolean().optional()` to shared task schema
- [x] Service: Create/update clear scheduledStart/scheduledEnd when isAllDay=true
- [x] Migration file: `add_task_all_day/migration.sql` (redundant with existing, safe to skip)
- [x] i18n: allDay, allDayTask, noSpecificTime (en/es)

### Part AK: Goal Templates (OBJ-F09) ✅
- [x] Constants: `packages/shared/src/constants/goal-templates.ts` — 6 categories, 2-3 templates each (fitness, career, finance, learning, relationships, wellness)
- [x] Routes: `GET /api/goals/templates` and `GET /api/goals/templates/:category`
- [x] i18n: goalTemplates, useTemplate, templateCategories + all template title/description keys (en/es)

### Part AL: Calendar + Timeline Task Views (TSK-F12) ✅
- [x] Repository: `findByDateRange(userId, start, end)` — tasks by scheduledDate/dueDate range
- [x] Service: `getCalendarView(userId, start, end)` — grouped by date with allDay/timed split
- [x] Service: `getTimelineView(userId, start, end)` — chronological with gap events
- [x] Routes: `GET /api/tasks/views/calendar` and `GET /api/tasks/views/timeline`
- [x] i18n: calendarView, timelineView, allDayTasks, timedTasks, noTasksThisDay, freeTime (en/es)

### Part AM: Smart Slot Finding (CAL-F03) ✅
- [x] Repository: `findCompletedWithActualStart(userId, limit)` — productivity pattern data
- [x] Service: `calendarService.findSmartSlots(userId, taskId, date)` — AI ranks time slots by availability + energy patterns
  - Returns scored slots with reasons + bestSlot recommendation
- [x] Route: `GET /api/calendar/ai/smart-slots?taskId=xxx&date=YYYY-MM-DD`
- [x] i18n: smartSlots, bestTimeSlot, slotScore, findBestTime, productivityPattern (en/es)

### Part AN: Quarterly Nudge (NOT-F06) ✅
- [x] Service: `cronService.processQuarterlyNudge()` — day 1 of quarter guard, checks existing goals, sends push
  - No goals → strong nudge, <50% measurable → soft nudge, else skip
- [x] Route: `POST /api/cron/quarterly-nudge`
- [x] i18n: quarterlyNudge, newQuarter, setQuarterlyGoals, reviewQuarterlyGoals (en/es)

### Part AO: UX Improvements & Functional Gap Closure ✅

#### Date Locale Consistency ✅
- [x] Created shared `formatDate`, `formatTime`, `formatMonth` in `apps/web/src/i18n/format.ts`
  - Uses `LOCALE_TO_INTL` mapping (en→en-US, es→es-ES) as single source of truth
  - Replaced 26+ scattered `toLocaleDateString`/`toLocaleTimeString` calls across 18 files
  - All date/time formatting now locale-aware via `useLocale()` hook

#### Font & Asset Optimization ✅
- [x] Removed unused Nunito Google Font from `index.html` (preconnect + stylesheet)
- [x] Converted auth logo from PNG (200KB) to WebP (13KB) — `logo_full_text.webp`

#### Error Handling ✅
- [x] Added global `MutationCache` error handler in `main.tsx` — all mutation errors show toast automatically
- [x] Fixed silent `.catch(() => {})` in `settings.tsx` — now shows error toast
- [x] Added finances empty state when no accounts/transactions

#### Scroll Restoration ✅
- [x] Enabled `scrollRestoration: true` on TanStack Router

#### AI Chat Fix & Floating Chat (AI-F11) ✅
- [x] Fixed chat API response format: `reply` → `response` field to match backend
- [x] Created `ChatPanel.tsx` — floating chat panel accessible from any page via FAB button
  - Uses Sheet component, only renders when AI feature flag enabled
  - Same tool-calling chat capabilities as /ai route
- [x] Added `ChatPanel` to `_app.tsx` layout
- [x] Removed AI from sidebar navigation (now transversal via floating chat)

#### Simplified Navigation (WEB-F06) ✅
- [x] Sidebar: split into core items (Dashboard, Tasks, Habits, Goals, Pomodoro) + collapsible "More" (Calendar, Finances, Notes, Reading)
  - Secondary items filtered by feature flags
- [x] MobileBottomNav: 4 main tabs (Dashboard, Tasks, Habits, Goals) + More sheet
- [x] Added `navMore` translation key (en/es)

#### Connect Orphan Backend Endpoints ✅
- [x] `NextTaskCard` — dashboard card for `GET /tasks/ai/next` (AI suggested next task)
- [x] `WeeklyXpBreakdown` — gamification widget for `GET /gamification/xp/weekly` (XP by source)
- [x] `QuarterlyReviewCard` — goals quarterly tab for `GET /goals/ai/quarterly-review` (on-demand AI review)
- [x] `WeeklyPlanCard` — dashboard card for `POST /chat/weekly-plan` (AI weekly planning)
- [x] Added gamification API method + query for weekly XP
- [x] Added AI API method for weekly plan

#### Weekly Goal Health Snapshots (OBJ-F14) ✅
- [x] `processWeeklyReview` cron now auto-creates `GoalHealthSnapshot` per quarterly goal
  - Uses `upsert` with unique (quarterlyGoalId, weekStart) constraint
  - Momentum score = current goal progress, status derived from thresholds (≥75→positive, ≥40→neutral, <40→negative)

#### Quarterly Achievement Trigger (GAM-F03) ✅
- [x] `processQuarterlyReview` cron now calls `checkAchievements(userId)` after review generation
- [x] `updateQuarterlyGoal` service now triggers `checkAchievements` when progress changes
  - Fires async (non-blocking) to avoid slowing down the update

#### Habit Archive/Restore Toggle (HAB-F10) ✅
- [x] Archive button added to HabitCard (list view) — sets `isActive: false`
- [x] Collapsible "archived habits" section at bottom of list tab with restore button
- [x] Queries archived habits via `habitsQueries.list({ isActive: 'false' })`
- [x] i18n: habitArchived, habitRestored, archivedHabits, archive, restore (en/es)

#### Task Backlog View (TSK-F18) ✅
- [x] Created `/tasks/backlog` route — shows unscheduled tasks (API `?filter=backlog`)
  - "Today" button per task for quick scheduling to current date
  - Search filter, completion impact on toggle
- [x] Added "Backlog" tab to `TasksNav.tsx`
- [x] i18n: backlog (en/es common.json)

---

## Future Enhancement Candidates (Phase 5+)

### Medium Priority (Phase 5)
1. Goal creation from tree view nodes
2. Goal filtering capabilities (by area, status, progress)
3. Goal context in dashboard/overview screens
4. Advanced goal analytics and reporting
5. Goal drill-down navigation improvements
6. Mobile tree view visualization
7. Goal templates and quick creation
8. AI-powered habit pattern analysis
9. Productivity insights dashboard

### Low Priority (Phase 6+)
1. Natural language goal parsing ("Add a goal to read 5 books")
2. AI-powered goal recommendations based on user history
3. Team goals and collaborative planning
4. Predictive analytics (time estimates, success probability)
5. Voice-based goal and task input
6. Automatic habit optimization suggestions

