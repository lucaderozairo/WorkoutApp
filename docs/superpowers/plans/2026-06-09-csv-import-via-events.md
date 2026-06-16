# CSV Import via Events Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Route CSV import through the event store so imported data is part of the event log, projections, and achievement/insight policies — instead of bypassing CQRS via direct viewStore writes.

**Architecture:** `importCsv.ts` becomes a pure CSV parser with zero domain imports. Domain-specific parsing moves into each feature as an import command handler. Callers dispatch commands instead of calling `writeImportToStore`.

**Tech Stack:** TypeScript, Vitest, existing `defineCommand` / event store infrastructure.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `shared/utils/importCsv.ts` | Strip domain logic; expose `parseCsvForImport(text)` → `ParsedCsvData` |
| Create | `shared/utils/importCsv.test.ts` | Unit tests for the pure parser |
| Modify | `features/training_log/domain/types.ts` | Add `ImportSession` command + `SessionImported` event |
| Create | `features/training_log/commands/importSessions.ts` | Handler: rows → `SessionImported` events |
| Create | `features/training_log/commands/importSessions.test.ts` | Integration test via viewStore |
| Modify | `features/cardio/domain/types.ts` | Add `CardioSessionImported` event |
| Create | `features/cardio/commands/importCardioSessions.ts` | Handler: rows → `CardioSessionImported` events |
| Create | `features/cardio/commands/importCardioSessions.test.ts` | Integration test |
| Modify | `ui/components/modals/SettingsModal.tsx` | Call feature handlers instead of `writeImportToStore` |
| Modify | `ui/components/widgets/ImportDataWidget.tsx` | Same |

---

## Task 1: Define ParsedCsvData type and slim down importCsv.ts

**Files:**
- Modify: `shared/utils/importCsv.ts`
- Create: `shared/utils/importCsv.test.ts`

- [ ] **Step 1.1: Write failing tests for the new pure parser**

Create `shared/utils/importCsv.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { parseCsvForImport } from './importCsv';

const EXPORT_CSV = [
  'Type,Session ID,Name,Date,Category/Sport,Exercise,Block Type,Set #,Weight (kg),Reps,Distance (m),Duration (s),Is Warmup,Is PR,RPE,Notes',
  'strength,sess-1,My Workout,2024-01-15,strength,Squat,,1,100,5,0,0,false,false,7,',
].join('\n');

const SIMPLE_CSV = 'Date,Exercise,Sets,Reps,Weight,Notes\n2024-01-15,Squat,3,5,100,';

describe('parseCsvForImport', () => {
  it('detects export format', () => {
    expect(parseCsvForImport(EXPORT_CSV).format).toBe('export');
  });

  it('detects simple format', () => {
    expect(parseCsvForImport(SIMPLE_CSV).format).toBe('simple');
  });

  it('returns unknown for unrecognised headers', () => {
    expect(parseCsvForImport('foo,bar\n1,2').format).toBe('unknown');
  });

  it('returns unknown for empty file', () => {
    expect(parseCsvForImport('').format).toBe('unknown');
  });

  it('exposes raw headers and rows for known formats', () => {
    const result = parseCsvForImport(SIMPLE_CSV);
    if (result.format === 'unknown') throw new Error('unexpected');
    expect(result.headers).toContain('Date');
    expect(result.rows).toHaveLength(1);
  });
});
```

- [ ] **Step 1.2: Run tests — expect fail**

```bash
npx vitest run shared/utils/importCsv.test.ts
```
Expected: FAIL — `parseCsvForImport is not exported`

- [ ] **Step 1.3: Replace importCsv.ts with new pure-parser shape**

Copy the existing content of `shared/utils/importCsv.ts` to `shared/utils/importCsvLegacy.ts` (keep intact — callers still use it until Task 5).

Then replace `shared/utils/importCsv.ts` with:

