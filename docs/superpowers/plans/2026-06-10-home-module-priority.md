# Plan: Home Screen Module Prioritization
**Date:** 2026-06-10
**Phase:** 3A
**Priority:** P1
**Status:** Ready to implement (requires Phase 2A complete)

## Problem

`DEFAULT_LAYOUT` in `useWidgetGrid.ts` shows: sleep → readiness → hrv → weather. This is an arbitrary order from early development. Weather and HRV are not daily decision drivers. The highest-value information (readiness, sleep debt, upcoming workout, recent session, load) is either absent from defaults or buried.

`HomeScreen.tsx` renders a `WelcomeWidget` above the widget grid. The widget grid starts below. There is no "next planned workout" widget and no "last workout" widget in the registry. The default set has no coaching insight slot.

## Goal

Default home layout after this plan:

1. **Readiness** — score or no-data CTA (Phase 2A implemented)
2. **Sleep** — last night + weekly trend
3. **Next workout** — upcoming appointment name, date/time, sport type; or empty state with "Plan a workout" CTA
4. **Last session** — most recent completed session (name, duration, sets/distance); or empty state
5. **Weekly volume** — one bar per day, total volume vs goal; or empty state
6. **Top insight** — first `InsightsHomeWidget` entry; hidden if no insights exist

Non-default widgets (hrv, weather, body-battery, habits, macros, calories, plan-adherence, monthly-dist) remain in registry and are add-able. They are not in the default layout.

Every module must have an empty state that explains the next action. Empty state must not imply data exists.

## Scope

- `ui/components/widgets/useWidgetGrid.ts` — `DEFAULT_LAYOUT`
- `ui/components/widgets/widgetRegistry.ts` — add `next-workout`, `last-session` entries
- New: `ui/components/widgets/NextWorkoutWidget.tsx`
- New: `ui/components/widgets/LastSessionWidget.tsx`
- `ui/screens/home/HomeScreen.tsx` — pass-through change if needed
- Empty-state audit of existing widgets in default set

Out of scope: drag/resize grid (Phase 3B), training load chart (Phase 5B), coaching rule engine (Phase 5C), `TrainingFocus` preference (Phase 12A).

---

## Implementation

### Step 1 — `NextWorkoutWidget`

File: `ui/components/widgets/NextWorkoutWidget.tsx`

Query: `useQuery<Appointment[]>('appointments_by_date')` — already available via `features/scheduling` contract.

Logic: from the appointment list, find the first appointment with `scheduledAt > Date.now()`. Display:

```
[icon: CalendarBlank]  [name or sport type]
                       [formatted date/time]
```

Empty state (no future appointments):
```
<Text size="caption" color="muted">No workout planned</Text>
<Text size="caption" color="muted">→ go to Schedule to plan one</Text>
```

Do not fabricate a "suggested workout" or default text that implies a workout exists.

Sizing: `sm` default, also available as `wide`.

Type signature to add to registry:
```ts
{ id: 'next-workout', label: 'Next Workout', defaultSize: 'sm', sizes: ['sm', 'wide'], Component: NextWorkoutWidget }
```

### Step 2 — `LastSessionWidget`

File: `ui/components/widgets/LastSessionWidget.tsx`

Query: `useQuery<TrainingDashboardView>('training_log_dashboard')` gives `totalSessions`.
For the actual last session details, query `useQuery<ActivityHistoryItem[]>('activity_history')` — take `[0]` (most recent).

Display (session exists):
```
[icon: Barbell or DirectionsRun by sport]  [session name or sport]
                                            [date] · [duration] · [sets or distance]
```

Display (no sessions logged):
```
<Text size="caption" color="muted">No sessions logged yet</Text>
<Text size="caption" color="muted">→ start a session to see it here</Text>
```

Sizing: `wide` default, also `sm`.

Type signature to add to registry:
```ts
{ id: 'last-session', label: 'Last Session', defaultSize: 'wide', sizes: ['sm', 'wide'], Component: LastSessionWidget }
```

