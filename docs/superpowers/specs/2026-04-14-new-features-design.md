# Feature Expansion Design — Workout App
**Date:** 2026-04-14  
**Status:** Approved (updated with feedback — v2)

---

## Overview

This spec covers the full feature expansion for the workout app. The core principle is closing the **feedback loop**:

```
User action → Data → Interpretation → Guidance → Next action
```

The app currently excels at structure, data ingestion, and visualisation. What it lacks is interpretation and guidance — turning a structured tracker into an adaptive training system.

### Feature priority tiers

**Tier 1 — Feedback loop (highest ROI)**
1. **Intelligent Coaching Layer** — interprets existing signals into actionable guidance
2. **Plan Adherence Tracking** — execution quality metric for training plans
3. **Workout Progression Engine** — progressive overload tracking for strength

**Tier 2 — Engagement anchors**
4. **Goals System** — personal goals that cross all features
5. **Habit & Routine Layer** — daily engagement beyond full workouts
6. **Tagging & Filtering** — data scalability as session history grows

**Tier 3 — Data depth**
7. **Training Plans** — week-based user-created plans with dashboard/calendar integration
8. **Analytics Depth** — GPS route maps, HR zone analysis, training load curve
9. **Recovery & Readiness Expansion** — richer readiness scoring with sleep/HRV inputs

**Tier 4 — Social & competition**
10. **Club & Competition** — leaderboards, challenges, group events (mock data)

**Tier 5 — Platform foundations**
11. **Advanced Analytics Comparisons** — week vs week, plan vs actual
12. **Notification System** — local-first reminders and insight alerts
13. **Data Export / Portability** — JSON/CSV export
14. **Exercise Library Normalisation** — canonical exercise type system
15. **Body & Health Tracking** — bodyweight/measurements log, equipment tracker

All features are local-first. Backend sync is deferred but schema-ready throughout.

---

## Approach: Infrastructure-First

Shared foundations are built before any feature UI. This prevents rework when multiple features share the same data (e.g. GPS tracks consumed by both Analytics and Training Plans) and ensures clean interfaces between features.

---

## Section 1: Shared Infrastructure

### 1A — GPS Data Layer
**File:** `data/sources/files/gps.ts`

A single parser that accepts GPX or FIT file input and normalises to a common `GpsTrack` type:

```ts
type GpsPoint = {
  lat: number;
  lng: number;
  elevation: number;
  heartRate?: number;
  cadence?: number;
  timestamp: string;
};

type GpsTrack = {
  points: GpsPoint[];
  totalDistance: number;       // metres
  elevationGain: number;       // metres
  avgHeartRate?: number;
  avgPace?: number;            // seconds per km
  avgSpeed?: number;           // km/h
  duration: number;            // seconds
};
```

No feature imports a raw GPX/FIT format directly — all GPS consumers use `GpsTrack`. Hooks into the existing Strava/Garmin import path (Phase 28) rather than creating a separate import flow.

### 1B — Training Plan Domain Model
**Module:** `features/training_plans/`

Follows the existing CQRS module structure.

**Domain types:**
```ts
type PlanDay = {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Monday
  assignment: { type: 'workout'; blueprintId: string }
            | { type: 'cardio'; activityType: ActivityType }
            | { type: 'rest' };
};

type PlanWeek = {
  weekNumber: number;
  days: PlanDay[];
};

type TrainingPlan = {
  id: string;
  name: string;
  startDate: string;           // ISO date
  durationWeeks: number;
  weeks: PlanWeek[];
  isPublic: boolean;           // schema-ready for community sharing; UI deferred
  authorId: string;
};
```

**Commands:** `CreatePlan`, `UpdatePlan`, `AssignWorkoutToDay`, `DeletePlan`  
**Events:** `PlanCreated`, `PlanUpdated`, `DayAssigned`, `PlanDeleted`  
**Projections:** `active_plan` (the currently running plan), `plan_list` (all plans)  
**Queries:** `getActivePlan()`, `getPlanList()`, `getPlanById(id)`

