# Exercise Volume Trend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a per-exercise volume trend chart so users can see whether work for a lift is rising, flat, or falling.

**Architecture:** `features/progression` already stores per-exercise `VolumeEntry` data. This plan exposes trend points through a query and renders them in the existing exercise history/progress surface. Warmups remain excluded because progression volume already excludes warmup sets.

**Tech Stack:** TypeScript, React 18, Vitest, existing progress chart patterns.

**Related spec:** `docs/product/feature-improvement-design-v2.md` Phase 4D.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `shared/contracts/progression.ts` | Create or extend | `ExerciseVolumeTrendPoint` |
| `shared/contracts/index.ts` | Modify | Re-export progression contracts |
| `features/progression/domain/volumeTrend.ts` | Create | Pure volume trend helper |
| `features/progression/domain/volumeTrend.test.ts` | Create | Volume/order/warmup-exclusion tests |
| `features/progression/queries/index.ts` | Modify | `getVolumeTrendForExercise` |
| `features/progression/contract.ts` | Modify | Export trend type |
| `ui/screens/progress/useExerciseHistory.ts` | Modify | Read volume trend query |
| `ui/screens/progress/ExerciseHistoryScreen.tsx` | Modify | Render chart and empty states |

---

## Task 1: Volume trend contract

**Files:**
- Create or modify: `shared/contracts/progression.ts`
- Modify: `shared/contracts/index.ts`

- [ ] **Step 1: Add type**

```ts
export interface ExerciseVolumeTrendPoint {
  exerciseName: string;
  sessionId: string;
  date: string;
  volume: number;
  sets: number;
  totalReps: number;
  maxWeightKg: number;
}
```

- [ ] **Step 2: Re-export**

```ts
export type { ExerciseVolumeTrendPoint } from './progression';
```

---

## Task 2: Pure volume helper and tests

**Files:**
- Create: `features/progression/domain/volumeTrend.ts`
- Create: `features/progression/domain/volumeTrend.test.ts`

- [ ] **Step 1: Write tests first**

Cases:
- Maps progression history to volume trend points.
- Sorts oldest to newest.
- Excludes zero-set entries.
- Preserves volume, sets, reps, and max weight.

- [ ] **Step 2: Create helper**

```ts
// features/progression/domain/volumeTrend.ts
import type { ExerciseVolumeTrendPoint } from '@shared/contracts';
import type { ExerciseProgression } from './types';

export function buildVolumeTrend(
  progression: ExerciseProgression | null,
): ExerciseVolumeTrendPoint[] {
  if (!progression) return [];
  return progression.history
    .filter(entry => entry.sets > 0)
    .map(entry => ({
      exerciseName: progression.exerciseName,
      sessionId: entry.sessionId,
      date: entry.date,
      volume: entry.volume,
      sets: entry.sets,
      totalReps: entry.totalReps,
      maxWeightKg: entry.maxWeightKg,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
```

- [ ] **Step 3: Run tests**

```
npx vitest run features/progression/domain/volumeTrend.test.ts
```

---

## Task 3: Query and exports

**Files:**
- Modify: `features/progression/queries/index.ts`
- Modify: `features/progression/contract.ts`
- Modify: `features/progression/index.ts`

- [ ] **Step 1: Add query**

```ts
import { buildVolumeTrend } from '../domain/volumeTrend';

export function getVolumeTrendForExercise(exerciseName: string) {
  return buildVolumeTrend(getProgressionForExercise(exerciseName));
}
```

- [ ] **Step 2: Use canonical grouping if exercise library is complete**

If alias grouping exists, use grouped/canonical progression for the selected exercise.

- [ ] **Step 3: Export type/query**

Public surfaces expose `ExerciseVolumeTrendPoint` and `getVolumeTrendForExercise`.

---

## Task 4: UI chart

**Files:**
- Modify: `ui/screens/progress/useExerciseHistory.ts`
- Modify: `ui/screens/progress/ExerciseHistoryScreen.tsx`

- [ ] **Step 1: Add trend data to hook**

Return:

```ts
volumeTrend: getVolumeTrendForExercise(exerciseName)
```

- [ ] **Step 2: Render chart**

Use existing progress chart patterns. X axis = date. Y axis = `volume`.

- [ ] **Step 3: Add point details**

Tooltip or detail row shows:
- volume
- sets
- total reps
- max weight
- source session link when route exists

- [ ] **Step 4: Add empty states**

States:
- no strength history
- insufficient volume trend data

---

## Task 5: Verification

- [ ] `npx tsc --noEmit`
- [ ] `npx vitest run features/progression/domain/volumeTrend.test.ts`
- [ ] `npx vitest run`
- [ ] `npm run lint`
- [ ] `npm run build`

- [ ] Manual checks:
1. Exercise with 2+ history points shows chart.
2. Warmups do not affect volume.
3. Trend points are ordered by date.
4. Point detail links to source session when route exists.
5. Mobile chart remains readable.
6. Empty state appears for insufficient data.

- [ ] Rebuild graphify:

```powershell
$env:PYTHONIOENCODING='utf-8'; $env:PYTHONUTF8='1'; python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** exercise volume trend, chart, source session details.
- [x] **Architecture:** progression query owns data; UI renders only.
- [x] **Out of scope preserved:** no training load, no coaching, no muscle targets.
- [x] **Tests planned:** volume formula, ordering, zero-set/warmup behavior.
