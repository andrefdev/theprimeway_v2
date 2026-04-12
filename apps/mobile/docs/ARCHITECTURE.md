# The Prime Way — Mobile App Architecture

> This document is the **single source of truth** for all AI agents and developers working on this codebase.
> Every decision, pattern, and constraint described here **MUST** be followed exactly.

---

## 1. Tech Stack (Non-Negotiable)

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Expo SDK | 54 |
| Runtime | React Native | 0.81 |
| UI Framework | React | 19 |
| Styling | NativeWind (Tailwind v3) | 4.2 |
| Router | Expo Router | 6 |
| State (remote) | TanStack Query | 5 |
| State (local) | Zustand | 5 |
| HTTP | Axios | 1.x |
| Forms | React Hook Form + Zod | 7 + 4 |
| Icons | lucide-react-native | 0.545+ |
| Lists | @shopify/flash-list | 2.x |
| Images | expo-image | 3.x |
| Animations | react-native-reanimated + Moti | 4 + 0.30 |
| Bottom Sheets | @gorhom/bottom-sheet | 5.x |
| Secure Storage | expo-secure-store | 15.x |
| Package Manager | **pnpm** | — |
| Bundler | **Metro** | — |
| Transpiler | **Babel** | — |

### NEVER use:
- `npm` or `yarn` → always `pnpm`
- `StyleSheet.create` → always NativeWind classes
- `FlatList` / `SectionList` → always `FlashList`
- `Image` from react-native → always `expo-image`
- `Animated` from react-native → always `react-native-reanimated`
- `AsyncStorage` → always `expo-secure-store` (tokens) or `react-native-mmkv` (prefs)
- `fetch()` → always Axios via `@/shared/api/client`
- `Context API` for global state → always Zustand
- Tailwind v4 → we use **v3 only**
- Webpack → we use **Metro only**

---

## 2. Brand / Design System

### 2.1 Color Palette

```
Primary / Electric Blue    #280FFB   hsl(246 97% 52%)
Primary Hover              #331CFB   hsl(246 97% 55%)
Secondary / Vivid Indigo   #4633FD   hsl(246 98% 60%)
Accent / Soft Violet       #6454FD   hsl(246 98% 66%)
Accent Light               #887CFD   hsl(246 97% 74%)
Background Highlight       #B3ABFE   hsl(246 98% 83%)
```

### 2.2 Dark Theme (Default)

```
Background:  #0F1419  hsl(210 25% 8%)   — deep navy/charcoal
Card:        #171D24  hsl(210 20% 11%)  — elevated surface
Popover:     #1C2330  hsl(210 20% 13%)  — highest surface
Muted bg:    #1E2530  hsl(210 15% 15%)  — subtle surface
Border:      #262E38  hsl(210 15% 18%)  — borders/dividers
Muted text:  #7A8494  hsl(210 10% 55%)  — secondary text
Foreground:  #FAFAFA  hsl(0 0% 98%)     — primary text
```

### 2.3 Semantic Colors (NEVER change, used for meaning)

| Token | Meaning | Value |
|-------|---------|-------|
| `success` | Positive, income, completed | green `hsl(142 71% 45%)` |
| `warning` | Caution, medium priority | amber `hsl(38 92% 50%)` |
| `destructive` | Error, expense, delete | red `hsl(0 72% 51%)` |
| `info` | Neutral info, transfers | blue `hsl(199 89% 48%)` |
| `income` | Financial income | = success green |
| `expense` | Financial expense | = destructive red |
| `transfer` | Financial transfer | = info blue |
| `priority-high` | High priority tasks | = destructive red |
| `priority-medium` | Medium priority | = warning amber |
| `priority-low` | Low priority | = info blue |

### 2.4 Color Usage Rules