Week 1 structure is the template — repeating the plan copies it across all N weeks. Individual day overrides are allowed on any week after the template is set.

### 1C — Challenge & Leaderboard Event Schema
**Module:** `features/clubs/`

Extends the existing social feature with new domain types:

```ts
type Challenge = {
  id: string;
  clubId: string;
  name: string;
  metric: 'distance' | 'sessions' | 'weight_lifted' | 'elevation';
  targetValue: number;
  unit: string;
  startDate: string;
  endDate: string;
};

type LeaderboardEntry = {
  userId: string;
  displayName: string;
  value: number;
  rank: number;
};

type ClubEvent = {
  id: string;
  clubId: string;
  type: 'race' | 'group_workout' | 'challenge';
  name: string;
  date: string;
  participants: string[];      // userIds
};
```

**Commands:** `CreateChallenge`, `LogChallengeProgress`, `JoinClubEvent`, `CompleteChallenge`  
**Events:** `ChallengeCreated`, `ChallengeProgressLogged`, `ChallengeCompleted`, `ClubEventJoined`  
**Projections:** `club_leaderboard`, `active_challenges`, `club_events`

Mock data is seeded as events on first load. Backend sync replaces the seed via a data adapter — no feature code changes required.

### 1D — Session Tags
**Shared type added to:** `shared/types/session.ts`

```ts
tags: string[]; // e.g. ["race", "deload", "legs", "heavy"]
```

Tags are stored on every session event (`WorkoutLogged`, `CardioSessionLogged`). All analytics projections index tags, enabling filtered queries. No separate domain model needed — tags are a field, not a feature.

### 1E — Exercise Library Normalisation
**File:** `shared/domain/exercise.ts`

A canonical exercise type used across training logs, blueprints, and progression tracking:

```ts
type Exercise = {
  id: string;
  name: string;
  muscleGroups: MuscleGroup[];
  equipment?: 'barbell' | 'dumbbell' | 'cable' | 'bodyweight' | 'machine' | 'other';
  category: 'compound' | 'isolation' | 'cardio' | 'mobility';
};
```

Existing exercise data is normalised to reference `Exercise.id`. Enables clean analytics, progression tracking, and plan reuse across users. The exercise library already partially exists in the legacy app — this formalises it as a shared domain type rather than ad-hoc strings.

### 1F — Coaching Insight Type
**File:** `features/coaching/domain/types.ts`

```ts
type InsightType = 'warning' | 'suggestion' | 'positive';

type CoachingInsight = {
  id: string;
  type: InsightType;
  message: string;
  createdAt: string;
  relatedEntityId?: string; // planId, sessionId, exerciseId, goalId
};
```

### 1G — Goals Domain Type
**File:** `features/goals/domain/types.ts`

```ts
type GoalMetric = 'weight_lifted' | 'distance' | 'sessions' | 'strength' | 'bodyweight';

type Goal = {
  id: string;
  type: GoalMetric;
  name: string;           // e.g. "Bench press 100kg"
  target: number;
  current: number;
  unit: string;
  deadline?: string;      // ISO date
  completed: boolean;
};
```

### 1H — Habit Type
**File:** `features/habits/domain/types.ts`

```ts
type Habit = {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly';
  streak: number;
  lastCompletedDate?: string;
};
```

### 1I — Notification Type
**File:** `features/notifications/domain/types.ts`

```ts
type NotificationType = 'reminder' | 'insight' | 'achievement' | 'goal';

type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  relatedEntityId?: string;
};
```

---

## Section 2: Feature UIs

All screens follow the existing design constraints: `section.card` surfaces, CSS `gap` for spacing, zero inline styles, styleguide primitives only.

### 2A — Training Plans Screen
**File:** `ui/layouts/TrainingPlansScreen.tsx`  
**Route:** `/plans`  
**Tab:** Sub-tab within Log (alongside the session logger and blueprints)

**Plan List view:**
- `.auto-columns` grid of `.surface.interactive` cards
- Each card: plan name (`h3`), duration (`p.detail`), current week progress (`<progress>`), start date (`p.caption`)
- "New Plan" → `button.primary`

