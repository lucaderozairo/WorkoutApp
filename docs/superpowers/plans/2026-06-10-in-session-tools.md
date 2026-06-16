# In-Session Tools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add four deterministic strength-session helpers to the active workout screen: previous performance, auto-rest, plate calculator, and simple progressive overload hints.

**Architecture:** No new feature module is required. `features/progression` owns previous-performance and overload read helpers because it already builds `exercise_progressions`. `ui/components/session` owns the in-session presentation. Plate calculation is a pure UI helper because it does not emit domain events. Auto-rest reuses the existing `rest_timer` view-store key already managed by `WorkoutView`; only a local toggle is added in this pass. UI must not scan projection internals directly inside render loops.

**Tech Stack:** React 18, TypeScript, Vitest, existing `@ui/bindings`, existing session components, existing design tokens/classes.

**Related plan:** `docs/superpowers/plans/2026-06-10-template-management.md` should be complete first so template-started sessions share the same active session surface.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `shared/contracts/strength.ts` | Create | `PreviousExercisePerformance`, `ProgressiveOverloadHint`, `PlateCalculation` contracts |
| `shared/contracts/index.ts` | Modify | Re-export strength contracts |
| `features/progression/domain/sessionTools.ts` | Create | Pure helpers for previous performance and overload hints |
| `features/progression/domain/sessionTools.test.ts` | Create | Unit tests for previous performance and overload rules |
| `features/progression/queries/index.ts` | Modify | Export query functions for session-facing strength context |
| `features/progression/contract.ts` | Modify | Export session-tool contract types/functions needed outside the feature |
| `ui/components/session/plateCalculator.ts` | Create | Pure plate math helper |
| `ui/components/session/plateCalculator.test.ts` | Create | Unit tests for plate math |
| `ui/components/session/PlateCalculatorModal.tsx` | Create | Modal UI for plate calculation |
| `ui/components/session/PreviousPerformanceLine.tsx` | Create | Compact previous-performance display |
| `ui/components/session/OverloadHintLine.tsx` | Create | Compact overload hint display |
| `ui/components/session/SetRow.tsx` | Modify | Add calculator action from set menu |
| `ui/components/session/BlockCard.tsx` | Modify | Render previous performance and overload hints; pass plate calculator callback |
| `ui/components/session/WorkoutView.tsx` | Modify | Query strength context, auto-rest toggle, modal state, helper props |

---

## Task 1: Shared contracts

**Files:**
- Create: `shared/contracts/strength.ts`
- Modify: `shared/contracts/index.ts`

- [ ] **Step 1: Create the shared strength contracts**

```ts
// shared/contracts/strength.ts
export interface PreviousExerciseSet {
  weightKg?: number;
  reps?: number;
  done?: boolean;
}

export interface PreviousExercisePerformance {
  exerciseName: string;
  lastSessionDate: string;
  sets: PreviousExerciseSet[];
  maxWeightKg?: number;
  estimatedOneRepMax?: number;
}

export interface ProgressiveOverloadHint {
  exerciseName: string;
  kind: 'increase_weight' | 'repeat_weight' | 'no_history';
  message: string;
  suggestedWeightKg?: number;
}

export interface PlateCalculation {
  targetWeightKg: number;
  barWeightKg: number;
  perSide: number[];
  remainderKg: number;
}
```

- [ ] **Step 2: Re-export from `shared/contracts/index.ts`**

```ts
export type {
  PlateCalculation,
  PreviousExercisePerformance,
  PreviousExerciseSet,
  ProgressiveOverloadHint,
} from './strength';
```

- [ ] **Step 3: Verify types**

```
npx tsc --noEmit
```

Expected: no errors.

---

## Task 2: Progression pure helpers and tests

**Files:**
- Create: `features/progression/domain/sessionTools.ts`
- Create: `features/progression/domain/sessionTools.test.ts`

- [ ] **Step 1: Write failing tests first**

