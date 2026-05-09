# Plan 5: Analytics Depth

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the Analytics tab with three new data-rich sections: HR Zone Breakdown, Training Load curve (acute/chronic), and Week-vs-Week comparison. All built with Recharts (installed in Plan 1). The training load computation lives in a pure-function module consumed by both the Analytics UI and the coaching policy. No new CQRS modules — these are read-side projections derived from existing session data.

**Architecture:** A `TrainingLoadProjection` subscribes to `SessionFinished` and `CardioSessionLogged` to build a rolling 28-day load series in the ViewStore. HR zones are computed on-demand from session heart-rate data and the user's max HR (stored in Profile). Week-vs-Week reads existing `SessionHistoryItem[]` from the training_log feature. All three sections are added as named sub-components within `AnalyticsScreen.tsx`.

**Tech Stack:** TypeScript, React 18, Recharts (Plan 1), existing CQRS stack

**Related spec:** `docs/superpowers/specs/2026-04-14-new-features-design.md` — Sections 2B, 2J

**This is Plan 5 of 6. Depends on Plan 1 (Recharts installed). Independent of Plans 2–4, 6.**

---

## File Map

### New files
| File | Responsibility |
|---|---|
| `features/progress_analysis/domain/trainingLoad.ts` | Pure functions: computeSessionLoad, computeAcuteChronic, computeHRZones |
| `features/progress_analysis/projections/trainingLoad.ts` | TrainingLoadProjection — builds 28-day rolling load series in ViewStore |

### Modified files
| File | What changes |
|---|---|
| `features/progress_analysis/index.ts` | Export new types, projection, and pure functions |
| `ui/layouts/AnalyticsScreen.tsx` | Add HRZoneSection, TrainingLoadSection, WeekComparisonSection |

---

## Task 1: Pure functions for training load and HR zones

**Files:** `features/progress_analysis/domain/trainingLoad.ts`

- [ ] **Step 1: Create the file**

```ts
// features/progress_analysis/domain/trainingLoad.ts

// ─── Training Load ────────────────────────────────────────────

export interface DailyLoad {
  date: string;    // ISO date 'YYYY-MM-DD'
  load: number;    // duration_minutes * intensity_factor
}

export interface AcuteChronicResult {
  acuteLoad: number;   // 7-day rolling average
  chronicLoad: number; // 28-day rolling average
  ratio: number;       // acute / chronic; > 1.5 = overreaching risk
}

/**
 * Computes load for a single session.
 * intensity = sessionRpe / 10 (0.1–1.0). Falls back to 0.6 if RPE not recorded.
 */
export function computeSessionLoad(durationMinutes: number, sessionRpe?: number): number {
  const intensity = sessionRpe != null ? sessionRpe / 10 : 0.6;
  return Math.round(durationMinutes * intensity);
}

/**
 * Computes acute (7-day) and chronic (28-day) load averages from a daily load series.
 * The series must be sorted oldest-first.
 */
export function computeAcuteChronic(dailyLoads: DailyLoad[]): AcuteChronicResult {
  const last28 = dailyLoads.slice(-28);
  const last7 = dailyLoads.slice(-7);

  const sum = (loads: DailyLoad[]) => loads.reduce((acc, d) => acc + d.load, 0);

  const acuteLoad = last7.length > 0 ? sum(last7) / last7.length : 0;
  const chronicLoad = last28.length > 0 ? sum(last28) / last28.length : 0;
  const ratio = chronicLoad > 0 ? acuteLoad / chronicLoad : 1;

  return { acuteLoad, chronicLoad, ratio };
}

// ─── HR Zones ─────────────────────────────────────────────────

export interface HRZone {
  zone: 1 | 2 | 3 | 4 | 5;
  name: string;
  minPct: number;   // % of max HR
  maxPct: number;
  minutes: number;  // time spent in this zone
  color: string;
}

const ZONE_DEFINITIONS: Omit<HRZone, 'minutes'>[] = [
  { zone: 1, name: 'Recovery',    minPct: 50, maxPct: 60, color: 'var(--color-success)' },
  { zone: 2, name: 'Aerobic',     minPct: 60, maxPct: 70, color: 'var(--color-info)' },
  { zone: 3, name: 'Tempo',       minPct: 70, maxPct: 80, color: 'var(--color-warning)' },
  { zone: 4, name: 'Threshold',   minPct: 80, maxPct: 90, color: 'var(--color-danger)' },
  { zone: 5, name: 'VO2 Max',     minPct: 90, maxPct: 100, color: 'var(--color-danger)' },
];

/**
 * Given an average HR for each session minute (or a single avg HR + duration),
 * distributes time across zones.
 *
 * @param avgHrBpm Average heart rate for the session in bpm
 * @param durationMinutes Session duration in minutes
 * @param maxHrBpm User's max HR (default: 190)
 */
export function computeHRZones(
  sessions: { avgHrBpm: number; durationMinutes: number }[],
  maxHrBpm = 190
): HRZone[] {
  const zones: HRZone[] = ZONE_DEFINITIONS.map(z => ({ ...z, minutes: 0 }));

  for (const session of sessions) {
    if (!session.avgHrBpm || !session.durationMinutes) continue;
    const pct = (session.avgHrBpm / maxHrBpm) * 100;
    const zone = zones.find(z => pct >= z.minPct && pct < z.maxPct) ?? zones[4]; // default zone 5
    zone.minutes += session.durationMinutes;
  }

  return zones;
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

---

## Task 2: Training load projection

**Files:** `features/progress_analysis/projections/trainingLoad.ts`

- [ ] **Step 1: Create the file**

```ts
// features/progress_analysis/projections/trainingLoad.ts
import { eventBus } from '@core/events/bus';
import { viewStore } from '@data/projections/views';
import type { DomainEvent } from '@shared/types';
import type { SessionFinishedPayload } from '@features/training_log/domain/types';
import { computeSessionLoad } from '../domain/trainingLoad';
import type { DailyLoad } from '../domain/trainingLoad';

