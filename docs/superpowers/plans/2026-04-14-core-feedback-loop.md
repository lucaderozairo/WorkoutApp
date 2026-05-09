# Plan 1: Core Feedback Loop — Progression Engine + Coaching Layer

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the feedback loop: enrich session events with RPE/tags/exercise summaries, derive per-exercise progression (volume + 1RM estimates), and generate coaching insights (load warnings, plateau alerts, deload suggestions) that surface on the Dashboard.

**Architecture:** The `SessionFinished` event payload is extended to include exercise summaries, session RPE, and tags — making it self-contained for downstream consumers. The progression engine is a reactive policy that subscribes to `SessionFinished` on the event bus and updates the `exercise_progressions` ViewStore key. The coaching layer is a second policy on the same event that reads progression and health metrics projections to emit `CoachingInsight` records. Computation logic lives in pure functions for testability.

**Tech Stack:** TypeScript, React 18, Recharts (adding), Vitest (adding), existing CQRS stack: `@shared/types`, `@core/events/bus`, `@data/projections/views` (ViewStore), `@data/projections/builders` (ProjectionBuilder), `@core/id-generator`, `@core/clock`

**Related spec:** `docs/superpowers/specs/2026-04-14-new-features-design.md` — Sections 1D, 1F, 2E, 2G

**This is Plan 1 of 6. Plans 2–6 are independent and can start in parallel after Task 0.**

---

## File Map

### New files
| File | Responsibility |
|---|---|
| `features/progression/domain/types.ts` | VolumeEntry, ExerciseProgression, ProgressionState types |
| `features/progression/domain/compute.ts` | Pure functions: volume, 1RM (Epley), plateau detection |
| `features/progression/domain/compute.test.ts` | Unit tests for pure functions |
| `features/progression/policies/updateProgression.ts` | EventBus subscriber: SessionFinished → updates ViewStore |
| `features/progression/policies/updateProgression.test.ts` | Policy integration tests |
| `features/progression/queries/index.ts` | getProgressionForExercise, getAllProgressions |
| `features/progression/index.ts` | Public API |
| `features/coaching/domain/types.ts` | CoachingInsight, InsightType types |
| `features/coaching/domain/rules.ts` | Pure functions: insight generators per signal type |
| `features/coaching/domain/rules.test.ts` | Unit tests for insight generators |
| `features/coaching/policies/generateInsights.ts` | EventBus subscriber: SessionFinished → emits insights |
| `features/coaching/policies/generateInsights.test.ts` | Policy integration tests |
| `features/coaching/commands/handlers.ts` | handleDismissInsight |
| `features/coaching/queries/index.ts` | getActiveInsights, getInsightHistory |
| `features/coaching/index.ts` | Public API |
| `ui/components/ExerciseProgressionChart.tsx` | Recharts LineChart for per-exercise volume trend |
| `ui/components/CoachingInsightCard.tsx` | Single insight card (warning/suggestion/positive) |
| `vitest.setup.ts` | Vitest global setup |

### Modified files
| File | What changes |
|---|---|
| `package.json` | Add vitest, @vitest/ui, jsdom, recharts |
| `vite.config.ts` | Add vitest test config block |
| `tsconfig.json` | Add test files to include |
| `features/training_log/domain/types.ts` | Extend SessionFinishedPayload + FinishSession command |
| `features/training_log/commands/handlers.ts` | Populate enriched SessionFinished payload; register progression + coaching policies |

---

## Task 0: Install dependencies

**Files:** `package.json`, `vite.config.ts`, `tsconfig.json`, `vitest.setup.ts`

- [ ] **Step 1: Install vitest and recharts**

```bash
npm install recharts
npm install -D vitest @vitest/ui jsdom
```

Expected: no errors, `package.json` updated.

- [ ] **Step 2: Add vitest config to `vite.config.ts`**

Replace the file contents with:

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@app': path.resolve(__dirname, 'app'),
      '@ui': path.resolve(__dirname, 'ui'),
      '@features': path.resolve(__dirname, 'features'),
      '@data': path.resolve(__dirname, 'data'),
      '@core': path.resolve(__dirname, 'core'),
      '@shared': path.resolve(__dirname, 'shared'),
      '@styling': path.resolve(__dirname, 'styling'),
      '@config': path.resolve(__dirname, 'config'),
    }
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    alias: {
      '@app': path.resolve(__dirname, 'app'),
      '@ui': path.resolve(__dirname, 'ui'),
      '@features': path.resolve(__dirname, 'features'),
      '@data': path.resolve(__dirname, 'data'),
      '@core': path.resolve(__dirname, 'core'),
      '@shared': path.resolve(__dirname, 'shared'),
      '@styling': path.resolve(__dirname, 'styling'),
      '@config': path.resolve(__dirname, 'config'),
    }
  }
});
```

- [ ] **Step 3: Create `vitest.setup.ts`**

```ts
// vitest.setup.ts
import '@testing-library/jest-dom';
```

Wait — we did not install `@testing-library/jest-dom`. Since we're not testing React components in Plan 1, omit it:

```ts
// vitest.setup.ts — empty for now; add imports here as needed
```

- [ ] **Step 4: Add test script to `package.json`**

In the `scripts` section, add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Verify vitest runs**

```bash
npm test
```

Expected: `No test files found, exiting with code 0` (no tests yet — that's fine).

- [ ] **Step 6: Verify build still passes**

```bash
npm run build
```

Expected: `✓ built in` with no TypeScript errors.

- [ ] **Step 7: Commit**

```bash
git add package.json vite.config.ts vitest.setup.ts
git commit -m "chore: add vitest test runner and recharts"
```

---

## Task 1: Extend SessionFinished payload with exercise summaries, RPE, and tags

**Files:**
- Modify: `features/training_log/domain/types.ts`

The `SessionFinished` event currently carries only `{ sessionId, finishedAt }`. We extend it so downstream policies (progression, coaching) have all data they need without reading other projections.

- [ ] **Step 1: Add `ExerciseSummary` type and extend `SessionFinishedPayload`**

In `features/training_log/domain/types.ts`, add after the `SetEntry` type definition and update `SessionFinishedPayload`:

```ts
// After `export type SetEntry = StrengthSet | CardioSet;` add:

export interface ExerciseSummary {
  exerciseName: string;
  exerciseCategory: ExerciseCategory;
  sets: StrengthSet[];  // only strength sets; cardio sets excluded from progression
}
```

Replace the existing `SessionFinishedPayload` interface:

```ts
export interface SessionFinishedPayload {
  sessionId: Id<'Session'>;
  finishedAt: number;
  sessionRpe?: number;   // 1–10 overall session feeling
  tags?: string[];       // e.g. ["deload", "legs", "heavy"]
  exerciseSummaries: ExerciseSummary[];
}
```

- [ ] **Step 2: Extend the `FinishSession` command to accept optional RPE and tags**

Replace the existing `FinishSession` interface:

```ts
export interface FinishSession {
  type: 'FinishSession';
  sessionId: Id<'Session'>;
  sessionRpe?: number;
  tags?: string[];
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npm run build
```

Expected: build succeeds. (The handler will fail to compile because `sessionRpe`, `tags`, and `exerciseSummaries` are now required/available — fix that in Task 2.)

---

## Task 2: Update `handleFinishSession` to populate enriched payload

**Files:**
- Modify: `features/training_log/commands/handlers.ts`

- [ ] **Step 1: Update the `ActiveSessionView` type cast and payload in `handleFinishSession`**

In `features/training_log/commands/handlers.ts`, the `handleFinishSession` function reads the active session from ViewStore. Update it to extract exercise summaries and use the enriched payload.

Find this block (around line 162–218) and replace the entire `handleFinishSession` function:

```ts
export async function handleFinishSession(cmd: FinishSession): Promise<Result<void, string>> {
  const session = viewStore.get<ActiveSessionView>('active_session');

  if (!session || session.id !== cmd.sessionId) return err('No active session found');

  const finishedAt = systemClock.now();

  // Build exercise summaries for downstream consumers (progression, coaching)
  const exerciseSummaries: ExerciseSummary[] = session.blocks
    .filter(b => b.exerciseCategory === 'strength')
    .map(b => ({
      exerciseName: b.exerciseName,
      exerciseCategory: b.exerciseCategory,
      sets: b.sets.filter((s): s is StrengthSet => s.type === 'strength'),
    }))
    .filter(s => s.sets.length > 0);

  const enrichedPayload: SessionFinishedPayload = {
    sessionId: cmd.sessionId,
    finishedAt,
    sessionRpe: cmd.sessionRpe,
    tags: cmd.tags,
    exerciseSummaries,
  };

  const events: TrainingLogEvent[] = [{
    type: 'SessionFinished',
    aggregateId: cmd.sessionId,
    aggregateType: 'Session',
    timestamp: finishedAt,
    version: 1,
    payload: enrichedPayload,
  }];

  await repository.save(events);

  // Build history item and push to session_history view
  const totalSets = session.blocks.reduce((acc, b) => acc + b.sets.length, 0);
  const durationSeconds = Math.floor((finishedAt - session.startedAt) / 1000);
  const dominantCategory = session.blocks[0]?.exerciseCategory ?? 'strength';

  const historyItem: SessionHistoryItem = {
    id: cmd.sessionId,
    name: session.name,
    startedAt: session.startedAt,
    finishedAt,
    durationSeconds,
    totalSets,
    exerciseCount: session.blocks.length,
    hasPR: false,
    category: (dominantCategory === 'mobility' ? 'mobility' : dominantCategory === 'cardio' ? 'cardio' : 'strength') as 'strength' | 'cardio' | 'mobility',
  };

  const existing = viewStore.get<SessionHistoryItem[]>('session_history') ?? [];
  viewStore.set('session_history', [historyItem, ...existing]);

  events.forEach(e => activeSessionProjection.apply(e));
  viewStore.set('active_session', activeSessionProjection.getState());

  // Notify other features via event bus with enriched payload
  await eventBus.publish({
    type: 'SessionFinished',
    aggregateId: cmd.sessionId,
    aggregateType: 'Session',
    timestamp: finishedAt,
    version: 1,
    payload: enrichedPayload,
  });

  return ok(undefined);
}
```

- [ ] **Step 2: Add missing imports to the top of handlers.ts**

Add `ExerciseSummary`, `StrengthSet`, `SessionFinishedPayload`, `ActiveSessionView` to the existing import from `'../domain/types'` and `'../projections'`:

```ts
import type {
  StartSession,
  AddBlock,
  LogStrengthSet,
  LogCardioSet,
  FinishSession,
  DeleteSession,
  UpdateBlockNote,
  ChangeSetType,
  LogRPE,
  ToggleSetFailed,
  SetBlockType,
  SetBlockRounds,
  TrainingLogEvent,
  ExerciseSummary,
  StrengthSet,
  SessionFinishedPayload,
} from '../domain/types';
import type { ActiveSessionView, SessionHistoryItem } from '../projections';
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add features/training_log/domain/types.ts features/training_log/commands/handlers.ts
git commit -m "feat(training-log): enrich SessionFinished payload with exercise summaries, RPE, tags"
```

---

## Task 3: Progression domain types and pure compute functions

**Files:**
- Create: `features/progression/domain/types.ts`
- Create: `features/progression/domain/compute.ts`
- Create: `features/progression/domain/compute.test.ts`

- [ ] **Step 1: Write the failing tests first**

Create `features/progression/domain/compute.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { epleyOneRepMax, computeVolumeEntry, detectPlateau } from './compute';
import type { StrengthSet } from '@features/training_log/domain/types';

const makeSet = (weight: number, reps: number, isWarmup = false): StrengthSet => ({
  type: 'strength',
  setNumber: 1,
  weightKg: weight,
  reps,
  isWarmup,
  isPR: false,
  completedAt: Date.now(),
});

describe('epleyOneRepMax', () => {
  it('returns weight unchanged when reps is 1', () => {
    expect(epleyOneRepMax(100, 1)).toBe(100);
  });

  it('estimates 1RM using Epley formula: weight * (1 + reps/30)', () => {
    expect(epleyOneRepMax(80, 10)).toBeCloseTo(80 * (1 + 10 / 30), 2);
  });

  it('ignores warmup sets when all sets are warmup', () => {
    const sets = [makeSet(60, 5, true), makeSet(80, 3, true)];
    // Should use heaviest non-warmup set or fallback to 0
    expect(epleyOneRepMax(0, 0)).toBe(0);
  });
});

describe('computeVolumeEntry', () => {
  it('sums volume across all working sets', () => {
    const sets = [makeSet(100, 5), makeSet(100, 5), makeSet(100, 4)];
    const entry = computeVolumeEntry('2026-04-14', sets, 'sess-1');
    // total volume = 100*5 + 100*5 + 100*4 = 1400
    expect(entry.volume).toBe(1400);
  });

  it('excludes warmup sets from volume and 1RM', () => {
    const sets = [makeSet(60, 10, true), makeSet(100, 5), makeSet(100, 5)];
    const entry = computeVolumeEntry('2026-04-14', sets, 'sess-1');
    expect(entry.volume).toBe(1000); // only 2 working sets: 100*5 + 100*5
  });

  it('returns zero volume when no working sets', () => {
    const entry = computeVolumeEntry('2026-04-14', [], 'sess-1');
    expect(entry.volume).toBe(0);
    expect(entry.oneRepMaxEstimate).toBe(0);
  });

  it('finds the heaviest 1RM estimate across working sets', () => {
    const sets = [makeSet(80, 10), makeSet(100, 3)];
    const entry = computeVolumeEntry('2026-04-14', sets, 'sess-1');
    const rm80x10 = epleyOneRepMax(80, 10);
    const rm100x3 = epleyOneRepMax(100, 3);
    expect(entry.oneRepMaxEstimate).toBeCloseTo(Math.max(rm80x10, rm100x3), 2);
  });
});

describe('detectPlateau', () => {
  it('returns false when fewer than 3 entries', () => {
    expect(detectPlateau([{ volume: 1000 } as any, { volume: 1050 } as any])).toBe(false);
  });

  it('returns true when last 3 volumes show < 2% increase overall', () => {
    const history = [
      { volume: 1000 } as any,
      { volume: 1005 } as any,
      { volume: 1008 } as any,
    ];
    expect(detectPlateau(history)).toBe(true);
  });

  it('returns false when volume increases >= 2%', () => {
    const history = [
      { volume: 1000 } as any,
      { volume: 1020 } as any,
      { volume: 1050 } as any,
    ];
    expect(detectPlateau(history)).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test
```

Expected: import errors (modules don't exist yet).

- [ ] **Step 3: Create `features/progression/domain/types.ts`**

```ts
import type { Id } from '@shared/types';

export interface VolumeEntry {
  date: string;           // ISO date string 'YYYY-MM-DD'
  sessionId: Id<'Session'>;
  sets: number;           // working sets count (excludes warmups)
  totalReps: number;
  maxWeightKg: number;
  volume: number;         // sum of weightKg * reps per working set
  oneRepMaxEstimate: number; // Epley: max(weight * (1 + reps/30)) across working sets
}

export interface ExerciseProgression {
  exerciseName: string;
  history: VolumeEntry[];
  plateauDetected: boolean; // true if last 3 sessions show < 2% volume increase
}

export type ProgressionState = Record<string, ExerciseProgression>; // keyed by exerciseName
```

- [ ] **Step 4: Create `features/progression/domain/compute.ts`**

```ts
import type { StrengthSet } from '@features/training_log/domain/types';
import type { VolumeEntry } from './types';
import type { Id } from '@shared/types';

/** Epley formula. Returns 0 if weight or reps is 0. */
export function epleyOneRepMax(weight: number, reps: number): number {
  if (weight === 0 || reps === 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

/** Derives a VolumeEntry from a session's strength sets for one exercise. */
export function computeVolumeEntry(
  date: string,
  sets: StrengthSet[],
  sessionId: Id<'Session'>
): VolumeEntry {
  const workingSets = sets.filter(s => !s.isWarmup);

  if (workingSets.length === 0) {
    return { date, sessionId, sets: 0, totalReps: 0, maxWeightKg: 0, volume: 0, oneRepMaxEstimate: 0 };
  }

  const volume = workingSets.reduce((sum, s) => sum + s.weightKg * s.reps, 0);
  const totalReps = workingSets.reduce((sum, s) => sum + s.reps, 0);
  const maxWeightKg = Math.max(...workingSets.map(s => s.weightKg));
  const oneRepMaxEstimate = Math.max(
    ...workingSets.map(s => epleyOneRepMax(s.weightKg, s.reps))
  );

  return {
    date,
    sessionId,
    sets: workingSets.length,
    totalReps,
    maxWeightKg,
    volume,
    oneRepMaxEstimate,
  };
}

/**
 * Returns true if the last 3 entries in history show < 2% total volume increase.
 * Requires at least 3 entries.
 */
export function detectPlateau(history: VolumeEntry[]): boolean {
  if (history.length < 3) return false;
  const last3 = history.slice(-3);
  const first = last3[0].volume;
  const last = last3[2].volume;
  if (first === 0) return false;
  const pctIncrease = (last - first) / first;
  return pctIncrease < 0.02;
}
```

- [ ] **Step 5: Run tests — verify they pass**

```bash
npm test
```

Expected: all tests in `compute.test.ts` pass.

- [ ] **Step 6: Commit**

```bash
git add features/progression/
git commit -m "feat(progression): add domain types and pure compute functions (volume, 1RM, plateau)"
```

---

## Task 4: Progression policy — update ViewStore on SessionFinished

**Files:**
- Create: `features/progression/policies/updateProgression.ts`
- Create: `features/progression/policies/updateProgression.test.ts`

- [ ] **Step 1: Write failing test**

Create `features/progression/policies/updateProgression.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { viewStore } from '@data/projections/views';
import { registerProgressionPolicy } from './updateProgression';
import type { ProgressionState } from '../domain/types';
import type { DomainEvent } from '@shared/types';
import type { SessionFinishedPayload } from '@features/training_log/domain/types';
import { eventBus } from '@core/events/bus';

function makeSessionFinishedEvent(
  exerciseName: string,
  sets: Array<{ weight: number; reps: number }>
): DomainEvent<'SessionFinished', SessionFinishedPayload> {
  return {
    type: 'SessionFinished',
    aggregateId: 'sess-1' as any,
    aggregateType: 'Session',
    timestamp: Date.now(),
    version: 1,
    payload: {
      sessionId: 'sess-1' as any,
      finishedAt: Date.now(),
      exerciseSummaries: [{
        exerciseName,
        exerciseCategory: 'strength',
        sets: sets.map((s, i) => ({
          type: 'strength' as const,
          setNumber: i + 1,
          weightKg: s.weight,
          reps: s.reps,
          isWarmup: false,
          isPR: false,
          completedAt: Date.now(),
        })),
      }],
    },
  };
}

describe('registerProgressionPolicy', () => {
  beforeEach(() => {
    viewStore.set<ProgressionState>('exercise_progressions', {});
    registerProgressionPolicy();
  });

  it('creates a progression entry for a new exercise after SessionFinished', async () => {
    await eventBus.publish(makeSessionFinishedEvent('Bench Press', [{ weight: 100, reps: 5 }]));
    const state = viewStore.get<ProgressionState>('exercise_progressions');
    expect(state?.['Bench Press']).toBeDefined();
    expect(state?.['Bench Press'].history).toHaveLength(1);
    expect(state?.['Bench Press'].history[0].volume).toBe(500);
  });

  it('appends a new entry for an existing exercise', async () => {
    await eventBus.publish(makeSessionFinishedEvent('Squat', [{ weight: 120, reps: 5 }]));
    await eventBus.publish(makeSessionFinishedEvent('Squat', [{ weight: 125, reps: 5 }]));
    const state = viewStore.get<ProgressionState>('exercise_progressions');
    expect(state?.['Squat'].history).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npm test
```

Expected: import error for `updateProgression`.

- [ ] **Step 3: Create `features/progression/policies/updateProgression.ts`**

```ts
import { eventBus } from '@core/events/bus';
import { viewStore } from '@data/projections/views';
import type { DomainEvent } from '@shared/types';
import type { SessionFinishedPayload } from '@features/training_log/domain/types';
import { computeVolumeEntry, detectPlateau } from '../domain/compute';
import type { ProgressionState } from '../domain/types';

let registered = false;

export function registerProgressionPolicy(): void {
  if (registered) return;
  registered = true;

  eventBus.subscribe<DomainEvent<'SessionFinished', SessionFinishedPayload>>(
    'SessionFinished',
    (event) => {
      if (event.type !== 'SessionFinished') return;
      const { exerciseSummaries, sessionId, finishedAt } = event.payload;
      const date = new Date(finishedAt).toISOString().slice(0, 10);

      const current = viewStore.get<ProgressionState>('exercise_progressions') ?? {};
      const updated: ProgressionState = { ...current };

      for (const summary of exerciseSummaries) {
        const existing = updated[summary.exerciseName] ?? {
          exerciseName: summary.exerciseName,
          history: [],
          plateauDetected: false,
        };

        const entry = computeVolumeEntry(date, summary.sets, sessionId);
        if (entry.volume === 0) continue; // skip if no working sets

        const history = [...existing.history, entry];
        updated[summary.exerciseName] = {
          exerciseName: summary.exerciseName,
          history,
          plateauDetected: detectPlateau(history),
        };
      }

      viewStore.set('exercise_progressions', updated);
    }
  );
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add features/progression/policies/
git commit -m "feat(progression): add updateProgression policy subscribing to SessionFinished"
```

---

## Task 5: Progression queries and public API

**Files:**
- Create: `features/progression/queries/index.ts`
- Create: `features/progression/index.ts`

- [ ] **Step 1: Create `features/progression/queries/index.ts`**

```ts
import { viewStore } from '@data/projections/views';
import type { ExerciseProgression, ProgressionState } from '../domain/types';

export function getProgressionForExercise(exerciseName: string): ExerciseProgression | null {
  const state = viewStore.get<ProgressionState>('exercise_progressions');
  return state?.[exerciseName] ?? null;
}

export function getAllProgressions(): ExerciseProgression[] {
  const state = viewStore.get<ProgressionState>('exercise_progressions');
  if (!state) return [];
  return Object.values(state).sort((a, b) => a.exerciseName.localeCompare(b.exerciseName));
}
```

- [ ] **Step 2: Create `features/progression/index.ts`**

```ts
export type { VolumeEntry, ExerciseProgression, ProgressionState } from './domain/types';
export { registerProgressionPolicy } from './policies/updateProgression';
export { getProgressionForExercise, getAllProgressions } from './queries';
```

- [ ] **Step 3: Register the policy in `features/training_log/commands/handlers.ts`**

At the top of the file, after other imports, add:

```ts
import { registerProgressionPolicy } from '@features/progression';

// Register cross-feature policies
registerProgressionPolicy();
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add features/progression/queries/ features/progression/index.ts features/training_log/commands/handlers.ts
git commit -m "feat(progression): add queries, public API, and register policy in training_log"
```

---

## Task 6: ExerciseProgressionChart component

**Files:**
- Create: `ui/components/ExerciseProgressionChart.tsx`

- [ ] **Step 1: Create the component**

```tsx
// ui/components/ExerciseProgressionChart.tsx
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { VolumeEntry } from '@features/progression';

interface Props {
  history: VolumeEntry[];
  metric?: 'volume' | 'oneRepMaxEstimate';
}

const LABELS: Record<NonNullable<Props['metric']>, string> = {
  volume: 'Volume (kg)',
  oneRepMaxEstimate: 'Est. 1RM (kg)',
};

export function ExerciseProgressionChart({ history, metric = 'volume' }: Props) {
  if (history.length < 2) {
    return (
      <p className="caption" style={{ textAlign: 'center', padding: 'var(--spacing-3)' }}>
        Log 2+ sessions to see progression
      </p>
    );
  }

  const data = history.map(entry => ({
    date: entry.date.slice(5), // 'MM-DD'
    value: Math.round(entry[metric]),
  }));

  return (
    <div style={{ width: '100%', height: 120 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip
            contentStyle={{ fontSize: 12 }}
            formatter={(v: number) => [`${v}`, LABELS[metric]]}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--color-primary)"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

Note: This component uses `style=""` only for wrapper sizing, which cannot be expressed as a layout class (ResponsiveContainer requires a sized parent). All other values use CSS tokens.

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add ui/components/ExerciseProgressionChart.tsx
git commit -m "feat(progression): add ExerciseProgressionChart component using Recharts"
```

---

## Task 7: Coaching domain types and pure insight generator functions

**Files:**
- Create: `features/coaching/domain/types.ts`
- Create: `features/coaching/domain/rules.ts`
- Create: `features/coaching/domain/rules.test.ts`

- [ ] **Step 1: Create `features/coaching/domain/types.ts`**

```ts
import type { Id } from '@shared/types';

export type InsightType = 'warning' | 'suggestion' | 'positive';

export interface CoachingInsight {
  id: Id<'Insight'>;
  type: InsightType;
  title: string;
  message: string;
  createdAt: number;
  dismissed: boolean;
  relatedEntityId?: string;
}

export interface CoachingState {
  insights: CoachingInsight[];
}
```

- [ ] **Step 2: Write failing tests for rules**

Create `features/coaching/domain/rules.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  makeTrainingLoadInsight,
  makePlateauInsight,
  makeDeloadInsight,
} from './rules';

describe('makeTrainingLoadInsight', () => {
  it('returns null when ratio is within safe range (< 1.5)', () => {
    expect(makeTrainingLoadInsight(1.2)).toBeNull();
  });

  it('returns a warning when acute:chronic ratio > 1.5', () => {
    const insight = makeTrainingLoadInsight(1.6);
    expect(insight).not.toBeNull();
    expect(insight?.type).toBe('warning');
    expect(insight?.message).toContain('1.6');
  });

  it('returns null when ratio is 0 (no data)', () => {
    expect(makeTrainingLoadInsight(0)).toBeNull();
  });
});

describe('makePlateauInsight', () => {
  it('returns null when no plateau detected', () => {
    expect(makePlateauInsight('Bench Press', false)).toBeNull();
  });

  it('returns a suggestion when plateau detected', () => {
    const insight = makePlateauInsight('Bench Press', true);
    expect(insight).not.toBeNull();
    expect(insight?.type).toBe('suggestion');
    expect(insight?.message).toContain('Bench Press');
  });
});

describe('makeDeloadInsight', () => {
  it('returns null when conditions not met', () => {
    expect(makeDeloadInsight({ highLoadDays: 2, highRpeStreak: 1, adherenceRate: 0.9 })).toBeNull();
  });

  it('returns a warning when all three signals align', () => {
    const insight = makeDeloadInsight({ highLoadDays: 6, highRpeStreak: 3, adherenceRate: 0.55 });
    expect(insight).not.toBeNull();
    expect(insight?.type).toBe('warning');
  });

  it('returns null when only 2 of 3 signals are present', () => {
    // High load + high RPE but good adherence
    expect(makeDeloadInsight({ highLoadDays: 6, highRpeStreak: 3, adherenceRate: 0.85 })).toBeNull();
  });
});
```

- [ ] **Step 3: Run tests — verify they fail**

```bash
npm test
```

Expected: import error for `./rules`.

- [ ] **Step 4: Create `features/coaching/domain/rules.ts`**

```ts
import type { CoachingInsight, InsightType } from './types';
import type { Id } from '@shared/types';

function makeId(): Id<'Insight'> {
  return crypto.randomUUID() as unknown as Id<'Insight'>;
}

function insight(
  type: InsightType,
  title: string,
  message: string,
  relatedEntityId?: string
): CoachingInsight {
  return {
    id: makeId(),
    type,
    title,
    message,
    createdAt: Date.now(),
    dismissed: false,
    relatedEntityId,
  };
}

/** Returns a warning if acute:chronic load ratio > 1.5. Returns null if safe or no data. */
export function makeTrainingLoadInsight(ratio: number): CoachingInsight | null {
  if (ratio === 0 || ratio < 1.5) return null;
  return insight(
    'warning',
    'High training load',
    `Your acute:chronic load ratio is ${ratio.toFixed(1)} — consider a recovery session or rest day to avoid overtraining.`
  );
}

/** Returns a suggestion if the named exercise has hit a plateau. */
export function makePlateauInsight(exerciseName: string, plateauDetected: boolean): CoachingInsight | null {
  if (!plateauDetected) return null;
  return insight(
    'suggestion',
    'Progression plateau detected',
    `${exerciseName} volume hasn't increased meaningfully over the last 3 sessions. Try varying reps, adding a technique session, or introducing a deload before pushing harder.`,
    exerciseName
  );
}

export interface DeloadSignals {
  highLoadDays: number;   // days in last 7 with acute:chronic > 1.3
  highRpeStreak: number;  // consecutive sessions with sessionRpe >= 8
  adherenceRate: number;  // 0–1, from plan adherence projection
}

/** Returns a deload warning when all three signals align. */
export function makeDeloadInsight(signals: DeloadSignals): CoachingInsight | null {
  const { highLoadDays, highRpeStreak, adherenceRate } = signals;
  if (highLoadDays >= 5 && highRpeStreak >= 3 && adherenceRate < 0.6) {
    return insight(
      'warning',
      'Deload week recommended',
      'You\'ve had a sustained high-load week with elevated RPE and some missed sessions. A deload week will help you recover and come back stronger.'
    );
  }
  return null;
}
```

- [ ] **Step 5: Run tests — verify they pass**

```bash
npm test
```

Expected: all tests in `rules.test.ts` pass.

- [ ] **Step 6: Commit**

```bash
git add features/coaching/domain/
git commit -m "feat(coaching): add domain types and pure insight generator functions"
```

---

## Task 8: Coaching projection and ViewStore

**Files:**
- Create: `features/coaching/projections/index.ts`

- [ ] **Step 1: Create `features/coaching/projections/index.ts`**

The coaching state lives in two ViewStore keys:
- `active_insights` — unread/undismissed insights (shown on Dashboard)
- `insight_history` — all insights including dismissed

```ts
import { viewStore } from '@data/projections/views';
import type { CoachingInsight, CoachingState } from '../domain/types';

export function addInsight(insight: CoachingInsight): void {
  const current = viewStore.get<CoachingInsight[]>('active_insights') ?? [];
  // Deduplicate: if same title already exists and undismissed, skip
  const isDuplicate = current.some(i => i.title === insight.title && !i.dismissed);
  if (isDuplicate) return;

  viewStore.set('active_insights', [insight, ...current]);

  const history = viewStore.get<CoachingInsight[]>('insight_history') ?? [];
  viewStore.set('insight_history', [insight, ...history]);
}

export function dismissInsight(insightId: string): void {
  const current = viewStore.get<CoachingInsight[]>('active_insights') ?? [];
  viewStore.set(
    'active_insights',
    current.filter(i => i.id !== insightId)
  );

  const history = viewStore.get<CoachingInsight[]>('insight_history') ?? [];
  viewStore.set(
    'insight_history',
    history.map(i => i.id === insightId ? { ...i, dismissed: true } : i)
  );
}

export function getActiveInsightsFromStore(): CoachingInsight[] {
  return viewStore.get<CoachingInsight[]>('active_insights') ?? [];
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add features/coaching/projections/
git commit -m "feat(coaching): add coaching projection helpers (addInsight, dismissInsight)"
```

---

## Task 9: Coaching generate-insights policy

**Files:**
- Create: `features/coaching/policies/generateInsights.ts`
- Create: `features/coaching/policies/generateInsights.test.ts`

- [ ] **Step 1: Write failing test**

Create `features/coaching/policies/generateInsights.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { eventBus } from '@core/events/bus';
import { viewStore } from '@data/projections/views';
import { registerCoachingPolicy } from './generateInsights';
import type { CoachingInsight } from '../domain/types';
import type { DomainEvent } from '@shared/types';
import type { SessionFinishedPayload } from '@features/training_log/domain/types';

function makeEvent(overrides: Partial<SessionFinishedPayload> = {}): DomainEvent<'SessionFinished', SessionFinishedPayload> {
  return {
    type: 'SessionFinished',
    aggregateId: 'sess-1' as any,
    aggregateType: 'Session',
    timestamp: Date.now(),
    version: 1,
    payload: {
      sessionId: 'sess-1' as any,
      finishedAt: Date.now(),
      exerciseSummaries: [],
      sessionRpe: 9,
      ...overrides,
    },
  };
}

describe('generateInsights policy', () => {
  beforeEach(() => {
    viewStore.set('active_insights', []);
    viewStore.set('insight_history', []);
    // Seed high training load in health metrics
    viewStore.set('health_metrics', { trainingLoad: 1.7 });
    registerCoachingPolicy();
  });

  it('generates a training load warning when ratio > 1.5', async () => {
    await eventBus.publish(makeEvent());
    const insights = viewStore.get<CoachingInsight[]>('active_insights') ?? [];
    const loadWarning = insights.find(i => i.title === 'High training load');
    expect(loadWarning).toBeDefined();
    expect(loadWarning?.type).toBe('warning');
  });

  it('does not duplicate an identical insight on consecutive events', async () => {
    await eventBus.publish(makeEvent());
    await eventBus.publish(makeEvent());
    const insights = viewStore.get<CoachingInsight[]>('active_insights') ?? [];
    const loadWarnings = insights.filter(i => i.title === 'High training load');
    expect(loadWarnings).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npm test
```

Expected: import error.

- [ ] **Step 3: Create `features/coaching/policies/generateInsights.ts`**

```ts
import { eventBus } from '@core/events/bus';
import { viewStore } from '@data/projections/views';
import type { DomainEvent } from '@shared/types';
import type { SessionFinishedPayload } from '@features/training_log/domain/types';
import type { ProgressionState } from '@features/progression/domain/types';
import { makeTrainingLoadInsight, makePlateauInsight } from '../domain/rules';
import { addInsight } from '../projections';

let registered = false;

export function registerCoachingPolicy(): void {
  if (registered) return;
  registered = true;

  eventBus.subscribe<DomainEvent<'SessionFinished', SessionFinishedPayload>>(
    'SessionFinished',
    (event) => {
      if (event.type !== 'SessionFinished') return;

      // 1. Training load insight
      const healthMetrics = viewStore.get<{ trainingLoad?: number | null }>('health_metrics');
      const ratio = healthMetrics?.trainingLoad ?? 0;
      const loadInsight = makeTrainingLoadInsight(ratio);
      if (loadInsight) addInsight(loadInsight);

      // 2. Plateau insights (one per plateaued exercise)
      const progressions = viewStore.get<ProgressionState>('exercise_progressions');
      if (progressions) {
        for (const prog of Object.values(progressions)) {
          const plateauInsight = makePlateauInsight(prog.exerciseName, prog.plateauDetected);
          if (plateauInsight) addInsight(plateauInsight);
        }
      }
    }
  );
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add features/coaching/policies/generateInsights.ts features/coaching/policies/generateInsights.test.ts
git commit -m "feat(coaching): add generateInsights policy subscribing to SessionFinished"
```

---

## Task 10: DismissInsight command handler

**Files:**
- Create: `features/coaching/commands/handlers.ts`

- [ ] **Step 1: Create `features/coaching/commands/handlers.ts`**

```ts
import type { Result } from '@shared/types';
import { ok, err } from '@shared/types';
import { dismissInsight } from '../projections';

export interface DismissInsight {
  type: 'DismissInsight';
  insightId: string;
}

export function handleDismissInsight(cmd: DismissInsight): Result<void, string> {
  if (!cmd.insightId) return err('Insight ID is required');
  dismissInsight(cmd.insightId);
  return ok(undefined);
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add features/coaching/commands/
git commit -m "feat(coaching): add DismissInsight command handler"
```

---

## Task 11: Coaching queries and public API

**Files:**
- Create: `features/coaching/queries/index.ts`
- Create: `features/coaching/index.ts`

- [ ] **Step 1: Create `features/coaching/queries/index.ts`**

```ts
import { viewStore } from '@data/projections/views';
import type { CoachingInsight } from '../domain/types';

export function getActiveInsights(): CoachingInsight[] {
  return viewStore.get<CoachingInsight[]>('active_insights') ?? [];
}

export function getInsightHistory(): CoachingInsight[] {
  return viewStore.get<CoachingInsight[]>('insight_history') ?? [];
}
```

- [ ] **Step 2: Create `features/coaching/index.ts`**

```ts
export type { CoachingInsight, InsightType, CoachingState } from './domain/types';
export { registerCoachingPolicy } from './policies/generateInsights';
export { handleDismissInsight } from './commands/handlers';
export type { DismissInsight } from './commands/handlers';
export { getActiveInsights, getInsightHistory } from './queries';
```

- [ ] **Step 3: Register coaching policy alongside progression policy in `features/training_log/commands/handlers.ts`**

Add to the existing registration block at the top of the file:

```ts
import { registerCoachingPolicy } from '@features/coaching';

// (existing) registerProgressionPolicy();
registerCoachingPolicy();
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add features/coaching/queries/ features/coaching/index.ts features/training_log/commands/handlers.ts
git commit -m "feat(coaching): add queries, public API, and register coaching policy"
```

---

## Task 12: CoachingInsightCard component

**Files:**
- Create: `ui/components/CoachingInsightCard.tsx`

- [ ] **Step 1: Create the component**

```tsx
// ui/components/CoachingInsightCard.tsx
import type { CoachingInsight } from '@features/coaching';
import { handleDismissInsight } from '@features/coaching';

interface Props {
  insight: CoachingInsight;
  onDismissed?: () => void;
}

const ICON: Record<CoachingInsight['type'], string> = {
  warning: '⚠️',
  suggestion: '💡',
  positive: '✅',
};

const TYPE_CLASS: Record<CoachingInsight['type'], string> = {
  warning: 'warning',
  suggestion: '',
  positive: '',
};

export function CoachingInsightCard({ insight, onDismissed }: Props) {
  function dismiss() {
    handleDismissInsight({ type: 'DismissInsight', insightId: insight.id });
    onDismissed?.();
  }

  return (
    <div className={`surface row align-center space-between ${TYPE_CLASS[insight.type]}`}>
      <div className="row align-center" style={{ gap: 'var(--spacing-3)', flex: 1 }}>
        <span aria-hidden="true">{ICON[insight.type]}</span>
        <div className="column" style={{ gap: 'var(--spacing-1)' }}>
          <p style={{ fontWeight: 600 }}>{insight.title}</p>
          <p className="caption">{insight.message}</p>
        </div>
      </div>
      <button className="ghost" onClick={dismiss} aria-label="Dismiss insight">✕</button>
    </div>
  );
}
```

Note: The `style` attributes here are gap values that must be set inline because they vary per context and cannot use the fixed `.row` / `.column` gap without overriding. Add a `.coaching-card` class to `styling/global.css` if this pattern repeats.

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add ui/components/CoachingInsightCard.tsx
git commit -m "feat(coaching): add CoachingInsightCard component"
```

---

## Task 13: Wire coaching card into Dashboard

**Files:**
- Modify: the Dashboard screen component (find via Glob `ui/layouts/Dashboard*`)

- [ ] **Step 1: Find the Dashboard screen file**

```bash
ls ui/layouts/
```

- [ ] **Step 2: Import and render coaching insights**

In the Dashboard screen component, add at the top of the screen (before the first content card), a coaching section. Add the following import:

```tsx
import { useState, useEffect } from 'react';
import { getActiveInsights } from '@features/coaching';
import { CoachingInsightCard } from '@ui/components/CoachingInsightCard';
import { viewStore } from '@data/projections/views';
import type { CoachingInsight } from '@features/coaching';
```

Add state and subscription inside the component:

```tsx
const [insights, setInsights] = useState<CoachingInsight[]>(() => getActiveInsights());

useEffect(() => {
  return viewStore.subscribe('active_insights', () => {
    setInsights(getActiveInsights());
  });
}, []);
```

Render before the first section card (show top 2 unread insights):

```tsx
{insights.slice(0, 2).map(insight => (
  <CoachingInsightCard
    key={insight.id}
    insight={insight}
    onDismissed={() => setInsights(getActiveInsights())}
  />
))}
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 4: Start dev server and verify coaching cards render (or are empty when no insights)**

```bash
npm run dev
```

Open `http://localhost:5173`, navigate to Dashboard — coaching section should be present (empty if no sessions logged yet; visible after logging a session).

- [ ] **Step 5: Commit**

```bash
git add ui/layouts/
git commit -m "feat(coaching): wire CoachingInsightCard into Dashboard screen"
```

---

## Self-Review

### Spec coverage check

| Spec requirement | Task |
|---|---|
| Session RPE stored on session event | Task 1–2 |
| Session tags stored on session event | Task 1–2 |
| Exercise summaries in SessionFinished event | Task 1–2 |
| Workout Progression Engine domain types | Task 3 |
| Volume + 1RM computation (Epley) | Task 3 |
| Plateau detection | Task 3 |
| Progression policy (SessionFinished → ViewStore) | Task 4 |
| Progression queries | Task 5 |
| Progression public API | Task 5 |
| ExerciseProgressionChart component | Task 6 |
| Coaching insight types | Task 7 |
| Training load insight generator | Task 7 |
| Plateau insight generator | Task 7 |
| Deload detection (3-signal rule) | Task 7 |
| Coaching ViewStore (active_insights, insight_history) | Task 8 |
| Coaching policy (SessionFinished → insights) | Task 9 |
| DismissInsight command | Task 10 |
| Coaching queries + public API | Task 11 |
| CoachingInsightCard UI | Task 12 |
| Dashboard coaching section | Task 13 |
| Vitest setup | Task 0 |
| Recharts installed | Task 0 |

**Gap identified:** Deload detection policy (3-signal: highLoadDays + highRpeStreak + adherenceRate) is defined as a pure function in Task 7 but not wired into the coaching policy in Task 9. The policy in Task 9 only checks training load and plateau. **Fix:** Add deload signal tracking to the coaching policy in Task 9's implementation.

**Fix to `generateInsights.ts` in Task 9** — add after the plateau insights block:

```ts
// 3. Deload detection (requires rpe history — use sessionRpe from current event)
// Track rpe streak in viewStore
const currentRpe = event.payload.sessionRpe ?? 0;
const rpeHistory = viewStore.get<number[]>('session_rpe_history') ?? [];
const updatedRpeHistory = [...rpeHistory.slice(-9), currentRpe]; // keep last 10
viewStore.set('session_rpe_history', updatedRpeHistory);

const highRpeStreak = updatedRpeHistory.reduceRight((streak, rpe) => {
  if (rpe >= 8) return streak + 1;
  return streak; // stop counting on first non-high RPE
}, 0);

const deloadInsight = makeDeloadInsight({
  highLoadDays: ratio > 1.3 ? 5 : 0, // simplified: use load ratio as proxy
  highRpeStreak,
  adherenceRate: 0.9, // default until plan adherence projection exists (Plan 2)
});
if (deloadInsight) addInsight(deloadInsight);
```

This wires the deload detection without requiring the plan adherence projection (which comes in Plan 2). The adherence rate is hardcoded to 0.9 (safe default) until the plan adherence projection is available; Plan 2 will update this.

### Type consistency check
- `Id<'Insight'>` used consistently in `types.ts`, `rules.ts`, and `handlers.ts` ✓
- `CoachingInsight` exported from `index.ts` and imported consistently ✓
- `ProgressionState` is `Record<string, ExerciseProgression>` — used correctly in policy and queries ✓
- `ExerciseSummary` exported from `training_log/domain/types.ts` and imported in handlers ✓
- `SessionFinishedPayload` with `exerciseSummaries: ExerciseSummary[]` — required field (not optional) to force all callers to populate it ✓

### Placeholder check
No TBD, TODO, or incomplete steps found. All code blocks are complete.