```typescript
import { parseCsv } from './csv';

const EXPORT_HEADERS = [
  'Type', 'Session ID', 'Name', 'Date', 'Category/Sport',
  'Exercise', 'Block Type', 'Set #',
  'Weight (kg)', 'Reps', 'Distance (m)', 'Duration (s)',
  'Is Warmup', 'Is PR', 'RPE', 'Notes',
];

const SIMPLE_HEADERS = ['Date', 'Exercise', 'Sets', 'Reps', 'Weight', 'Notes'];

function normalizeHeaders(headers: string[]): string[] {
  return headers.map(h => h.trim().replace(/\s+/g, ' '));
}

export type ParsedCsvData =
  | { format: 'export'; headers: string[]; rows: string[][] }
  | { format: 'simple'; headers: string[]; rows: string[][] }
  | { format: 'unknown'; error: string };

export function parseCsvForImport(text: string): ParsedCsvData {
  const parsed = parseCsv(text);
  if (parsed.length < 2) {
    return { format: 'unknown', error: 'CSV file has no data rows.' };
  }
  const headers = normalizeHeaders(parsed[0]);
  const rows = parsed.slice(1);

  if (headers.some(h => EXPORT_HEADERS.includes(h))) {
    return { format: 'export', headers, rows };
  }
  if (headers.some(h => SIMPLE_HEADERS.includes(h))) {
    return { format: 'simple', headers, rows };
  }
  return {
    format: 'unknown',
    error: 'Unrecognized CSV format. Expected export format or: Date, Exercise, Sets, Reps, Weight, Notes',
  };
}

// Legacy re-exports — remove in Task 5 once callers are updated
export type { CsvImportResult } from './importCsvLegacy';
export { importCsv, writeImportToStore } from './importCsvLegacy';
```

- [ ] **Step 1.4: Run tests — expect pass**

```bash
npx vitest run shared/utils/importCsv.test.ts
```
Expected: PASS (5 tests)

- [ ] **Step 1.5: Confirm existing callers still compile**

```bash
npx tsc --noEmit
```
Expected: 0 errors (legacy re-exports preserve the old API)

- [ ] **Step 1.6: Commit**

```bash
git add shared/utils/importCsv.ts shared/utils/importCsvLegacy.ts shared/utils/importCsv.test.ts
git commit -m "refactor(import): split importCsv.ts into pure parser + legacy shim"
```

---

## Task 2: Add SessionImported event + types to training_log

**Files:**
- Modify: `features/training_log/domain/types.ts`

- [ ] **Step 2.1: Add SessionImportedPayload interface**

In `features/training_log/domain/types.ts`, add after the existing payload interfaces:

```typescript
export interface SessionImportedPayload {
  sessionId: Id<'Activity'>;
  name: string;
  startedAt: number;
  finishedAt: number;
  notes: string;
  primarySport: string;
  segments: Array<{
    id: Id<'Segment'>;
    exerciseName: string;
    exerciseCategory: string;
    sets: SetEntry[];
    order: number;
  }>;
}
```

- [ ] **Step 2.2: Add SessionImported to the TrainingLogEvent union**

Find the `TrainingLogEvent` type and add:

```typescript
| DomainEvent<'SessionImported', SessionImportedPayload>
```

- [ ] **Step 2.3: Add ImportSession command interface**

```typescript
export interface ImportSession {
  type: 'ImportSession';
  parsedData: import('@shared/utils/importCsv').ParsedCsvData;
}
```

- [ ] **Step 2.4: Add ImportSession to TrainingLogCommand union**

```typescript
| ImportSession
```

- [ ] **Step 2.5: `npx tsc --noEmit` — 0 errors**

The new event case will be unhandled by the projection switch — TypeScript will warn but not error (handled in Task 3).

- [ ] **Step 2.6: Commit**

```bash
git add features/training_log/domain/types.ts
git commit -m "feat(training_log): add ImportSession command and SessionImported event types"
```

---

## Task 3: Implement handleImportSessions + update projection

**Files:**
- Create: `features/training_log/commands/importSessions.ts`
- Create: `features/training_log/commands/importSessions.test.ts`
- Modify: `features/training_log/projections/index.ts`