**Plan Builder view:**
- Name field: `input[type="text"]`
- Start date: `input[type="date"]`
- Duration: `input[type="number"]` (weeks)
- Weekly day grid: `.surface.grid` with 7 columns (Mon–Sun)
- Each day cell: `.tab` pattern — unassigned uses `.secondary` styling, assigned uses `.tab.active` (primary fill)
- Assignment options per day: workout blueprint (select from existing blueprints), cardio type, or rest
- Day type pills: `.pill.bg-primary` for workout, `.pill.bg-surface` for rest

**Dashboard integration:**
- "Today's Plan" card on Dashboard: `.surface.interactive`
- 7-day week strip showing day type dots or activity icons
- Tapping a day opens `DayDetailSheet` with the assigned session
- Quick-start button: `button.primary` → pre-populates Log tab with the blueprint

### 2B — Analytics Depth
**File:** `ui/layouts/AnalyticsScreen.tsx` (extended)

Three new sub-sections added to the existing Analytics tab:

**Route Map:**
- `.surface` wrapping a Leaflet map div (no API key required)
- Colour-coded polyline by pace or HR zone
- Triggered after GPS import; shows placeholder `.alert` if no GPS data

**HR Zone Breakdown:**
- Zones 1–5 computed from max HR stored in Profile (`220 - age` default, overridable)
- One `<progress>` element per zone, full width, labelled with zone name and time (`p.caption`)
- Weekly zone distribution: small Recharts `<BarChart>` inside a `.surface`

**Training Load:**
- Rolling 7-day (acute) and 28-day (chronic) load curves
- Load = session duration (minutes) × intensity factor (RPE/10 or HR zone average/5)
- Acute:chronic ratio > 1.5 flags overreaching risk via `.alert.warning`
- Rendered as Recharts `<AreaChart>` inside a `.surface`

### 2C — Club Leaderboards & Challenges
**File:** Extensions to `ui/layouts/SocialScreen.tsx` and club detail view

**Inside a club/group view — two new sub-tabs:**

Sub-tab navigation: `.tabs` + `.tab` + `.tab.active` (existing pattern)

**Leaderboard tab:**
- `.column` of `.surface` cards, one per member
- Rank number (`h3`), display name (`p`), metric value (`.detail`), metric label (`.caption`)
- Metric selector: `.tabs` strip at top (Distance / Sessions / Weight Lifted)

**Challenges tab:**
- Active and upcoming challenges as `.surface` cards
- Challenge name (`h3`), metric + target (`p.detail`), date range (`p.caption`)
- Per-participant `<progress>` bar + name label
- Countdown to end: `p.caption` styled with `--color-text-secondary`
- Join button: `button.primary`; joined state shows `button.secondary` (disabled)
- `ChallengeCompleted` event hooks into the Achievements feature automatically via event bus

### 2D — Body & Health Tracking
**File:** `ui/layouts/ProfileScreen.tsx` (extended)

New collapsible section within the Profile tab:

**Bodyweight log:**
- Quick-add: `input[type="number"]` (kg/lbs) + `input[type="date"]` + `button.primary`
- History: small Recharts `<LineChart>` inside `.surface`
- Emits `BodyweightLogged` event

**Measurements:**
- Fields: waist, chest, arms, legs — `input[type="number"]` per field
- Trend sparklines: small Recharts `<LineChart>` per measurement in a `.auto-columns` grid

**Equipment tracker:**
- `.auto-columns` grid of `.surface` cards, one per gear item
- Gear name (`h3`), type (`p.caption`), odometer (`p.detail` styled as `.value`)
- Each cardio session auto-increments assigned equipment's mileage via a policy in `features/profile/policies/equipment.ts`
- Emits `EquipmentMileageUpdated`
- Mileage exceeding retirement threshold → `.alert.warning` on the card

### 2E — Intelligent Coaching Layer
**Module:** `features/coaching/`  
**UI:** Persistent card on Dashboard + dedicated section in Analytics tab

The coaching engine consumes existing signals and produces `CoachingInsight` records via policies. It does not make decisions itself — it reads projections and emits insights.

