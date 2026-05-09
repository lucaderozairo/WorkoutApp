# Sleep CSV Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the sleep feature to import and display rich Garmin-measured sleep data (day CSV) alongside the existing subjective manual log, and render a year-trend chart from a weekly aggregate CSV.

**Architecture:** Extend `SleepEntry`/`SleepLoggedPayload` with nullable Garmin fields and a `source` flag; a new `ImportSleepFromCSV` command parses a single-day Garmin CSV and fires the existing `SleepLogged` event. Year-trend data is parsed into `WeeklySleepTrend[]` and held in local React state (no events, not persisted), rendered via Recharts in the ProfileScreen sleep section.

**Tech Stack:** TypeScript, React, Vitest, Recharts

---

### Task 1: Extend domain types

**Files:**
- Modify: `features/readiness/domain/types.ts`

- [ ] **Step 1: Replace the Sleep block in types.ts**

Open `features/readiness/domain/types.ts`. Find the `// ─── Sleep ───` section (lines 77–118). Replace the entire block — `SleepEntry`, `SleepState`, `SleepLoggedPayload`, `LogSleep` — with the following, and add `ImportSleepFromCSV` and `WeeklySleepTrend` at the end of the block:

```typescript
// ─── Sleep ───────────────────────────────────────────────────

export interface SleepEntry {
  id: Id<'Sleep'>;
  userId: Id<'User'>;
  date: string;                     // 'YYYY-MM-DD'
  source: 'manual' | 'garmin_csv' | 'garmin_api';

  // Subjective (manual) — null when entry is Garmin-only
  sleepQuality: number | null;      // 1–10
  energy: number | null;            // 1–10
  soreness: number | null;          // 1–10
  mood: number | null;              // 1–10
  score: number;                    // 0–100

  // Garmin-measured — null when entry is manual-only
  sleepScore: number | null;        // 0–100 Garmin score
  quality: string | null;           // 'Good' | 'Fair' | 'Poor'
  durationMin: number | null;
  deepMin: number | null;
  lightMin: number | null;
  remMin: number | null;
  awakeMin: number | null;
  hrv: number | null;               // ms
  restingHr: number | null;         // bpm
  overnightHr: number | null;       // bpm
  respiration: number | null;       // brpm
  bodyBatteryChange: number | null;
  stressAvg: number | null;
  restlessMoments: number | null;

  loggedAt: number;
}

export interface SleepState {
  entries: SleepEntry[];
}

export interface SleepLoggedPayload {
  entryId: Id<'Sleep'>;
  userId: Id<'User'>;
  date: string;
  source: 'manual' | 'garmin_csv' | 'garmin_api';
  sleepQuality: number | null;
  energy: number | null;
  soreness: number | null;
  mood: number | null;
  score: number;
  sleepScore: number | null;
  quality: string | null;
  durationMin: number | null;
  deepMin: number | null;
  lightMin: number | null;
  remMin: number | null;
  awakeMin: number | null;
  hrv: number | null;
  restingHr: number | null;
  overnightHr: number | null;
  respiration: number | null;
  bodyBatteryChange: number | null;
  stressAvg: number | null;
  restlessMoments: number | null;
}

export interface LogSleep {
  type: 'LogSleep';
  userId: Id<'User'>;
  sleepQuality: number;   // required 1–10 (unchanged)
  energy: number;
  soreness: number;
  mood: number;
}

export interface ImportSleepFromCSV {
  type: 'ImportSleepFromCSV';
  userId: Id<'User'>;
  csvText: string;
}

// ─── Sleep Trend (UI-only, not persisted) ────────────────────

export interface WeeklySleepTrend {
  weekLabel: string;
  avgScore: number;
  avgQuality: string;      // 'Good' | 'Fair' | 'Poor'
  avgDurationMin: number;
  avgSleepNeedMin: number;
  avgBedtime: string;      // e.g. '12:31 AM'
  avgWakeTime: string;     // e.g. '8:30 AM'
}
```

- [ ] **Step 2: Commit**

```bash
git add features/readiness/domain/types.ts
git commit -m "feat(sleep): extend SleepEntry with Garmin fields; add ImportSleepFromCSV and WeeklySleepTrend"
```

---

### Task 2: Day CSV parser