### Step 3 — Update `DEFAULT_LAYOUT`

File: `ui/components/widgets/useWidgetGrid.ts`, `DEFAULT_LAYOUT` constant.

Replace:
```ts
const DEFAULT_LAYOUT: WidgetInstance[] = [
  { id: 'sleep',     instanceId: 'sleep',     size: 'md' },
  { id: 'readiness', instanceId: 'readiness', size: 'sm' },
  { id: 'hrv',       instanceId: 'hrv',       size: 'sm' },
  { id: 'weather',   instanceId: 'weather',   size: 'lg' },
];
```

With:
```ts
const DEFAULT_LAYOUT: WidgetInstance[] = [
  { id: 'readiness',    instanceId: 'readiness',    size: 'sm'   },
  { id: 'sleep',        instanceId: 'sleep',        size: 'md'   },
  { id: 'next-workout', instanceId: 'next-workout', size: 'wide' },
  { id: 'last-session', instanceId: 'last-session', size: 'wide' },
  { id: 'weekly-volume',instanceId: 'weekly-volume',size: 'wide' },
  { id: 'insights',     instanceId: 'insights',     size: 'wide' },
];
```

Bump `STORAGE_KEY` to `'widget-grid-v2'` so existing users get the new default on their next visit. Old `v1` key will be abandoned (no migration needed — data is only layout preference, not user content).

### Step 4 — Add entries to registry

File: `ui/components/widgets/widgetRegistry.ts`

Add after existing entries:
```ts
import { NextWorkoutWidget } from './NextWorkoutWidget';
import { LastSessionWidget } from './LastSessionWidget';
```

Add to `WIDGET_REGISTRY`:
```ts
{ id: 'next-workout', label: 'Next Workout', defaultSize: 'sm',   sizes: ['sm', 'wide'],       Component: NextWorkoutWidget },
{ id: 'last-session', label: 'Last Session',  defaultSize: 'wide', sizes: ['sm', 'wide'],       Component: LastSessionWidget },
```

### Step 5 — Empty-state audit of existing default widgets

Verify each widget in the new `DEFAULT_LAYOUT` has a no-data state that does not imply data exists.

| Widget | Query | Empty state check |
|--------|-------|-------------------|
| `readiness` (`ReadinessHomeWidget`) | `today_readiness` | Phase 2A implemented `hasEntry: false` → prompt |
| `sleep` (`SleepHomeWidget`) | `sleep_trend` | Verify shows "No sleep logged" when `weeklyTrend` is empty, not zeros or dashes |
| `next-workout` | `appointments_by_date` | New widget — empty state in Step 1 |
| `last-session` | `activity_history` | New widget — empty state in Step 2 |
| `weekly-volume` (`WeeklyVolumeHomeWidget`) | — | Verify shows empty message, not chart with all zeros |
| `insights` (`InsightsHomeWidget`) | — | Verify widget is hidden or shows "No insights yet" when no insights |

If a widget fails this check, fix its empty state as part of this plan.

---

## Acceptance Criteria

- `npx tsc --noEmit` → 0 errors
- `npx vitest run` → same pass count
- `npm run lint` → no new errors
- Fresh state (no data): readiness widget shows prompt, sleep widget shows empty message, next-workout shows "No workout planned", last-session shows "No sessions logged", weekly-volume shows empty, insights widget absent or shows placeholder
- Logged readiness: readiness widget shows real score
- Appointment scheduled: next-workout widget shows it
- Session logged: last-session widget shows it
- `DEFAULT_LAYOUT` order matches: readiness → sleep → next-workout → last-session → weekly-volume → insights
- Old `widget-grid-v1` key is not read; new key is `widget-grid-v2`
- `NextWorkoutWidget` and `LastSessionWidget` exist in registry and are add-able
- No empty state renders a placeholder number or implies data exists

## Definition of Done

All acceptance criteria pass. Home screen default layout prioritizes daily decisions in order of relevance.