- [ ] **Step 3.1: Write failing integration test**

Create `features/training_log/commands/importSessions.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { handleImportSessions } from './importSessions';
import { viewStore } from '@data/projections/views';
import type { ActivitiesState } from '../projections';
import type { ParsedCsvData } from '@shared/utils/importCsv';

const EXPORT_DATA: ParsedCsvData = {
  format: 'export',
  headers: [
    'Type', 'Session ID', 'Name', 'Date', 'Category/Sport',
    'Exercise', 'Block Type', 'Set #',
    'Weight (kg)', 'Reps', 'Distance (m)', 'Duration (s)',
    'Is Warmup', 'Is PR', 'RPE', 'Notes',
  ],
  rows: [
    ['strength', 'sess-1', 'Morning Lift', '2024-01-15', 'strength', 'Squat', '', '1', '100', '5', '0', '0', 'false', 'false', '7', ''],
    ['strength', 'sess-1', 'Morning Lift', '2024-01-15', 'strength', 'Squat', '', '2', '105', '5', '0', '0', 'false', 'false', '7', ''],
    ['strength', 'sess-1', 'Morning Lift', '2024-01-15', 'strength', 'Bench Press', '', '1', '80', '8', '0', '0', 'false', 'false', '', ''],
  ],
};

beforeEach(() => {
  viewStore.set('sessions', { byId: {}, activeId: null });
});

describe('handleImportSessions', () => {
  it('imports strength session into viewStore via events', async () => {
    const result = await handleImportSessions(EXPORT_DATA);

    expect(result.sessionCount).toBe(1);
    expect(result.errors).toHaveLength(0);

    const state = viewStore.get<ActivitiesState>('sessions');
    const sessions = Object.values(state?.byId ?? {});
    expect(sessions).toHaveLength(1);
    expect(sessions[0].name).toBe('Morning Lift');
    expect(sessions[0].segments).toHaveLength(2);
    expect(sessions[0].segments[0].exerciseName).toBe('Squat');
    expect(sessions[0].segments[0].sets).toHaveLength(2);
  });

  it('skips cardio rows', async () => {
    const cardioData: ParsedCsvData = {
      format: 'export',
      headers: EXPORT_DATA.headers,
      rows: [['cardio', 'sess-c', 'Run', '2024-01-16', 'running', '', '', '', '', '', '5000', '1800', '', '', '', '']],
    };
    const result = await handleImportSessions(cardioData);
    expect(result.sessionCount).toBe(0);
  });

  it('returns error for unknown format', async () => {
    const result = await handleImportSessions({ format: 'unknown', error: 'bad file' });
    expect(result.sessionCount).toBe(0);
    expect(result.errors).toContain('bad file');
  });

  it('handles simple format', async () => {
    const simpleData: ParsedCsvData = {
      format: 'simple',
      headers: ['Date', 'Exercise', 'Sets', 'Reps', 'Weight', 'Notes'],
      rows: [['2024-01-20', 'Deadlift', '3', '5', '140', '']],
    };
    const result = await handleImportSessions(simpleData);
    expect(result.sessionCount).toBe(1);
    const state = viewStore.get<ActivitiesState>('sessions');
    const sessions = Object.values(state?.byId ?? {});
    expect(sessions[0].segments[0].exerciseName).toBe('Deadlift');
  });
});
```

- [ ] **Step 3.2: Run test — fail**

```bash
npx vitest run features/training_log/commands/importSessions.test.ts
```
Expected: FAIL — `handleImportSessions not found`

- [ ] **Step 3.3: Create `features/training_log/commands/importSessions.ts`**

