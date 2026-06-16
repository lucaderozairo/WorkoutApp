# Estimated 1RM Trend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an exercise-specific estimated 1RM trend chart backed by progression query data.

**Architecture:** `features/progression` already computes `oneRepMaxEstimate` in `VolumeEntry`. This plan exposes those values as trend points through a query and renders them in the existing exercise history/progress surface. React components must not recompute 1RM from raw sets.

**Tech Stack:** TypeScript, React 18, Vitest, existing progress screen chart patterns.

**Related spec:** `docs/product/feature-improvement-design-v2.md` Phase 4D.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `shared/contracts/progression.ts` | Create or extend | `ExerciseOneRepMaxTrendPoint` |
| `shared/contracts/index.ts` | Modify | Re-export progression contracts |
| `features/progression/domain/oneRepMaxTrend.ts` | Create | Pure trend helper |
| `features/progression/domain/oneRepMaxTrend.test.ts` | Create | Formula/order tests |
| `features/progression/queries/index.ts` | Modify | `getOneRepMaxTrendForExercise` |
| `features/progression/contract.ts` | Modify | Export trend type |
| `ui/screens/progress/useExerciseHistory.ts` | Modify | Read trend query |
| `ui/screens/progress/ExerciseHistoryScreen.tsx` | Modify | Render chart and empty states |

---

## Task 1: Trend contract

**Files:**
- Create or modify: `shared/contracts/progression.ts`
- Modify: `shared/contracts/index.ts`

- [ ] **Step 1: Add type**

```ts
export interface ExerciseOneRepMaxTrendPoint {
  exerciseName: string;
  sessionId: string;
  date: string;
  estimatedOneRepMax: number;
  weightKg: number;
  reps: number;
}
```

- [ ] **Step 2: Re-export**

```ts
export type { ExerciseOneRepMaxTrendPoint } from './progression';
```

---

## Task 2: Pure trend helper and tests

**Files:**
- Create: `features/progression/domain/oneRepMaxTrend.ts`
- Create: `features/progression/domain/oneRepMaxTrend.test.ts`

- [ ] **Step 1: Write tests first**

Cases:
- Maps progression history to trend points.
- Sorts oldest to newest.
- Rounds estimated 1RM to one decimal.
- Excludes entries with zero estimated 1RM.

- [ ] **Step 2: Create helper**

```ts
// features/progression/domain/oneRepMaxTrend.ts
import type { ExerciseOneRepMaxTrendPoint } from '@shared/contracts';
import type { ExerciseProgression } from './types';

export function buildOneRepMaxTrend(
  progression: ExerciseProgression | null,
): ExerciseOneRepMaxTrendPoint[] {
  if (!progression) return [];
  return progression.history
    .filter(entry => entry.oneRepMaxEstimate > 0)
    .map(entry => {
      const bestIndex = entry.setWeights.reduce((best, weight, index) => {
        const currentEstimate = weight * (1 + (entry.setReps[index] ?? 0) / 30);
        const bestEstimate = entry.setWeights[best] * (1 + (entry.setReps[best] ?? 0) / 30);
        return currentEstimate > bestEstimate ? index : best;
      }, 0);
      return {
        exerciseName: progression.exerciseName,
        sessionId: entry.sessionId,
        date: entry.date,
        estimatedOneRepMax: Math.round(entry.oneRepMaxEstimate * 10) / 10,
        weightKg: entry.setWeights[bestIndex] ?? 0,
        reps: entry.setReps[bestIndex] ?? 0,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}
```

- [ ] **Step 3: Run tests**

```
npx vitest run features/progression/domain/oneRepMaxTrend.test.ts
```

---

## Task 3: Query and exports

**Files:**
- Modify: `features/progression/queries/index.ts`
- Modify: `features/progression/contract.ts`
- Modify: `features/progression/index.ts`

- [ ] **Step 1: Add query**

```ts
import { buildOneRepMaxTrend } from '../domain/oneRepMaxTrend';

export function getOneRepMaxTrendForExercise(exerciseName: string) {
  return buildOneRepMaxTrend(getProgressionForExercise(exerciseName));
}
```

- [ ] **Step 2: Use canonical grouping if exercise library is complete**

If alias grouping exists, use grouped/canonical progression for the selected exercise.

- [ ] **Step 3: Export type/query**

Public surfaces expose `ExerciseOneRepMaxTrendPoint` and `getOneRepMaxTrendForExercise`.

---

## Task 4: UI chart

**Files:**
- Modify: `ui/screens/progress/useExerciseHistory.ts`
- Modify: `ui/screens/progress/ExerciseHistoryScreen.tsx`

- [ ] **Step 1: Add trend data to hook**

Return:

```ts
oneRepMaxTrend: getOneRepMaxTrendForExercise(exerciseName)
```

- [ ] **Step 2: Render chart**

Use existing progress chart components/patterns. X axis = date. Y axis = `estimatedOneRepMax`.

- [ ] **Step 3: Add point details**

Tooltip or row detail shows:
- estimated 1RM
- source weight
- reps
- session link when route exists

- [ ] **Step 4: Add empty states**

States:
- no strength history
- insufficient 1RM trend data

---

## Task 5: Verification

- [ ] `npx tsc --noEmit`
- [ ] `npx vitest run features/progression/domain/oneRepMaxTrend.test.ts`
- [ ] `npx vitest run`
- [ ] `npm run lint`
- [ ] `npm run build`

- [ ] Manual checks:
1. Exercise with 2+ history points shows chart.
2. Warmup-only data does not produce trend.
3. Chart uses query data, not component scans.
4. Mobile chart remains readable.
5. Empty state appears for insufficient data.

- [ ] Rebuild graphify:

```powershell
$env:PYTHONIOENCODING='utf-8'; $env:PYTHONUTF8='1'; python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** estimated 1RM trend by exercise, chart, source session metadata.
- [x] **Architecture:** progression query owns data; UI renders only.
- [x] **Out of scope preserved:** no PR detail list, no volume chart, no load/coaching logic.
- [x] **Tests planned:** formula, ordering, zero exclusion.