**Policy triggers (`features/coaching/policies/generateInsights.ts`):**
- `WorkoutLogged` → check plan adherence rate, volume trends
- `CardioSessionLogged` → check training load acute:chronic ratio
- `PlanDayMissed` → emit missed-session warning
- `TrainingLoadUpdated` → check for overreaching (ratio > 1.5) or undertraining
- `GoalProgressUpdated` → check proximity to deadline

**Example insights:**
- "Your acute:chronic load ratio is 1.6 — consider a recovery day" (warning)
- "You've missed 3 planned sessions this week" (warning)
- "Zone 2 time is below aerobic base target — add one easy run" (suggestion)
- "Bench press volume up 12% this week — great consistency" (positive)
- "You're on track to hit your 100km goal with 6 days remaining" (positive)

**UI — Dashboard coaching card:**
- `.surface` card with coloured left border via `.warning` / `.primary` variant
- Icon + message text (`p`) + dismiss button (`button.ghost`)
- Shows top 1–2 unread insights; "View all" links to full list

**UI — Analytics coaching section:**
- `.column` of all recent insights, oldest dismissed first
- Filterable by type (warning / suggestion / positive) via `.tabs`

**Commands:** `DismissInsight`, `GenerateInsights`  
**Events:** `InsightGenerated`, `InsightDismissed`  
**Projections:** `active_insights` (unread), `insight_history`

### 2F — Plan Adherence Tracking
**Module:** Extension to `features/training_plans/`

**Projection added:**
```ts
type PlanAdherence = {
  planId: string;
  completed: number;
  scheduled: number;
  adherenceRate: number; // 0–100%
  currentStreak: number; // consecutive completed days
  missedDays: string[];  // ISO dates
};
```

**Events:**
- `PlannedSessionCompleted` — emitted when a session matching a plan day is logged
- `PlannedSessionSkipped` — emitted at end of day if planned session not logged

**UI additions to plan cards:**
- Adherence % badge: `.pill.bg-primary` (green tint at >80%, `.warning` below 60%)
- Weekly streak indicator: consecutive completed days shown as dots in the 7-day strip
- Missed sessions highlighted in red on the day grid

**Feeds into:** Coaching Layer (missed sessions trigger insights), Readiness scoring

### 2G — Workout Progression Engine
**Module:** `features/progression/`

Tracks per-exercise volume and strength trends for gym users — the cardio equivalent already exists via Analytics.

**Domain types:**
```ts
type VolumeEntry = {
  date: string;
  sets: number;
  reps: number;
  weight: number;
  volume: number;      // sets * reps * weight
  oneRepMaxEstimate: number; // Epley: weight * (1 + reps/30)
};

type ExerciseProgression = {
  exerciseId: string;
  history: VolumeEntry[];
  plateauDetected: boolean;  // < 2% volume increase over 3 sessions
};
```

**Queries:** `getProgressionForExercise(exerciseId)`, `getPlateauAlerts()`

**UI — Per-exercise mini chart:**
- Inside expanded session/blueprint view: small Recharts `<LineChart>` of volume over time
- Estimated 1RM trend as a secondary line
- Plateau alert: `.pill.warning` badge on the exercise name

**UI — Progression tab inside Blueprint:**
- Full-page view of all exercises in the blueprint with their volume trends
- `.auto-columns` grid of `.surface` cards, one per exercise

**Events:** `ExerciseProgressionUpdated` (computed on `WorkoutLogged`)  
**Feeds into:** Coaching Layer (plateau detection triggers suggestions), Goals (strength goals)

### 2H — Goals System
**Module:** `features/goals/`  
**UI:** Dashboard widget + dedicated section in Analytics tab

**Commands:** `CreateGoal`, `UpdateGoalProgress`, `CompleteGoal`, `DeleteGoal`  
**Events:** `GoalCreated`, `GoalProgressUpdated`, `GoalCompleted`  
**Projections:** `active_goals`, `completed_goals`

**Progress auto-updated via policies:**
- `WorkoutLogged` → update strength/sessions goals
- `CardioSessionLogged` → update distance/sessions goals
- `BodyweightLogged` → update bodyweight goals

