# Exercise Library Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce a shared exercise-library vocabulary so picker search and progress grouping can use canonical names, aliases, muscles, and movement patterns without rewriting historical session events.

**Architecture:** `shared/contracts/exercises.ts` defines the cross-feature exercise-library shape. A small adapter/query wraps `data/static/exercises.ts` so feature/UI code does not import static data directly. Progression grouping normalizes exercise names at read time; old events remain unchanged.

**Tech Stack:** TypeScript, React 18, Vitest, existing exercise picker/session UI, existing progression queries.

**Related spec:** `docs/product/feature-improvement-design-v2.md` Phase 4C.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `shared/contracts/exercises.ts` | Create | `ExerciseLibraryEntry`, `MovementPattern` |
| `shared/contracts/index.ts` | Modify | Re-export exercise contracts |
| `features/exercise_library/domain/search.ts` | Create | Pure search and normalization helpers |
| `features/exercise_library/domain/search.test.ts` | Create | Search/alias tests |
| `features/exercise_library/queries/index.ts` | Create | Library reads wrapping static exercise data |
| `features/exercise_library/contract.ts` | Create | Public type contract |
| `features/exercise_library/index.ts` | Create | Public exports |
| `ui/components/exercise/ExercisePicker.tsx` or current picker file | Modify | Use exercise-library search |
| `features/progression/queries/index.ts` | Modify | Add alias-aware progression grouping query |
| `ui/screens/progress/useExerciseHistory.ts` | Modify | Use canonical grouping query |

---

## Task 1: Shared exercise-library contract

**Files:**
- Create: `shared/contracts/exercises.ts`
- Modify: `shared/contracts/index.ts`

- [ ] **Step 1: Create contract**

```ts
// shared/contracts/exercises.ts
export type MovementPattern =
  | 'squat'
  | 'hinge'
  | 'push'
  | 'pull'
  | 'carry'
  | 'lunge'
  | 'rotation'
  | 'isolation'
  | 'cardio'
  | 'mobility';

export interface ExerciseLibraryEntry {
  id: string;
  name: string;
  aliases: string[];
  primaryMuscles: string[];
  movementPattern: MovementPattern;
}
```

- [ ] **Step 2: Re-export**

```ts
export type { ExerciseLibraryEntry, MovementPattern } from './exercises';
```

- [ ] **Step 3: Verify**

```
npx tsc --noEmit
```

---

## Task 2: Exercise library feature shell

**Files:**
- Create: `features/exercise_library/domain/search.ts`
- Create: `features/exercise_library/domain/search.test.ts`
- Create: `features/exercise_library/queries/index.ts`
- Create: `features/exercise_library/contract.ts`
- Create: `features/exercise_library/index.ts`

- [ ] **Step 1: Write search tests first**

Cases:
- Finds by canonical name.
- Finds by alias.
- Finds by primary muscle.
- Finds by movement pattern.
- Normalizes alias to canonical entry.
- Returns empty array for no match.

- [ ] **Step 2: Create pure search helpers**

```ts
// features/exercise_library/domain/search.ts
import type { ExerciseLibraryEntry } from '@shared/contracts';

export function normalizeExerciseName(value: string): string {
  return value.trim().toLowerCase();
}

export function findCanonicalExercise(
  entries: ExerciseLibraryEntry[],
  exerciseName: string,
): ExerciseLibraryEntry | null {
  const normalized = normalizeExerciseName(exerciseName);
  return entries.find(entry =>
    normalizeExerciseName(entry.name) === normalized ||
    entry.aliases.some(alias => normalizeExerciseName(alias) === normalized)
  ) ?? null;
}

export function searchExerciseLibrary(
  entries: ExerciseLibraryEntry[],
  query: string,
): ExerciseLibraryEntry[] {
  const normalized = normalizeExerciseName(query);
  if (!normalized) return entries;
  return entries.filter(entry =>
    normalizeExerciseName(entry.name).includes(normalized) ||
    entry.aliases.some(alias => normalizeExerciseName(alias).includes(normalized)) ||
    entry.primaryMuscles.some(muscle => normalizeExerciseName(muscle).includes(normalized)) ||
    entry.movementPattern.includes(normalized)
  );
}
```

- [ ] **Step 3: Create query adapter around static data**

