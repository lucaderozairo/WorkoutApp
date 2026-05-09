# Activity Planning (Spec 3) — Design

## Goal

Allow users to plan a future gym session or cardio activity (run, cycle, swim) from the Workout tab, with the plan surfacing in both the Workout tab and the Schedule screen.

## Architecture

A four-step wizard modal/screen with type-adaptive step 2. Gym planning uses an exercise picker. Cardio planning uses a Leaflet map for route drawing or saved-route selection, plus target pace and auto-calculated distance markers. All plans are stored as `PlannedSession` domain objects and displayed in the existing Workout history list and Schedule screen.

**Tech stack:** React + TypeScript, Leaflet.js (already installed), `@ui/bindings` (useQuery/useCommand), feature-based architecture, CSS modules via existing design tokens.

---

## Entry Point

A **"Plan"** button added to the Workout tab header alongside the existing "Start now" button. Tapping it opens the planning wizard (step 1).

```
[ ▶ Start now ]   [ 📋 Plan ]
```

---

## Wizard Steps

### Step 1 — Choose type

Four options displayed as tappable cards:
- 🏋️ **Gym session** — "Exercises, sets & reps"
- 🏃 **Run** — "Route, pace & markers"
- 🚴 **Cycle** — "Route, pace & markers"
- 🏊 **Swim** — "Distance & pace"

Selecting a type advances to step 2.

### Step 2 — Configure (type-adaptive)

**Step 2a — Gym session:**
- Session name text input (e.g. "Push Day")
- Exercise list: each entry shows name, sets × reps, weight
- Inline edit of sets/reps/weight on tap
- "+ Add exercise" button opens an exercise search/picker
- "Next →" advances to step 3

**Step 2b — Run / Cycle:**
- Route toggle: **Draw route** | **Saved routes**
  - *Draw route:* Leaflet map; tap to place waypoints; polyline auto-drawn; distance auto-calculated from waypoint geodesics
  - *Saved routes:* scrollable list of previously saved/completed routes to select
- Target pace input (min/km)
- Auto-calculated distance markers table (read-only):
  - Run/Swim: every 1 km
  - Cycle: every 5 km
  - Formula: `markerTime = distanceKm × paceMinPerKm` formatted as MM:SS
- "Next →" advances to step 3

**Step 2c — Swim:**
- No map; pool-based
- Pool length selector (25m / 50m)
- Target distance input (metres)
- Target pace input (min/100m)
- Auto-calculated distance markers table (every 100m)
- "Next →" advances to step 3

### Step 3 — Schedule

- Date picker (native date input or calendar component)
- Time picker (HH:MM)
- Notes textarea (optional, max 300 chars)
- "Next →" advances to step 4

### Step 4 — Review & Save

Read-only summary card:
- Activity type + emoji
- Session/route name
- Date, time
- Gym: exercise count summary; Cardio: distance, pace, estimated duration
- Distance markers preview (first and last)
- **"Save plan"** button — commits the `PlannedSession` and navigates back to Workout tab

After save, a brief confirmation ("Plan saved — see you Thursday!") is shown, then the wizard dismisses.

---

## Data Model

```typescript
type ActivityType = 'gym' | 'run' | 'cycle' | 'swim';

interface PlannedExercise {
  name: string;
  sets: number;
  reps: number;
  weightKg: number;
}

interface DistanceMarker {
  distanceKm: number;
  cumulativeTime: string; // "MM:SS"
}

interface PlannedSession {
  id: string;
  type: ActivityType;
  name: string;
  scheduledAt: number; // Unix ms
  notes?: string;

  // Gym only
  exercises?: PlannedExercise[];

  // Cardio only
  routeWaypoints?: [number, number][]; // [lat, lng] pairs
  targetPaceMinPerKm?: number;
  distanceKm?: number;
  distanceMarkers?: DistanceMarker[];

  // Swim only
  poolLengthM?: number;
  targetDistanceM?: number;
  targetPaceMinPer100m?: number;
}
```

Plans are stored via `useCommand('plan_session', payload)` and retrieved via `useQuery<PlannedSession[]>('planned_sessions')`.

---

## Where Plans Appear

1. **Workout tab** — new "Upcoming" section above "Recent sessions", showing planned sessions sorted by `scheduledAt` ascending.
2. **Schedule screen** — planned sessions rendered on their scheduled date (in addition to any logged sessions).

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `features/workout/planning/types.ts` | Create | `PlannedSession`, `PlannedExercise`, `DistanceMarker` types |
| `features/workout/planning/planningCommands.ts` | Create | `plan_session` command handler, in-memory store |
| `features/workout/planning/planningQueries.ts` | Create | `planned_sessions` query projection |
| `features/workout/planning/index.ts` | Create | Barrel export + registration call |
| `ui/components/workout/PlanWizard.tsx` | Create | Four-step wizard shell (state machine: step 0–4) |
| `ui/components/workout/wizard/StepType.tsx` | Create | Step 1 — type selector cards |
| `ui/components/workout/wizard/StepGym.tsx` | Create | Step 2a — exercise list + picker |
| `ui/components/workout/wizard/StepCardio.tsx` | Create | Step 2b — map + pace + markers |
| `ui/components/workout/wizard/StepSwim.tsx` | Create | Step 2c — pool distance + pace + markers |
| `ui/components/workout/wizard/StepSchedule.tsx` | Create | Step 3 — date/time/notes |
| `ui/components/workout/wizard/StepReview.tsx` | Create | Step 4 — summary + save |
| `ui/components/workout/wizard/ExercisePicker.tsx` | Create | Search + pick exercise by name |
| `ui/components/workout/wizard/RouteMap.tsx` | Create | Leaflet map with waypoint editing |
| `ui/components/workout/UpcomingPlans.tsx` | Create | Upcoming sessions list for Workout tab |
| `ui/layouts/WorkoutScreen.tsx` | Modify | Add Plan button + UpcomingPlans section |
| `ui/layouts/ScheduleScreen.tsx` | Modify | Render planned sessions alongside logged sessions |
| `styling/wizard.css` | Create | Wizard layout, step indicators, map container |
| `app/registry/App.tsx` | Modify | Call planning registration on startup |

---

## CSS Conventions

- Zero inline `style=""` attributes
- Spacing between siblings via `gap` on parent
- Map container is a fixed-height `div` (`--map-h: 240px` on mobile, `320px` on desktop)
- Step indicator: horizontal row of 4 dots; active dot is accent-coloured
- Wizard renders as a full-screen overlay on mobile, centred modal (max-width 480px) on desktop

---

## Constraints & Notes

- Leaflet `L.map` is initialized in a `useEffect` on `RouteMap` mount; ref used to avoid re-initialization
- Distance calculation: Haversine formula between consecutive waypoints
- Pace input stored as fractional minutes (e.g. 5.5 = 5:30/km); formatted to MM:SS for display
- Saved routes list is sourced from past completed cardio sessions (those that have `routeWaypoints`)
- No live tracking in this spec (that's Spec 4)
- No backend — all state is in-memory via command/query binding layer