**UI — Dashboard widget:**
- `.surface` card showing active goals as a `.column` list
- Each goal: name (`p`), `<progress>` bar, current/target (`p.caption`)
- `.pill.bg-primary` when within 10% of target; `.pill.warning` if deadline within 7 days

**UI — Analytics goals section:**
- `.auto-columns` grid of goal cards
- Completed goals collapsed below active ones
- "Add goal" → modal with goal type selector, target, and optional deadline

**Hooks into:** Achievements (goal completion unlocks achievements), Coaching (deadline proximity triggers insights), Challenges (club challenges can mirror a personal goal)

### 2I — Habit & Routine Layer
**Module:** `features/habits/`  
**UI:** Dashboard widget + dedicated section

Daily engagement layer for users not doing full sessions — stretching, mobility, step counts.

**Commands:** `CreateHabit`, `LogHabitCompletion`, `DeleteHabit`  
**Events:** `HabitCreated`, `HabitCompleted`, `HabitStreakBroken`  
**Projections:** `habits_today` (which habits are due today), `habit_streaks`

**UI — Dashboard widget:**
- `.column` of habit cards within a `.surface`
- Each habit: name (`p`), streak count (`.detail`), completion toggle (`button.icon`)
- Completed state: `.active` class on the row
- Streak milestones (7, 30, 100 days) → emit `AchievementUnlocked`

**UI — Habits management view:**
- List + "Add habit" form
- Frequency selector: `select` (daily / weekly)

**Feeds into:** Achievements (streak milestones), Coaching (broken streaks trigger insights)

### 2J — Advanced Analytics Comparisons
**Module:** Extension to `ui/layouts/AnalyticsScreen.tsx`

**Comparison views added as a new sub-tab within Analytics:**

- **Week vs week**: side-by-side volume, distance, zone distribution for any two selected weeks
- **Plan vs actual**: overlay of planned vs completed sessions for the active plan period
- **Pre/post plan**: performance metrics before and after a completed training block

**UI:**
- Week selector: two `input[type="week"]` fields
- Recharts `<BarChart>` with two data series (current / comparison) rendered side-by-side
- Plan vs actual: Recharts `<AreaChart>` with planned as a dotted line, actual as filled area

### 2K — Notification System
**Module:** `features/notifications/`  
**UI:** Bell icon in header + notification tray

Local-first — no backend required. Notifications are generated by policies and stored in the event store.

**Triggers (via policies):**
- `PlanDayMissed` → "You missed your planned session today"
- `GoalProgressUpdated` (>90% complete) → "You're almost at your goal!"
- `InsightGenerated` (type: warning) → surfaced as notification
- `AchievementUnlocked` → "New achievement unlocked"
- Daily reminder (time-based, set by user in Profile) → "Time for today's session"

**UI:**
- Header bell icon with unread count badge
- Tray: `.column` of `.surface.compact` notification cards
- Each: icon + title (`p`) + message (`p.caption`) + timestamp
- Mark all read: `button.ghost`

**Commands:** `MarkNotificationRead`, `MarkAllRead`, `SetReminderTime`  
**Events:** `NotificationCreated`, `NotificationRead`

### 2L — Data Export
**Module:** `data/services/export.ts`  
**UI:** Profile → Settings section

**Export formats:**
- **JSON**: full event store snapshot — all sessions, plans, goals, habits, bodyweight entries
- **CSV**: sessions only — date, activity, duration, distance, sets/reps, volume

**UI:**
- Two `button.secondary` buttons: "Export JSON" / "Export CSV"
- Uses browser `Blob` + `URL.createObjectURL` — no backend required
- Confirmation `.alert` shown after export completes

### 2M — Recovery & Readiness Expansion
**Module:** Extension to `features/readiness/`

Extends the existing readiness score with richer inputs:

```ts
ReadinessScore = f(
  trainingLoad,      // existing: acute:chronic ratio
  sleepQuality,      // new: manual entry (1–10 scale) or imported
  restingHR,         // new: manual entry, flagged if > 5bpm above baseline
  planAdherence,     // new: feeds from Plan Adherence projection
  hrv?               // future-ready field, not implemented yet
)
```