```ts
// features/progression/domain/sessionTools.test.ts
import { describe, expect, it } from 'vitest';
import type { ExerciseProgression } from './types';
import {
  buildPreviousPerformance,
  buildProgressiveOverloadHint,
} from './sessionTools';

const progression: ExerciseProgression = {
  exerciseName: 'Bench Press',
  plateauDetected: false,
  history: [
    {
      date: '2026-06-01',
      sessionId: 's-1' as never,
      sets: 3,
      totalReps: 15,
      maxWeightKg: 80,
      volume: 1200,
      oneRepMaxEstimate: 93.3,
      setWeights: [80, 80, 80],
      setReps: [5, 5, 5],
      warmupWeights: [40],
    },
  ],
};

describe('buildPreviousPerformance', () => {
  it('uses the latest progression entry', () => {
    expect(buildPreviousPerformance(progression)).toEqual({
      exerciseName: 'Bench Press',
      lastSessionDate: '2026-06-01',
      maxWeightKg: 80,
      estimatedOneRepMax: 93.3,
      sets: [
        { weightKg: 80, reps: 5, done: true },
        { weightKg: 80, reps: 5, done: true },
        { weightKg: 80, reps: 5, done: true },
      ],
    });
  });
});

describe('buildProgressiveOverloadHint', () => {
  it('suggests +2.5kg when all working sets hit target reps', () => {
    expect(buildProgressiveOverloadHint(progression, 5)).toEqual({
      exerciseName: 'Bench Press',
      kind: 'increase_weight',
      message: 'Last time all working sets hit 5 reps. Try 82.5 kg.',
      suggestedWeightKg: 82.5,
    });
  });

  it('asks user to repeat weight when any set misses target reps', () => {
    const hint = buildProgressiveOverloadHint(progression, 6);
    expect(hint.kind).toBe('repeat_weight');
  });

  it('returns no_history when progression is null', () => {
    expect(buildProgressiveOverloadHint(null, 5).kind).toBe('no_history');
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```
npx vitest run features/progression/domain/sessionTools.test.ts
```

Expected: missing module/function errors.

- [ ] **Step 3: Create `sessionTools.ts`**

```ts
// features/progression/domain/sessionTools.ts
import type {
  PreviousExercisePerformance,
  ProgressiveOverloadHint,
} from '@shared/contracts';
import type { ExerciseProgression } from './types';

export function buildPreviousPerformance(
  progression: ExerciseProgression | null,
): PreviousExercisePerformance | null {
  const latest = progression?.history.at(-1);
  if (!progression || !latest) return null;
  return {
    exerciseName: progression.exerciseName,
    lastSessionDate: latest.date,
    maxWeightKg: latest.maxWeightKg,
    estimatedOneRepMax: Math.round(latest.oneRepMaxEstimate * 10) / 10,
    sets: latest.setWeights.map((weightKg, index) => ({
      weightKg,
      reps: latest.setReps[index] ?? 0,
      done: true,
    })),
  };
}

export function buildProgressiveOverloadHint(
  progression: ExerciseProgression | null,
  targetReps: number,
): ProgressiveOverloadHint {
  const latest = progression?.history.at(-1);
  if (!progression || !latest || latest.setReps.length === 0) {
    return {
      exerciseName: progression?.exerciseName ?? '',
      kind: 'no_history',
      message: 'No previous working sets.',
    };
  }

  const hitTarget = latest.setReps.every(reps => reps >= targetReps);
  if (!hitTarget) {
    return {
      exerciseName: progression.exerciseName,
      kind: 'repeat_weight',
      message: `Last time did not hit ${targetReps} reps on every set. Repeat ${latest.maxWeightKg} kg.`,
      suggestedWeightKg: latest.maxWeightKg,
    };
  }

  const suggestedWeightKg = latest.maxWeightKg + 2.5;
  return {
    exerciseName: progression.exerciseName,
    kind: 'increase_weight',
    message: `Last time all working sets hit ${targetReps} reps. Try ${suggestedWeightKg} kg.`,
    suggestedWeightKg,
  };
}
```

- [ ] **Step 4: Run helper tests**

```
npx vitest run features/progression/domain/sessionTools.test.ts
```

Expected: all tests pass.

---

## Task 3: Progression session queries

**Files:**
- Modify: `features/progression/queries/index.ts`
- Modify: `features/progression/contract.ts`

- [ ] **Step 1: Add query helpers**

```ts
// features/progression/queries/index.ts
import {
  buildPreviousPerformance,
  buildProgressiveOverloadHint,
} from '../domain/sessionTools';

export function getPreviousPerformanceForExercise(exerciseName: string) {
  return buildPreviousPerformance(getProgressionForExercise(exerciseName));
}