Only `features/exercise_library/queries/index.ts` imports `data/static/exercises.ts`.

```ts
export function getExerciseLibrary(): ExerciseLibraryEntry[] {
  // Map static exercise records into ExerciseLibraryEntry.
}

export function searchExercises(query: string): ExerciseLibraryEntry[] {
  return searchExerciseLibrary(getExerciseLibrary(), query);
}
```

- [ ] **Step 4: Export contract and barrel**

`contract.ts` exports types. `index.ts` exports queries and pure helpers.

- [ ] **Step 5: Run tests**

```
npx vitest run features/exercise_library/domain/search.test.ts
```

---

## Task 3: Seed entries from static exercises

**Files:**
- Modify: `features/exercise_library/queries/index.ts`
- Read: `data/static/exercises.ts`

- [ ] **Step 1: Inspect static shape**

```
Get-Content -LiteralPath 'data\static\exercises.ts'
```

- [ ] **Step 2: Map available fields**

Mapping rule:
- `id`: stable slug from canonical name if static id missing
- `name`: static display name
- `aliases`: empty array unless static data has aliases
- `primaryMuscles`: from static muscle/group field if present
- `movementPattern`: conservative fallback from category/group

- [ ] **Step 3: Add explicit alias seed list for common lifts**

Examples:
- `Bench Press`: `Barbell Bench`, `Flat Bench`
- `Back Squat`: `Squat`, `Barbell Squat`
- `Deadlift`: `Conventional Deadlift`
- `Overhead Press`: `OHP`, `Shoulder Press`

Keep list small. Do not add form/media/substitution data.

---

## Task 4: Update exercise picker search

**Files:**
- Modify current exercise picker component (find with `rg "ExercisePicker|recent_exercises" ui features`)

- [ ] **Step 1: Replace ad-hoc filtering**

Use:

```ts
import { searchExercises } from '@features/exercise_library';
```

Search result display should use `entry.name`; alias match still selects canonical name.

- [ ] **Step 2: Preserve recent exercises**

If current picker mixes recent exercises and static suggestions, keep recent exercises visible, then show library results below.

- [ ] **Step 3: Empty state**

No search results should render a clear empty state, not a blank list.

- [ ] **Step 4: Manual search checks**

Search:
- canonical name
- alias
- muscle
- movement pattern
- nonsense string

---

## Task 5: Alias-aware progression grouping

**Files:**
- Modify: `features/progression/queries/index.ts`
- Modify: `ui/screens/progress/useExerciseHistory.ts`

- [ ] **Step 1: Add canonical grouping helper**

```ts
import { findCanonicalExercise, getExerciseLibrary } from '@features/exercise_library';

function canonicalProgressionKey(exerciseName: string): string {
  return findCanonicalExercise(getExerciseLibrary(), exerciseName)?.name ?? exerciseName;
}
```

- [ ] **Step 2: Add grouped progression query**

```ts
export function getGroupedProgressions(): ExerciseProgression[] {
  // Fold existing exercise_progressions entries by canonical name.
  // Merge histories and sort oldest -> newest.
}
```

- [ ] **Step 3: Update exercise history screen hook**

Use grouped query when listing exercise history. Do not mutate old events or projection state.

- [ ] **Step 4: Add tests**

Test that `Bench Press` and `Barbell Bench` histories appear under one canonical progression.

---

## Task 6: Verification

- [ ] `npx tsc --noEmit`
- [ ] `npx vitest run features/exercise_library/domain/search.test.ts`
- [ ] `npx vitest run`
- [ ] `npm run lint`
- [ ] `npm run build`

- [ ] Manual checks:
1. Picker finds canonical names.
2. Picker finds aliases.
3. Picker finds muscle/movement pattern.
4. Selecting alias stores canonical exercise name for new blocks.
5. Existing old sessions still show original names.
6. Progress history groups aliases without event migration.

- [ ] Rebuild graphify:

```powershell
$env:PYTHONIOENCODING='utf-8'; $env:PYTHONUTF8='1'; python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** shared exercise entry, aliases, muscles, movement pattern, picker search, progress grouping.
- [x] **Architecture:** static data hidden behind feature query; old events unchanged.
- [x] **Out of scope preserved:** no media, no form guidance, no substitutions, no heatmaps.
- [x] **Tests planned:** search, alias normalization, progression grouping.