1. **NEVER hardcode hex/rgb colors** → always use CSS variable tokens (`bg-primary`, `text-muted-foreground`, etc.)
2. **Primary (#280FFB)** → CTAs, active tabs, FABs, progress bars, active toggles, send buttons
3. **Secondary (#4633FD)** → secondary buttons, card accents, gradient endpoints
4. **Accent (#6454FD)** → badges, light accents, icon tints, category pills
5. **Accent Light (#887CFD)** → subtle highlights, selected chips, secondary text accents
6. **Background Highlight (#B3ABFE)** → very subtle tints, focus rings, glow effects
7. **Green** → income, completed, success, streaks
8. **Red** → expenses, errors, high priority, destructive actions
9. **Amber** → warnings, medium priority, pending states
10. **Blue (info)** → transfers, low priority, informational

### 2.5 Typography

- Font: System default (SF Pro on iOS, Roboto on Android)
- Base: 16px (1rem)
- Scale: `text-2xs` (10px), `text-xs` (12px), `text-sm` (14px), `text-base` (16px), `text-lg` (18px), `text-xl` (20px), `text-2xl` (24px), `text-3xl` (30px), `text-4xl` (36px)
- Headings: `font-bold` or `font-semibold`, never `font-normal`
- Body: `font-normal`, `leading-relaxed` for readability
- Muted/secondary text: `text-muted-foreground`

### 2.6 Spacing & Layout

- Page padding: `px-4` (16px) horizontal, `pt-2 pb-6` vertical
- Card padding: `p-4` (internal), gap `gap-3` between cards
- Section spacing: `gap-6` between major sections
- Border radius: `rounded-xl` (cards), `rounded-lg` (buttons/inputs), `rounded-full` (avatars/pills)
- Bottom tab bar height: 80px (with safe area)

### 2.7 Elevation (Dark Mode)

```
Level 0: bg-background     — page background
Level 1: bg-card            — cards, list items
Level 2: bg-popover         — modals, bottom sheets, dropdowns
Level 3: bg-muted           — nested surfaces within cards
```

---

## 3. Project Structure

```
theprimeway_app/
├── app/                          # Expo Router (file-based routing)
│   ├── _layout.tsx               # Root layout (providers, theme)
│   ├── index.tsx                 # Entry redirect
│   ├── (auth)/                   # Public routes
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── verify-otp.tsx
│   ├── (onboarding)/             # First-time setup
│   │   ├── welcome.tsx
│   │   └── ...
│   └── (app)/                    # Protected routes (auth required)
│       ├── _layout.tsx           # Auth guard + tab navigator
│       ├── (tabs)/               # Bottom tab navigator
│       │   ├── _layout.tsx       # Tab bar configuration
│       │   ├── index.tsx         # Dashboard/Home
│       │   ├── tasks/            # Tasks module
│       │   ├── habits/           # Habits module
│       │   ├── finances/         # Finances module
│       │   └── goals/            # Goals module
│       ├── ai.tsx                # AI Chat (modal)
│       ├── calendar.tsx          # Calendar (modal)
│       ├── notes/                # Notes module
│       ├── profile.tsx           # Profile (modal)
│       ├── settings.tsx          # Settings (modal)
│       └── subscription.tsx      # Subscription (modal)
├── src/
│   ├── features/                 # Feature modules (domain logic)
│   │   ├── {feature}/
│   │   │   ├── components/       # Feature-specific UI
│   │   │   ├── hooks/            # Feature hooks (queries, mutations)
│   │   │   ├── services/         # API call functions
│   │   │   └── types.ts          # Feature types
│   ├── shared/
│   │   ├── api/
│   │   │   ├── client.ts         # Axios instance + interceptors
│   │   │   ├── endpoints.ts      # API URL constants
│   │   │   └── queryKeys.ts      # TanStack Query keys
│   │   ├── components/
│   │   │   ├── ui/               # Primitives (button, card, input...)
│   │   │   ├── layout/           # Header, Screen, TabBar
│   │   │   ├── feedback/         # EmptyState, ErrorState, Loading
│   │   │   └── data-display/     # StatsCard, charts, etc.
│   │   ├── hooks/                # Shared hooks
│   │   ├── providers/            # AuthProvider, QueryProvider
│   │   ├── stores/               # Zustand stores
│   │   ├── types/                # Shared types (models, api)
│   │   ├── utils/                # Utilities (cn, date, currency, format)
│   │   ├── constants/            # Static data
│   │   └── i18n/                 # Internationalization (en/es)
├── assets/                       # Static assets (images, fonts)
├── global.css                    # Design tokens (CSS variables)
├── tailwind.config.js            # Tailwind + NativeWind config
├── babel.config.js               # Babel config (nativewind + reanimated)
├── metro.config.js               # Metro bundler config
├── app.json                      # Expo config
└── tsconfig.json                 # TypeScript (strict, path aliases)
```

---

## 4. Component Architecture

### 4.1 Component Hierarchy

```
Screen (page in app/ directory)
└── Feature Components (src/features/{feature}/components/)
    └── Shared Composites (src/shared/components/data-display/, layout/, feedback/)
        └── UI Primitives (src/shared/components/ui/)
```

### 4.2 UI Primitives (`src/shared/components/ui/`)

These are the base building blocks. They exist already from react-native-reusables:

| Component | File | Usage |
|-----------|------|-------|
| Button | `button.tsx` | All tappable actions |
| Text | `text.tsx` | All text display (h1-h4, p, muted, etc.) |
| Input | `input.tsx` | Text inputs |
| Textarea | `textarea.tsx` | Multiline inputs |
| Card + parts | `card.tsx` | All card containers |
| Badge | `badge.tsx` | Status/category labels |
| Progress | `progress.tsx` | Progress bars |
| Avatar | `avatar.tsx` | User/entity images |
| Tabs | `tabs.tsx` | Tab navigation |
| Switch | `switch.tsx` | Boolean toggles |
| Checkbox | `checkbox.tsx` | Multi-select |
| RadioGroup | `radio-group.tsx` | Single-select |
| Select | `select.tsx` | Dropdown selects |
| Dialog | `dialog.tsx` | Modal dialogs |
| AlertDialog | `alert-dialog.tsx` | Confirmation dialogs |
| DropdownMenu | `dropdown-menu.tsx` | Context menus |
| Separator | `separator.tsx` | Visual dividers |
| Collapsible | `collapsible.tsx` | Expandable sections |
| Accordion | `accordion.tsx` | Multiple expandable sections |
| Tooltip | `tooltip.tsx` | Info tooltips |
| Popover | `popover.tsx` | Rich popover content |
| Label | `label.tsx` | Form labels |
| Toggle | `toggle.tsx` | Toggle buttons |
| ToggleGroup | `toggle-group.tsx` | Grouped toggles |

### 4.3 Shared Composites (to be created/styled)

These combine primitives into reusable patterns:

| Component | Location | Purpose |
|-----------|----------|---------|
| `Screen` | `layout/Screen.tsx` | SafeArea + scroll wrapper |
| `Header` | `layout/Header.tsx` | Page header with back/title/actions |
| `BottomSheet` | `layout/BottomSheet.tsx` | @gorhom/bottom-sheet wrapper |
| `FAB` | `ui/fab.tsx` | Floating action button |
| `StatsCard` | `data-display/StatsCard.tsx` | Metric display card |
| `SectionHeader` | `data-display/SectionHeader.tsx` | Section title + action |
| `EmptyState` | `feedback/EmptyState.tsx` | No data illustration |
| `ErrorState` | `feedback/ErrorState.tsx` | Error with retry |
| `LoadingOverlay` | `feedback/LoadingOverlay.tsx` | Full-screen loading |
| `PillTabs` | `ui/pill-tabs.tsx` | Horizontal pill-style tab selector |
| `IconCircle` | `ui/icon-circle.tsx` | Icon in colored circle bg |
| `PriorityIndicator` | `data-display/PriorityIndicator.tsx` | Color bar/dot for priority |
| `TransactionItem` | `data-display/TransactionItem.tsx` | Transaction row |
| `ChipFilter` | `ui/chip-filter.tsx` | Horizontal filter chip row |

### 4.4 Feature Components

Each feature module has its own components that are NOT shared across features:

```
src/features/tasks/components/
├── TaskCard.tsx          # Single task in list/timeline
├── TaskTimeline.tsx      # Today timeline view
├── WeekBoard.tsx         # Weekly kanban columns
├── TaskForm.tsx          # Create/edit form (in BottomSheet)
├── TaskFilters.tsx       # Tab pills (Today/Weekly/All/Focus)
└── UnscheduledSection.tsx # Collapsible unscheduled tasks

src/features/habits/components/
├── HabitCard.tsx         # Single habit with toggle
├── HabitList.tsx         # Today's habits list
├── HabitForm.tsx         # Create/edit (BottomSheet)
├── StreakBanner.tsx       # Streak celebration
├── HabitStats.tsx        # Completion rate, streaks
└── WeekDots.tsx          # 7-day completion dots

src/features/finances/components/
├── BalanceCard.tsx       # Cash balance display
├── NarrativeCard.tsx     # Financial narrative/status
├── CashFlowRow.tsx       # Income/Expenses/Net cards
├── BudgetCard.tsx        # Budget with progress
├── TransactionForm.tsx   # Add transaction (BottomSheet)
├── AccountCard.tsx       # Bank account card
├── DebtCard.tsx          # Debt/loan card
├── SavingsGoalCard.tsx   # Savings goal with progress
├── HoldingCard.tsx       # Investment holding
├── PortfolioChart.tsx    # Donut allocation chart
└── NetWorthSparkline.tsx # 6-month trend line

src/features/goals/components/
├── VisionCard.tsx        # 10-year vision hero
├── PillarCard.tsx        # Strategic pillar (expandable)
├── OutcomeCard.tsx       # Annual outcome
├── QuarterFocusCard.tsx  # Quarterly OKR card
├── KeyResultRow.tsx      # KR with progress bar
├── WeeklyGoalCard.tsx    # Weekly goal card
├── GoalForm.tsx          # Create/edit goal (BottomSheet)
└── RoadmapTree.tsx       # Collapsible hierarchy

src/features/notes/components/
├── NoteCard.tsx          # Note preview card
├── NoteEditor.tsx        # Rich text editor
├── CategoryChips.tsx     # Category filter
└── NoteSidePanel.tsx     # Tags, category, export

src/features/reading/components/
├── BookCard.tsx          # Book with cover + progress
├── BookGrid.tsx          # 2-column book grid
├── ReadingKanban.tsx     # Plan kanban board
├── ReadingGoalCard.tsx   # Reading goal with ring
└── BookDetailSheet.tsx   # Book detail bottom sheet

src/features/ai/components/
├── ChatMessage.tsx       # User/AI message bubble
├── ChatInput.tsx         # Input + send + mic
├── ToolCallCard.tsx      # Tool execution display
├── ConfirmationCard.tsx  # Write operation approval
├── SuggestionPills.tsx   # Quick suggestion chips
└── TypingIndicator.tsx   # Animated dots
```

---

## 5. Coding Patterns

### 5.1 NativeWind Styling Rules

```tsx
// CORRECT: Use NativeWind classes
<View className="bg-card rounded-xl p-4 gap-3">
  <Text className="text-foreground text-lg font-bold">Title</Text>
  <Text className="text-muted-foreground text-sm">Subtitle</Text>
</View>

// WRONG: Never use StyleSheet
const styles = StyleSheet.create({ container: { ... } }); // FORBIDDEN

// WRONG: Never hardcode colors
<View style={{ backgroundColor: '#280FFB' }}> // FORBIDDEN
<View className="bg-[#280FFB]"> // FORBIDDEN — use bg-primary instead
```

### 5.2 Component Pattern

```tsx
// Standard feature component pattern
import { View } from 'react-native';
import { Text } from '@ui/text';
import { Card, CardContent } from '@ui/card';
import { Button } from '@ui/button';
import { cn } from '@/shared/utils';

type TaskCardProps = {
  task: Task;
  onToggle: (id: string) => void;
  onPress: (id: string) => void;
};

export function TaskCard({ task, onToggle, onPress }: TaskCardProps) {
  return (
    <Card className={cn('gap-2', task.status === 'completed' && 'opacity-60')}>
      <CardContent className="flex-row items-center gap-3">
        {/* ... */}
      </CardContent>
    </Card>
  );
}
```

### 5.3 Data Fetching Pattern

```tsx
// Hook in features/{feature}/hooks/
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import { taskService } from '../services/taskService';

export function useTasks(filter?: TaskFilter) {
  return useQuery({
    queryKey: queryKeys.tasks.list(filter),
    queryFn: () => taskService.getAll(filter),
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: taskService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });
}
```

### 5.4 Service Pattern

```tsx
// Service in features/{feature}/services/
import { apiClient } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';

export const taskService = {
  getAll: (filter?: TaskFilter) =>
    apiClient.get<Task[]>(ENDPOINTS.TASKS.LIST, { params: filter }).then(r => r.data),

  create: (data: CreateTaskDto) =>
    apiClient.post<Task>(ENDPOINTS.TASKS.CREATE, data).then(r => r.data),

  update: (id: string, data: Partial<Task>) =>
    apiClient.put<Task>(ENDPOINTS.TASKS.UPDATE(id), data).then(r => r.data),

  delete: (id: string) =>
    apiClient.delete(ENDPOINTS.TASKS.DELETE(id)),
};
```

### 5.5 Screen Pattern

```tsx
// Screen in app/(app)/(tabs)/tasks/today.tsx
import { Screen } from '@/shared/components/layout/Screen';
import { Header } from '@/shared/components/layout/Header';
import { TaskTimeline } from '@features/tasks/components/TaskTimeline';
import { useTasks } from '@features/tasks/hooks/useTasks';

export default function TasksTodayScreen() {
  const { data: tasks, isLoading } = useTasks({ date: 'today' });

  return (
    <Screen>
      <Header title="Today" />
      <TaskTimeline tasks={tasks} isLoading={isLoading} />
    </Screen>
  );
}
```

### 5.6 Bottom Sheet Pattern

```tsx
// All create/edit forms use @gorhom/bottom-sheet
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useRef, useCallback } from 'react';

export function TaskFormSheet({ visible, onClose }: Props) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['85%'], []);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={{ backgroundColor: 'hsl(210, 20%, 11%)' }}
      handleIndicatorStyle={{ backgroundColor: 'hsl(210, 10%, 55%)' }}
    >
      <BottomSheetView className="flex-1 px-4">
        {/* Form content */}
      </BottomSheetView>
    </BottomSheet>
  );
}
```

---

## 6. Navigation Structure

### 6.1 Tab Bar

5 tabs in the bottom tab bar:

| Tab | Icon | Route | Module |
|-----|------|-------|--------|
| Home | `House` | `/(app)/(tabs)/` | Dashboard |
| Tasks | `CheckSquare` | `/(app)/(tabs)/tasks/` | Tasks |
| Habits | `Flame` | `/(app)/(tabs)/habits/` | Habits |
| Finances | `Wallet` | `/(app)/(tabs)/finances/` | Finances |
| More | `LayoutGrid` | Opens More menu | Grid nav |

### 6.2 "More" Menu Grid

Accessible from 5th tab, opens grid of secondary modules:

| Item | Icon | Route |
|------|------|-------|
| Goals | `Target` | `/(app)/(tabs)/goals/` |
| Reading | `BookOpen` | Modal or nested |
| Notes | `FileText` | `/(app)/notes/` |
| AI Chat | `Sparkles` | `/(app)/ai` |
| Calendar | `Calendar` | `/(app)/calendar` |
| Pomodoro | `Timer` | `/(app)/pomodoro` |
| Profile | `User` | `/(app)/profile` |
| Settings | `Settings` | `/(app)/settings` |
| Premium | `Crown` | `/(app)/subscription` |

### 6.3 Tab Bar Styling

```
Background: bg-background (with blur on iOS)
Active icon: text-primary (#280FFB)
Inactive icon: text-muted-foreground
Active indicator: 4px dot below icon, bg-primary
Height: 80px (includes safe area)
Border top: border-t border-border
```

---

## 7. Screen-by-Screen Specifications

### Dashboard (Home)
- Greeting + date + avatar
- AI Daily Briefing card (primary border glow)
- Stats row: 4 mini cards (tasks, habits, focus, budget)
- Quick actions: 4 circular buttons (+ Task, Focus, + Transaction, + Note)
- Today's agenda: task cards + habit circles
- Scrollable, pull-to-refresh

### Tasks Today
- Timeline view with hourly markers
- Task cards positioned at scheduled time
- Priority color-coded left border (red/amber/blue)
- Unscheduled section (collapsible bottom)
- FAB to add task

### Tasks Weekly
- 7-day horizontal scroll columns
- Compact task cards per day
- Today highlighted with primary tint
- Week summary bar with progress

### Habits
- Streak banner (if active streak)
- Today's habits with one-tap toggle
- 7-day mini dots per habit
- Stats section (completion rate, top streaks)

### Goals (Prime Roadmap)
- Vision card (hero, primary gradient border)
- Collapsible pillar tree
- Tab pills: Roadmap / Quarterly / Weekly
- Progress overview ring

### Finances Overview
- Narrative card (status message)
- Cash balance (large number)
- Daily capacity
- Net worth sparkline
- Quick actions (+ Expense, + Income)
- Recent transactions

### AI Chat
- Message bubbles (user right, AI left)
- Markdown rendering
- Tool call timeline
- Confirmation cards for writes
- Suggestion pills on empty state
- Input bar with send + attachment

### Notes
- Masonry grid of note cards
- Category chips horizontal filter
- Pinned section
- Search bar

### Reading Library
- 2-column book grid with covers
- Status filter chips
- Progress bars on current reads
- Reading goal card (bottom)

---

## 8. Consistency Checklist

Before submitting any screen, verify:

- [ ] All colors use CSS variable tokens (no hardcoded hex)
- [ ] Background is `bg-background` (Level 0) or `bg-card` (Level 1)
- [ ] Primary accent is Electric Blue (`bg-primary`, `text-primary`) — NEVER gold/amber
- [ ] Active tab icons use `text-primary` (#280FFB)
- [ ] FAB buttons use `bg-primary` with white icon
- [ ] Progress bars use `bg-primary` fill on `bg-primary/20` track
- [ ] Cards use `bg-card rounded-xl border-border` consistently
- [ ] Text hierarchy: `text-foreground` (primary), `text-muted-foreground` (secondary)
- [ ] Spacing follows the system (px-4 page, p-4 cards, gap-3/gap-6)
- [ ] Bottom sheet forms use `@gorhom/bottom-sheet` (never Dialog for forms)
- [ ] Icons use `lucide-react-native` via Icon wrapper
- [ ] Lists use `FlashList` (never FlatList)
- [ ] Images use `expo-image` (never Image)
- [ ] No `StyleSheet.create` anywhere
- [ ] Semantic colors for finance/priority (green=income, red=expense, etc.)
- [ ] Tab bar is consistent across all tab screens (5 tabs)
- [ ] Font weights: bold for headings, normal for body, medium for labels

---

## 9. Path Aliases

```
@/*         → src/
@ui/*       → src/shared/components/ui/
@features/* → src/features/
@shared/*   → src/shared/
@assets/*   → assets/
```

Use these everywhere. Never use relative paths like `../../../shared/`.

---

## 10. API Integration

- Base URL: `EXPO_PUBLIC_API_URL` environment variable
- Auth: Bearer JWT via `Authorization` header (auto-injected by Axios interceptor)
- Endpoints: defined in `@/shared/api/endpoints.ts`
- Query keys: defined in `@/shared/api/queryKeys.ts`
- Stale time: 5 minutes, GC time: 30 minutes
- 401 responses auto-logout and redirect to login
- All API calls go through `@/shared/api/client.ts` — NEVER create separate Axios instances