```typescript
import type { ParsedCsvData } from '@shared/utils/importCsv';
import type { TrainingLogEvent, SessionImportedPayload, SetEntry } from '../domain/types';
import { applyAll } from './handlers';
import { eventRepository } from '@data/event-repository';
import { systemClock } from '@core/clock';
import type { Id } from '@shared/types';

export interface ImportSessionsResult {
  sessionCount: number;
  errors: string[];
}

function safeStr(row: string[], i: number): string {
  return i >= 0 ? (row[i] ?? '').trim() : '';
}

function safeNum(row: string[], i: number): number {
  if (i < 0) return 0;
  const v = parseFloat(row[i]);
  return isNaN(v) ? 0 : v;
}

function parseExportRows(headers: string[], rows: string[][]): { events: TrainingLogEvent[]; errors: string[] } {
  const errors: string[] = [];
  const events: TrainingLogEvent[] = [];

  const col = (name: string) => headers.indexOf(name);
  const typeIdx = col('Type');
  const idIdx = col('Session ID');
  const nameIdx = col('Name');
  const dateIdx = col('Date');
  const catIdx = col('Category/Sport');
  const exerciseIdx = col('Exercise');
  const setNumIdx = col('Set #');
  const weightIdx = col('Weight (kg)');
  const repsIdx = col('Reps');
  const distIdx = col('Distance (m)');
  const durIdx = col('Duration (s)');
  const warmupIdx = col('Is Warmup');
  const isPRIdx = col('Is PR');
  const rpeIdx = col('RPE');
  const notesIdx = col('Notes');

  if (typeIdx < 0 || idIdx < 0) return { events, errors: ['Missing Type or Session ID columns'] };

  const sessionGroups = new Map<string, string[][]>();
  for (const row of rows) {
    if (safeStr(row, typeIdx).toLowerCase() === 'cardio') continue;
    const id = safeStr(row, idIdx) || `imported-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const g = sessionGroups.get(id);
    if (g) g.push(row);
    else sessionGroups.set(id, [row]);
  }

  for (const [sessionId, groupRows] of sessionGroups) {
    try {
      const firstRow = groupRows[0];
      const name = safeStr(firstRow, nameIdx) || 'Imported Session';
      const dateStr = safeStr(firstRow, dateIdx);
      const startedAt = dateStr ? new Date(dateStr).getTime() : Date.now();
      const notes = safeStr(firstRow, notesIdx);
      const primarySport = catIdx >= 0 ? safeStr(firstRow, catIdx) || 'strength' : 'strength';

      const exerciseGroups = new Map<string, string[][]>();
      for (const row of groupRows) {
        const exName = safeStr(row, exerciseIdx);
        const g = exerciseGroups.get(exName);
        if (g) g.push(row);
        else exerciseGroups.set(exName, [row]);
      }

      const segments: SessionImportedPayload['segments'] = [];
      let order = 0;
      for (const [exName, exRows] of exerciseGroups) {
        const sets: SetEntry[] = [];
        for (const exRow of exRows) {
          const dm = safeNum(exRow, distIdx);
          const ds = safeNum(exRow, durIdx);
          if (dm > 0 || ds > 0) {
            sets.push({ setNumber: sets.length + 1, distanceMeters: dm, durationSeconds: ds, completedAt: startedAt });
          } else {
            sets.push({
              setNumber: safeNum(exRow, setNumIdx) || sets.length + 1,
              weightKg: safeNum(exRow, weightIdx),
              reps: safeNum(exRow, repsIdx),
              isWarmup: safeStr(exRow, warmupIdx).toLowerCase() === 'true',
              isPR: safeStr(exRow, isPRIdx).toLowerCase() === 'true',
              completedAt: startedAt,
              rpe: safeNum(exRow, rpeIdx) || null,
            });
          }
        }
        segments.push({
          id: `imported-block-${sessionId}-${order}` as Id<'Segment'>,
          exerciseName: exName,
          exerciseCategory: 'strength',
          sets,
          order,
        });
        order++;
      }

      events.push({
        type: 'SessionImported',
        aggregateId: sessionId as Id<'Activity'>,
        aggregateType: 'Session',
        timestamp: systemClock.now(),
        version: 1,
        payload: { sessionId: sessionId as Id<'Activity'>, name, startedAt, finishedAt: startedAt + 3600000, notes, primarySport, segments },
      });
    } catch (e) {
      errors.push(`Session ${sessionId}: ${e instanceof Error ? e.message : 'Parse error'}`);
    }
  }

  return { events, errors };
}