**New inputs UI (in Dashboard readiness card):**
- Sleep quality slider (1–10) — `input[type="range"]`
- Resting HR field — `input[type="number"]`
- "How do you feel?" quick-tap (1–5 emoji scale) → stored as subjective RPE for the day

**Readiness breakdown:**
- Expand the readiness card to show which factors are suppressing or boosting score
- Each factor as a labelled `.row.space-between` with a mini `<progress>` bar

**Events:** `SleepQualityLogged`, `RestingHRLogged`

### 2N — Session RPE & Notes (if not already stored)

RPE is already used in training load calculations. This ensures it is stored explicitly on every session:

```ts
// Added to session event payload
sessionRPE: number;  // 1–10, overall session feeling
notes?: string;      // free text
```

**UI:** At the end of session logging flow — a single "How hard was that?" slider + optional notes field. Takes <10 seconds to complete.

**Enables:** Coaching accuracy, fatigue tracking, burnout detection (sustained high RPE + declining volume = burnout signal for coaching layer)

### 2O — Deload Detection
**Module:** Extension to `features/coaching/policies/`

A dedicated policy (`detectDeload.ts`) that monitors:
- Acute:chronic load ratio trending > 1.5 for 5+ days
- Session RPE trending > 8 for 3+ consecutive sessions
- Plan adherence dropping below 60% in past 7 days

When all three align → emits a `DeloadRecommended` coaching insight:
> "You've had a high-load week with elevated RPE and some missed sessions — a deload week would help you recover and come back stronger."

**No new domain types needed** — consumes existing projections and emits a `CoachingInsight`.

---

## Section 3: Integration Points

### Training Plan → Dashboard & Calendar
- Dashboard queries `active_plan` projection → renders "Today's Plan" card with 7-day week strip
- Tapping a day opens existing `DayDetailSheet`, showing the assigned session alongside appointments
- `PlanDay` entries are translated to `ScheduledSession` objects consumed by the Scheduling feature's calendar projection — the calendar sees plan sessions the same as manual appointments (distinguished by a `source: 'plan'` field)
- No changes to the calendar UI — it reads the scheduling projection as normal

### GPS Import → Analytics
- File picker (Phase 28) pipes GPX/FIT through `data/sources/files/gps.ts` → emits `GpsTrackImported`
- Cardio feature listens for `GpsTrackImported` and enriches the cardio session record
- Analytics queries the enriched session to render route map and HR zones
- No separate import UI — hooks into the existing Strava/Garmin import path

### Challenges → Achievements
- `ChallengeCompleted` events consumed by the Achievements feature (Phase 20) via event bus
- Challenge completions automatically unlock relevant achievements — no additional wiring needed

### Training Load → Readiness
- Training load (acute/chronic ratio) added as an input signal to the existing Readiness scoring algorithm
- High acute load (ratio > 1.5) suppresses readiness score; recovered chronic baseline boosts it
- Change isolated to `features/readiness/domain/scoring.ts`

### Equipment Mileage → Cardio Sessions
- Policy in `features/profile/policies/equipment.ts` listens for `CardioSessionLogged`
- Reads session distance, emits `EquipmentMileageUpdated` for the assigned equipment item
- Profile screen reads updated mileage from equipment projection

### Coaching → Everything
The coaching layer is a **read-only consumer** — it never writes to other features' stores. It reads projections (`active_plan`, `plan_adherence`, `training_load`, `active_goals`, `habit_streaks`, `exercise_progression`) and emits `InsightGenerated` events into its own projection. Other features remain unaware of coaching.

### Goals → Achievements → Notifications
`GoalCompleted` → `AchievementUnlocked` → `NotificationCreated`. Each step is triggered by the previous event via the event bus. No feature imports from another — they communicate only through events.

### Progression Engine → Coaching
`ExerciseProgressionUpdated` with `plateauDetected: true` → coaching policy emits plateau suggestion insight. The coaching layer reads the progression projection directly — no tight coupling.