**Files:**
- Create: `features/readiness/domain/parseGarminSleepCSV.ts`
- Create: `features/readiness/domain/parseGarminSleepCSV.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `features/readiness/domain/parseGarminSleepCSV.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { parseGarminSleepCSV } from './parseGarminSleepCSV';

const SAMPLE = `Sleep Score 1 Day,
Date,2026-04-15
Sleep Duration,8h 35m
Sleep Score,87
Quality,Good

Sleep Score Factors,
Sleep Duration,8h 35m
Stress Avg,17
Deep Sleep Duration,1h 3m
Light Sleep Duration,5h 25m
REM Duration,2h 8m
Awake Time,11m

Sleep Timeline Metrics,
Breathing Variations,--
Restless Moments,35
Avg Overnight Heart Rate,53 bpm
Resting Heart Rate,45 bpm
Body Battery Change,+70
Avg SpO₂,--
Avg Respiration,11 brpm
Avg Overnight HRV,89 ms`;

describe('parseGarminSleepCSV', () => {
  it('parses the date', () => {
    expect(parseGarminSleepCSV(SAMPLE).date).toBe('2026-04-15');
  });

  it('parses sleep score and quality', () => {
    const r = parseGarminSleepCSV(SAMPLE);
    expect(r.sleepScore).toBe(87);
    expect(r.quality).toBe('Good');
  });

  it('parses total duration from the first Sleep Duration row only', () => {
    expect(parseGarminSleepCSV(SAMPLE).durationMin).toBe(515); // 8*60 + 35
  });

  it('parses sleep stages', () => {
    const r = parseGarminSleepCSV(SAMPLE);
    expect(r.deepMin).toBe(63);   // 1*60 + 3
    expect(r.lightMin).toBe(325); // 5*60 + 25
    expect(r.remMin).toBe(128);   // 2*60 + 8
    expect(r.awakeMin).toBe(11);
  });

  it('parses physiological metrics', () => {
    const r = parseGarminSleepCSV(SAMPLE);
    expect(r.hrv).toBe(89);
    expect(r.restingHr).toBe(45);
    expect(r.overnightHr).toBe(53);
    expect(r.respiration).toBe(11);
    expect(r.bodyBatteryChange).toBe(70);
    expect(r.stressAvg).toBe(17);
    expect(r.restlessMoments).toBe(35);
  });

  it('returns null for -- values', () => {
    expect(parseGarminSleepCSV('Avg Overnight HRV,--\n').hrv).toBeNull();
  });

  it('handles minutes-only duration with no hours component', () => {
    expect(parseGarminSleepCSV('Awake Time,11m\n').awakeMin).toBe(11);
  });
});
```

- [ ] **Step 2: Run tests and confirm they fail**

```
npm test -- features/readiness/domain/parseGarminSleepCSV.test.ts
```

Expected: FAIL — `parseGarminSleepCSV` is not defined.

- [ ] **Step 3: Implement the parser**

Create `features/readiness/domain/parseGarminSleepCSV.ts`:

```typescript
export interface ParsedGarminSleepDay {
  date: string | null;
  sleepScore: number | null;
  quality: string | null;
  durationMin: number | null;
  deepMin: number | null;
  lightMin: number | null;
  remMin: number | null;
  awakeMin: number | null;
  hrv: number | null;
  restingHr: number | null;
  overnightHr: number | null;
  respiration: number | null;
  bodyBatteryChange: number | null;
  stressAvg: number | null;
  restlessMoments: number | null;
}

function parseDuration(s: string): number | null {
  const h = s.match(/(\d+)h/);
  const m = s.match(/(\d+)min?/);
  if (!h && !m) return null;
  return (h ? parseInt(h[1], 10) * 60 : 0) + (m ? parseInt(m[1], 10) : 0);
}