function parseSimpleRows(headers: string[], rows: string[][]): { events: TrainingLogEvent[]; errors: string[] } {
  const errors: string[] = [];
  const events: TrainingLogEvent[] = [];

  const dateIdx = headers.indexOf('Date');
  const exerciseIdx = headers.indexOf('Exercise');
  const setsIdx = headers.indexOf('Sets');
  const repsIdx = headers.indexOf('Reps');
  const weightIdx = headers.indexOf('Weight');
  const notesIdx = headers.indexOf('Notes');

  if (dateIdx < 0 || exerciseIdx < 0) return { events, errors: ['Missing Date or Exercise columns'] };

  const dateGroups = new Map<string, string[][]>();
  for (const row of rows) {
    const d = (row[dateIdx] ?? '').trim();
    const g = dateGroups.get(d);
    if (g) g.push(row);
    else dateGroups.set(d, [row]);
  }

  for (const [dateStr, groupRows] of dateGroups) {
    try {
      const startedAt = dateStr ? new Date(dateStr).getTime() : Date.now();
      const sessionId = `imported-${startedAt}-${Math.random().toString(36).slice(2, 6)}`;
      const segments: SessionImportedPayload['segments'] = [];
      let order = 0;

      for (const row of groupRows) {
        const exercise = (row[exerciseIdx] ?? '').trim();
        const setCount = parseInt(row[setsIdx] ?? '1') || 1;
        const reps = parseInt(row[repsIdx] ?? '10') || 10;
        const weightKg = parseFloat(row[weightIdx] ?? '0') || 0;
        const sets: SetEntry[] = Array.from({ length: setCount }, (_, i) => ({
          setNumber: i + 1,
          weightKg,
          reps,
          isWarmup: false,
          isPR: false,
          completedAt: startedAt,
        }));

        segments.push({
          id: `imported-block-${sessionId}-${order}` as Id<'Segment'>,
          exerciseName: exercise,
          exerciseCategory: 'strength',
          sets,
          notes: notesIdx >= 0 ? (row[notesIdx] ?? '').trim() : '',
          order,
        });
        order++;
      }

      events.push({
        type: 'SessionImported',
        aggregateId: sessionId as Id<'Activity'>,
        aggregateType: 'Session',
        timestamp: systemClock.now(),
        version: 1,
        payload: { sessionId: sessionId as Id<'Activity'>, name: 'Imported Workout', startedAt, finishedAt: startedAt + 3600000, notes: '', primarySport: 'strength', segments },
      });
    } catch (e) {
      errors.push(`Date ${dateStr}: ${e instanceof Error ? e.message : 'Parse error'}`);
    }
  }

  return { events, errors };
}