### Habits → Dashboard
The Dashboard queries `habits_today` projection — the same pattern as "Today's Plan". Both surface in the same daily overview area, ordered by time of day if a preferred time is set on the habit.

### Tags → Analytics
All analytics queries accept an optional `tags` filter parameter. The projection layer indexes sessions by tag at write time — no performance cost at query time. Enables "show me only my deload sessions" or "compare leg day vs upper day volume".

### Session RPE → Coaching + Readiness
`sessionRPE` stored on every session event. Coaching policy reads RPE trends. Readiness scoring uses it as a daily subjective wellness signal. No separate event needed — it's part of the session payload.

### Notifications → Header UI
The `active_insights` and `notifications` projections are both read by the header component. Unread count = sum of unread notifications. The bell icon is the single entry point — no per-feature notification chrome needed.

### Mock → Real Backend
- All projections write to ViewStore / IndexedDB (existing pattern)
- Leaderboard and challenge data seeded as mock events on first load
- Backend connection: replace seed with a remote fetch via a data adapter — zero feature code changes

---

## Section 4: Styleguide Compliance

All new UI components use existing styleguide primitives only. Key mappings:

| UI Element | Styleguide Class |
|---|---|
| Screen-level cards | `.surface` |
| Clickable cards | `.surface.interactive` |
| Card grids | `.auto-columns` |
| Horizontal layouts | `.row`, `.row.space-between`, `.row.align-center` |
| Vertical layouts | `.column` |
| Sub-tab navigation | `.tabs` + `.tab` + `.tab.active` |
| Progress bars | `<progress>` (native, already styled) |
| Status pills | `.pill` + `.bg-primary` / `.bg-surface` |
| Warning states | `.alert.warning` or `.warning` class |
| Secondary text | `p.caption`, `p.detail` |
| Form inputs | Native `input[type="*"]` (already styled) |
| Primary actions | `button.primary` |
| Secondary actions | `button.secondary` |
| Destructive/ghost | `button.ghost`, `button.warning` |

**Spacing:** All sibling gaps via `gap` on parent `.row` / `.column`. `--spacing-3` (8px) within cards, `--spacing-4` (16px) between cards. Zero `margin` between siblings.

---

## Section 5: Out of Scope (Deferred)

| Feature | Deferred reason | Schema-ready? |
|---|---|---|
| Community plan templates | Needs backend + moderation | Yes — `isPublic`, `authorId` fields exist |
| Pre-built plan library | Deferred to after community backend | No |
| Live GPS recording | Requires background geolocation service | No |
| Real leaderboard sync | Backend not connected yet | Yes — adapter slot reserved |
| Wearable real-time sync | Separate integration design needed | No |
| Nutrition + workout correlation | Needs both features fully implemented first | No |

---

## New Feature Modules Summary

### New modules
| Module | Path | Priority tier |
|---|---|---|
| Coaching | `features/coaching/` | Tier 1 |
| Goals | `features/goals/` | Tier 2 |
| Habits | `features/habits/` | Tier 2 |
| Progression | `features/progression/` | Tier 1 |
| Notifications | `features/notifications/` | Tier 3 |
| Training Plans | `features/training_plans/` | Tier 3 |
| Clubs | `features/clubs/` | Tier 4 |

### New shared infrastructure
| Type | Path |
|---|---|
| GPS Data Layer | `data/sources/files/gps.ts` |
| Exercise Library | `shared/domain/exercise.ts` |
| Session tags | `shared/types/session.ts` (field addition) |
| Data export service | `data/services/export.ts` |

### Extensions to existing modules
| What | Path |
|---|---|
| Plan adherence projection | `features/training_plans/projections/adherence.ts` |
| Readiness scoring inputs | `features/readiness/domain/scoring.ts` |
| Analytics comparisons | `ui/layouts/AnalyticsScreen.tsx` |
| Body tracking | `features/profile/` |
| Equipment policy | `features/profile/policies/equipment.ts` |
| Training Plans screen | `ui/layouts/TrainingPlansScreen.tsx` (new) |
