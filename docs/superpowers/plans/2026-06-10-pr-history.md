# PR History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add exercise-specific PR history, backed by progression read models, linked from exercise history rows and back to source sessions.

**Architecture:** `features/progression` owns PR detection and PR-history queries. UI displays query results only. PRs are derived from `SessionFinished.exerciseSummaries`/existing progression history; no new session events are needed. If exercise library is complete, grouping uses canonical exercise names at query time.

**Tech Stack:** TypeScript, React 18, Vitest, existing progress screens/routes, existing progression projection.

**Related spec:** `docs/product/feature-improvement-design-v2.md` Phase 4D.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `shared/contracts/progression.ts` | Create or extend | `ExercisePrEntry` shared read-model type |
| `shared/contracts/index.ts` | Modify | Re-export progression contracts |
| `features/progression/domain/prHistory.ts` | Create | Pure PR detection helpers |
| `features/progression/domain/prHistory.test.ts` | Create | PR replacement/warmup tests |
| `features/progression/domain/types.ts` | Modify | Add PR history state if kept in progression domain |
| `features/progression/projections/index.ts` | Modify | Build PR entries from finished sessions or progression entries |
| `features/progression/queries/index.ts` | Modify | `getPrHistoryForExercise` |
| `features/progression/contract.ts` | Modify | Export PR entry type |
| `ui/screens/progress/useExerciseHistory.ts` | Modify | Add PR history data/link target |
| `ui/screens/progress/ExerciseHistoryScreen.tsx` | Modify | Render PR section or route target |

---

## Task 1: PR history contract

**Files:**
- Create or modify: `shared/contracts/progression.ts`
- Modify: `shared/contracts/index.ts`

- [ ] **Step 1: Add PR entry type**

```ts
// shared/contracts/progression.ts
export interface ExercisePrEntry {
  exerciseName: string;
  sessionId: string;
  date: string;
  kind: 'max_weight' | 'estimated_1rm' | 'volume';
  value: number;
  weightKg?: number;
  reps?: number;
}
```

- [ ] **Step 2: Re-export**

```ts
export type { ExercisePrEntry } from './progression';
```

- [ ] **Step 3: Verify**

```
npx tsc --noEmit
```

---

## Task 2: Pure PR helpers and tests

**Files:**
- Create: `features/progression/domain/prHistory.ts`
- Create: `features/progression/domain/prHistory.test.ts`

- [ ] **Step 1: Write tests first**

Cases:
- Max-weight PR increases only when weight exceeds previous max.
- Estimated-1RM PR uses Epley estimate.
- Volume PR uses session volume.
- Warmup sets are excluded.
- Same-value repeat does not create duplicate PR.

- [ ] **Step 2: Create pure helpers**

```ts
// features/progression/domain/prHistory.ts
import type { ExercisePrEntry } from '@shared/contracts';
import type { VolumeEntry } from './types';

export function buildPrHistoryForExercise(
  exerciseName: string,
  history: VolumeEntry[],
): ExercisePrEntry[] {
  const prs: ExercisePrEntry[] = [];
  let bestWeight = 0;
  let bestOneRepMax = 0;
  let bestVolume = 0;

  for (const entry of history) {
    if (entry.maxWeightKg > bestWeight) {
      bestWeight = entry.maxWeightKg;
      prs.push({
        exerciseName,
        sessionId: entry.sessionId,
        date: entry.date,
        kind: 'max_weight',
        value: entry.maxWeightKg,
        weightKg: entry.maxWeightKg,
      });
    }
    if (entry.oneRepMaxEstimate > bestOneRepMax) {
      bestOneRepMax = entry.oneRepMaxEstimate;
      prs.push({
        exerciseName,
        sessionId: entry.sessionId,
        date: entry.date,
        kind: 'estimated_1rm',
        value: Math.round(entry.oneRepMaxEstimate * 10) / 10,
      });
    }
    if (entry.volume > bestVolume) {
      bestVolume = entry.volume;
      prs.push({
        exerciseName,
        sessionId: entry.sessionId,
        date: entry.date,
        kind: 'volume',
        value: entry.volume,
      });
    }
  }

  return prs;
}
```

- [ ] **Step 3: Run helper tests**

```
npx vitest run features/progression/domain/prHistory.test.ts
```

Expected: all tests pass.

---

## Task 3: PR query

**Files:**
- Modify: `features/progression/queries/index.ts`
- Modify: `features/progression/contract.ts`
- Modify: `features/progression/index.ts`

- [ ] **Step 1: Add query**

```ts
import { buildPrHistoryForExercise } from '../domain/prHistory';

export function getPrHistoryForExercise(exerciseName: string): ExercisePrEntry[] {
  const progression = getProgressionForExercise(exerciseName);
  if (!progression) return [];
  return buildPrHistoryForExercise(progression.exerciseName, progression.history);
}
```

- [ ] **Step 2: Use alias grouping if exercise library exists**

If `2026-06-10-exercise-library` is complete, route this through grouped/canonical progression query instead of raw exercise name.

- [ ] **Step 3: Export**

Export query and type from public surfaces.

---

## Task 4: UI integration

**Files:**
- Modify: `ui/screens/progress/useExerciseHistory.ts`
- Modify: `ui/screens/progress/ExerciseHistoryScreen.tsx`

- [ ] **Step 1: Add PR data to hook**

Read selected exercise name from existing route/selection state and call:

```ts
getPrHistoryForExercise(exerciseName)
```

- [ ] **Step 2: Link exercise history rows**

Each exercise history row should expose a PR history action/section. Use existing routing if exercise history already has a detail route; otherwise render PR history inside the current screen.

- [ ] **Step 3: Render PR list**

Display:
- date
- PR kind
- value
- source session link when route exists

- [ ] **Step 4: Empty states**

States:
- no strength sessions
- no PRs yet
- exercise not found

---

## Task 5: Verification

- [ ] `npx tsc --noEmit`
- [ ] `npx vitest run features/progression/domain/prHistory.test.ts`
- [ ] `npx vitest run`
- [ ] `npm run lint`
- [ ] `npm run build`

- [ ] Manual checks:
1. Open exercise history.
2. Open PR history for exercise with history.
3. PR rows show kind/date/value.
4. Warmup-only sessions create no PR.
5. Source session link navigates when route exists.
6. Empty state appears for no PRs.

- [ ] Rebuild graphify:

```powershell
$env:PYTHONIOENCODING='utf-8'; $env:PYTHONUTF8='1'; python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** PR history by exercise, exercise-history link, source-session link.
- [x] **Architecture:** progression owns PR logic; UI reads query data.
- [x] **Out of scope preserved:** no 1RM trend chart, no volume trend chart, no coaching insights.
- [x] **Tests planned:** PR replacement rules and warmup exclusion.