export async function handleImportSessions(data: ParsedCsvData): Promise<ImportSessionsResult> {
  if (data.format === 'unknown') return { sessionCount: 0, errors: [data.error] };

  const { events, errors } = data.format === 'export'
    ? parseExportRows(data.headers, data.rows)
    : parseSimpleRows(data.headers, data.rows);

  if (events.length > 0) {
    applyAll(events);
    await eventRepository.commit(events);
  }

  return { sessionCount: events.length, errors };
}
```

- [ ] **Step 3.4: Run tests — fail (projection missing the SessionImported case)**

```bash
npx vitest run features/training_log/commands/importSessions.test.ts
```
Expected: FAIL — session not appearing in viewStore

- [ ] **Step 3.5: Add SessionImported case to the training_log projection reducer**

In `features/training_log/projections/index.ts`, find the reducer switch and add:

```typescript
case 'SessionImported': {
  const p = event.payload as SessionImportedPayload;
  return {
    ...state,
    byId: {
      ...state.byId,
      [p.sessionId]: {
        id: p.sessionId,
        name: p.name,
        primarySport: p.primarySport as SportType,
        status: 'finished' as const,
        startedAt: p.startedAt,
        finishedAt: p.finishedAt,
        segments: p.segments.map(seg => ({
          id: seg.id,
          exerciseName: seg.exerciseName,
          exerciseCategory: seg.exerciseCategory as ExerciseCategory,
          sets: seg.sets,
          notes: '',
          order: seg.order,
        })),
        notes: p.notes,
        sources: [],
      },
    },
  };
}
```

Import `SessionImportedPayload` from `../domain/types` at the top if not already imported.

- [ ] **Step 3.6: Run tests — pass**

```bash
npx vitest run features/training_log/commands/importSessions.test.ts
```
Expected: PASS (4 tests)

- [ ] **Step 3.7: Commit**

```bash
git add features/training_log/domain/types.ts features/training_log/commands/importSessions.ts features/training_log/commands/importSessions.test.ts features/training_log/projections/index.ts
git commit -m "feat(training_log): add handleImportSessions — CSV import flows through event store"
```

---

## Task 4: Implement handleImportCardioSessions

**Files:**
- Modify: `features/cardio/domain/types.ts`
- Create: `features/cardio/commands/importCardioSessions.ts`
- Create: `features/cardio/commands/importCardioSessions.test.ts`
- Modify: `features/cardio/projections/index.ts`

- [ ] **Step 4.1: Write failing test**

Create `features/cardio/commands/importCardioSessions.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { handleImportCardioSessions } from './importCardioSessions';
import { viewStore } from '@data/projections/views';
import type { RecentCardioView } from '../projections';
import type { ParsedCsvData } from '@shared/utils/importCsv';

const CARDIO_DATA: ParsedCsvData = {
  format: 'export',
  headers: [
    'Type', 'Session ID', 'Name', 'Date', 'Category/Sport',
    'Exercise', 'Block Type', 'Set #', 'Weight (kg)', 'Reps',
    'Distance (m)', 'Duration (s)', 'Is Warmup', 'Is PR', 'RPE', 'Notes',
  ],
  rows: [
    ['cardio', 'sess-c1', 'Morning Run', '2024-01-15', 'running', '', '', '', '', '', '5000', '1800', '', '', '', 'felt good'],
  ],
};

beforeEach(() => {
  viewStore.set('recent_cardio_sessions', { sessions: [] });
});

describe('handleImportCardioSessions', () => {
  it('imports cardio session into viewStore via events', async () => {
    const result = await handleImportCardioSessions(CARDIO_DATA);

    expect(result.cardioCount).toBe(1);
    expect(result.errors).toHaveLength(0);

    const state = viewStore.get<RecentCardioView>('recent_cardio_sessions');
    expect(state?.sessions).toHaveLength(1);
    expect(state?.sessions[0].distanceMeters).toBe(5000);
    expect(state?.sessions[0].durationSeconds).toBe(1800);
  });

  it('skips strength rows', async () => {
    const strengthData: ParsedCsvData = {
      ...CARDIO_DATA,
      rows: [['strength', 'sess-s1', 'Lift', '2024-01-15', 'strength', 'Squat', '', '1', '100', '5', '', '', 'false', 'false', '', '']],
    };
    const result = await handleImportCardioSessions(strengthData);
    expect(result.cardioCount).toBe(0);
  });

  it('returns error for unknown format', async () => {
    const result = await handleImportCardioSessions({ format: 'unknown', error: 'bad csv' });
    expect(result.cardioCount).toBe(0);
    expect(result.errors).toContain('bad csv');
  });
});
```

- [ ] **Step 4.2: Run test — fail**

```bash
npx vitest run features/cardio/commands/importCardioSessions.test.ts
```

- [ ] **Step 4.3: Add CardioSessionImportedPayload to `features/cardio/domain/types.ts`**

```typescript
export interface CardioSessionImportedPayload {
  sessionId: Id<'CardioSession'>;
  sport: string;
  title: string;
  startedAt: number;
  durationSeconds: number;
  distanceMeters: number;
  notes: string;
}
```

Add to the `CardioEvent` union:

```typescript
| DomainEvent<'CardioSessionImported', CardioSessionImportedPayload>
```

- [ ] **Step 4.4: Create `features/cardio/commands/importCardioSessions.ts`**

```typescript
import type { ParsedCsvData } from '@shared/utils/importCsv';
import type { CardioEvent, CardioSessionImportedPayload } from '../domain/types';
import { eventRepository } from '@data/event-repository';
import { systemClock } from '@core/clock';
import { viewStore } from '@data/projections/views';
import { recentCardioProjection, monthlyCardioProjection, type RecentCardioView } from '../projections';
import { loadFromStorage } from '@data/sources/local/persistence';
import type { Id } from '@shared/types';