export function getProgressiveOverloadHintForExercise(
  exerciseName: string,
  targetReps: number,
) {
  return buildProgressiveOverloadHint(
    getProgressionForExercise(exerciseName),
    targetReps,
  );
}
```

- [ ] **Step 2: Export session-tool types from contract**

```ts
// features/progression/contract.ts
export type {
  PreviousExercisePerformance,
  ProgressiveOverloadHint,
} from '@shared/contracts';
```

- [ ] **Step 3: Export helper functions from `features/progression/index.ts` if not already exported through queries**

```ts
export {
  getPreviousPerformanceForExercise,
  getProgressiveOverloadHintForExercise,
} from './queries';
```

- [ ] **Step 4: Verify type surface**

```
npx tsc --noEmit
```

Expected: no errors.

---

## Task 4: Plate calculator pure helper and tests

**Files:**
- Create: `ui/components/session/plateCalculator.ts`
- Create: `ui/components/session/plateCalculator.test.ts`

- [ ] **Step 1: Write failing plate-calculator tests**

```ts
// ui/components/session/plateCalculator.test.ts
import { describe, expect, it } from 'vitest';
import { calculatePlates } from './plateCalculator';

describe('calculatePlates', () => {
  it('calculates per-side plates for a standard bar', () => {
    expect(calculatePlates(100, 20, [20, 15, 10, 5, 2.5])).toEqual({
      targetWeightKg: 100,
      barWeightKg: 20,
      perSide: [20, 20],
      remainderKg: 0,
    });
  });

  it('uses smaller plates for remainder', () => {
    expect(calculatePlates(87.5, 20, [20, 15, 10, 5, 2.5, 1.25]).perSide)
      .toEqual([20, 10, 2.5, 1.25]);
  });

  it('returns a positive remainder when exact loading is impossible', () => {
    expect(calculatePlates(82, 20, [20, 10, 5]).remainderKg).toBe(2);
  });
});
```

- [ ] **Step 2: Create pure helper**

```ts
// ui/components/session/plateCalculator.ts
import type { PlateCalculation } from '@shared/contracts';

export function calculatePlates(
  targetWeightKg: number,
  barWeightKg: number,
  availablePlatesKg: number[],
): PlateCalculation {
  let sideWeight = Math.max(0, (targetWeightKg - barWeightKg) / 2);
  const perSide: number[] = [];
  const plates = [...availablePlatesKg].sort((a, b) => b - a);

  for (const plate of plates) {
    while (sideWeight >= plate) {
      perSide.push(plate);
      sideWeight = Math.round((sideWeight - plate) * 100) / 100;
    }
  }

  return {
    targetWeightKg,
    barWeightKg,
    perSide,
    remainderKg: Math.round(sideWeight * 2 * 100) / 100,
  };
}
```

- [ ] **Step 3: Run helper tests**

```
npx vitest run ui/components/session/plateCalculator.test.ts
```

Expected: all tests pass.

---

## Task 5: Plate calculator modal

**Files:**
- Create: `ui/components/session/PlateCalculatorModal.tsx`

- [ ] **Step 1: Create modal component**

```tsx
// ui/components/session/PlateCalculatorModal.tsx
import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { Row, Column, Cluster } from '@ui/layout';
import { Surface, Text, Chip } from '@ui/atoms';
import { Button, Input } from '@ui/molecules';
import { calculatePlates } from './plateCalculator';

const DEFAULT_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];

interface PlateCalculatorModalProps {
  initialWeightKg: number;
  onClose: () => void;
}

export function PlateCalculatorModal({ initialWeightKg, onClose }: PlateCalculatorModalProps) {
  const [targetWeightKg, setTargetWeightKg] = useState(initialWeightKg);
  const [barWeightKg, setBarWeightKg] = useState(20);
  const calculation = useMemo(
    () => calculatePlates(targetWeightKg, barWeightKg, DEFAULT_PLATES),
    [targetWeightKg, barWeightKg],
  );

  return (
    <div className="modal-overlay">
      <Surface>
        <Column>
          <Row justify="between" align="center">
            <Text as="h3">Plate Calculator</Text>
            <Button type="button" variant="ghost" size="icon" onClick={onClose}>
              <X size={12} />
            </Button>
          </Row>
          <Row gap={1}>
            <Input
              label="Target kg"
              type="number"
              min="0"
              step="0.5"
              value={targetWeightKg}
              onChange={e => setTargetWeightKg(Number(e.target.value))}
            />
            <Input
              label="Bar kg"
              type="number"
              min="0"
              step="0.5"
              value={barWeightKg}
              onChange={e => setBarWeightKg(Number(e.target.value))}
            />
          </Row>
          <Column gap={1}>
            <Text size="eyebrow">Each side</Text>
            <Cluster gap={1}>
              {calculation.perSide.length === 0 ? (
                <Text size="caption" color="faint">No plates</Text>
              ) : calculation.perSide.map((plate, index) => (
                <Chip key={`${plate}-${index}`}>{plate} kg</Chip>
              ))}
            </Cluster>
            {calculation.remainderKg > 0 && (
              <Text size="caption" color="muted">
                Cannot load remaining {calculation.remainderKg} kg with available plates.
              </Text>
            )}
          </Column>
        </Column>
      </Surface>
    </div>
  );
}
```

- [ ] **Step 2: Verify modal compiles**

```
npx tsc --noEmit
```

Expected: no errors.

---

## Task 6: Previous-performance and overload display components

**Files:**
- Create: `ui/components/session/PreviousPerformanceLine.tsx`
- Create: `ui/components/session/OverloadHintLine.tsx`

- [ ] **Step 1: Create previous-performance display**

```tsx
// ui/components/session/PreviousPerformanceLine.tsx
import { Row, Column } from '@ui/layout';
import { Text, Chip } from '@ui/atoms';
import type { PreviousExercisePerformance } from '@shared/contracts';

