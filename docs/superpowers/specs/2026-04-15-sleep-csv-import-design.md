# Sleep CSV Import — Design Spec
**Date:** 2026-04-15

## Overview

Extend the sleep feature to store and display rich Garmin-measured sleep data alongside the existing subjective (1–10) manual log. CSV import is the initial ingestion path; the data model is designed to be compatible with a future Garmin API integration.

---

## Data Model

### Extended `SleepEntry` (`features/readiness/domain/types.ts`)

All new fields are nullable. Existing manual entries are unaffected — new fields default to `null` and `source` defaults to `'manual'`.

```ts
export interface SleepEntry {
  id: Id<'Sleep'>;
  userId: Id<'User'>;
  date: string;                     // 'YYYY-MM-DD'
  source: 'manual' | 'garmin_csv' | 'garmin_api';

  // Subjective (manual)
  sleepQuality: number | null;      // 1–10
  energy: number | null;            // 1–10
  soreness: number | null;          // 1–10
  mood: number | null;              // 1–10
  score: number;                    // 0–100 derived

  // Garmin-measured (nullable)
  sleepScore: number | null;        // 0–100 Garmin score
  quality: string | null;           // 'Good' | 'Fair' | 'Poor'
  durationMin: number | null;       // total sleep minutes
  deepMin: number | null;
  lightMin: number | null;
  remMin: number | null;
  awakeMin: number | null;
  hrv: number | null;               // ms
  restingHr: number | null;         // bpm
  overnightHr: number | null;       // bpm
  respiration: number | null;       // brpm
  bodyBatteryChange: number | null; // e.g. +70
  stressAvg: number | null;
  restlessMoments: number | null;

  loggedAt: number;
}
```

`SleepEntryView` and `SleepLoggedPayload` are updated to match. `LogSleep` (the manual command) keeps its existing required number fields — it is unchanged. Only the storage type accepts nullable subjective fields.

### New command: `ImportSleepFromCSV`

```ts
export interface ImportSleepFromCSV {
  type: 'ImportSleepFromCSV';
  userId: Id<'User'>;
  csvText: string;  // raw file contents
}
```

Fires the same `SleepLogged` event as manual logging, with `source: 'garmin_csv'` and all subjective fields set to `null`.

---

## CSV Parsing

**File:** `features/readiness/domain/parseGarminSleepCSV.ts`

A pure function that takes raw CSV text and returns a `Partial<SleepEntry>` with all Garmin fields populated. No third-party library — the format is key-value rows.

Parsing rules:
- `--` values → `null`
- Duration strings `Xh Ym` → total minutes (e.g. `8h 35m` → `515`)
- Unit-suffixed values `53 bpm`, `11 brpm` → strip unit, parse number
- `+70` body battery → parse as signed integer
- `Date` row → `date` field (`YYYY-MM-DD`)
- `Sleep Score` row → `sleepScore`
- `Quality` row → `quality`
- `Sleep Duration` (first occurrence) → `durationMin`
- `Deep Sleep Duration` → `deepMin`
- `Light Sleep Duration` → `lightMin`
- `REM Duration` → `remMin`
- `Awake Time` → `awakeMin`
- `Avg Overnight HRV` → `hrv`
- `Resting Heart Rate` → `restingHr`
- `Avg Overnight Heart Rate` → `overnightHr`
- `Avg Respiration` → `respiration`
- `Body Battery Change` → `bodyBatteryChange`
- `Stress Avg` → `stressAvg`
- `Restless Moments` → `restlessMoments`

---

## Command Handler

**File:** `features/readiness/commands/handlers.ts`

New `handleImportSleepFromCSV` function:
1. Calls `parseGarminSleepCSV(cmd.csvText)`
2. Validates that a date was parsed; returns `err` if not
3. Sets `score` to `sleepScore ?? 0` (no subjective inputs to derive from)
4. Fires `SleepLogged` event with `source: 'garmin_csv'`, all subjective fields `null`
5. Applies to `sleepHistoryProjection`, updates `viewStore`

Exported from `features/readiness/index.ts`.

---

## UI — ProfileScreen Sleep Section

**File:** `ui/layouts/ProfileScreen.tsx`

### Import control
A file input (`accept=".csv"`) with a "Import Garmin CSV" label sits at the top of the sleep section. On file selection:
1. `FileReader.readAsText` reads the file
2. Parsed result is dispatched via `handleImportSleepFromCSV`
3. Input resets after dispatch

### Entry display
Each `SleepEntryView` renders two blocks:

**Garmin Measured block** (only when `source !== 'manual'`):
- Headline: Garmin score + quality label
- Sleep stages: Deep / Light / REM / Awake as formatted durations
- Metrics row: HRV, resting HR, overnight HR, respiration, body battery change, stress avg, restless moments — each shown only when non-null

**Subjective block** (always shown):
- Current 1–10 ratings for sleep quality, energy, soreness, mood
- Manual log form (unchanged) available beneath

When subjective fields are null (Garmin-only entry), values display as `—` and the form is available to fill them in.

### History list
Last 7 entries show: date, Garmin score/quality (if available), subjective score (if available).

---

## Year CSV — Trend Chart

**File:** `features/readiness/domain/parseGarminSleepYearCSV.ts`

A pure function that parses the Garmin year export (comma-separated, one row per week) into an array of typed weekly data points:

```ts
export interface WeeklySleepTrend {
  weekLabel: string;       // e.g. 'Apr 9-15'
  avgScore: number;
  avgQuality: string;      // 'Good' | 'Fair' | 'Poor'
  avgDurationMin: number;
  avgSleepNeedMin: number;
  avgBedtime: string;      // e.g. '12:31 AM'
  avgWakeTime: string;     // e.g. '8:30 AM'
}
```

Parsing rules:
- Header row is skipped
- Duration strings `Xh Ymin` → total minutes
- Week label is taken as-is from the `Date` column
- Rows are returned oldest-first (reversed from the CSV, which is newest-first)

**Storage:** Local React `useState` only — no domain events, no projection, not persisted. Re-importing replaces the previous trend data.

**UI — Trend Chart:**
A chart in the sleep section renders `avgScore` and `avgDurationMin` as dual line series over the ~52 week range. Quality is encoded as colour (green = Good, amber = Fair, red = Poor). A summary row beneath shows `avgSleepNeedMin`, `avgBedtime`, and `avgWakeTime` for the most recent week. A second "Import Year Trend" file input (`accept=".csv"`) triggers parsing and sets the trend state.

---

## Future Garmin API

The `ImportSleepFromCSV` command is the CSV-specific entry point, but `handleLogSleep` can be extended to accept `source: 'garmin_api'` once the API integration is built. The domain model requires no further changes.

---

## Files Modified

| File | Change |
|------|--------|
| `features/readiness/domain/types.ts` | Extend `SleepEntry`, `SleepLoggedPayload`; add `ImportSleepFromCSV` (`LogSleep` unchanged) |
| `features/readiness/domain/reducers.ts` | Update `SleepEntryView` and `applySleepLogged` |
| `features/readiness/domain/parseGarminSleepCSV.ts` | New file — day CSV parser |
| `features/readiness/domain/parseGarminSleepYearCSV.ts` | New file — year CSV parser, returns `WeeklySleepTrend[]` |
| `features/readiness/commands/handlers.ts` | Add `handleImportSleepFromCSV` |
| `features/readiness/index.ts` | Export `handleImportSleepFromCSV` |
| `ui/layouts/ProfileScreen.tsx` | Add import button, update sleep section display |