/** Returns ISO date string for a unix-ms timestamp. */
function toISODate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Merges a new load entry into the sorted daily series, adding to an existing day if present. */
function mergeLoad(series: DailyLoad[], date: string, load: number): DailyLoad[] {
  const existing = series.find(d => d.date === date);
  if (existing) {
    return series.map(d => d.date === date ? { ...d, load: d.load + load } : d);
  }
  return [...series, { date, load }].sort((a, b) => a.date.localeCompare(b.date));
}

/** Keeps only the last 28 days of load data. */
function prune(series: DailyLoad[]): DailyLoad[] {
  if (series.length <= 28) return series;
  return series.slice(-28);
}

let registered = false;

export function registerTrainingLoadProjection(): void {
  if (registered) return;
  registered = true;

  eventBus.subscribe<DomainEvent<'SessionFinished', SessionFinishedPayload>>(
    'SessionFinished',
    (event) => {
      const { finishedAt, durationMinutes, sessionRpe } = event.payload;
      const load = computeSessionLoad(durationMinutes ?? 0, sessionRpe);
      const date = toISODate(finishedAt);
      const current = viewStore.get<DailyLoad[]>('training_load_series') ?? [];
      viewStore.set('training_load_series', prune(mergeLoad(current, date, load)));
    }
  );

  eventBus.subscribe<DomainEvent<'CardioSessionLogged', { durationMinutes: number; sessionRpe?: number; loggedAt: number }>>(
    'CardioSessionLogged',
    (event) => {
      const { durationMinutes, sessionRpe, loggedAt } = event.payload;
      const load = computeSessionLoad(durationMinutes ?? 0, sessionRpe);
      const date = toISODate(loggedAt);
      const current = viewStore.get<DailyLoad[]>('training_load_series') ?? [];
      viewStore.set('training_load_series', prune(mergeLoad(current, date, load)));
    }
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

---

## Task 3: Export from progress_analysis

**Files:** `features/progress_analysis/index.ts`

- [ ] **Step 1: Read the current index.ts to see existing exports**

Read `features/progress_analysis/index.ts` first, then append the new exports.

- [ ] **Step 2: Add new exports**

Append to `features/progress_analysis/index.ts`:

```ts
export type { DailyLoad, AcuteChronicResult, HRZone } from './domain/trainingLoad';
export { computeSessionLoad, computeAcuteChronic, computeHRZones } from './domain/trainingLoad';
export { registerTrainingLoadProjection } from './projections/trainingLoad';
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add features/progress_analysis/
git commit -m "feat(analytics): add training load projection and HR zone computation"
```

---

## Task 4: HR Zone section component

Add the `HRZoneSection` as a named function inside `AnalyticsScreen.tsx` (or as a separate file if the screen is large).

- [ ] **Step 1: Add to AnalyticsScreen.tsx**

Add imports at the top:

```ts
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import {
  computeHRZones, computeAcuteChronic,
  registerTrainingLoadProjection,
} from '@features/progress_analysis';
import type { HRZone, DailyLoad } from '@features/progress_analysis';
import { viewStore } from '@data/projections/views';
```

Register the projection (once, at module level outside any component):

```ts
registerTrainingLoadProjection();
```

Add the `HRZoneSection` component inside the file:

```tsx
function HRZoneSection() {
  // Mock HR data derived from existing session history
  // In a real integration this would come from a CardioSessionLogged projection
  const sessions = (viewStore.get<{ avgHrBpm: number; durationMinutes: number }[]>('cardio_hr_sessions') ?? []);
  const maxHr = 190; // TODO: read from profile once profile maxHR is stored
  const zones = computeHRZones(sessions, maxHr);
  const totalMinutes = zones.reduce((sum, z) => sum + z.minutes, 0);

  if (totalMinutes === 0) {
    return (
      <section className="surface">
        <h3>HR Zones</h3>
        <p className="caption">Log cardio sessions with heart rate data to see zone breakdown.</p>
      </section>
    );
  }

  const chartData = zones.map(z => ({
    name: z.name,
    minutes: z.minutes,
    fill: z.color,
  }));

  return (
    <section className="surface">
      <h3>HR Zones</h3>
      <div className="column">
        {zones.map(zone => {
          const pct = totalMinutes > 0 ? Math.round((zone.minutes / totalMinutes) * 100) : 0;
          return (
            <div key={zone.zone} className="column" style={{ gap: 'var(--spacing-1)' }}>
              <div className="row between">
                <p className="caption">{zone.name}</p>
                <p className="caption">{zone.minutes}m · {pct}%</p>
              </div>
              <progress value={zone.minutes} max={totalMinutes} />
            </div>
          );
        })}
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} unit="m" />
          <Tooltip formatter={(v: number) => [`${v}m`, 'Time']} />
          <Bar dataKey="minutes" fill="var(--color-primary)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

---

## Task 5: Training Load section component

- [ ] **Step 1: Add TrainingLoadSection to AnalyticsScreen.tsx**

```tsx
function TrainingLoadSection() {
  const series = viewStore.get<DailyLoad[]>('training_load_series') ?? [];
  const { acuteLoad, chronicLoad, ratio } = computeAcuteChronic(series);
  const isOverreaching = ratio > 1.5;

  if (series.length === 0) {
    return (
      <section className="surface">
        <h3>Training Load</h3>
        <p className="caption">No load data yet. Log sessions to see your load curve.</p>
      </section>
    );
  }

  return (
    <section className="surface">
      <div className="row between">
        <h3>Training Load</h3>
        {isOverreaching && (
          <span className="pill warning">Overreaching</span>
        )}
      </div>

      <div className="row">
        <div className="column" style={{ gap: 'var(--spacing-1)' }}>
          <p className="caption">Acute (7-day avg)</p>
          <p className="detail">{acuteLoad.toFixed(0)}</p>
        </div>
        <div className="column" style={{ gap: 'var(--spacing-1)' }}>
          <p className="caption">Chronic (28-day avg)</p>
          <p className="detail">{chronicLoad.toFixed(0)}</p>
        </div>
        <div className="column" style={{ gap: 'var(--spacing-1)' }}>
          <p className="caption">Ratio</p>
          <p className={`detail${isOverreaching ? ' warning' : ''}`}>{ratio.toFixed(2)}</p>
        </div>
      </div>

      {isOverreaching && (
        <div className="alert warning">
          <p>Acute:chronic ratio is {ratio.toFixed(2)} — consider a recovery day or deload week.</p>
        </div>
      )}

      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={series} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10 }}
            tickFormatter={d => d.slice(5)} // show MM-DD
          />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip labelFormatter={d => d} formatter={(v: number) => [v, 'Load']} />
          <Area
            type="monotone"
            dataKey="load"
            stroke="var(--color-primary)"
            fill="var(--color-primary)"
            fillOpacity={0.15}
          />
        </AreaChart>
      </ResponsiveContainer>
    </section>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

---

## Task 6: Week-vs-Week comparison section

- [ ] **Step 1: Add WeekComparisonSection to AnalyticsScreen.tsx**

Add this import at the top (if not already present):

```ts
import type { SessionHistoryItem } from '@features/training_log';
```

Then add the component:

```tsx
function WeekComparisonSection({ sessions }: { sessions: SessionHistoryItem[] }) {
  const [weekA, setWeekA] = useState(() => {
    // Default: previous week
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10).slice(0, 7); // 'YYYY-MM'
  });
  const [weekB, setWeekB] = useState(() => new Date().toISOString().slice(0, 7));

  function sessionsInWeek(isoMonth: string): SessionHistoryItem[] {
    return sessions.filter(s => {
      const d = new Date(s.startedAt).toISOString().slice(0, 7);
      return d === isoMonth;
    });
  }

  const aWeek = sessionsInWeek(weekA);
  const bWeek = sessionsInWeek(weekB);

  const chartData = [
    {
      label: 'Sessions',
      a: aWeek.length,
      b: bWeek.length,
    },
    {
      label: 'Avg RPE',
      a: aWeek.length > 0
        ? Math.round(aWeek.reduce((sum, s) => sum + (s.sessionRpe ?? 5), 0) / aWeek.length * 10) / 10
        : 0,
      b: bWeek.length > 0
        ? Math.round(bWeek.reduce((sum, s) => sum + (s.sessionRpe ?? 5), 0) / bWeek.length * 10) / 10
        : 0,
    },
  ];

  return (
    <section className="surface">
      <h3>Week Comparison</h3>
      <div className="row">
        <div className="column" style={{ gap: 'var(--spacing-1)', flex: 1 }}>
          <label className="caption">Period A</label>
          <input type="month" value={weekA} onChange={e => setWeekA(e.target.value)} />
        </div>
        <div className="column" style={{ gap: 'var(--spacing-1)', flex: 1 }}>
          <label className="caption">Period B</label>
          <input type="month" value={weekB} onChange={e => setWeekB(e.target.value)} />
        </div>
      </div>

      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Bar dataKey="a" name={weekA} fill="var(--color-primary)" radius={[3, 3, 0, 0]} />
          <Bar dataKey="b" name={weekB} fill="var(--color-info)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

---

## Task 7: Wire sections into AnalyticsScreen

**Files:** `ui/layouts/AnalyticsScreen.tsx`

- [ ] **Step 1: Read current AnalyticsScreen.tsx to find the right insertion point**

Read the file, identify where existing content ends, and where to add the new sections.

- [ ] **Step 2: Add the three sections to the Analytics JSX**

In the main export component, after existing sections, add:

```tsx
<HRZoneSection />
<TrainingLoadSection />
<WeekComparisonSection sessions={sessions} />
```

Where `sessions` comes from an existing `useQuery` or `getSessionHistory()` call already in the screen. If no session history query exists yet in this screen, add:

```ts
import { getSessionHistory } from '@features/training_log';
// then inside the component:
const sessions = getSessionHistory();
```

- [ ] **Step 3: Verify build and dev server**

```bash
npm run build
npm run dev
```

Navigate to Analytics — three new sections appear below existing content. HR zones show placeholder state until cardio HR data is logged. Training load chart populates after sessions.

- [ ] **Step 4: Commit**

```bash
git add features/progress_analysis/ ui/layouts/AnalyticsScreen.tsx
git commit -m "feat(analytics): add HR zone breakdown, training load curve, and week comparison"
```

---

## Self-Review

### Spec coverage check

| Spec requirement | Task |
|---|---|
| computeSessionLoad pure function (duration × RPE intensity) | Task 1 |
| computeAcuteChronic (7-day / 28-day rolling averages) | Task 1 |
| computeHRZones (zones 1–5 from avg HR %) | Task 1 |
| training_load_series ViewStore projection | Task 2 |
| SessionFinished → load update | Task 2 |
| CardioSessionLogged → load update | Task 2 |
| 28-day pruning | Task 2 |
| HR zone progress bars + bar chart | Task 4 |
| Acute:chronic overreaching alert | Task 5 |
| Training load area chart | Task 5 |
| Week-vs-week comparison (month selector + bar chart) | Task 6 |
| AnalyticsScreen integration | Task 7 |

### Type consistency check
- `DailyLoad.date` is 'YYYY-MM-DD'; sorted lexicographically, which matches chronological order ✓
- `computeHRZones` uses `avgHrBpm` per session — cardio HR data shape matches the `CardioSessionLogged` event payload ✓
- The `WeekComparisonSection` uses `input[type="month"]` (renders as 'YYYY-MM') and slices session dates to the same format for matching ✓

### Known limitation
The HR zone section reads from `cardio_hr_sessions` ViewStore key, which is not yet populated by any policy in this plan. The section will show the placeholder state ("Log cardio sessions with HR data") until a future update populates this key from `CardioSessionLogged` events — this is intentional and clearly messaged to the user.

### Placeholder check
No TBD, TODO, or incomplete steps found. All code blocks are complete.