function parseValue(s: string): number | null {
  if (s === '--' || s.trim() === '') return null;
  const match = s.match(/^([+-]?\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : null;
}

export function parseGarminSleepCSV(text: string): ParsedGarminSleepDay {
  const result: ParsedGarminSleepDay = {
    date: null, sleepScore: null, quality: null, durationMin: null,
    deepMin: null, lightMin: null, remMin: null, awakeMin: null,
    hrv: null, restingHr: null, overnightHr: null, respiration: null,
    bodyBatteryChange: null, stressAvg: null, restlessMoments: null,
  };

  let durationSeen = false;

  for (const line of text.split('\n')) {
    const commaIdx = line.indexOf(',');
    if (commaIdx === -1) continue;
    const key = line.slice(0, commaIdx).trim();
    const value = line.slice(commaIdx + 1).trim();
    if (!value) continue;

    switch (key) {
      case 'Date':                     result.date = value; break;
      case 'Sleep Score':              result.sleepScore = parseValue(value); break;
      case 'Quality':                  result.quality = value; break;
      case 'Sleep Duration':
        if (!durationSeen) { result.durationMin = parseDuration(value); durationSeen = true; }
        break;
      case 'Deep Sleep Duration':      result.deepMin = parseDuration(value); break;
      case 'Light Sleep Duration':     result.lightMin = parseDuration(value); break;
      case 'REM Duration':             result.remMin = parseDuration(value); break;
      case 'Awake Time':               result.awakeMin = parseDuration(value); break;
      case 'Avg Overnight HRV':        result.hrv = parseValue(value); break;
      case 'Resting Heart Rate':       result.restingHr = parseValue(value); break;
      case 'Avg Overnight Heart Rate': result.overnightHr = parseValue(value); break;
      case 'Avg Respiration':          result.respiration = parseValue(value); break;
      case 'Body Battery Change':      result.bodyBatteryChange = parseValue(value); break;
      case 'Stress Avg':               result.stressAvg = parseValue(value); break;
      case 'Restless Moments':         result.restlessMoments = parseValue(value); break;
    }
  }

  return result;
}
```

- [ ] **Step 4: Run tests and confirm they pass**

```
npm test -- features/readiness/domain/parseGarminSleepCSV.test.ts
```

Expected: all 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add features/readiness/domain/parseGarminSleepCSV.ts features/readiness/domain/parseGarminSleepCSV.test.ts
git commit -m "feat(sleep): add Garmin day CSV parser with tests"
```

---

### Task 3: Year CSV parser

**Files:**
- Create: `features/readiness/domain/parseGarminSleepYearCSV.ts`
- Create: `features/readiness/domain/parseGarminSleepYearCSV.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `features/readiness/domain/parseGarminSleepYearCSV.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { parseGarminSleepYearCSV } from './parseGarminSleepYearCSV';

const SAMPLE = `Date,Avg Score,Avg Quality,Avg Duration,Avg Sleep Need,Avg Bedtime,Avg Wake Time
Apr 9-15,83,Good,7h 46min,7h 53min,12:31 AM,8:30 AM
Apr 2-8,85,Good,8h 5min,7h 55min,12:24 AM,8:39 AM
Nov 27 - Dec 3, 2025,71,Fair,7h 41min,8h 29min,12:38 AM,8:38 AM`;

describe('parseGarminSleepYearCSV', () => {
  it('skips the header row', () => {
    const result = parseGarminSleepYearCSV(SAMPLE);
    expect(result.every(r => r.weekLabel !== 'Date')).toBe(true);
  });

  it('returns rows oldest-first', () => {
    const result = parseGarminSleepYearCSV(SAMPLE);
    expect(result[0].weekLabel).toBe('Nov 27 - Dec 3, 2025');
    expect(result[result.length - 1].weekLabel).toBe('Apr 9-15');
  });

  it('parses score and quality', () => {
    const result = parseGarminSleepYearCSV(SAMPLE);
    const apr9 = result.find(r => r.weekLabel === 'Apr 9-15')!;
    expect(apr9.avgScore).toBe(83);
    expect(apr9.avgQuality).toBe('Good');
  });

  it('parses duration and sleep need to minutes', () => {
    const result = parseGarminSleepYearCSV(SAMPLE);
    const apr9 = result.find(r => r.weekLabel === 'Apr 9-15')!;
    expect(apr9.avgDurationMin).toBe(466);  // 7*60 + 46
    expect(apr9.avgSleepNeedMin).toBe(473); // 7*60 + 53
  });

  it('preserves week labels that contain a comma (year suffix)', () => {
    const result = parseGarminSleepYearCSV(SAMPLE);
    const nov = result.find(r => r.weekLabel === 'Nov 27 - Dec 3, 2025');
    expect(nov).toBeDefined();
    expect(nov!.avgScore).toBe(71);
  });

  it('preserves bedtime and wake time strings', () => {
    const result = parseGarminSleepYearCSV(SAMPLE);
    const apr9 = result.find(r => r.weekLabel === 'Apr 9-15')!;
    expect(apr9.avgBedtime).toBe('12:31 AM');
    expect(apr9.avgWakeTime).toBe('8:30 AM');
  });
});
```

- [ ] **Step 2: Run tests and confirm they fail**

```
npm test -- features/readiness/domain/parseGarminSleepYearCSV.test.ts
```

Expected: FAIL — `parseGarminSleepYearCSV` is not defined.

- [ ] **Step 3: Implement the parser**

Create `features/readiness/domain/parseGarminSleepYearCSV.ts`:

```typescript
import type { WeeklySleepTrend } from './types';

function parseDuration(s: string): number | null {
  const h = s.match(/(\d+)h/);
  const m = s.match(/(\d+)min?/);
  if (!h && !m) return null;
  return (h ? parseInt(h[1], 10) * 60 : 0) + (m ? parseInt(m[1], 10) : 0);
}

export function parseGarminSleepYearCSV(text: string): WeeklySleepTrend[] {
  const lines = text.trim().split('\n').slice(1); // skip header
  const results: WeeklySleepTrend[] = [];

  for (const line of lines) {
    const parts = line.split(',').map(s => s.trim());
    if (parts.length < 7) continue;

    // Last 6 columns are always: score, quality, duration, need, bedtime, wakeTime
    // Everything before is the week label (may itself contain a comma e.g. "Nov 27 - Dec 3, 2025")
    const [avgScoreStr, avgQuality, avgDurationStr, avgSleepNeedStr, avgBedtime, avgWakeTime] =
      parts.slice(-6);
    const weekLabel = parts.slice(0, parts.length - 6).join(',').trim();

    const avgScore = parseInt(avgScoreStr, 10);
    const avgDurationMin = parseDuration(avgDurationStr);
    const avgSleepNeedMin = parseDuration(avgSleepNeedStr);

    if (!weekLabel || isNaN(avgScore) || avgDurationMin === null || avgSleepNeedMin === null) continue;

    results.push({ weekLabel, avgScore, avgQuality, avgDurationMin, avgSleepNeedMin, avgBedtime, avgWakeTime });
  }

  return results.reverse(); // oldest-first
}
```

- [ ] **Step 4: Run tests and confirm they pass**

```
npm test -- features/readiness/domain/parseGarminSleepYearCSV.test.ts
```

Expected: all 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add features/readiness/domain/parseGarminSleepYearCSV.ts features/readiness/domain/parseGarminSleepYearCSV.test.ts
git commit -m "feat(sleep): add Garmin year CSV parser with tests"
```

---

### Task 4: Update reducers

**Files:**
- Modify: `features/readiness/domain/reducers.ts`

- [ ] **Step 1: Replace SleepEntryView**

In `features/readiness/domain/reducers.ts`, replace the `SleepEntryView` interface:

```typescript
// BEFORE
export interface SleepEntryView {
  id: Id<'Sleep'>;
  sleepQuality: number;
  energy: number;
  soreness: number;
  mood: number;
  score: number;
  loggedAt: number;
}
```

```typescript
// AFTER
export interface SleepEntryView {
  id: Id<'Sleep'>;
  date: string;
  source: 'manual' | 'garmin_csv' | 'garmin_api';
  sleepQuality: number | null;
  energy: number | null;
  soreness: number | null;
  mood: number | null;
  score: number;
  sleepScore: number | null;
  quality: string | null;
  durationMin: number | null;
  deepMin: number | null;
  lightMin: number | null;
  remMin: number | null;
  awakeMin: number | null;
  hrv: number | null;
  restingHr: number | null;
  overnightHr: number | null;
  respiration: number | null;
  bodyBatteryChange: number | null;
  stressAvg: number | null;
  restlessMoments: number | null;
  loggedAt: number;
}
```

- [ ] **Step 2: Replace applySleepLogged**

In the same file, replace `applySleepLogged`:

```typescript
// BEFORE
export function applySleepLogged(state: SleepEntryView[], event: ReadinessEvent): SleepEntryView[] {
  if (event.type !== 'SleepLogged') return state;
  const p = event.payload as SleepLoggedPayload;
  const entry: SleepEntryView = {
    id: p.entryId,
    sleepQuality: p.sleepQuality,
    energy: p.energy,
    soreness: p.soreness,
    mood: p.mood,
    score: p.score,
    loggedAt: event.timestamp,
  };
  return [entry, ...state].slice(0, 50);
}
```

```typescript
// AFTER
export function applySleepLogged(state: SleepEntryView[], event: ReadinessEvent): SleepEntryView[] {
  if (event.type !== 'SleepLogged') return state;
  const p = event.payload as SleepLoggedPayload;
  const entry: SleepEntryView = {
    id: p.entryId,
    date: p.date,
    source: p.source,
    sleepQuality: p.sleepQuality,
    energy: p.energy,
    soreness: p.soreness,
    mood: p.mood,
    score: p.score,
    sleepScore: p.sleepScore,
    quality: p.quality,
    durationMin: p.durationMin,
    deepMin: p.deepMin,
    lightMin: p.lightMin,
    remMin: p.remMin,
    awakeMin: p.awakeMin,
    hrv: p.hrv,
    restingHr: p.restingHr,
    overnightHr: p.overnightHr,
    respiration: p.respiration,
    bodyBatteryChange: p.bodyBatteryChange,
    stressAvg: p.stressAvg,
    restlessMoments: p.restlessMoments,
    loggedAt: event.timestamp,
  };
  return [entry, ...state].slice(0, 50);
}
```

- [ ] **Step 3: Run all tests to verify no regressions**

```
npm test
```

Expected: all tests PASS.

- [ ] **Step 4: Commit**

```bash
git add features/readiness/domain/reducers.ts
git commit -m "feat(sleep): update SleepEntryView and applySleepLogged for extended model"
```

---

### Task 5: Update command handlers

**Files:**
- Modify: `features/readiness/commands/handlers.ts`

- [ ] **Step 1: Add imports**

At the top of `features/readiness/commands/handlers.ts`, add these two imports alongside the existing ones:

```typescript
import { parseGarminSleepCSV } from '../domain/parseGarminSleepCSV';
import type { ImportSleepFromCSV } from '../domain/types';
```

- [ ] **Step 2: Replace handleLogSleep**

Replace the existing `handleLogSleep` function to populate the new fields:

```typescript
export async function handleLogSleep(cmd: LogSleep): Promise<Result<void, string>> {
  for (const [field, value] of [['sleepQuality', cmd.sleepQuality], ['energy', cmd.energy], ['soreness', cmd.soreness], ['mood', cmd.mood]] as const) {
    if (value < 1 || value > 10) return err(`${field} must be between 1 and 10`);
  }

  const entryId = cryptoIdGenerator.next<'Sleep'>();
  const score = Math.round(((cmd.sleepQuality + cmd.energy + (10 - cmd.soreness) + cmd.mood) / 40) * 100);

  const events: ReadinessEvent[] = [{
    type: 'SleepLogged',
    aggregateId: cmd.userId,
    aggregateType: 'User',
    timestamp: systemClock.now(),
    version: 1,
    payload: {
      entryId,
      userId: cmd.userId,
      date: new Date().toISOString().slice(0, 10),
      source: 'manual',
      sleepQuality: cmd.sleepQuality,
      energy: cmd.energy,
      soreness: cmd.soreness,
      mood: cmd.mood,
      score,
      sleepScore: null,
      quality: null,
      durationMin: null,
      deepMin: null,
      lightMin: null,
      remMin: null,
      awakeMin: null,
      hrv: null,
      restingHr: null,
      overnightHr: null,
      respiration: null,
      bodyBatteryChange: null,
      stressAvg: null,
      restlessMoments: null,
    },
  }];

  events.forEach(e => sleepHistoryProjection.apply(e));
  viewStore.set('sleep_history', sleepHistoryProjection.getState());
  return ok(undefined);
}
```

- [ ] **Step 3: Add handleImportSleepFromCSV after handleLogSleep**

```typescript
export async function handleImportSleepFromCSV(cmd: ImportSleepFromCSV): Promise<Result<void, string>> {
  const parsed = parseGarminSleepCSV(cmd.csvText);
  if (!parsed.date) return err('Could not parse date from CSV — is this a Garmin single-day sleep export?');

  const entryId = cryptoIdGenerator.next<'Sleep'>();

  const events: ReadinessEvent[] = [{
    type: 'SleepLogged',
    aggregateId: cmd.userId,
    aggregateType: 'User',
    timestamp: systemClock.now(),
    version: 1,
    payload: {
      entryId,
      userId: cmd.userId,
      date: parsed.date,
      source: 'garmin_csv',
      sleepQuality: null,
      energy: null,
      soreness: null,
      mood: null,
      score: parsed.sleepScore ?? 0,
      sleepScore: parsed.sleepScore,
      quality: parsed.quality,
      durationMin: parsed.durationMin,
      deepMin: parsed.deepMin,
      lightMin: parsed.lightMin,
      remMin: parsed.remMin,
      awakeMin: parsed.awakeMin,
      hrv: parsed.hrv,
      restingHr: parsed.restingHr,
      overnightHr: parsed.overnightHr,
      respiration: parsed.respiration,
      bodyBatteryChange: parsed.bodyBatteryChange,
      stressAvg: parsed.stressAvg,
      restlessMoments: parsed.restlessMoments,
    },
  }];

  events.forEach(e => sleepHistoryProjection.apply(e));
  viewStore.set('sleep_history', sleepHistoryProjection.getState());
  return ok(undefined);
}
```

- [ ] **Step 4: Run all tests**

```
npm test
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add features/readiness/commands/handlers.ts
git commit -m "feat(sleep): add handleImportSleepFromCSV; update handleLogSleep for extended payload"
```

---

### Task 6: Update feature exports

**Files:**
- Modify: `features/readiness/index.ts`

- [ ] **Step 1: Add new exports**

In `features/readiness/index.ts`, update the type export block to include `ImportSleepFromCSV` and `WeeklySleepTrend`:

```typescript
export type {
  ReadinessEntry,
  ReadinessState,
  ReadinessEvent,
  LogReadiness,
  HealthMetricsEntry,
  LogHealthMetrics,
  HealthMetricsLoggedPayload,
  SleepEntry,
  SleepState,
  SleepLoggedPayload,
  LogSleep,
  ImportSleepFromCSV,
  WeeklySleepTrend,
  RestingHREntry,
  RestingHRLoggedPayload,
  LogRestingHR,
  SubjectiveRPEEntry,
  SubjectiveRPELoggedPayload,
  LogSubjectiveRPE,
} from './domain/types';
```

Add `handleImportSleepFromCSV` to the command handler exports:

```typescript
export {
  handleLogReadiness,
  handleLogHealthMetrics,
  handleLogSleep,
  handleImportSleepFromCSV,
  handleLogRestingHR,
  handleLogSubjectiveRPE,
} from './commands/handlers';
```

Add the year CSV parser export (used directly in ProfileScreen UI):

```typescript
export { parseGarminSleepYearCSV } from './domain/parseGarminSleepYearCSV';
```

- [ ] **Step 2: Run all tests**

```
npm test
```

Expected: all tests PASS.

- [ ] **Step 3: Commit**

```bash
git add features/readiness/index.ts
git commit -m "feat(sleep): export ImportSleepFromCSV, WeeklySleepTrend, handleImportSleepFromCSV, parseGarminSleepYearCSV"
```

---

### Task 7: Update ProfileScreen sleep section UI

**Files:**
- Modify: `ui/layouts/ProfileScreen.tsx`

- [ ] **Step 1: Update the @features/readiness import**

Find the existing import block at the top of `ui/layouts/ProfileScreen.tsx`:

```typescript
import {
  handleLogHealthMetrics,
  handleLogSleep,
  handleLogReadiness,
  SleepEntryView,
} from '@features/readiness';
```

Replace it with:

```typescript
import {
  handleLogHealthMetrics,
  handleLogSleep,
  handleLogReadiness,
  handleImportSleepFromCSV,
  parseGarminSleepYearCSV,
} from '@features/readiness';
import type { SleepEntryView, WeeklySleepTrend } from '@features/readiness';
// Note: the existing `import type { HealthMetricsView } from '@features/readiness'` line elsewhere in the file stays unchanged.
```

- [ ] **Step 2: Add Recharts imports**

After the existing React import, add:

```typescript
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
```

- [ ] **Step 3: Add weeklyTrend state and dispatchImportSleepFromCSV in the component body**

Inside `ProfileScreen`, after the existing `useCommand` declarations, add:

```typescript
const { dispatch: dispatchImportSleepFromCSV } = useCommand(handleImportSleepFromCSV);
const [weeklyTrend, setWeeklyTrend] = useState<WeeklySleepTrend[]>([]);
```

- [ ] **Step 4: Add fmtMin helper before the return statement**

Immediately above `return (` inside the component, add:

```typescript
function fmtMin(min: number | null): string {
  if (min === null) return '—';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
```

- [ ] **Step 5: Replace the sleep section**

Find the entire `{/* Sleep */}` block — from `<section className="surface">` (the one containing `<h3>Sleep</h3>`) through its closing `</section>` — and replace it with:

```tsx
{/* Sleep */}
<section className="surface">
  <header className="row between">
    <h3>Sleep</h3>
    <div className="row">
      <label className="secondary small">
        Import Day CSV
        <input
          type="file"
          accept=".csv"
          onChange={e => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
              dispatchImportSleepFromCSV({ type: 'ImportSleepFromCSV', userId, csvText: reader.result as string });
            };
            reader.readAsText(file);
            e.target.value = '';
          }}
        />
      </label>
      <label className="secondary small">
        Import Year Trend
        <input
          type="file"
          accept=".csv"
          onChange={e => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
              setWeeklyTrend(parseGarminSleepYearCSV(reader.result as string));
            };
            reader.readAsText(file);
            e.target.value = '';
          }}
        />
      </label>
    </div>
  </header>

  {sleepEntries.length > 0 ? (
    <>
      {/* Garmin measured block — shown only for imported entries */}
      {sleepEntries[0].source !== 'manual' && (
        <div className="column">
          <span className="label">GARMIN MEASURED</span>
          <div className="row between">
            <div>
              <p className="value">{sleepEntries[0].sleepScore ?? '—'}</p>
              <span className="caption">{sleepEntries[0].quality ?? '—'}</span>
            </div>
            <div className="row">
              <span className="pill">Deep {fmtMin(sleepEntries[0].deepMin)}</span>
              <span className="pill">Light {fmtMin(sleepEntries[0].lightMin)}</span>
              <span className="pill">REM {fmtMin(sleepEntries[0].remMin)}</span>
              <span className="pill">Awake {fmtMin(sleepEntries[0].awakeMin)}</span>
            </div>
          </div>
          <div className="row-natural">
            {sleepEntries[0].hrv !== null && <span className="pill">HRV {sleepEntries[0].hrv}ms</span>}
            {sleepEntries[0].restingHr !== null && <span className="pill">RHR {sleepEntries[0].restingHr}bpm</span>}
            {sleepEntries[0].overnightHr !== null && <span className="pill">Overnight HR {sleepEntries[0].overnightHr}bpm</span>}
            {sleepEntries[0].respiration !== null && <span className="pill">Resp {sleepEntries[0].respiration}brpm</span>}
            {sleepEntries[0].bodyBatteryChange !== null && (
              <span className="pill">Body Battery {sleepEntries[0].bodyBatteryChange > 0 ? '+' : ''}{sleepEntries[0].bodyBatteryChange}</span>
            )}
            {sleepEntries[0].stressAvg !== null && <span className="pill">Stress {sleepEntries[0].stressAvg}</span>}
            {sleepEntries[0].restlessMoments !== null && <span className="pill">Restless {sleepEntries[0].restlessMoments}</span>}
          </div>
        </div>
      )}

      {/* Subjective block — always shown */}
      <div className="column">
        <span className="label">SUBJECTIVE</span>
        <div className="row">
          <span className="caption">Sleep</span>
          <span className="value">{sleepEntries[0].sleepQuality ?? '—'}</span>
          <span className="caption">Energy</span>
          <span className="value">{sleepEntries[0].energy ?? '—'}</span>
          <span className="caption">Soreness</span>
          <span className="value">{sleepEntries[0].soreness ?? '—'}</span>
          <span className="caption">Mood</span>
          <span className="value">{sleepEntries[0].mood ?? '—'}</span>
        </div>
        <div className="row">
          <input type="number" step="1" min="1" max="10" placeholder="Sleep" value={slSleep} onChange={e => setSlSleep(e.target.value)} />
          <input type="number" step="1" min="1" max="10" placeholder="Energy" value={slEnergy} onChange={e => setSlEnergy(e.target.value)} />
          <input type="number" step="1" min="1" max="10" placeholder="Soreness" value={slSoreness} onChange={e => setSlSoreness(e.target.value)} />
          <input type="number" step="1" min="1" max="10" placeholder="Mood" value={slMood} onChange={e => setSlMood(e.target.value)} />
          <button className="primary small" onClick={() => {
            const sq = parseInt(slSleep, 10);
            const en = parseInt(slEnergy, 10);
            const so = parseInt(slSoreness, 10);
            const md = parseInt(slMood, 10);
            if (![sq, en, so, md].some(v => isNaN(v) || v < 1 || v > 10)) {
              dispatchLogSleep({ type: 'LogSleep', userId, sleepQuality: sq, energy: en, soreness: so, mood: md });
              setSlSleep(''); setSlEnergy(''); setSlSoreness(''); setSlMood('');
            }
          }}>Log</button>
        </div>
      </div>

      {/* History — last 7 entries */}
      <div className="column gap-0">
        {sleepEntries.slice(0, 7).map(entry => (
          <div key={entry.id} className="row between">
            <time className="caption">{entry.date ?? new Date(entry.loggedAt).toLocaleDateString()}</time>
            <div className="row">
              {entry.source !== 'manual' && entry.sleepScore !== null && (
                <span className="pill">{entry.sleepScore} {entry.quality}</span>
              )}
              {entry.sleepQuality !== null && (
                <span className={`value ${entry.score >= 70 ? 'good' : 'warning'}`}>{entry.score}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  ) : (
    <>
      <p className="caption">No sleep entries yet.</p>
      <div className="row">
        <input type="number" step="1" min="1" max="10" placeholder="Sleep" value={slSleep} onChange={e => setSlSleep(e.target.value)} />
        <input type="number" step="1" min="1" max="10" placeholder="Energy" value={slEnergy} onChange={e => setSlEnergy(e.target.value)} />
        <input type="number" step="1" min="1" max="10" placeholder="Soreness" value={slSoreness} onChange={e => setSlSoreness(e.target.value)} />
        <input type="number" step="1" min="1" max="10" placeholder="Mood" value={slMood} onChange={e => setSlMood(e.target.value)} />
        <button className="primary small" onClick={() => {
          const sq = parseInt(slSleep, 10);
          const en = parseInt(slEnergy, 10);
          const so = parseInt(slSoreness, 10);
          const md = parseInt(slMood, 10);
          if (![sq, en, so, md].some(v => isNaN(v) || v < 1 || v > 10)) {
            dispatchLogSleep({ type: 'LogSleep', userId, sleepQuality: sq, energy: en, soreness: so, mood: md });
            setSlSleep(''); setSlEnergy(''); setSlSoreness(''); setSlMood('');
          }
        }}>Log</button>
      </div>
    </>
  )}

  {/* Year trend chart — shown only after importing a year CSV */}
  {weeklyTrend.length > 0 && (
    <div className="column">
      <span className="label">SLEEP TREND</span>
      <div className="row between">
        <span className="caption">Score (left axis) · Duration (right axis)</span>
        <div className="row">
          <span className="caption">Need {fmtMin(weeklyTrend[weeklyTrend.length - 1].avgSleepNeedMin)}</span>
          <span className="caption">Bed {weeklyTrend[weeklyTrend.length - 1].avgBedtime}</span>
          <span className="caption">Wake {weeklyTrend[weeklyTrend.length - 1].avgWakeTime}</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={weeklyTrend}>
          <XAxis dataKey="weekLabel" tick={false} />
          <YAxis yAxisId="score" domain={[0, 100]} width={28} tick={{ fontSize: 10 }} />
          <YAxis yAxisId="dur" orientation="right" tickFormatter={(v: number) => fmtMin(v)} width={42} tick={{ fontSize: 10 }} />
          <Tooltip
            formatter={(v: unknown, name: string) =>
              name === 'avgDurationMin' ? fmtMin(v as number) : v
            }
            labelFormatter={(l: string) => l}
          />
          <Line yAxisId="score" type="monotone" dataKey="avgScore" stroke="var(--accent)" dot={false} strokeWidth={2} />
          <Line yAxisId="dur" type="monotone" dataKey="avgDurationMin" stroke="var(--text-2)" dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )}
</section>
```

- [ ] **Step 6: Run all tests**

```
npm test
```

Expected: all tests PASS.

- [ ] **Step 7: Commit**

```bash
git add ui/layouts/ProfileScreen.tsx
git commit -m "feat(sleep): add Garmin CSV import, full metrics display, and year trend chart"
```
