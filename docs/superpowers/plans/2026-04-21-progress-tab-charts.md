# Progress Tab: Mock Activities + Charts

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Populate the Progress tab with realistic mock lift sessions and cardio sessions, then add an exercise scatter chart (weight over time per set), a weekly volume chart, and per-sport monthly distance sparklines.

**Architecture:** Mock data lives in `data/mock/` and is seeded into `viewStore` at startup only when the keys are empty (preserving real user data). Pure data-derivation helpers are extracted to `ui/layouts/progressHelpers.ts` for testability. The `ExerciseProgressChart` component is added to the existing `Charts.tsx`.

**Tech Stack:** TypeScript, React, Recharts 3.x, Vitest

---

## File Map

| Action  | Path                                   | Responsibility                                      |
|---------|----------------------------------------|-----------------------------------------------------|
| Create  | `data/mock/sessions.ts`                | `MOCK_SESSION_HISTORY` + `MOCK_EXERCISE_SETS`       |
| Create  | `data/mock/sessions.test.ts`           | Shape / value tests for above                       |
| Create  | `data/mock/cardio.ts`                  | `MOCK_CARDIO_SESSIONS`                              |
| Create  | `data/mock/cardio.test.ts`             | Shape / value tests for above                       |
| Create  | `ui/layouts/progressHelpers.ts`        | `weeklyVolume` + `monthlySportKm` pure functions    |
| Create  | `ui/layouts/progressHelpers.test.ts`   | Unit tests for both helpers                         |
| Modify  | `app/entrypoints/index.tsx`            | Seed viewStore from mock data on first load         |
| Modify  | `ui/components/Charts.tsx`             | Add `ExerciseProgressChart`                         |
| Modify  | `ui/layouts/ProgressScreen.tsx`        | Wire dropdown, exercise chart, volume, sparklines   |

---

## Task 1: Mock lift sessions and exercise set data

**Files:**
- Create: `data/mock/sessions.ts`
- Create: `data/mock/sessions.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `data/mock/sessions.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { MOCK_SESSION_HISTORY, MOCK_EXERCISE_SETS } from './sessions';

describe('MOCK_SESSION_HISTORY', () => {
  it('has 12 sessions', () => {
    expect(MOCK_SESSION_HISTORY).toHaveLength(12);
  });
  it('all sessions have category strength', () => {
    for (const s of MOCK_SESSION_HISTORY) {
      expect(s.category).toBe('strength');
    }
  });
  it('sessions are sorted oldest to newest', () => {
    for (let i = 1; i < MOCK_SESSION_HISTORY.length; i++) {
      expect(MOCK_SESSION_HISTORY[i].startedAt).toBeGreaterThan(MOCK_SESSION_HISTORY[i - 1].startedAt);
    }
  });
  it('at least one session has hasPR true', () => {
    expect(MOCK_SESSION_HISTORY.some(s => s.hasPR)).toBe(true);
  });
  it('durationSeconds equals finishedAt minus startedAt', () => {
    for (const s of MOCK_SESSION_HISTORY) {
      expect(s.durationSeconds).toBe(Math.round((s.finishedAt - s.startedAt) / 1000));
    }
  });
});