interface PreviousPerformanceLineProps {
  performance: PreviousExercisePerformance | null;
}

export function PreviousPerformanceLine({ performance }: PreviousPerformanceLineProps) {
  if (!performance) {
    return <Text size="caption" color="faint">No previous sets</Text>;
  }

  return (
    <Column gap={1}>
      <Text size="caption" color="muted">Last: {performance.lastSessionDate}</Text>
      <Row gap={1}>
        {performance.sets.map((set, index) => (
          <Chip key={index}>
            {set.weightKg ?? 0} kg x {set.reps ?? 0}
          </Chip>
        ))}
      </Row>
    </Column>
  );
}
```

- [ ] **Step 2: Create overload hint display**

```tsx
// ui/components/session/OverloadHintLine.tsx
import { TrendingUp } from 'lucide-react';
import { Row } from '@ui/layout';
import { Text } from '@ui/atoms';
import type { ProgressiveOverloadHint } from '@shared/contracts';

interface OverloadHintLineProps {
  hint: ProgressiveOverloadHint;
}

export function OverloadHintLine({ hint }: OverloadHintLineProps) {
  if (hint.kind === 'no_history') return null;
  return (
    <Row gap={1} align="center">
      <TrendingUp size={12} />
      <Text size="caption" color="muted">{hint.message}</Text>
    </Row>
  );
}
```

- [ ] **Step 3: Verify**

```
npx tsc --noEmit
```

Expected: no errors.

---

## Task 7: Add plate action to SetRow

**Files:**
- Modify: `ui/components/session/SetRow.tsx`

- [ ] **Step 1: Add prop**

```ts
onOpenPlateCalculator?: (weightKg: number) => void;
```

- [ ] **Step 2: Add button in set options**

Inside the open set menu, add this button near "Add note":

```tsx
{currentMode === 'wt-reps' && onOpenPlateCalculator && (
  <Button
    type="button"
    variant="ghost"
    size="sm"
    onClick={() => {
      onOpenMenu(null);
      onOpenPlateCalculator(parseFloat(wVal) || 0);
    }}
  >
    Plate calculator
  </Button>
)}
```

- [ ] **Step 3: Verify no layout regression**

Open the set options menu at 320 px. The new button must wrap cleanly inside the menu.

---

## Task 8: Wire BlockCard display props

**Files:**
- Modify: `ui/components/session/BlockCard.tsx`

- [ ] **Step 1: Add imports**

```ts
import type {
  PreviousExercisePerformance,
  ProgressiveOverloadHint,
} from '@shared/contracts';
import { PreviousPerformanceLine } from './PreviousPerformanceLine';
import { OverloadHintLine } from './OverloadHintLine';
```

- [ ] **Step 2: Add props**

```ts
previousPerformanceByExercise: Record<string, PreviousExercisePerformance | null>;
overloadHintsByExercise: Record<string, ProgressiveOverloadHint>;
onOpenPlateCalculator: (weightKg: number) => void;
```

- [ ] **Step 3: Render context in the single-exercise branch**

After exercise comments and before charts:

```tsx
<PreviousPerformanceLine performance={previousPerformanceByExercise[ex.name] ?? null} />
{overloadHintsByExercise[ex.name] && (
  <OverloadHintLine hint={overloadHintsByExercise[ex.name]} />
)}
```

- [ ] **Step 4: Pass plate callback to each `SetRow`**

```tsx
onOpenPlateCalculator={onOpenPlateCalculator}
```

- [ ] **Step 5: Repeat for `ExerciseSection` only if superset/circuit rows need parity in this pass**

Minimum P1 requirement is single exercise rows. Superset parity can be a follow-up if the existing `ExerciseSection` prop surface makes this invasive.

---

## Task 9: Wire WorkoutView state and auto-rest

**Files:**
- Modify: `ui/components/session/WorkoutView.tsx`

- [ ] **Step 1: Add imports**

```ts
import {
  getPreviousPerformanceForExercise,
  getProgressiveOverloadHintForExercise,
} from '@features/progression';
import { PlateCalculatorModal } from './PlateCalculatorModal';
```

- [ ] **Step 2: Add state**

```ts
const [autoRestEnabled, setAutoRestEnabled] = useState(false);
const [plateInitialWeightKg, setPlateInitialWeightKg] = useState<number | null>(null);
```

- [ ] **Step 3: Build exercise context outside render loops**

```ts
const exerciseNames = Array.from(new Set(
  blocks.flatMap(block => block.exercises.map(exercise => exercise.name)),
));

