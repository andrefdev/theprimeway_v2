# The Primeway — Product Roadmap & Strategic Redesign

> **Version:** 1.0 — April 2026
> **Author:** Senior Product Engineering Review
> **Audience:** Founders, engineering, design, and any AI agent (Claude Code, Cursor, etc.) collaborating on the platform.
> **Companion doc:** `Motor de Scheduling Inteligente — theprimeway` (technical spec for the scheduling engine).

This document is the strategic roadmap for evolving The Primeway from a structured task manager into a true **Vision-to-Execution Operating System** — a category that today does not exist coherently, but is hinted at by Sunsama (execution), Notion (structure), Habitica (motivation) and OKR tools (alignment).

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Competitive Landscape](#2-competitive-landscape)
3. [Key Insights from System Audit](#3-key-insights-from-system-audit)
4. [Architecture Proposal](#4-architecture-proposal)
5. [Scheduling Engine Design](#5-scheduling-engine-design)
6. [UX Redesign](#6-ux-redesign)
7. [Execution Flow — A Day in the Life](#7-execution-flow)
8. [Phased Product Roadmap](#8-phased-product-roadmap)
9. [Success Metrics & North Stars](#9-success-metrics--north-stars)
10. [Risks, Trade-offs and Open Questions](#10-risks-trade-offs-and-open-questions)

---

## 1. Executive Summary

### 1.1. Vision Statement

> The Primeway is the operating system for an intentional life: it lets a person translate a 10-year vision into a habit they performed this morning — and into a 25-minute focus block this afternoon — without ever losing the line that connects them.

### 1.2. The opportunity in one sentence

Productivity tools today force users to choose between **structure** (Notion, OKR tools), **execution** (Sunsama, Akiflow, Motion), **motivation** (Habitica, Streaks) and **personal growth** (BestSelf, Reflectly). **No product owns the vertical pipeline**: 10-year vision → quarterly OKR → weekly objective → today's task → focus block → habit → reflection.

The Primeway can own that pipeline if — and only if — every layer feels lightweight at the user's current zoom level. Heavy structure is fatal at the daily zoom; loose structure is fatal at the yearly zoom. The art is **progressive disclosure of intentionality**.

### 1.3. The three strategic bets

1. **Coherent vertical** — One graph from 10-year vision to a single 25-minute working session. Other products fragment this into separate apps or modules with no cross-talk.
2. **Sunsama-grade execution loop** — A deterministic, conservative scheduling engine that the user trusts. This is table stakes for premium daily-driver positioning.
3. **Ritual-driven flow** — Time is structured by *rituals* (Daily Plan, Daily Shutdown, Weekly Plan, Weekly Review, Quarterly Reflection), not by screens. Rituals are the thread between the vision layer and the execution layer.

### 1.4. What we are *not* building

- A team collaboration tool (no comments, no assignments, no shared workspaces in v1).
- An AI-first auto-planner like Motion. We use AI sparingly (channel suggestion, time estimation), and the user always retains control. Predictability beats optimization.
- A note-taking app. Notes belong on tasks/goals/sessions, but the Primeway is not a Notion replacement.

---

## 2. Competitive Landscape

A clear-eyed analysis of what each player owns, what they don't, and where The Primeway can differentiate.

### 2.1. Tier 1 — Daily-driver execution tools

| Product | Owns | Doesn't own | Pricing |
|---|---|---|---|
| **Sunsama** | The daily planning ritual + calendar-aware time-boxing. Best-in-class focus on "this week, this day". | Long-horizon goals, habits, reflection. No 3-year vision concept. | $20/mo |
| **Akiflow** | Universal task inbox (Slack, Gmail, Asana, Linear → Akiflow). Speed-of-capture leader. | Vision/goals layer. Focus mode. Ritual structure. | $19/mo |
| **Motion** | AI auto-scheduling that re-optimizes aggressively. | Predictability. The user feels they've lost control. No life-vision layer. | $34/mo |
| **Reclaim.ai** | Habits and recurring activities slotted as defendable calendar blocks. | UI for daily planning. No vision/objective concept. | $18/mo |
| **Amie / Cron** | Beautiful calendar UX. | Tasks-as-first-class. No goal hierarchy. | $15/mo |

**Lesson for The Primeway:** Sunsama owns the *ritual* and *trust*. Motion owns the *optimization* and *AI*. Akiflow owns the *capture*. We must own the *vertical alignment* (vision → today) while matching Sunsama's ritual quality and Akiflow's capture speed.

### 2.2. Tier 2 — Structure & knowledge tools

| Product | Owns | Doesn't own | Pricing |
|---|---|---|---|
| **Notion** | Infinite flexibility, second brain, OKR templates. | Anything with time. No real scheduler. | $10/mo |
| **ClickUp** | Project hierarchies, dashboards, "everything app" pitch. | Coherence. UX is overwhelming. Daily ritual nonexistent. | $7/mo |
| **Linear** | Issue tracking with ruthless polish. | Personal vision. Cross-life integration. | $8/mo |
| **Todoist** | Lightweight cross-platform task entry. Natural language input. | Calendar integration (weak). No goals or rituals. | $5/mo |
| **Things 3** | Beautiful single-user task manager with project/area hierarchy. | Calendar awareness. Objectives. Web/Windows. | One-time $50 |

**Lesson for The Primeway:** None of these win at *time*. They win at *structure*. Our hierarchy (Vision → 3yr → 1yr → Quarter → Week → Task) is competitive with their best, but only if we make the upper layers feel lightweight, not bureaucratic.

### 2.3. Tier 3 — Motivation, habits & personal growth

| Product | Owns | Doesn't own | Pricing |
|---|---|---|---|
| **Habitica** | Gamification, streaks, RPG framing. Excellent motivation loop. | Real productivity workflow. No tasks-with-time concept. | Free / $5 |
| **Streaks** | Beautiful single-purpose habit tracker. | Anything beyond habits. | $5 one-time |
| **MyGoodWeek** | Weekly intent-setting + journaling. Reflection-first. | Daily execution. Calendar. No real task layer. | $8/mo |
| **BestSelf / Sunsama Journal** | Paper-first reflection prompts. | Digital calendar integration. | Variable |
| **Reflectly / Stoic** | Daily reflection journals with mood tracking. | Productivity. | $5/mo |

**Lesson for The Primeway:** Habits and reflection prompts must be **embedded into rituals**, not parked in a separate tab. Habitica's streak motivation works because it's tied to identity. We can borrow that — link habits to the *3-year vision* they serve, so completing a habit feels like an investment in your future self, not a checkbox.

### 2.4. Tier 4 — OKR & goal-alignment tools

| Product | Owns | Doesn't own | Pricing |
|---|---|---|---|
| **Mooncamp / Lattice / Weekdone** | Team OKR rollups. | Personal use. Daily execution. | Enterprise |
| **Goalscape** | Visual goal hierarchy. | Time. Tasks. | Niche |

**Lesson for The Primeway:** OKR tools are built for teams. The personal-OKR space is **wide open**. Using vision-aligned weekly objectives (à la Sunsama) and rolling them into quarterly + yearly + 3-year is a defensible position no one else owns cleanly.

### 2.5. Where The Primeway plays

```
                              STRUCTURE / VISION
                              (Notion, OKR tools)
                                     ▲
                                     │
                                     │   ★ The Primeway
                                     │   (vertical owner)
                                     │
                                     │
   MOTIVATION / HABITS  ◄────────────┼────────────►  EXECUTION / TIME
   (Habitica, Streaks)               │               (Sunsama, Akiflow, Motion)
                                     │
                                     │
                                     │
                                     ▼
                              CAPTURE / SPEED
                              (Todoist, TickTick)
```

The unique position: **the only tool where the connection between "what I'm working on at 3 PM" and "who I'm becoming over 10 years" is one click and visually obvious**.

### 2.6. Pricing positioning hypothesis

- **Free tier**: Vision + goals + tasks + habits, but no calendar sync, no scheduling engine, no Focus Mode.
- **Pro ($14/mo)**: Full scheduling engine, calendar sync, rituals, Focus Mode, ML suggestions.
- **Lifestyle ($24/mo)**: Multi-device sync, advanced reflection prompts, integrations (Slack, Linear, Notion read-only), API access.

Beats Sunsama on price ($20→$14 entry) and offers a coherent free tier that pulls users in via the structure/vision layer they cannot get from Sunsama at all.

---

## 3. Key Insights from System Audit

### 3.1. The structural strength

The Primeway already has a **stronger conceptual hierarchy than any competitor**:

```
Vision (10y, single)
  └── 3-year goals
       └── 1-year goals
            └── Quarterly goals
                 └── Weekly goals
                      └── Tasks
                           └── (currently missing) Working sessions
Habits ─── linked to ─── any goal layer
```

This is the moat. Don't break it. But also don't make every user fill every level on day 1 — see "progressive disclosure" later.

### 3.2. The structural gaps

| Gap | Symptom | Resolution |
|---|---|---|
| **No "when" layer** | Tasks have no time. No way to say "this Tuesday at 2pm". | Introduce **WorkingSession** as a first-class entity (already detailed in the scheduling spec). |
| **Backlog is dead weight** | Backlog exists but nobody uses it because it's a dumping ground with no triage flow. | Backlog is *just* `task.day == null`. Repurpose UX as a "parking lot" surfaced during Daily Planning, not a separate view. |
| **No ritual concept** | Users don't know *when* to plan, review, reflect. Goals get stale. | First-class **Ritual** entity + cron-driven prompts + UI shells. Rituals become the spine of the daily/weekly experience. |
| **Goals and tasks live in separate UIs** | The user never feels the line between "3-year goal" and "today's task". | A single graph view + per-task badge showing the goal chain it serves. |
| **Habits are not on the calendar** | Habits exist only in a checklist. They don't compete for time, so they get skipped. | Habits become recurring tasks with a `Habit` flavour (streak, identity statement, etc.). They occupy real time on the calendar. |
| **AI assistant is undifferentiated** | A generic chatbot in a side panel. Users don't know what to ask. | Replace generic chat with **scoped AI actions** triggered from rituals (e.g., "summarize my week", "suggest a habit for this 3-year goal"). |
| **Statistics is a dashboard people open once** | Vanity metrics, no narrative. | Reframe as the **Reflection layer**: weekly review surfaces the metric that matters this week, with a journaling prompt. |

### 3.3. Conceptual redundancies to remove

- **Quarterly + Yearly + 3-year** can collapse visually for users who don't use them. Don't *delete* them in the data model — make them *optional waypoints* between the 10-year vision and the weekly objective. UX shows only what the user has filled.
- **"All tasks" view** is a cop-out. Replace with **smart filters** (by channel, by goal chain, by horizon, by status) and let users save filters as views.
- **Daily / Weekly / All / Backlog** are four views of the same data. Collapse to **one task surface** with three lenses: *Today (timeline)*, *This Week (kanban)*, *Everything (table with filters)*. Backlog disappears as a tab and reappears as a filter.

### 3.4. Missing abstractions

- **WorkingSession** (the "when" of a task) — see scheduling spec.
- **Ritual** (a scheduled, structured user activity).
- **ReflectionEntry** (free-text prompt response tied to a ritual instance).
- **Channel** & **Context** (categorization that lets habits, tasks, and calendar events share organization).
- **VisionThread** (denormalized, computed view of a goal's full chain — used for badge rendering, not stored).

### 3.5. The deepest insight

> **The Primeway's competitive moat is not the vision hierarchy. It's the bridge between the vision hierarchy and the calendar.** Every other tool stops at one or the other. The bridge is the rituals. The calendar is rented from Google. The vision is a spreadsheet without the bridge. Build the bridge.

---

## 4. Architecture Proposal

### 4.1. Guiding principles

1. **The "what" and the "when" are separate.** Inherited from Sunsama. Tasks describe *what*; WorkingSessions describe *when*. A task can have 0, 1 or N sessions.
2. **The vision layer is a graph, not a tree.** A task may serve multiple weekly objectives; an objective may serve multiple yearly goals. Use FK lists, not nested rows.
3. **Habits are tasks with a flavor.** Don't build a parallel Habit subsystem with its own scheduling. A habit is a task linked to a `RecurringSeries` with `kind = HABIT` and an extra `identityStatement` field.
4. **Rituals are scheduled, structured experiences.** Each ritual is an instance of a template. Completing a ritual produces artefacts (reflections, plan snapshots, generated tasks).
5. **The 10-year vision is the only singleton.** Everything else is plural.

### 4.2. Entity Relationship — Bird's Eye View

```
                              ┌──────────────┐
                              │     User     │
                              └──────┬───────┘
                                     │
                ┌────────────────────┼────────────────────┐
                │                    │                    │
         ┌──────▼─────┐       ┌──────▼──────┐      ┌──────▼──────┐
         │   Vision   │       │   Context   │      │UserSettings │
         │ (singleton)│       │  (Work, …)  │      └─────────────┘
         └──────┬─────┘       └──────┬──────┘
                │                    │
       ┌────────▼─────────┐    ┌─────▼────────┐
       │   Goal           │    │   Channel    │
       │ horizon: enum    │    │ #project-x   │
       │ (3Y/1Y/Q/W)      │    └──────┬───────┘
       │ parentId: Goal?  │           │
       └────────┬─────────┘           │
                │                     │
                │  ┌──────────────────┘
                │  │
         ┌──────▼──▼────┐
         │   Task       │◄──────────┐
         │ day: Date?   │           │
         │ kind: enum   │     ┌─────┴───────┐
         │ (TASK|HABIT) │     │ Recurring   │
         └──────┬───────┘     │ Series      │
                │             └─────────────┘
                │
       ┌────────▼─────────┐         ┌─────────────────┐
       │ WorkingSession   │         │ CalendarEvent   │
       │ start, end       │         │ (read-only)     │
       └──────────────────┘         └─────────────────┘

           ┌──────────────────────────────┐
           │   Ritual (template)          │
           │   kind, cadence, prompts     │
           └──────────────┬───────────────┘
                          │
                  ┌───────▼──────────┐
                  │ RitualInstance   │
                  │ scheduledFor     │
                  │ status           │
                  └───────┬──────────┘
                          │
                  ┌───────▼──────────┐
                  │ ReflectionEntry  │
                  │ promptId, body   │
                  └──────────────────┘
```

### 4.3. Entity-by-entity proposal

#### Vision (singleton per user)
```
Vision
├── id
├── userId (unique)
├── statement: text     // "By 2036 I am a respected systems thinker who…"
├── coreValues: text[]  // 3–5 values
├── identityStatements: text[]  // future-self statements
├── lastReviewedAt: datetime
└── createdAt
```
Why singleton: forcing a single 10-year vision is a *feature*, not a constraint. Multiple visions = no vision.

#### Goal (collapses 3Y / 1Y / Quarter / Week into one polymorphic table)
```
Goal
├── id
├── userId
├── horizon: enum {THREE_YEAR, ONE_YEAR, QUARTER, WEEK}
├── parentGoalId: Goal?       // hierarchy via self-FK
├── title
├── description
├── targetMetric (optional, free-text or numeric)
├── channelId (optional)
├── status: enum {ACTIVE, ACHIEVED, RETIRED}
├── startsOn / endsOn         // computed for QUARTER/WEEK from periodKey
├── periodKey: string?        // "2026-Q2", "2026-W17"
├── visionContribution: float (0–1)  // self-rated importance
└── timestamps
```
**Why one table:** today's separate tables for 3yr/1yr/Quarter/Week create N migrations every time you add a field, force N different UIs, and prevent multi-horizon queries ("show me everything that ladders to this 3-year goal"). One table with `horizon` makes the graph natural.

#### Task (already exists; modified)
Already specified in the scheduling doc (section 3 of that doc). Add:
```
+ kind: enum {TASK, HABIT}                // flavour
+ identityStatement: string?              // for habits: "I am a person who…"
+ goalIds: Goal[]  (many-to-many, replaces single objectiveId)
```
**Why many-to-many:** a task can serve multiple goals (e.g., "30 min Spanish" serves both "fluency in Spanish" and "consistent learning habit"). Forcing single FK loses information.

#### WorkingSession
Unchanged from the scheduling spec.

#### RecurringSeries
Unchanged. Used for both HABIT and recurring TASK.

#### Habit specifics (no separate table)
A habit is a `Task` with `kind = HABIT`, attached to a `RecurringSeries`, with `identityStatement` filled. Streak counters, perfect-week counters etc. are computed views, not stored fields.

#### Channel & Context
Unchanged from scheduling spec.

#### Ritual (NEW — first-class)
```
Ritual                          // template, system + user-defined
├── id
├── userId (null for system templates)
├── kind: enum {DAILY_PLAN, DAILY_SHUTDOWN, WEEKLY_PLAN, WEEKLY_REVIEW, QUARTERLY_REVIEW, ANNUAL_REVIEW, CUSTOM}
├── name
├── cadence: enum {DAILY, WEEKLY, MONTHLY, QUARTERLY, ANNUALLY, ON_DEMAND}
├── scheduledTime: string?  // "08:00" for daily; cron-like for weekly
├── steps: Step[] (JSONB)   // [{type:"PROMPT", text:"What is your highlight today?"}, …]
├── isEnabled: bool
└── timestamps

RitualInstance
├── id
├── ritualId
├── userId
├── scheduledFor: datetime
├── startedAt, completedAt
├── status: enum {PENDING, IN_PROGRESS, COMPLETED, SKIPPED}
└── snapshot: JSONB         // captured state at completion (e.g., the day's plan)

ReflectionEntry
├── id
├── ritualInstanceId
├── promptKey: string       // matches a step in the Ritual template
├── body: text
├── attachedGoalId: Goal?   // optional link to a goal the reflection touches
└── createdAt
```

**Why this matters:** Sunsama bakes 4 rituals into the UI. The Primeway exposes the *concept*, lets users add custom rituals (e.g., "Friday gratitude", "Sunday vision check-in"), and stores the artefacts so the AI assistant has *real history* to summarize.

#### Removed / merged tables

| Currently | Becomes |
|---|---|
| `ThreeYearGoal`, `YearlyGoal`, `QuarterGoal`, `WeekGoal` | Single `Goal` table with `horizon` |
| `Backlog` (if exists as own table) | Removed; use `Task.day == null` |
| Separate `Habit` table | Removed; `Task.kind == HABIT` |
| `Statistics` snapshots | Computed on-the-fly from events; cache in `MetricRollup` if perf demands |

### 4.4. Computed views (not stored)

- **VisionThread(taskId)** — chain of goal IDs from the task up to the vision, used to render badges.
- **HabitStreak(taskId)** — count of consecutive matched RecurringSeries instances completed.
- **AlignmentScore(weekKey)** — % of completed `actualTime` spent on tasks linked to ≥1 goal.
- **WorkloadInfo(day)** — already specified in scheduling doc.

### 4.5. Migration strategy from current schema

| Step | Action | Risk |
|---|---|---|
| 1 | Create new `Goal` table; migrate rows from 4 separate tables with `horizon` enum | Low — pure data move |
| 2 | Add `Task.kind`, `Task.identityStatement`, `Task.goalIds` (M2M); migrate from existing `objectiveId` | Low |
| 3 | Migrate Habit rows to Task rows with `kind=HABIT` + RecurringSeries | **Medium** — must preserve streak history; build a one-time importer |
| 4 | Add `Ritual`, `RitualInstance`, `ReflectionEntry`; seed with system templates | Low |
| 5 | Drop deprecated tables behind a feature flag, then drop after 30 days | Low |

---

## 5. Scheduling Engine Design

The full technical spec already exists (see *Motor de Scheduling Inteligente — theprimeway*). This section translates it into the roadmap and highlights the *adaptations* required for The Primeway specifically.

### 5.1. Core algorithm summary (deterministic, conservative)

The engine has five algorithms, layered:

| # | Algorithm | Trigger | What it does |
|---|---|---|---|
| 1 | **Auto-Schedule** | User presses `X` on a task | Finds the first hole today that fits the task; respects calendar events, working hours, gap. Falls back to splitting or asks the user. |
| 2 | **Splitting** | Auto-Schedule can't fit the task whole | Divides the task across multiple gaps (with min-chunk and edge-case rules). |
| 3 | **Deconflict** | A session is moved/created and overlaps others | Reschedules only the displaced sessions, not the world. The user-moved one is fixed. |
| 4 | **Early-Completion Reflow** | Task is completed before its session ends | Truncates the session and shifts only the *contiguous* later group forward. |
| 5 | **Late-Timer Detector** *(Primeway extension)* | Timer starts ≥ N min after the scheduled session start | Moves the session to "now" (or asks), so the calendar reflects reality. |

### 5.2. Why this design over Motion-style optimization

Motion re-optimizes the entire day on every change. Result: the user feels they don't own their schedule. Sunsama is conservative: it only touches what is strictly necessary. This is a **trust decision**, not a technical one. We keep Sunsama's philosophy and add the late-timer detector as the *one* place where we go further (and even there, we offer OFF / PROMPT / AUTO modes).

### 5.3. Adaptations specific to The Primeway

| Adaptation | Reason |
|---|---|
| Tasks carry `goalIds[]`. The engine doesn't care, but the UI on top of it must show the vision-thread badge on every scheduled session — so when the user looks at the calendar, they see *what life-arc* each block is serving. | Reinforces the vertical bet. |
| Habits (RecurringSeries with `kind=HABIT`) are scheduled at "roughly time" if specified, otherwise auto-scheduled at start of day. | Habits must compete for time. |
| Ritual instances are pre-blocked on the calendar (e.g., 8:00–8:15 Daily Plan). They behave like fixed events for the engine. | Rituals are sacred. |
| Workload threshold respects "personal" contexts (excludes from sum). | Inherited from Sunsama; preserves work/life balance signal. |

### 5.4. Algorithmic foundations (papers / techniques worth reading)

For the team / AI agents implementing this, useful references:

- **Interval scheduling & gap computation** — classic CLRS chapter on greedy algorithms; sweep-line algorithms for overlap detection.
- **Fractional indexing** for `Task.positionInDay` — Figma's blog post "Realtime Editing of Ordered Sequences"; library `fractional-indexing` (npm).
- **Naive Bayes for short-text classification** — McCallum & Nigam (1998) "A Comparison of Event Models for Naive Bayes Text Classification"; sufficient for channel suggestion at this scale.
- **Jaro-Winkler / fuzzy similarity** for time estimation — Winkler (1990); npm `string-similarity`.
- **Command pattern with linked commands** for granular undo — GoF "Design Patterns"; the implementation in the scheduling doc (section 15) is the source of truth.
- **iCalendar RFC 5545 + RFC 7986** — must read before implementing recurring tasks and Google Calendar push.
- **CRDT note**: not needed in v1 (single-user). Relevant when we introduce multi-device offline sync (Phase 4).

### 5.5. What the engine does NOT do (intentionally)

- Predict optimal task order using ML.
- Re-arrange the day proactively based on "energy levels" or AI heuristics.
- Block calendar events.
- Move things across days without explicit user trigger.

If a future Phase wants those, they live behind a clearly labeled "Auto-pilot" toggle, OFF by default.

---

## 6. UX Redesign

### 6.1. Primary navigation

Replace the current scattered menu with **four primary surfaces** + **two ambient layers**.

```
┌──────────────────────────────────────────────────────────┐
│  Top bar:  [Today ▾]   [Compass]   [Vision]   [Library]  │  ← 4 surfaces
│  Right:    [Search]  [Capture +]  [Profile]              │
├──────────────────────────────────────────────────────────┤
│                                                          │
│                       MAIN SURFACE                       │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  Bottom dock (always present): Focus | Timer | Ritual ▸  │  ← ambient
└──────────────────────────────────────────────────────────┘
```

| Surface | Owns | Replaces |
|---|---|---|
| **Today** | The day: timeline + tasks list + focus + ritual prompts | Daily / Weekly / Backlog / All |
| **Compass** | The week: calendar + weekly objectives + workload | Weekly |
| **Vision** | The graph: 10y → 3y → 1y → Q | Vision module |
| **Library** | Habits, channels, tasks archive, smart filters | All Tasks, Habits |
| Ambient: **Focus** | Fullscreen single-task mode (toggle with `F`) | — (NEW) |
| Ambient: **Ritual** | Slide-over panel for the active ritual | — (NEW) |

**Capture (+)** is a global cmd-K-style modal: parse `30m Write blog post #writing @tomorrow` style natural language and create a task. (Akiflow-grade speed is non-negotiable.)

### 6.2. Where Rituals live

- **Daily Plan** — automatically presented at the user's chosen morning time on the *Today* surface as a slide-over. Slide-over because the user is already in their day; we don't take them somewhere else.
- **Daily Shutdown** — same surface, end-of-day slide-over. Auto-triggers at 18:00 (configurable).
- **Weekly Plan** — Sunday/Monday morning, opens *Compass* with a slide-over.
- **Weekly Review** — Friday/Sunday evening, opens *Compass* with retro prompts and visualizes the week's alignment %.
- **Quarterly / Annual Reviews** — opens *Vision* surface, time-boxed (45 min default) with structured reflection prompts that culminate in concrete updates to the goal graph.

**Design principle:** rituals never take you to a *new tab*. They are slide-overs *on the surface that owns the data they need*. This keeps the user oriented.

### 6.3. Focus Mode — flow

Focus Mode is the deepest single-task experience.

```
[User clicks 'F' on a task or session]
            │
            ▼
[Pre-flight (3s, optional)]
   "What does done look like?"  ← 1-line acceptance
   "How long do you actually need?" ← override planned time
            │
            ▼
[Fullscreen view]
   ┌─────────────────────────────────────────┐
   │  ⏱ 24:32         Goal: → Become a CTO   │
   │                                         │
   │   Task title (large)                    │
   │   ─────────────                         │
   │   Notes (markdown, editable inline)     │
   │   Subtask checklist (left side)         │
   │                                         │
   │   [Pause]  [Complete]  [Cut short]      │
   └─────────────────────────────────────────┘
            │
            ▼
[On Complete]
   "What's the smallest next step?" → adds a new task to backlog or today
   "Worth a reflection?" → optional 1-line ReflectionEntry
            │
            ▼
[Returns to previous surface, with the next session highlighted]
```

**Key constraint:** Focus Mode is single-window. No notifications. No multi-tab. If we can't keep that promise, we don't ship Focus Mode.

### 6.4. The vision-task connection (visual)

Every task surface shows a **vision-thread chip** when a task is linked to any goal:

```
[ ✦ ] Write Q2 architecture doc       30m   #engineering
       ↳ This Week → Ship platform v2 → 1y: Lead architecture
```

Hovering reveals the full chain. Clicking jumps to the goal in the *Vision* surface.

This is **the moment the user feels the vertical**. It must be present on every list, calendar block, and Focus Mode header.

### 6.5. Daily experience — login to shutdown

Detailed in section 7 below.

### 6.6. Things we explicitly remove

- The "All Tasks" tab.
- The "Backlog" tab (becomes a filter).
- The dedicated "Statistics" page (becomes embedded panels in *Compass* and the Weekly Review ritual).
- The generic AI chat (becomes scoped AI actions inside rituals + a `?` shortcut for ad-hoc questions).

### 6.7. Visual language and motion

- **Single primary color** drawn from the user's *active context* (work=blue, personal=green, etc.). Subtle but constant signal of context.
- **Time blocks animate** when the engine moves them; the animation makes the change *legible* (you see the 4 sessions slide forward 15 minutes after you complete a task early). Without animation, users miss the magic.
- **Goal chains are typographic, not iconographic.** A breadcrumb of italicised goal titles communicates the hierarchy more honestly than nested icons.

---

## 7. Execution Flow — A Day in the Life

The flow that unifies everything. This is the "promise" the product makes to the user.

### 7.1. Sunday evening — Weekly Plan

1. App opens to *Compass*. The Weekly Plan ritual triggers.
2. Step 1 — **Vision check-in**: "Look at your active 1-year goals. Anything to retire?" (free-text + buttons).
3. Step 2 — **Pick weekly objectives**: 3–5 max. Suggested from active quarterly goals.
4. Step 3 — **Pull tasks**: drag tasks from backlog or generate from objectives.
5. Step 4 — **Time-block roughly**: drag tasks onto days (no exact times yet — that's tomorrow's daily plan).
6. Output: a snapshot stored as a `RitualInstance` with the planned objectives and rough day distribution.

### 7.2. Monday 8:00 AM — Daily Plan

1. The app opens. Daily Plan slide-over appears on *Today*.
2. Step 1 — **Set today's highlight** (the one thing that, if done, makes today a win).
3. Step 2 — **Confirm tasks** for the day (auto-pulled from yesterday's rollover + Sunday's plan).
4. Step 3 — **Press `X` on each task** to auto-schedule it. Engine fits everything into the calendar respecting events and working hours.
5. Step 4 — **Workload check**: header shows total planned vs threshold. If over, the ritual prompts: "Defer something?"
6. Output: the day is now a real schedule. Ritual closes.

### 7.3. Throughout the day — execution

- User clicks a task → press `F` → **Focus Mode**.
- Timer auto-starts on entering Focus Mode (configurable).
- If the user starts the timer ≥ 15 min after the scheduled slot, the **late-timer detector** fires (PROMPT mode by default).
- On task complete: **early-completion reflow** moves contiguous tasks forward.
- Calendar event arrives mid-day (e.g., a meeting): the conflict is shown, user resolves manually (engine doesn't move things automatically when *external* changes hit).

### 7.4. 18:00 — Daily Shutdown

1. *Today* surface shows the Daily Shutdown slide-over.
2. Step 1 — **Wins**: "What got done?" (auto-filled with completed task list, user can edit).
3. Step 2 — **One thing tomorrow**: pick the highlight for tomorrow.
4. Step 3 — **Move incomplete**: click-through to roll over remaining tasks.
5. Step 4 — **Reflection prompt** (optional): "How did today feel?" — saved as ReflectionEntry.
6. Output: clean separation between work and rest. Snapshot stored.

### 7.5. Friday or Sunday — Weekly Review

1. *Compass* opens with Weekly Review slide-over.
2. Embedded statistics panel shows: alignment %, completed objectives, hours by channel, habit streaks.
3. Step 1 — **Score objectives**: per-objective slider (0–100) + 1-sentence reflection.
4. Step 2 — **What worked / what didn't**.
5. Step 3 — **Carry into next week** (tasks, learnings, new objectives).
6. Output: closes the loop. The week becomes data for the next *Vision check-in*.

### 7.6. Quarterly — Vision Review

Same shape, different surface. Opens *Vision*. User retires 1-year goals, advances quarterly objectives, edits the 3-year layer if reality has shifted.

### 7.7. The flow promise

> Open the app at any moment. You always know **what to do right now** (Focus Mode), **what is next today** (Today timeline), **how today serves this week** (badge on every task), **how this week serves the year** (Compass + Vision), and **how the year serves the life** (Vision surface). No layer is more than 2 clicks away.

---

## 8. Phased Product Roadmap

Four phases, ~9 months total to a complete v2. Each phase is shippable on its own.

> Conventions: **P0** = must-ship blocker for the phase. **P1** = ship if time. **P2** = nice-to-have.

### Phase 1 — Core Infrastructure (Months 1–2)

**Goal:** Refactor the data model and remove the deepest UX debts so future work is fast.

#### Technical tasks
- **P0** Migrate to unified `Goal` table (collapse 3Y/1Y/Q/W) with horizon enum.
- **P0** Add `Task.kind`, `Task.identityStatement`, `Task.goalIds` (M2M).
- **P0** Introduce `WorkingSession` entity (only the model; UI comes Phase 2).
- **P0** Introduce `Channel` and `Context` (with `isPersonal` flag).
- **P0** Add `UserSettings` table per scheduling spec.
- **P0** `Command` table + minimal `CommandManager` API (used by Phase 2 onward).
- **P1** `Ritual`, `RitualInstance`, `ReflectionEntry` schema (UI Phase 3).
- **P1** Working hours model.
- **P2** Telemetry events: `task_created`, `goal_linked`, `session_started`, etc. (used by Phase 4 metrics).

#### Product changes
- **P0** Remove "All Tasks" and "Backlog" tabs from nav. Implement the new top bar (Today / Compass / Vision / Library) — even if some surfaces are placeholders.
- **P0** Vision-thread chip rendered everywhere a task appears.
- **P0** Goal graph view (read-only) on Vision surface.
- **P1** Library surface with channels & filters.

#### Risks
- Migrating habits → tasks-with-kind is the hairiest data move; build a dry-run script and a rollback plan.
- Old clients pointing at deprecated endpoints — version the API or keep a 30-day shim.

### Phase 2 — Scheduling Engine (Months 3–5)

**Goal:** Ship the Sunsama-grade execution loop. After this phase, The Primeway is a credible Sunsama alternative on time.

#### Technical tasks
- **P0** Implement Auto-Schedule (sec. 4 of scheduling doc).
- **P0** Implement Splitting (sec. 5).
- **P0** Implement Deconflict (sec. 6) wired into the Command pattern for undo.
- **P0** Implement Early-Completion Reflow (sec. 7).
- **P0** Calendar OAuth + sync for Google Calendar (read events, push sessions).
- **P1** Implement Late-Timer Detector (sec. 8) with OFF / PROMPT / AUTO modes.
- **P1** Outlook calendar integration.
- **P2** Workload threshold visual + custom day thresholds.

#### Product changes
- **P0** Today surface gets the timeline view + task list + drag-drop to schedule.
- **P0** Compass surface with weekly calendar (showing sessions + events).
- **P0** Keyboard shortcuts: `X` auto-schedule, `Shift+X` no-split, `C` complete, `F` focus.
- **P0** Capture modal (cmd-K) with natural-language parsing.
- **P0** Cmd+Z undo (granular per Command pattern).
- **P1** Workload counter (3 cyclable modes) in Today header.

#### Risks
- Calendar push/pull edge cases around timezones, recurrence exceptions, declined events. Allocate 30% of the phase to test fixtures alone.
- Concurrency on session moves. Implement optimistic locking from day one; debugging it later is painful.

### Phase 3 — UX, Rituals & Focus (Months 6–7)

**Goal:** The product becomes *opinionated*. Daily and weekly rituals make the engine feel alive.

#### Technical tasks
- **P0** Ritual templates (system) + RitualInstance lifecycle + cron triggers.
- **P0** ReflectionEntry persistence + retrieval.
- **P0** Focus Mode UI (fullscreen, single-window).
- **P0** Recurring tasks (RecurringSeries materialization + special rollover).
- **P1** Habit flavor on tasks (identity statement, streak computation, "perfect week").
- **P1** Custom rituals (user-defined templates).
- **P2** ML-light: channel suggestion (Naive Bayes) and time estimation (Jaro-Winkler).

#### Product changes
- **P0** Daily Plan + Daily Shutdown + Weekly Plan + Weekly Review rituals shipped end-to-end.
- **P0** Focus Mode with pre-flight + completion prompts.
- **P0** Habits live in the Library surface, schedule on the calendar like tasks.
- **P1** Vision-aligned highlight: morning ritual asks "Which 1-year goal does today serve?" and surfaces it on the day.
- **P1** Embedded analytics panels in Compass (alignment %, channel breakdown).
- **P2** Quarterly / Annual review templates.

#### Risks
- Rituals can feel heavy if the prompts are too long. Aggressively iterate on prompt length and skip-ability.
- Focus Mode discipline on browser/desktop — must intercept tab-switching, blur notifications.

### Phase 4 — Advanced Features & Defensibility (Months 8–9+)

**Goal:** Differentiation that competitors cannot copy quickly.

#### Technical tasks
- **P1** Scoped AI actions inside rituals: "Summarize my week", "Suggest a habit for this 3-year goal", "Identify which goals are stalling".
- **P1** Slack / Linear / Notion read-only integrations (one-way capture into tasks).
- **P1** Mobile companion app (React Native, shared backend) — focus on quick capture, today view, ritual completion.
- **P2** Multi-device sync with offline support (introduce CRDTs).
- **P2** Personal API + webhooks for power users.
- **P2** Experimental: a *Vision Map* visualisation (radial graph of vision → … → today's session, computed live).

#### Product changes
- **P1** Public API + Zapier integration for capture from anywhere.
- **P1** Lifestyle tier launch with above features.
- **P2** Sharing: read-only public goal page (à la Indiehackers / 12-week year community accountability).

#### Risks
- Mobile is its own product; don't underestimate it. Allocate 6–8 weeks for a quality v1.
- AI scope creep. Hard rule: AI must always be "scoped to a ritual moment" or "explicitly invoked by user". No background AI re-arranging the schedule.

### Cross-phase: continuous

- **Performance budget**: Today surface load < 800 ms p95. Auto-schedule operation < 150 ms p95.
- **Accessibility**: WCAG AA from Phase 2 onward; full keyboard navigation as a hard requirement (Sunsama users are keyboard-first).
- **Telemetry**: weekly review of activation funnel (signup → first task → first scheduled session → first ritual completion).
- **Documentation**: every new feature ships with a 1-page "How it thinks" doc. Predictability comes from the user understanding the rules.

### Roadmap — visual summary

```
Month   1     2     3     4     5     6     7     8     9
       ┌───────────┐
P1     │ INFRA     │
       │ Data + UX │
       └───────────┘
                   ┌─────────────────┐
P2                 │ SCHEDULING      │
                   │ Engine + Sync   │
                   └─────────────────┘
                                     ┌───────────┐
P3                                   │ RITUALS   │
                                     │ + Focus   │
                                     └───────────┘
                                                 ┌───────────┐
P4                                               │ ADVANCED  │
                                                 │ AI/Mobile │
                                                 └───────────┘

Public milestones:
  ▲ End M2  — internal alpha (own team uses it)
  ▲ End M5  — closed beta (100 users, paid)
  ▲ End M7  — public launch v2
  ▲ End M9  — Lifestyle tier + mobile
```

---

## 9. Success Metrics & North Stars

### 9.1. North Star

> **Weekly active users who complete ≥ 1 ritual per week and have ≥ 60% goal-aligned execution time.**

This is the metric that proves the vertical is working: people are not just using the tool, they are using *the loop*.

### 9.2. Layered KPIs

| Layer | Metric | Target by end of Phase 3 |
|---|---|---|
| **Activation** | % new users who complete first Daily Plan in week 1 | 50% |
| **Engagement** | % WAU who complete ≥ 4 Daily Plans/week | 35% |
| **Depth** | % users with ≥ 1 active 1-year goal | 60% |
| **Loop closure** | % users completing a Weekly Review | 25% |
| **Trust** | Sessions auto-rescheduled per user per week (proxy: lower is better unless user-initiated) | < 5 unwanted reschedules / week |
| **Speed** | Median time from Capture to first scheduled session | < 30 seconds |
| **Retention** | Week-4 retention | 45% |

### 9.3. Anti-metrics (things we explicitly don't optimize)

- Total tasks created (vanity).
- Time spent in app (we want users to *finish* and leave).
- Number of integrations enabled (depth > breadth).

---

## 10. Risks, Trade-offs and Open Questions

### 10.1. Risks

| Risk | Mitigation |
|---|---|
| Users feel the vision layer is "too much" and bounce | Progressive disclosure — start with just Today + Vision (10y statement). Reveal 3y/1y/Q only if user asks. Don't force-feed OKRs. |
| Scheduling engine bugs erode trust | Granular undo from day one. Conservative defaults. Public "How it thinks" doc per algorithm. |
| Calendar sync edge cases (Outlook, ICloud, recurring exceptions) | Lock down Google first. Outlook in Phase 2 only. iCloud Phase 4. |
| Mobile is treated as an afterthought | Mobile Phase 4 only as a *companion* — quick capture, today view, ritual prompts. Don't try to ship full feature parity. |
| Pricing too aggressive for the audience | Free tier carries the vision/structure layers. Paid only for the time-engine. Users self-select. |
| AI features creep into core | Hard line: AI is invoked, never proactive (except late-timer detector with explicit toggles). |
| Migration from legacy schema breaks existing users | Dry-run scripts, rollback plan, 30-day shadow mode. |

### 10.2. Trade-offs we're making consciously

| We chose | Over | Because |
|---|---|---|
| Conservative scheduling (Sunsama style) | Aggressive optimization (Motion style) | Trust > marginal time savings |
| Vertical depth (vision → habit) | Horizontal breadth (team features) | Owns a defensible niche |
| Rituals as fixed surfaces | Generic chat assistant | Predictable beats clever |
| One Goal table with horizon | Separate tables per horizon | Multi-horizon queries become trivial |
| Habits as Tasks-with-kind | Separate Habit subsystem | Habits compete for time = real adoption |

### 10.3. Open questions to resolve before Phase 1 ends

1. **Pricing**: validate Pro at $14 and Lifestyle at $24 with 20+ user interviews.
2. **Mobile-first or desktop-first launch?** Hypothesis: desktop-first for the deep work positioning, mobile companion later. Confirm with target users.
3. **Default ritual cadence**: should Daily Plan auto-trigger on app open, or at a scheduled time? Test both.
4. **How opinionated about the 10-year vision?** Do we *force* a vision statement before unlocking anything else? Probably not, but it should be the first onboarding step.
5. **Backlog UX**: filter on a unified surface, or persistent left sidebar? Prototype both in Phase 2.
6. **Habit streaks gamification**: how far do we lean into Habitica-style motivation? Risk of feeling childish; opportunity for adoption.
7. **Team / shared visions**: out of scope for v2, but architectural decisions in Phase 1 should not preclude it (e.g., `userId` foreign keys on goals can become `ownerId` later).

---

## Appendix A — One-line summary per section (for quick reference)

1. **Vision** — Vision → daily focus block as one connected graph; the bridge is rituals.
2. **Competitive** — Own the *vertical*; match Sunsama on time, beat Notion on time, beat Habitica on coherence.
3. **Audit** — Strong hierarchy, missing time layer + ritual layer; "Backlog" and "All Tasks" tabs should die.
4. **Architecture** — Collapse 4 goal tables into one with `horizon`; tasks gain `kind` (TASK/HABIT) and `goalIds[]`.
5. **Scheduling** — Five conservative algorithms; everything undoable; one Primeway-only extension (late-timer detector).
6. **UX** — Four surfaces (Today / Compass / Vision / Library) + ambient (Focus / Ritual). Vision-thread chip everywhere.
7. **Flow** — Sunday plan → Monday plan → execute → shutdown → Friday review → quarterly vision check.
8. **Roadmap** — 4 phases × ~2 months: Infra → Scheduling → Rituals → Advanced.
9. **Metrics** — North Star: WAU completing rituals + 60%+ aligned execution time.
10. **Risks** — Trust, scope creep, migration; mitigated by conservatism, undo, and progressive disclosure.

---

## Appendix B — How an AI agent should use this doc

When implementing any feature for The Primeway:

1. Read **section 1 (Vision)** to align with the bet.
2. Read **section 4 (Architecture)** to respect the data model.
3. Read the **scheduling spec companion doc** for any algorithmic work.
4. Locate your feature in the **roadmap (section 8)** to confirm phase + priority.
5. When in doubt, default to: *conservative > aggressive*, *predictable > optimal*, *vertical > horizontal*.
6. Every new entity must have a spot in section 4. If it doesn't, propose the addition before coding.
7. Every new UI surface must justify itself within the 4 surfaces in section 6, or earn the right to become a 5th.

---

*End of roadmap. Companion document: `Motor de Scheduling Inteligente — theprimeway` for the algorithmic source of truth.*