describe('MOCK_EXERCISE_SETS', () => {
  it('has exactly 4 exercises', () => {
    expect(Object.keys(MOCK_EXERCISE_SETS)).toHaveLength(4);
  });
  it('each exercise has at least 10 sessions', () => {
    for (const [name, entries] of Object.entries(MOCK_EXERCISE_SETS)) {
      expect(entries.length, `${name} should have >= 10 entries`).toBeGreaterThanOrEqual(10);
    }
  });
  it('each session has exactly one warmup set', () => {
    for (const entries of Object.values(MOCK_EXERCISE_SETS)) {
      for (const entry of entries) {
        expect(entry.sets.filter(s => s.isWarmup)).toHaveLength(1);
      }
    }
  });
  it('working sets have higher weight than the warmup set', () => {
    for (const entries of Object.values(MOCK_EXERCISE_SETS)) {
      for (const entry of entries) {
        const warmup = entry.sets.find(s => s.isWarmup)!;
        for (const s of entry.sets.filter(s => !s.isWarmup)) {
          expect(s.weightKg).toBeGreaterThan(warmup.weightKg);
        }
      }
    }
  });
  it('entries are sorted oldest to newest per exercise', () => {
    for (const entries of Object.values(MOCK_EXERCISE_SETS)) {
      for (let i = 1; i < entries.length; i++) {
        expect(entries[i].date).toBeGreaterThan(entries[i - 1].date);
      }
    }
  });
  it('at least one session has a failed set', () => {
    const allSets = Object.values(MOCK_EXERCISE_SETS).flatMap(e => e.flatMap(s => s.sets));
    expect(allSets.some(s => s.failed)).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests — expect failure**

```
npx vitest run data/mock/sessions.test.ts
```
Expected: FAIL — "Cannot find module './sessions'"

- [ ] **Step 3: Create `data/mock/sessions.ts`**

```ts
import type { SessionHistoryItem } from '@features/training_log';
import type { Id } from '@shared/types';

export interface ExerciseSetEntry {
  date: number;
  sets: { weightKg: number; reps: number; isWarmup: boolean; failed?: boolean }[];
}

const d = (iso: string) => new Date(iso).getTime();

function session(
  id: string, name: string, dateIso: string,
  durationMin: number, totalSets: number, exerciseCount: number, hasPR: boolean,
): SessionHistoryItem {
  const startedAt = d(dateIso + 'T09:00:00');
  return {
    id: id as Id<'Session'>,
    name,
    startedAt,
    finishedAt: startedAt + durationMin * 60 * 1000,
    durationSeconds: durationMin * 60,
    totalSets,
    exerciseCount,
    hasPR,
    category: 'strength',
  };
}

export const MOCK_SESSION_HISTORY: SessionHistoryItem[] = [
  session('sess-01', 'Upper A', '2026-01-06', 75,  18, 4, false),
  session('sess-02', 'Lower A', '2026-01-13', 70,  16, 4, true),
  session('sess-03', 'Upper B', '2026-01-20', 80,  20, 5, false),
  session('sess-04', 'Lower B', '2026-01-27', 65,  14, 4, false),
  session('sess-05', 'Upper A', '2026-02-03', 75,  18, 4, true),
  session('sess-06', 'Lower A', '2026-02-10', 68,  16, 4, false),
  session('sess-07', 'Upper B', '2026-02-17', 82,  22, 5, true),
  session('sess-08', 'Lower B', '2026-02-24', 67,  15, 4, false),
  session('sess-09', 'Upper A', '2026-03-03', 78,  20, 4, false),
  session('sess-10', 'Lower A', '2026-03-10', 72,  18, 4, true),
  session('sess-11', 'Upper B', '2026-03-17', 85,  24, 5, false),
  session('sess-12', 'Lower B', '2026-03-24', 70,  16, 4, false),
];

function s(
  dateIso: string,
  warmupKg: number,
  working: [number, number, true?][],
): ExerciseSetEntry {
  return {
    date: d(dateIso),
    sets: [
      { weightKg: warmupKg, reps: 5, isWarmup: true },
      ...working.map(([kg, reps, failed]) => ({
        weightKg: kg, reps, isWarmup: false, ...(failed ? { failed: true } : {}),
      })),
    ],
  };
}

export const MOCK_EXERCISE_SETS: Record<string, ExerciseSetEntry[]> = {
  'Squat': [
    s('2026-01-06', 60, [[80,5], [82.5,5], [85,3]]),
    s('2026-01-13', 60, [[82.5,5], [85,5], [87.5,3]]),
    s('2026-01-20', 65, [[85,5], [87.5,5], [90,3]]),
    s('2026-01-27', 65, [[87.5,5], [90,5], [92.5,3]]),
    s('2026-02-03', 70, [[90,5], [92.5,5], [95,3]]),
    s('2026-02-10', 70, [[92.5,5], [95,5], [97.5,3]]),
    s('2026-02-17', 70, [[95,5], [97.5,5], [100,3]]),
    s('2026-02-24', 75, [[97.5,5], [100,3], [102.5,1,true]]),
    s('2026-03-03', 75, [[97.5,5], [100,5], [102.5,3]]),
    s('2026-03-10', 75, [[100,5], [102.5,5], [105,3]]),
    s('2026-03-17', 80, [[102.5,5], [105,5], [107.5,3]]),
    s('2026-03-24', 80, [[105,5], [107.5,5], [110,2]]),
  ],
  'Bench Press': [
    s('2026-01-06', 50, [[70,5], [72.5,5], [75,3]]),
    s('2026-01-13', 50, [[72.5,5], [75,5], [77.5,3]]),
    s('2026-01-20', 55, [[75,5], [77.5,5], [80,3]]),
    s('2026-01-27', 55, [[77.5,5], [80,5], [82.5,3]]),
    s('2026-02-03', 55, [[80,5], [82.5,5], [85,3]]),
    s('2026-02-10', 60, [[82.5,5], [85,5], [87.5,3]]),
    s('2026-02-17', 60, [[85,5], [87.5,5], [90,3]]),
    s('2026-02-24', 60, [[87.5,5], [90,3], [92.5,1,true]]),
    s('2026-03-03', 60, [[87.5,5], [90,5], [92.5,3]]),
    s('2026-03-10', 65, [[90,5], [92.5,5], [95,3]]),
    s('2026-03-17', 65, [[92.5,5], [95,5], [97.5,3]]),
    s('2026-03-24', 65, [[95,5], [97.5,5], [100,2]]),
  ],
  'Deadlift': [
    s('2026-01-06', 80,  [[97.5,5], [100,5],  [105,3]]),
    s('2026-01-13', 80,  [[100,5],  [105,5],  [107.5,3]]),
    s('2026-01-20', 85,  [[105,5],  [107.5,5],[110,3]]),
    s('2026-01-27', 85,  [[107.5,5],[110,5],  [112.5,3]]),
    s('2026-02-03', 90,  [[110,5],  [112.5,5],[115,3]]),
    s('2026-02-10', 90,  [[112.5,5],[115,5],  [117.5,3]]),
    s('2026-02-17', 90,  [[115,5],  [117.5,5],[120,3]]),
    s('2026-02-24', 90,  [[117.5,5],[120,3],  [125,1,true]]),
    s('2026-03-03', 90,  [[117.5,5],[120,5],  [122.5,3]]),
    s('2026-03-10', 95,  [[120,5],  [122.5,5],[125,3]]),
    s('2026-03-17', 95,  [[122.5,5],[125,5],  [127.5,3]]),
    s('2026-03-24', 100, [[125,5],  [127.5,5],[130,2]]),
  ],
  'Overhead Press': [
    s('2026-01-06', 30, [[50,5], [52.5,5], [55,3]]),
    s('2026-01-13', 30, [[52.5,5],[55,5],  [57.5,3]]),
    s('2026-01-20', 32.5,[[55,5], [57.5,5],[60,3]]),
    s('2026-01-27', 32.5,[[57.5,5],[60,5], [62.5,3]]),
    s('2026-02-03', 35, [[60,5], [62.5,5], [65,3]]),
    s('2026-02-10', 35, [[62.5,5],[65,5],  [67.5,3]]),
    s('2026-02-17', 35, [[65,5],  [67.5,5],[70,3]]),
    s('2026-02-24', 37.5,[[67.5,5],[70,3], [72.5,1,true]]),
    s('2026-03-03', 37.5,[[67.5,5],[70,5], [72.5,3]]),
    s('2026-03-10', 37.5,[[70,5],  [72.5,5],[75,3]]),
    s('2026-03-17', 40, [[72.5,5],[75,5],  [77.5,3]]),
    s('2026-03-24', 40, [[75,5],  [77.5,5],[80,2]]),
  ],
};
```

- [ ] **Step 4: Run tests — expect pass**

```
npx vitest run data/mock/sessions.test.ts
```
Expected: all 7 tests pass.

- [ ] **Step 5: Commit**

```
git add data/mock/sessions.ts data/mock/sessions.test.ts
git commit -m "feat: add mock lift session history and exercise set data"
```

---

## Task 2: Mock cardio sessions

**Files:**
- Create: `data/mock/cardio.ts`
- Create: `data/mock/cardio.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `data/mock/cardio.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { MOCK_CARDIO_SESSIONS } from './cardio';

describe('MOCK_CARDIO_SESSIONS', () => {
  it('has 14 sessions total (8 runs + 4 cycles + 2 rows)', () => {
    expect(MOCK_CARDIO_SESSIONS).toHaveLength(14);
  });
  it('has 8 run sessions', () => {
    expect(MOCK_CARDIO_SESSIONS.filter(s => s.sport === 'run')).toHaveLength(8);
  });
  it('has 4 cycle sessions', () => {
    expect(MOCK_CARDIO_SESSIONS.filter(s => s.sport === 'cycle')).toHaveLength(4);
  });
  it('has 2 row sessions', () => {
    expect(MOCK_CARDIO_SESSIONS.filter(s => s.sport === 'row')).toHaveLength(2);
  });
  it('all sessions have positive distance and duration', () => {
    for (const s of MOCK_CARDIO_SESSIONS) {
      expect(s.distanceMeters).toBeGreaterThan(0);
      expect(s.durationSeconds).toBeGreaterThan(0);
    }
  });
  it('run sessions have a gpsTrack', () => {
    for (const s of MOCK_CARDIO_SESSIONS.filter(s => s.sport === 'run')) {
      expect(s.gpsTrack).toBeDefined();
    }
  });
  it('all ids are unique', () => {
    const ids = MOCK_CARDIO_SESSIONS.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
```

- [ ] **Step 2: Run tests — expect failure**

```
npx vitest run data/mock/cardio.test.ts
```
Expected: FAIL — "Cannot find module './cardio'"

- [ ] **Step 3: Create `data/mock/cardio.ts`**

```ts
import type { CardioSession } from '@features/cardio';
import type { Id } from '@shared/types';
import { generateMockRun } from '@data/mock/runs';

const uid = 'user-001' as Id<'User'>;

function run(
  id: string, dateIso: string, durationMin: number, distanceKm: number, avgHr = 155,
): CardioSession {
  return {
    id: id as Id<'CardioSession'>,
    userId: uid,
    sport: 'run',
    startedAt: new Date(dateIso).getTime(),
    durationSeconds: durationMin * 60,
    distanceMeters: distanceKm * 1000,
    notes: '',
    routeId: null,
    gpsTrack: generateMockRun({ date: new Date(dateIso), sport: 'run', durationMin, distanceKm, avgHr }),
  };
}

function cycle(
  id: string, dateIso: string, durationMin: number, distanceKm: number,
): CardioSession {
  return {
    id: id as Id<'CardioSession'>,
    userId: uid,
    sport: 'cycle',
    startedAt: new Date(dateIso).getTime(),
    durationSeconds: durationMin * 60,
    distanceMeters: distanceKm * 1000,
    notes: '',
    routeId: null,
    gpsTrack: generateMockRun({ date: new Date(dateIso), sport: 'cycle', durationMin, distanceKm, avgHr: 145 }),
  };
}

function row(
  id: string, dateIso: string, durationMin: number, distanceKm: number,
): CardioSession {
  return {
    id: id as Id<'CardioSession'>,
    userId: uid,
    sport: 'row',
    startedAt: new Date(dateIso).getTime(),
    durationSeconds: durationMin * 60,
    distanceMeters: distanceKm * 1000,
    notes: '',
    routeId: null,
  };
}

export const MOCK_CARDIO_SESSIONS: CardioSession[] = [
  // Runs
  run('cardio-run-01', '2026-01-08', 30,  5.5),
  run('cardio-run-02', '2026-01-15', 35,  6.2),
  run('cardio-run-03', '2026-01-22', 40,  7.0, 158),
  run('cardio-run-04', '2026-01-29', 28,  5.0),
  run('cardio-run-05', '2026-02-05', 42,  7.5, 160),
  run('cardio-run-06', '2026-02-19', 45,  8.0, 162),
  run('cardio-run-07', '2026-03-05', 50,  9.0, 160),
  run('cardio-run-08', '2026-03-19', 55, 10.0, 158),
  // Cycles
  cycle('cardio-cyc-01', '2026-01-11', 50, 22.0),
  cycle('cardio-cyc-02', '2026-02-01', 55, 25.0),
  cycle('cardio-cyc-03', '2026-02-22', 60, 28.0),
  cycle('cardio-cyc-04', '2026-03-15', 65, 30.0),
  // Rows
  row('cardio-row-01', '2026-01-18', 25, 5.0),
  row('cardio-row-02', '2026-03-01', 28, 5.5),
];
```

- [ ] **Step 4: Run tests — expect pass**

```
npx vitest run data/mock/cardio.test.ts
```
Expected: all 7 tests pass.

- [ ] **Step 5: Commit**

```
git add data/mock/cardio.ts data/mock/cardio.test.ts
git commit -m "feat: add mock cardio sessions (runs, cycles, rows)"
```

---

## Task 3: Progress data helpers

**Files:**
- Create: `ui/layouts/progressHelpers.ts`
- Create: `ui/layouts/progressHelpers.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `ui/layouts/progressHelpers.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { weeklyVolume, monthlySportKm } from './progressHelpers';
import type { SessionHistoryItem } from '@features/training_log';
import type { CardioSession } from '@features/cardio';
import type { Id } from '@shared/types';

const d = (iso: string) => new Date(iso).getTime();

function makeSession(dateIso: string, totalSets: number): SessionHistoryItem {
  const startedAt = d(dateIso + 'T09:00:00');
  return {
    id: 'x' as Id<'Session'>, name: 'Test', startedAt,
    finishedAt: startedAt + 3600000, durationSeconds: 3600,
    totalSets, exerciseCount: 3, hasPR: false, category: 'strength',
  };
}

function makeCardio(dateIso: string, sport: CardioSession['sport'], distanceKm: number): CardioSession {
  return {
    id: 'c' as Id<'CardioSession'>, userId: 'u' as Id<'User'>, sport,
    startedAt: d(dateIso), durationSeconds: 1800,
    distanceMeters: distanceKm * 1000, notes: '', routeId: null,
  };
}

describe('weeklyVolume', () => {
  it('returns empty array for no sessions', () => {
    expect(weeklyVolume([])).toEqual([]);
  });

  it('groups two sessions from the same week into one entry', () => {
    const sessions = [
      makeSession('2026-01-06', 10), // Tuesday
      makeSession('2026-01-08', 8),  // Thursday — same Mon week: 2026-01-05
    ];
    const result = weeklyVolume(sessions);
    expect(result).toHaveLength(1);
    expect(result[0].load).toBe(18);
  });

  it('produces separate entries for different weeks', () => {
    const sessions = [
      makeSession('2026-01-06', 10),
      makeSession('2026-01-13', 15),
    ];
    const result = weeklyVolume(sessions);
    expect(result).toHaveLength(2);
    expect(result[0].load).toBe(10);
    expect(result[1].load).toBe(15);
  });

  it('returns entries sorted oldest to newest', () => {
    const sessions = [
      makeSession('2026-01-13', 15),
      makeSession('2026-01-06', 10),
    ];
    const result = weeklyVolume(sessions);
    expect(result[0].date < result[1].date).toBe(true);
  });

  it('date key is the Monday of that week in YYYY-MM-DD format', () => {
    const sessions = [makeSession('2026-01-07', 12)]; // Wednesday Jan 7 → Monday Jan 5
    const result = weeklyVolume(sessions);
    expect(result[0].date).toBe('2026-01-05');
  });
});

describe('monthlySportKm', () => {
  it('returns empty array for no sessions', () => {
    expect(monthlySportKm([], 'run')).toEqual([]);
  });

  it('filters to the requested sport', () => {
    const sessions = [
      makeCardio('2026-01-10', 'run', 10),
      makeCardio('2026-01-15', 'cycle', 20),
    ];
    expect(monthlySportKm(sessions, 'run')).toHaveLength(1);
    expect(monthlySportKm(sessions, 'cycle')).toHaveLength(1);
  });

  it('sums km for sessions in the same month', () => {
    const sessions = [
      makeCardio('2026-01-10', 'run', 5.5),
      makeCardio('2026-01-20', 'run', 6.0),
    ];
    const result = monthlySportKm(sessions, 'run');
    expect(result).toHaveLength(1);
    expect(result[0].y).toBeCloseTo(11.5, 1);
  });

  it('produces separate entries for different months', () => {
    const sessions = [
      makeCardio('2026-01-10', 'run', 5.0),
      makeCardio('2026-02-10', 'run', 7.0),
    ];
    const result = monthlySportKm(sessions, 'run');
    expect(result).toHaveLength(2);
  });

  it('x label is a 3-letter month abbreviation', () => {
    const result = monthlySportKm([makeCardio('2026-03-10', 'run', 5)], 'run');
    expect(result[0].x).toBe('Mar');
  });
});
```

- [ ] **Step 2: Run tests — expect failure**

```
npx vitest run ui/layouts/progressHelpers.test.ts
```
Expected: FAIL — "Cannot find module './progressHelpers'"

- [ ] **Step 3: Create `ui/layouts/progressHelpers.ts`**

```ts
import type { SessionHistoryItem } from '@features/training_log';
import type { CardioSession, CardioSport } from '@features/cardio';
import type { DailyLoad } from '@features/progress_analysis';

export function weeklyVolume(sessions: SessionHistoryItem[]): DailyLoad[] {
  const map = new Map<string, number>();
  for (const s of sessions) {
    const d = new Date(s.startedAt);
    const day = d.getDay(); // 0 = Sun
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const mon = new Date(d);
    mon.setDate(d.getDate() + diffToMonday);
    const key = mon.toISOString().slice(0, 10);
    map.set(key, (map.get(key) ?? 0) + s.totalSets);
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, load]) => ({ date, load }));
}

export function monthlySportKm(
  sessions: CardioSession[],
  sport: CardioSport,
): { x: string; y: number }[] {
  const map = new Map<string, number>();
  for (const s of sessions) {
    if (s.sport !== sport) continue;
    const month = new Date(s.startedAt).toISOString().slice(0, 7);
    map.set(month, (map.get(month) ?? 0) + s.distanceMeters / 1000);
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, km]) => ({
      x: new Date(key + '-15').toLocaleString('en-GB', { month: 'short' }),
      y: Math.round(km * 10) / 10,
    }));
}
```

- [ ] **Step 4: Run tests — expect pass**

```
npx vitest run ui/layouts/progressHelpers.test.ts
```
Expected: all 10 tests pass.

- [ ] **Step 5: Commit**

```
git add ui/layouts/progressHelpers.ts ui/layouts/progressHelpers.test.ts
git commit -m "feat: add weeklyVolume and monthlySportKm helpers"
```

---

## Task 4: Seed viewStore at startup

**Files:**
- Modify: `app/entrypoints/index.tsx`

- [ ] **Step 1: Add mock imports and conditional seeding**

Open `app/entrypoints/index.tsx`. The current file ends with:

```tsx
// Hydrate persisted view keys before first render so projections start with saved state.
for (const key of PERSISTED_KEYS) {
  const saved = loadFromStorage(key);
  if (saved !== null) viewStore.set(key, saved);
}
```

Replace the entire file with:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { App } from '@app/registry/App';
import { viewStore } from '@data/projections/views';
import { PERSISTED_KEYS, loadFromStorage } from '@data/sources/local/persistence';
import { MOCK_SESSION_HISTORY } from '@data/mock/sessions';
import { MOCK_CARDIO_SESSIONS } from '@data/mock/cardio';
import '@styling/global.css';

// Hydrate persisted view keys before first render so projections start with saved state.
for (const key of PERSISTED_KEYS) {
  const saved = loadFromStorage(key);
  if (saved !== null) viewStore.set(key, saved);
}

// Seed mock data only when no real data exists yet.
if (!viewStore.get('session_history')) {
  viewStore.set('session_history', MOCK_SESSION_HISTORY);
}
if (!viewStore.get('recent_cardio_sessions')) {
  viewStore.set('recent_cardio_sessions', { sessions: MOCK_CARDIO_SESSIONS });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);
```

- [ ] **Step 2: Run full test suite to confirm no regressions**

```
npx vitest run
```
Expected: all existing tests pass.

- [ ] **Step 3: Commit**

```
git add app/entrypoints/index.tsx
git commit -m "feat: seed mock session and cardio data into viewStore on first load"
```

---

## Task 5: ExerciseProgressChart component

**Files:**
- Modify: `ui/components/Charts.tsx`

- [ ] **Step 1: Add `ScatterChart` and `Scatter` to the recharts import**

Open `ui/components/Charts.tsx`. The current first import is:

```ts
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart, Bar,
  AreaChart, Area,
  LineChart, Line,
  PieChart, Pie, Cell, Label,
  XAxis, YAxis, Tooltip,
  ReferenceLine,
} from 'recharts';
```

Replace it with:

```ts
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart, Bar,
  AreaChart, Area,
  LineChart, Line,
  PieChart, Pie, Cell, Label,
  ScatterChart, Scatter,
  XAxis, YAxis, Tooltip,
  ReferenceLine,
} from 'recharts';
```

- [ ] **Step 2: Add the `ExerciseProgressChart` export at the end of `Charts.tsx`**

Append after the last export in the file:

```tsx
// ─── ExerciseProgressChart ────────────────────────────────────────────────────
// Scatter chart showing weight per set over time for a single exercise.
// Orange dots = warmup sets. Red dots = working sets. X mark = failed set.
// Red trend line connects the heaviest working set per session.

import type { ExerciseSetEntry } from '@data/mock/sessions';

const JITTER_MS = 36 * 3600 * 1000; // 1.5 day offset per set — keeps dots readable

type ScatterDot = { x: number; y: number; reps: number; failed?: boolean };

function WorkingSetShape(props: { cx?: number; cy?: number; payload?: ScatterDot }) {
  const { cx = 0, cy = 0, payload } = props;
  if (payload?.failed) {
    const r = 5;
    return (
      <g>
        <line x1={cx - r} y1={cy - r} x2={cx + r} y2={cy + r} stroke="var(--color-warning)" strokeWidth={2} strokeLinecap="round" />
        <line x1={cx + r} y1={cy - r} x2={cx - r} y2={cy + r} stroke="var(--color-warning)" strokeWidth={2} strokeLinecap="round" />
      </g>
    );
  }
  return <circle cx={cx} cy={cy} r={4} fill="var(--color-warning)" stroke="#FFFFFF" strokeWidth={1} />;
}

export function ExerciseProgressChart({
  data,
}: {
  data: ExerciseSetEntry[];
}) {
  const warmup: ScatterDot[] = [];
  const working: ScatterDot[] = [];
  const trend: { x: number; y: number }[] = [];

  for (const session of data) {
    let maxWorking = 0;
    session.sets.forEach((set, i) => {
      const point: ScatterDot = { x: session.date + i * JITTER_MS, y: set.weightKg, reps: set.reps, failed: set.failed };
      if (set.isWarmup) {
        warmup.push(point);
      } else {
        working.push(point);
        if (set.weightKg > maxWorking) maxWorking = set.weightKg;
      }
    });
    if (maxWorking > 0) trend.push({ x: session.date, y: maxWorking });
  }

  const allWeights = [...warmup, ...working].map(p => p.y);
  const maxWeight = allWeights.length > 0 ? Math.max(...allWeights) : 100;
  const yMax = Math.ceil((maxWeight + 10) / 20) * 20;
  const yTicks: number[] = [];
  for (let w = 0; w <= yMax; w += 20) yTicks.push(w);

  const allDates = data.map(d => d.date);
  const minDate = Math.min(...allDates);
  const maxDate = Math.max(...allDates);
  const pad = (maxDate - minDate) * 0.05;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ScatterChart margin={{ top: 14, right: 8, bottom: 16, left: 36 }}>
        {yTicks.map(y => (
          <ReferenceLine
            key={y}
            y={y}
            stroke="#E5E5EA"
            strokeOpacity={y % 40 === 0 ? 0.8 : 0.4}
            strokeDasharray={y % 40 === 0 ? undefined : '2 5'}
            strokeWidth={1}
          />
        ))}
        <XAxis
          type="number"
          dataKey="x"
          domain={[minDate - pad, maxDate + pad]}
          tickFormatter={(v: number) =>
            new Date(v).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
          }
          tick={{ fontSize: 10, fontFamily: "'SF Mono','Menlo','Courier New',monospace", fontWeight: 900, fill: '#6D6D72' }}
          axisLine={false}
          tickLine={false}
          scale="time"
          tickCount={4}
          name="date"
        />
        <YAxis
          dataKey="y"
          domain={[0, yMax]}
          ticks={yTicks}
          tickFormatter={(v: number) => `${v}kg`}
          tick={{ fontSize: 11, fontFamily: "'SF Mono','Menlo','Courier New',monospace", fontWeight: 900, fill: '#6D6D72' }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        {/* Trend line — invisible dots, just the connecting line */}
        <Scatter
          data={trend}
          line={{ stroke: 'var(--color-warning)', strokeOpacity: 0.3, strokeWidth: 1.5 }}
          shape={() => null}
          isAnimationActive={false}
        />
        {/* Warmup dots */}
        <Scatter
          data={warmup}
          shape={({ cx = 0, cy = 0 }: { cx?: number; cy?: number }) => (
            <circle cx={cx} cy={cy} r={3} fill="var(--color-run)" fillOpacity={0.65} stroke="#FFFFFF" strokeWidth={1} />
          )}
          isAnimationActive={false}
        />
        {/* Working dots (custom shape handles failed sets) */}
        <Scatter
          data={working}
          shape={(props: Parameters<typeof WorkingSetShape>[0]) => <WorkingSetShape {...props} />}
          isAnimationActive={false}
        />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 3: Run full test suite — confirm no regressions**

```
npx vitest run
```
Expected: all existing tests pass (the chart has no unit tests — it is verified visually in the next task).

- [ ] **Step 4: Commit**

```
git add ui/components/Charts.tsx
git commit -m "feat: add ExerciseProgressChart scatter chart component"
```

---

## Task 6: Wire lift section in ProgressScreen

**Files:**
- Modify: `ui/layouts/ProgressScreen.tsx`

- [ ] **Step 1: Add imports at the top of `ProgressScreen.tsx`**

After the existing imports, add:

```tsx
import { ExerciseProgressChart, TrainingLoadChart } from '@ui/components/Charts';
import { MOCK_EXERCISE_SETS } from '@data/mock/sessions';
import { weeklyVolume } from '@ui/layouts/progressHelpers';
```

- [ ] **Step 2: Add exercise dropdown state inside `ProgressScreen`**

In the `ProgressScreen` function, after the existing `useState` calls, add:

```tsx
const EXERCISES = Object.keys(MOCK_EXERCISE_SETS);
const [selectedExercise, setSelectedExercise] = useState(EXERCISES[0]);
const weeklyVolumeSeries = weeklyVolume(history.length > 0 ? history : MOCK_SESSION_HISTORY_FALLBACK);
```

Wait — `history` comes from `useQuery('session_history')` which is now seeded with mock data, so just use `history` directly:

```tsx
const EXERCISES = Object.keys(MOCK_EXERCISE_SETS);
const [selectedExercise, setSelectedExercise] = useState(EXERCISES[0]);
```

- [ ] **Step 3: Replace the lift section JSX**

Find this block (lines ~279–315 in the original file):

```tsx
{/* Lift sessions */}
{(sportFilter === 'all' || sportFilter === 'lift') && (
  <>
    <section className="surface compact">
      <div className="stats-row">
        ...
      </div>
    </section>

    {filteredHistory.length === 0 ? (
      <EmptyState ... />
    ) : (
      filteredHistory.map(s => <SessionCard key={s.id} session={s} activeSession={activeSession} />)
    )}
  </>
)}
```

Replace it with:

```tsx
{/* Lift sessions */}
{(sportFilter === 'all' || sportFilter === 'lift') && (
  <>
    <section className="surface compact">
      <div className="stats-row">
        <div className="stat">
          <span className="label">SESSIONS</span>
          <p className="value lift">{history.length}</p>
        </div>
        <div className="stat">
          <span className="label">TOTAL SETS</span>
          <p className="value">{totalSets}</p>
        </div>
        <div className="stat">
          <span className="label">PRS</span>
          <p className="value">{prCount}</p>
        </div>
      </div>
    </section>

    <div className="surface column compact">
      <div className="row space-between align-center">
        <span className="caption">Exercise</span>
        <select
          value={selectedExercise}
          onChange={e => setSelectedExercise(e.target.value)}
          className="ghost small"
        >
          {EXERCISES.map(ex => (
            <option key={ex} value={ex}>{ex}</option>
          ))}
        </select>
      </div>
      <ExerciseProgressChart data={MOCK_EXERCISE_SETS[selectedExercise]} />
    </div>

    <div className="surface column compact">
      <span className="caption">Weekly sets</span>
      <TrainingLoadChart series={weeklyVolume(history)} />
    </div>

    {filteredHistory.length === 0 ? (
      <EmptyState
        icon="📋"
        title="No sessions yet"
        message="Log your first workout in the Log tab, or import a history file."
        action={
          onOpenSettings ? (
            <button type="button" className="secondary" onClick={onOpenSettings}>
              Import history
            </button>
          ) : undefined
        }
      />
    ) : (
      filteredHistory.map(s => <SessionCard key={s.id} session={s} activeSession={activeSession} />)
    )}
  </>
)}
```

- [ ] **Step 4: Run full test suite**

```
npx vitest run
```
Expected: all tests pass.

- [ ] **Step 5: Commit**

```
git add ui/layouts/ProgressScreen.tsx
git commit -m "feat: add exercise chart and weekly volume to lift section"
```

---

## Task 7: Wire cardio sparklines in ProgressScreen

**Files:**
- Modify: `ui/layouts/ProgressScreen.tsx`

- [ ] **Step 1: Add `monthlySportKm` import**

Add to the imports added in Task 6:

```tsx
import { weeklyVolume, monthlySportKm } from '@ui/layouts/progressHelpers';
import { SparklineArea } from '@ui/components/Charts';
import { MOCK_CARDIO_SESSIONS } from '@data/mock/cardio';
```

- [ ] **Step 2: Update the cardio sport section JSX**

Find this block inside the `sportsToShow.map(...)` fragment:

```tsx
<section className="surface compact">
  <div className="stats-row">
    <div className="stat">
      <span className="label">DISTANCE</span>
      <p className={`value ${meta.color}`}>{totalKm.toFixed(1)}km</p>
    </div>
    <div className="stat">
      <span className="label">SESSIONS</span>
      <p className="value">{sessions.length}</p>
    </div>
  </div>
</section>
{sessions.map(s => <CardioSessionCard key={s.id} session={s} />)}
```

Replace it with:

```tsx
<section className="surface compact">
  <div className="stats-row">
    <div className="stat">
      <span className="label">DISTANCE</span>
      <p className={`value ${meta.color}`}>{totalKm.toFixed(1)}km</p>
    </div>
    <div className="stat">
      <span className="label">SESSIONS</span>
      <p className="value">{sessions.length}</p>
    </div>
  </div>
</section>
{(() => {
  const monthlyKm = monthlySportKm(MOCK_CARDIO_SESSIONS, sport);
  if (monthlyKm.length < 2) return null;
  return (
    <div className="surface column compact">
      <span className="caption">Monthly km</span>
      <SparklineArea
        data={monthlyKm}
        color={`var(--color-${meta.color})`}
        height={50}
        id={`${sport}-monthly-km`}
        showTooltip
        tooltipFormatter={(v) => `${v} km`}
      />
    </div>
  );
})()}
{sessions.map(s => <CardioSessionCard key={s.id} session={s} />)}
```

- [ ] **Step 3: Run full test suite**

```
npx vitest run
```
Expected: all tests pass.

- [ ] **Step 4: Commit**

```
git add ui/layouts/ProgressScreen.tsx
git commit -m "feat: add monthly km sparklines to cardio sections"
```

---

## Self-Review Checklist

- [x] All 3 spec sections covered (mock data, chart component, screen layout)
- [x] `ExerciseSetEntry` type defined in Task 1, imported in Tasks 5 and 6
- [x] `DailyLoad` has no `fatigue` field — plan uses `{ date: string; load: number }` only
- [x] `monthlySportKm` uses `new Date(key + '-15')` (mid-month) so locale `toLocaleString` gives the right month abbreviation without timezone edge-cases
- [x] Seeding is conditional (`!viewStore.get(...)`) — preserves real user data
- [x] `weeklyVolume(history)` called inside JSX so it reacts to `history` from `useQuery`
- [x] Cardio sparkline only renders when `monthlyKm.length >= 2` — avoids a single-point flat line