const previousPerformanceByExercise = Object.fromEntries(
  exerciseNames.map(name => [name, getPreviousPerformanceForExercise(name)]),
);

const overloadHintsByExercise = Object.fromEntries(
  exerciseNames.map(name => [name, getProgressiveOverloadHintForExercise(name, 5)]),
);
```

Note: target reps are fixed at `5` for first pass because current session rows do not carry template target reps yet.

- [ ] **Step 4: Add auto-rest toggle near `UndoToast`**

```tsx
<Button
  type="button"
  variant={autoRestEnabled ? 'secondary' : 'ghost'}
  size="sm"
  onClick={() => setAutoRestEnabled(v => !v)}
>
  Auto-rest {autoRestEnabled ? 'on' : 'off'}
</Button>
```

- [ ] **Step 5: Start rest after successful set completion**

In `handleToggleDone`, after `await updateSet(...)` succeeds:

```ts
if (autoRestEnabled && newDone) {
  setRestTimer({ seconds: block.restSeconds ?? 90, exerciseName: ex.name });
}
```

- [ ] **Step 6: Start rest after successful set logging**

In `handleAddSet`, after `await logStrengthSet(...)` succeeds:

```ts
if (autoRestEnabled && domainBlock) {
  setRestTimer({ seconds: domainBlock.restSeconds ?? 90, exerciseName: domainBlock.exerciseName });
}
```

- [ ] **Step 7: Pass props to `BlockCard`**

```tsx
previousPerformanceByExercise={previousPerformanceByExercise}
overloadHintsByExercise={overloadHintsByExercise}
onOpenPlateCalculator={setPlateInitialWeightKg}
```

- [ ] **Step 8: Render plate modal**

```tsx
{plateInitialWeightKg !== null && (
  <PlateCalculatorModal
    initialWeightKg={plateInitialWeightKg}
    onClose={() => setPlateInitialWeightKg(null)}
  />
)}
```

---

## Task 10: Full verification

- [ ] **Step 1: Typecheck**

```
npx tsc --noEmit
```

- [ ] **Step 2: Unit tests**

```
npx vitest run features/progression/domain/sessionTools.test.ts ui/components/session/plateCalculator.test.ts
```

- [ ] **Step 3: Full test suite**

```
npx vitest run
```

- [ ] **Step 4: Lint**

```
npm run lint
```

- [ ] **Step 5: Production build**

```
npm run build
```

- [ ] **Step 6: Manual checks**

1. Start or open a strength session.
2. Exercise with prior progression shows previous sets.
3. Exercise without prior progression shows "No previous sets".
4. Auto-rest toggle starts timer after set completion.
5. Plate calculator opens from set options and closes without route change.
6. Overload hint appears only when previous performance supports it.
7. 320 px viewport has no overlapping set controls or modal content.

- [ ] **Step 7: Rebuild graphify graph**

```powershell
$env:PYTHONIOENCODING='utf-8'; $env:PYTHONUTF8='1'; python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"
```

---

## Self-Review Checklist

- [x] **Spec coverage:**
  - Previous performance inline for each exercise -> Tasks 2, 3, 6, 8, 9
  - Auto-rest timer after logging/completing a set -> Task 9
  - Plate calculator from set row -> Tasks 4, 5, 7, 9
  - Simple progressive overload hint -> Tasks 2, 3, 6, 8, 9

- [x] **Architecture checks:**
  - No new feature-to-feature dependency from `features/progression` to `features/training_log`
  - UI consumes `features/progression` query functions, not projection internals
  - Plate calculator stays UI-local and emits no domain events
  - Existing rest timer state is reused

- [x] **Out of scope preserved:**
  - No warmup suggestions
  - No RPE trend warning logic
  - No failure-pattern detection
  - No multi-week progression model

- [x] **CSS and UI conventions:**
  - No inline styles
  - Existing `Surface`, `Text`, `Button`, `Row`, `Column`, and token classes used
  - Modal uses existing `modal-overlay` pattern
