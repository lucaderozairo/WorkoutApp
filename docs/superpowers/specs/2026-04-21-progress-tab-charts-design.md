# Progress Tab: Mock Activities + Charts Design

**Date:** 2026-04-21  
**Status:** Approved

---

## Overview

Add mock activity data and visualisations to the Progress tab. The exercise scatter chart may later move to an Analytics screen — the component is designed to be portable.

---

## 1. Mock Data (`data/mock/`)

### `data/mock/sessions.ts`

**`MOCK_SESSION_HISTORY: SessionHistoryItem[]`**  
~12 lift sessions spread across 3 months (Jan–Mar). Each entry satisfies the `SessionHistoryItem` type from `features/training_log`. Fields: `id`, `name`, `startedAt`, `finishedAt`, `durationSeconds`, `totalSets`, `exerciseCount`, `hasPR`, `category: 'strength'`.

**`MOCK_EXERCISE_SETS`**  
A `Record<string, { date: number; sets: { weightKg: number; reps: number; isWarmup: boolean; failed?: boolean }[] }[]>`.  
Exercises: Squat, Bench Press, Deadlift, Overhead Press. Each has ~12 entries over 3 months showing progressive overload. Warmup sets (1–2 per session) at ~60% of working weight.

### `data/mock/cardio.ts`

**`MOCK_CARDIO_SESSIONS: CardioSession[]`**  
Built with `generateMockRun()`. ~8 runs (5–12 km), 4 cycles (20–40 km), 2 rows (5–8 km). Sessions span Jan–Mar with realistic dates. Satisfies the `CardioSession` type from `features/cardio`.

### Seeding (`app/entrypoints/index.tsx`)

After the persisted-key hydration loop, seed the viewStore if the keys are empty (don't overwrite real user data):

```ts
import { MOCK_SESSION_HISTORY } from '@data/mock/sessions';
import { MOCK_CARDIO_SESSIONS } from '@data/mock/cardio';

if (!viewStore.get('session_history')) {
  viewStore.set('session_history', MOCK_SESSION_HISTORY);
}
if (!viewStore.get('recent_cardio_sessions')) {
  viewStore.set('recent_cardio_sessions', { sessions: MOCK_CARDIO_SESSIONS });
}
```

---

## 2. `ExerciseProgressChart` (new, `ui/components/Charts.tsx`)

**Props:**
```ts
interface ExerciseSetPoint {
  date: number;
  weightKg: number;
  reps: number;
  isWarmup: boolean;
  failed?: boolean;
}

interface ExerciseProgressChartProps {
  data: { date: number; sets: { weightKg: number; reps: number; isWarmup: boolean; failed?: boolean }[] }[];
  id: string;
}
```

**Implementation (Recharts `ScatterChart`):**

- X-axis: numeric timestamp, formatted as `DD Mon`. Domain spans first → last date with padding.
- Y-axis: weight in kg, domain `[0, maxWeight + 10]`, ticks at 20 kg intervals.
- Grid: dashed horizontal lines (minor every 10 kg, major every 20 kg) via `ReferenceLine`. Match `#E5E5EA` with opacity as in the provided SVG.
- **Jitter:** sets on the same day are offset horizontally by `setIndex * DAY_OFFSET_MS` (small constant, ~6h in ms) so dots don't overlap.
- **Warmup series** (`Scatter`): orange (`var(--color-run)`), `r=3`, `fillOpacity=0.65`, white stroke width 1.
- **Working series** (`Scatter`): red (`var(--color-warning)`), `r=4`, `fillOpacity=1`, white stroke width 1.
- **Failed sets:** rendered as an X (two crossing `<line>` elements) instead of a circle, same red.
- **Trend line:** a `Line` (or second `Scatter` with `line=true`) connecting the max working-set weight per session date. Stroke red, `strokeOpacity=0.3`, `strokeDasharray="none"`, `strokeWidth=1.5`. No dots on the trend line itself.
- Height: 260px, responsive width.
- No legend. No tooltip (keep it simple for v1; can add later).

---

## 3. ProgressScreen Layout Changes (`ui/layouts/ProgressScreen.tsx`)

### Lift section (`filter === 'all' || filter === 'lift'`)

Insert between the stats row and the session cards:

1. **Exercise dropdown** — a `<select>` element listing `Object.keys(MOCK_EXERCISE_SETS)`. State: `const [selectedExercise, setSelectedExercise]`. Defaults to first key.
2. **`ExerciseProgressChart`** — receives `data={MOCK_EXERCISE_SETS[selectedExercise]}` and `id="exercise-progress"`.
3. **Weekly volume bar** — uses the existing `TrainingLoadChart` component. Derive data: group `MOCK_SESSION_HISTORY` by ISO week, sum `totalSets` per week. Pass as `series: DailyLoad[]` (one entry per week, `date` = ISO week-start string e.g. `'2026-01-06'`, `load` = total sets). `DailyLoad` is `{ date: string; load: number }`.

### Each cardio sport section

Insert between the stats row and the session cards:

- **Monthly km sparkline** — `SparklineArea` (existing). Derive data: group `MOCK_CARDIO_SESSIONS` for that sport by `YYYY-MM`, sum `distanceMeters / 1000`. Pass as `data={[{x: 'Jan', y: 12.3}, ...]}`. Color matches sport color var. Height 50, `id={sport + '-monthly-km'}`.

---

## 4. No New Files

All chart additions go into existing `ui/components/Charts.tsx`. Layout changes are confined to `ui/layouts/ProgressScreen.tsx`. Mock data files are new but contained in `data/mock/`.

---

## 5. Out of Scope

- Tooltip on `ExerciseProgressChart` (can add later)
- Real data wiring (all mock for now)
- Moving chart to Analytics screen (noted as future work)