export interface ImportCardioResult {
  cardioCount: number;
  errors: string[];
}

function applyAndStoreCardio(events: CardioEvent[]): void {
  const live = viewStore.get<RecentCardioView>('recent_cardio_sessions') ?? loadFromStorage<RecentCardioView>('recent_cardio_sessions');
  if (live) recentCardioProjection.setState(live);
  events.forEach(e => {
    recentCardioProjection.apply(e);
    monthlyCardioProjection.apply(e);
  });
  viewStore.set('recent_cardio_sessions', recentCardioProjection.getState());
  viewStore.set('monthly_cardio_progression', monthlyCardioProjection.getState());
}

export async function handleImportCardioSessions(data: ParsedCsvData): Promise<ImportCardioResult> {
  if (data.format === 'unknown') return { cardioCount: 0, errors: [data.error] };

  const { headers, rows } = data;
  const events: CardioEvent[] = [];
  const errors: string[] = [];

  const col = (name: string) => headers.indexOf(name);
  const typeIdx = col('Type');
  const idIdx = col('Session ID');
  const nameIdx = col('Name');
  const dateIdx = col('Date');
  const catIdx = col('Category/Sport');
  const distIdx = col('Distance (m)');
  const durIdx = col('Duration (s)');
  const notesIdx = col('Notes');

  if (typeIdx < 0 || idIdx < 0) return { cardioCount: 0, errors: ['Missing Type or Session ID columns'] };

  const cardioRows = rows.filter(row => (row[typeIdx] ?? '').trim().toLowerCase() === 'cardio');

  const groups = new Map<string, string[]>();
  for (const row of cardioRows) {
    const id = (row[idIdx] ?? '').trim() || `imported-cardio-${Date.now()}`;
    if (!groups.has(id)) groups.set(id, row);
  }

  for (const [sessionId, firstRow] of groups) {
    try {
      const payload: CardioSessionImportedPayload = {
        sessionId: sessionId as Id<'CardioSession'>,
        sport: catIdx >= 0 ? (firstRow[catIdx] ?? '').trim().toLowerCase() || 'other' : 'other',
        title: nameIdx >= 0 ? (firstRow[nameIdx] ?? '').trim() || 'Imported Cardio' : 'Imported Cardio',
        startedAt: dateIdx >= 0 && (firstRow[dateIdx] ?? '').trim() ? new Date((firstRow[dateIdx] ?? '').trim()).getTime() : Date.now(),
        durationSeconds: durIdx >= 0 ? parseFloat(firstRow[durIdx] ?? '0') || 0 : 0,
        distanceMeters: distIdx >= 0 ? parseFloat(firstRow[distIdx] ?? '0') || 0 : 0,
        notes: notesIdx >= 0 ? (firstRow[notesIdx] ?? '').trim() : '',
      };

      events.push({
        type: 'CardioSessionImported',
        aggregateId: sessionId as Id<'CardioSession'>,
        aggregateType: 'CardioSession',
        timestamp: systemClock.now(),
        version: 1,
        payload,
      });
    } catch (e) {
      errors.push(`Cardio ${sessionId}: ${e instanceof Error ? e.message : 'Parse error'}`);
    }
  }

  if (events.length > 0) {
    applyAndStoreCardio(events);
    await eventRepository.commit(events);
  }

  return { cardioCount: events.length, errors };
}
```

- [ ] **Step 4.5: Add CardioSessionImported case to `features/cardio/projections/index.ts`**

In the recentCardioProjection reducer:

```typescript
case 'CardioSessionImported': {
  const p = event.payload as CardioSessionImportedPayload;
  return {
    ...state,
    sessions: [
      {
        id: p.sessionId,
        userId: 'imported' as Id<'User'>,
        sport: p.sport as CardioSession['sport'],
        title: p.title,
        startedAt: p.startedAt,
        durationSeconds: p.durationSeconds,
        distanceMeters: p.distanceMeters,
        notes: p.notes,
        comments: [],
        media: [],
        location: undefined,
        routeId: null,
      },
      ...state.sessions,
    ],
  };
}
```

Import `CardioSessionImportedPayload` from `../domain/types` if not already present.

- [ ] **Step 4.6: Run tests — pass**

```bash
npx vitest run features/cardio/commands/importCardioSessions.test.ts
```
Expected: PASS (3 tests)

- [ ] **Step 4.7: Commit**

```bash
git add features/cardio/domain/types.ts features/cardio/commands/importCardioSessions.ts features/cardio/commands/importCardioSessions.test.ts features/cardio/projections/index.ts
git commit -m "feat(cardio): add handleImportCardioSessions — CSV import flows through event store"
```

---

## Task 5: Update callers and delete writeImportToStore

**Files:**
- Modify: `ui/components/modals/SettingsModal.tsx` (lines ~13, 85–86)
- Modify: `ui/components/widgets/ImportDataWidget.tsx` (lines ~5, 22–23)
- Modify: `shared/utils/importCsv.ts` (remove legacy re-exports)
- Delete: `shared/utils/importCsvLegacy.ts`

- [ ] **Step 5.1: Update SettingsModal.tsx**

Replace:

```typescript
import { importCsv, writeImportToStore } from '@shared/utils/importCsv';
```

With:

```typescript
import { parseCsvForImport } from '@shared/utils/importCsv';
import { handleImportSessions } from '@features/training_log/commands/importSessions';
import { handleImportCardioSessions } from '@features/cardio/commands/importCardioSessions';
```

Replace the two-line import handler:

```typescript
const result = importCsv(text);
const counts = writeImportToStore(result);
```

With (inside an async handler — the surrounding function must be async or you must await appropriately):

```typescript
const data = parseCsvForImport(text);
const [trainingResult, cardioResult] = await Promise.all([
  handleImportSessions(data),
  handleImportCardioSessions(data),
]);
const counts = {
  sessionCount: trainingResult.sessionCount,
  cardioCount: cardioResult.cardioCount,
  errorCount: trainingResult.errors.length + cardioResult.errors.length,
};
```

- [ ] **Step 5.2: Update ImportDataWidget.tsx**

Apply the same import and handler replacement as Step 5.1.

- [ ] **Step 5.3: Remove legacy re-exports from importCsv.ts**

Remove these two lines from `shared/utils/importCsv.ts`:

```typescript
export type { CsvImportResult } from './importCsvLegacy';
export { importCsv, writeImportToStore } from './importCsvLegacy';
```

- [ ] **Step 5.4: Delete importCsvLegacy.ts**

```bash
git rm shared/utils/importCsvLegacy.ts
```

- [ ] **Step 5.5: `npx tsc --noEmit` — 0 errors**

- [ ] **Step 5.6: Run all related tests**

```bash
npx vitest run shared/utils features/training_log/commands/importSessions features/cardio/commands/importCardioSessions
```
Expected: all PASS

- [ ] **Step 5.7: Commit**

```bash
git add shared/utils/importCsv.ts ui/components/modals/SettingsModal.tsx ui/components/widgets/ImportDataWidget.tsx
git rm shared/utils/importCsvLegacy.ts
git commit -m "refactor(import): delete writeImportToStore — all CSV imports now flow through event store"
```
