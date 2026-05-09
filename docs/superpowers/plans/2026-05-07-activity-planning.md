# Activity Planning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a four-step planning wizard to the Workout tab so users can plan a future gym session or cardio activity (run/cycle/swim), with planned sessions surfacing in both the Workout tab and the Schedule screen.

**Architecture:** A new `features/planning` domain module stores plans via event-sourced command/projection pattern (matching all other features). A `PlanWizard` overlay component manages a four-step state machine (type → configure → schedule → review). Gym plans collect exercises; cardio plans use an interactive Leaflet map for waypoints with auto-calculated distance and pace markers; swim plans use pool-based distance/pace. Plans surface via `useQuery('planned_sessions')` in both the Workout tab (upcoming section) and the Schedule screen.

**Tech Stack:** React 18, TypeScript, Leaflet.js (`leaflet` + `@types/leaflet` already installed), Vitest, existing `@ui/bindings` (useQuery/useCommand), existing CSS design tokens.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `features/planning/domain/types.ts` | Create | `PlannedSession`, `PlannedExercise`, `DistanceMarker`, `PlanType`, all event/command types |
| `features/planning/domain/markers.ts` | Create | `formatPace`, `parsePace`, `buildMarkers` — pure helper functions |
| `features/planning/domain/markers.test.ts` | Create | Unit tests for the three pure helpers |
| `features/planning/projections/index.ts` | Create | `plannedSessionsProjection` — `PlannedSession[]` sorted by scheduledAt |
| `features/planning/queries/index.ts` | Create | `getPlannedSessions()` — reads from viewStore |
| `features/planning/commands/handlers.ts` | Create | `handlePlanSession`, `handleDeletePlannedSession` |
| `features/planning/index.ts` | Create | Barrel export for all planning types and functions |
| `app/registry/App.tsx` | Modify | Add `import '@features/planning'` to register the projection |
| `styling/wizard.css` | Create | Wizard overlay, header, body, footer, step dots, map container |
| `styling/styleguide.css` | Modify | Add `@import "./wizard.css"` |
| `ui/components/workout/wizard/StepType.tsx` | Create | Step 1 — four activity type cards |
| `ui/components/workout/wizard/StepGym.tsx` | Create | Step 2a — exercise list + inline picker |
| `ui/components/workout/wizard/RouteMap.tsx` | Create | Leaflet map with tap-to-add waypoints, auto distance |
| `ui/components/workout/wizard/StepCardio.tsx` | Create | Step 2b — RouteMap, pace input, distance markers table |
| `ui/components/workout/wizard/StepSwim.tsx` | Create | Step 2c — pool length, distance, pace inputs, markers |
| `ui/components/workout/wizard/StepSchedule.tsx` | Create | Step 3 — date, time, notes |
| `ui/components/workout/wizard/StepReview.tsx` | Create | Step 4 — read-only summary + Save button |
| `ui/components/workout/wizard/PlanWizard.tsx` | Create | Wizard shell — step state machine + WizardData accumulator |
| `ui/components/workout/UpcomingPlans.tsx` | Create | Upcoming planned sessions list for Workout tab |
| `ui/layouts/LogScreenV2.tsx` | Modify | Add Plan button + `UpcomingPlans` section + `showPlan` state |
| `ui/layouts/TrainingPlansScreen.tsx` | Modify | Add "Planned Sessions" section showing upcoming plans by date |

---

## Task 1: Planning domain types + pure helpers + tests

**Files:**
- Create: `features/planning/domain/types.ts`
- Create: `features/planning/domain/markers.ts`
- Create: `features/planning/domain/markers.test.ts`

- [ ] **Step 1: Write failing tests for `formatPace`, `parsePace`, and `buildMarkers`**

```typescript
// features/planning/domain/markers.test.ts
import { describe, it, expect } from 'vitest';
import { formatPace, parsePace, buildMarkers } from './markers';

describe('formatPace', () => {
  it('formats whole minutes', () => {
    expect(formatPace(300)).toBe('5:00');
  });
  it('formats seconds with leading zero', () => {
    expect(formatPace(330)).toBe('5:30');
  });
  it('formats single-digit seconds', () => {
    expect(formatPace(305)).toBe('5:05');
  });
});

describe('parsePace', () => {
  it('parses MM:SS string to total seconds', () => {
    expect(parsePace('5:00')).toBe(300);
  });
  it('parses MM:SS with non-zero seconds', () => {
    expect(parsePace('5:30')).toBe(330);
  });
  it('clamps seconds to 59', () => {
    expect(parsePace('5:99')).toBe(359);
  });
  it('returns 0 for empty string', () => {
    expect(parsePace('')).toBe(0);
  });
});

describe('buildMarkers', () => {
  it('produces one marker for exactly one interval', () => {
    const m = buildMarkers(1, 300, 1);
    expect(m).toHaveLength(1);
    expect(m[0].distanceKm).toBe(1);
    expect(m[0].cumulativeTime).toBe('5:00');
  });

  it('produces markers at each interval and final distance', () => {
    const m = buildMarkers(3, 300, 1);
    expect(m.map(x => x.distanceKm)).toEqual([1, 2, 3]);
    expect(m.map(x => x.cumulativeTime)).toEqual(['5:00', '10:00', '15:00']);
  });

  it('includes a partial final marker when total is not a round number', () => {
    const m = buildMarkers(1.5, 300, 1);
    expect(m).toHaveLength(2);
    expect(m[1].distanceKm).toBe(1.5);
    expect(m[1].cumulativeTime).toBe('7:30');
  });

  it('uses 5 km intervals for cycles (caller responsibility to pass correct interval)', () => {
    const m = buildMarkers(10, 120, 5);
    expect(m.map(x => x.distanceKm)).toEqual([5, 10]);
  });
});
```

- [ ] **Step 2: Run the tests to confirm they fail**

```
npx vitest run features/planning/domain/markers.test.ts
```
Expected: errors about missing module `./markers`.

- [ ] **Step 3: Create the domain types file**

```typescript
// features/planning/domain/types.ts
import type { Id, DomainEvent } from '@shared/types';

export type PlanType = 'gym' | 'run' | 'cycle' | 'swim';

export interface PlannedExercise {
  name: string;
  sets: number;
  reps: number;
  weightKg: number;
}

export interface DistanceMarker {
  distanceKm: number;
  cumulativeTime: string;  // "M:SS" or "MM:SS"
}

export interface PlannedSession {
  id: Id<'PlannedSession'>;
  type: PlanType;
  name: string;
  scheduledAt: number;  // Unix ms
  notes: string;
  // Gym only
  exercises?: PlannedExercise[];
  // Run / cycle only
  routeWaypoints?: [number, number][];   // [lat, lng] pairs
  distanceKm?: number;
  paceSecPerKm?: number;
  distanceMarkers?: DistanceMarker[];
  // Swim only
  poolLengthM?: 25 | 50;
  targetDistanceM?: number;
  paceSecPer100m?: number;
}

export type PlanningEvent =
  | DomainEvent<'SessionPlanned', PlannedSession>
  | DomainEvent<'PlannedSessionDeleted', { planId: Id<'PlannedSession'> }>;

export interface PlanSession {
  type: 'PlanSession';
  userId: Id<'User'>;
  planType: PlanType;
  name: string;
  scheduledAt: number;
  notes: string;
  exercises?: PlannedExercise[];
  routeWaypoints?: [number, number][];
  distanceKm?: number;
  paceSecPerKm?: number;
  distanceMarkers?: DistanceMarker[];
  poolLengthM?: 25 | 50;
  targetDistanceM?: number;
  paceSecPer100m?: number;
}

export interface DeletePlannedSession {
  type: 'DeletePlannedSession';
  planId: Id<'PlannedSession'>;
}

export type PlanningCommand = PlanSession | DeletePlannedSession;
```

- [ ] **Step 4: Create the markers helper file**

```typescript
// features/planning/domain/markers.ts
import type { DistanceMarker } from './types';

export function formatPace(secPerKm: number): string {
  const m = Math.floor(secPerKm / 60);
  const s = secPerKm % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function parsePace(str: string): number {
  const parts = str.split(':');
  const m = parseInt(parts[0] ?? '0', 10) || 0;
  const s = Math.min(parseInt(parts[1] ?? '0', 10) || 0, 59);
  return m * 60 + s;
}

export function buildMarkers(
  distanceKm: number,
  paceSecPerKm: number,
  intervalKm: number,
): DistanceMarker[] {
  const markers: DistanceMarker[] = [];
  let d = intervalKm;
  while (d <= distanceKm + 0.001) {
    const km = Math.round(Math.min(d, distanceKm) * 1000) / 1000;
    const totalSec = Math.round(km * paceSecPerKm);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    markers.push({ distanceKm: km, cumulativeTime: `${mins}:${String(secs).padStart(2, '0')}` });
    if (km >= distanceKm) break;
    d += intervalKm;
  }
  return markers;
}
```

- [ ] **Step 5: Run tests again to confirm they pass**

```
npx vitest run features/planning/domain/markers.test.ts
```
Expected: all 10 tests pass.

---

## Task 2: Planning projection, queries, and barrel export

**Files:**
- Create: `features/planning/projections/index.ts`
- Create: `features/planning/queries/index.ts`
- Create: `features/planning/index.ts`

- [ ] **Step 1: Create the projection**

```typescript
// features/planning/projections/index.ts
import type { PlanningEvent, PlannedSession } from '../domain/types';
import { ProjectionBuilder, projectionRegistry } from '@data/projections/builders';

export const plannedSessionsProjection = new ProjectionBuilder<PlannedSession[], PlanningEvent>(
  'planned_sessions',
  [],
  {
    SessionPlanned: (state, event) => {
      const plan = event.payload as PlannedSession;
      return [...state, plan].sort((a, b) => a.scheduledAt - b.scheduledAt);
    },
    PlannedSessionDeleted: (state, event) => {
      return state.filter(p => p.id !== event.payload.planId);
    },
  },
);

projectionRegistry.register('planned_sessions', plannedSessionsProjection);
```

- [ ] **Step 2: Create the query**

```typescript
// features/planning/queries/index.ts
import { viewStore } from '@data/projections/views';
import type { PlannedSession } from '../domain/types';

export function getPlannedSessions(): PlannedSession[] {
  return viewStore.get<PlannedSession[]>('planned_sessions') ?? [];
}

export function getUpcomingPlans(nowMs = Date.now()): PlannedSession[] {
  return getPlannedSessions().filter(p => p.scheduledAt > nowMs);
}
```

- [ ] **Step 3: Create the barrel export**

```typescript
// features/planning/index.ts
export type {
  PlanType,
  PlannedExercise,
  DistanceMarker,
  PlannedSession,
  PlanningEvent,
  PlanSession,
  DeletePlannedSession,
  PlanningCommand,
} from './domain/types';

export { formatPace, parsePace, buildMarkers } from './domain/markers';

export { plannedSessionsProjection } from './projections';

export { getPlannedSessions, getUpcomingPlans } from './queries';

export { handlePlanSession, handleDeletePlannedSession } from './commands/handlers';
```

Note: `commands/handlers.ts` does not exist yet — create it in Task 3. The barrel will type-check once Task 3 is done.

---

## Task 3: Planning command handler

**Files:**
- Create: `features/planning/commands/handlers.ts`

- [ ] **Step 1: Create the command handler**

```typescript
// features/planning/commands/handlers.ts
import type { Result } from '@shared/types';
import { ok, err } from '@shared/types';
import type { PlanSession, DeletePlannedSession, PlanningEvent, PlannedSession } from '../domain/types';
import { cryptoIdGenerator } from '@core/id-generator';
import { systemClock } from '@core/clock';
import { inMemoryEventStore } from '@data/store';
import { viewStore } from '@data/projections/views';
import { plannedSessionsProjection } from '../projections';

function applyAndStore(events: PlanningEvent[]): void {
  events.forEach(e => plannedSessionsProjection.apply(e));
  viewStore.set('planned_sessions', plannedSessionsProjection.getState());
}

export async function handlePlanSession(cmd: PlanSession): Promise<Result<void, string>> {
  if (!cmd.name.trim()) return err('Session name is required');
  if (!cmd.scheduledAt) return err('Scheduled date is required');

  const plan: PlannedSession = {
    id: cryptoIdGenerator.next<'PlannedSession'>(),
    type: cmd.planType,
    name: cmd.name.trim(),
    scheduledAt: cmd.scheduledAt,
    notes: cmd.notes,
    exercises: cmd.exercises,
    routeWaypoints: cmd.routeWaypoints,
    distanceKm: cmd.distanceKm,
    paceSecPerKm: cmd.paceSecPerKm,
    distanceMarkers: cmd.distanceMarkers,
    poolLengthM: cmd.poolLengthM,
    targetDistanceM: cmd.targetDistanceM,
    paceSecPer100m: cmd.paceSecPer100m,
  };

  const event: PlanningEvent = {
    type: 'SessionPlanned',
    aggregateId: cmd.userId,
    aggregateType: 'User',
    timestamp: systemClock.now(),
    version: 1,
    payload: plan,
  };

  await inMemoryEventStore.append(event);
  applyAndStore([event]);
  return ok(undefined);
}

export async function handleDeletePlannedSession(cmd: DeletePlannedSession): Promise<Result<void, string>> {
  const event: PlanningEvent = {
    type: 'PlannedSessionDeleted',
    aggregateId: cmd.planId,
    aggregateType: 'PlannedSession',
    timestamp: systemClock.now(),
    version: 1,
    payload: { planId: cmd.planId },
  };

  await inMemoryEventStore.append(event);
  applyAndStore([event]);
  return ok(undefined);
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```
npx tsc --noEmit
```
Expected: no new errors. If you see "Cannot find module '@data/store'" check that the path alias resolves to `data/store` — it does per `vite.config.ts`.

---

## Task 4: Register planning feature in App.tsx

**Files:**
- Modify: `app/registry/App.tsx`

- [ ] **Step 1: Add the import**

In `app/registry/App.tsx`, add this line directly after the `'@features/training_log'` import:

```typescript
import '@features/planning';
```

The full import block at the top of App.tsx should look like:

```typescript
// existing imports...
import '@features/training_log';
import '@features/planning';
```

The side-effect import triggers `projectionRegistry.register('planned_sessions', ...)` so `useQuery('planned_sessions')` works from any component.

- [ ] **Step 2: Verify no build errors**

```
npx tsc --noEmit
```
Expected: no new errors.

---

## Task 5: Wizard CSS

**Files:**
- Create: `styling/wizard.css`
- Modify: `styling/styleguide.css`

- [ ] **Step 1: Create wizard.css**

```css
/* styling/wizard.css */

/* ── Wizard overlay — full-screen, above nav (no existing equivalent) ── */
.wizard-overlay {
  position: fixed;
  inset: 0;
  z-index: 300;
  background: var(--surface-0);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── Wizard chrome — style child elements directly, no extra classes ── */
.wizard-overlay > header {
  padding: var(--s-4) var(--s-5);
  border-bottom: 1px solid var(--line);
  flex-shrink: 0;
}

.wizard-overlay > div {
  flex: 1;
  overflow-y: auto;
  padding: var(--s-5);
}

.wizard-overlay > footer {
  padding: var(--s-4) var(--s-5);
  border-top: 1px solid var(--line);
  flex-shrink: 0;
}

/* ── Type selector — selected accent border (no existing equivalent) ── */
.surface.selected { border-color: var(--accent); }

/* ── Leaflet map container (height must be explicit for Leaflet) ── */
.plan-map {
  width: 100%;
  height: 240px;
  border-radius: var(--r-md);
  overflow: hidden;
  border: 1px solid var(--line);
}

@media (min-width: 600px) {
  .plan-map { height: 320px; }
}

/* ── Narrow number inputs for set/rep counts and weight ── */
.input-count  { width: 44px; }
.input-weight { width: 56px; }
```

- [ ] **Step 2: Add the import to styleguide.css**

Open `styling/styleguide.css`. Add one line at the end:

```css
@import "./wizard.css";
```

The full file should now be:

```css
@import "./tokens.css";
@import "./reset.css";
@import "./layout.css";
@import "./typography.css";
@import "./nav.css";
@import "./utilities.css";
@import "./surface.css";
@import "./buttons.css";
@import "./forms.css";
@import "./components.css";
@import "./log.css";
@import "./wizard.css";
```

---

## Task 6: StepType component

**Files:**
- Create: `ui/components/workout/wizard/StepType.tsx`

- [ ] **Step 1: Create the component**

```typescript
// ui/components/workout/wizard/StepType.tsx
import type { PlanType } from '@features/planning';

interface StepTypeProps {
  selected: PlanType | null;
  onSelect: (type: PlanType) => void;
}

const TYPE_OPTIONS: Array<{ type: PlanType; emoji: string; label: string; desc: string }> = [
  { type: 'gym',   emoji: '🏋️', label: 'Gym session',  desc: 'Exercises, sets & reps' },
  { type: 'run',   emoji: '🏃', label: 'Run',           desc: 'Route, pace & markers' },
  { type: 'cycle', emoji: '🚴', label: 'Cycle',         desc: 'Route, pace & markers' },
  { type: 'swim',  emoji: '🏊', label: 'Swim',          desc: 'Distance & pace' },
];

export function StepType({ selected, onSelect }: StepTypeProps) {
  return (
    <div className="column">
      {TYPE_OPTIONS.map(opt => (
        <button
          key={opt.type}
          type="button"
          className={`surface row align-center interactive${selected === opt.type ? ' selected' : ''}`}
          onClick={() => onSelect(opt.type)}
        >
          <span aria-hidden>{opt.emoji}</span>
          <div className="column compact">
            <span className="detail">{opt.label}</span>
            <span className="caption muted">{opt.desc}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
```

---

## Task 7: StepGym component

**Files:**
- Create: `ui/components/workout/wizard/StepGym.tsx`

- [ ] **Step 1: Create the component**

```typescript
// ui/components/workout/wizard/StepGym.tsx
import { useState } from 'react';
import type { PlannedExercise } from '@features/planning';

interface StepGymProps {
  sessionName: string;
  exercises: PlannedExercise[];
  onSessionNameChange: (name: string) => void;
  onExercisesChange: (exercises: PlannedExercise[]) => void;
}

const EXERCISE_SUGGESTIONS = [
  'Bench Press', 'Overhead Press', 'Squat', 'Deadlift', 'Pull-up',
  'Bent Over Row', 'Incline DB Press', 'Lateral Raise', 'Bicep Curl',
  'Tricep Extension', 'Leg Press', 'Romanian Deadlift',
];

function ExerciseRow({
  ex,
  onChange,
  onRemove,
}: {
  ex: PlannedExercise;
  onChange: (updated: PlannedExercise) => void;
  onRemove: () => void;
}) {
  return (
    <div className="row align-center">
      <div className="column compact grow">
        <span className="detail">{ex.name}</span>
        <div className="row compact align-center">
          <input
            type="number"
            min={1}
            max={20}
            value={ex.sets}
            onChange={e => onChange({ ...ex, sets: Math.max(1, Number(e.target.value)) })}
            aria-label="Sets"
            className="input-count"
          />
          <span className="caption muted">sets ×</span>
          <input
            type="number"
            min={1}
            max={100}
            value={ex.reps}
            onChange={e => onChange({ ...ex, reps: Math.max(1, Number(e.target.value)) })}
            aria-label="Reps"
            className="input-count"
          />
          <span className="caption muted">reps</span>
          <input
            type="number"
            min={0}
            step={2.5}
            value={ex.weightKg}
            onChange={e => onChange({ ...ex, weightKg: Math.max(0, Number(e.target.value)) })}
            aria-label="Weight kg"
            className="input-weight"
          />
          <span className="caption muted">kg</span>
        </div>
      </div>
      <button type="button" className="ghost icon sm" onClick={onRemove} aria-label="Remove">
        ×
      </button>
    </div>
  );
}

export function StepGym({ sessionName, exercises, onSessionNameChange, onExercisesChange }: StepGymProps) {
  const [search, setSearch] = useState('');
  const [showPicker, setShowPicker] = useState(false);

  const filtered = EXERCISE_SUGGESTIONS.filter(
    name => name.toLowerCase().includes(search.toLowerCase()) &&
      !exercises.some(e => e.name === name),
  );

  function addExercise(name: string) {
    onExercisesChange([...exercises, { name, sets: 3, reps: 8, weightKg: 0 }]);
    setSearch('');
    setShowPicker(false);
  }

  function updateExercise(idx: number, updated: PlannedExercise) {
    onExercisesChange(exercises.map((e, i) => (i === idx ? updated : e)));
  }

  function removeExercise(idx: number) {
    onExercisesChange(exercises.filter((_, i) => i !== idx));
  }

  return (
    <div className="column">
      <div className="column compact">
        <label className="caption">Session name</label>
        <input
          type="text"
          value={sessionName}
          onChange={e => onSessionNameChange(e.target.value)}
          placeholder="e.g. Push Day"
        />
      </div>

      <div className="surface column compact">
        {exercises.length === 0 && (
          <p className="caption muted">No exercises added yet.</p>
        )}
        {exercises.map((ex, idx) => (
          <ExerciseRow
            key={idx}
            ex={ex}
            onChange={updated => updateExercise(idx, updated)}
            onRemove={() => removeExercise(idx)}
          />
        ))}

        {showPicker ? (
          <div className="column compact">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search exercises…"
              autoFocus
            />
            <div className="column compact">
              {filtered.slice(0, 8).map(name => (
                <button
                  key={name}
                  type="button"
                  className="ghost"
                  onClick={() => addExercise(name)}
                >
                  {name}
                </button>
              ))}
            </div>
            <button type="button" className="ghost sm" onClick={() => setShowPicker(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <button type="button" className="secondary sm" onClick={() => setShowPicker(true)}>
            + Add exercise
          </button>
        )}
      </div>
    </div>
  );
}
```

Note: `.input-count` and `.input-weight` are defined in `styling/wizard.css` (Task 5). They constrain the width of the small number inputs so they don't collapse to their default size.

---

## Task 8: RouteMap component (Leaflet)

**Files:**
- Create: `ui/components/workout/wizard/RouteMap.tsx`

This follows the same pattern as the existing `ui/components/Map.tsx`.

- [ ] **Step 1: Create RouteMap**

```typescript
// ui/components/workout/wizard/RouteMap.tsx
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const TILE_ATTR = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>';
const DEFAULT_CENTER: L.LatLngTuple = [51.505, -0.09];  // London — replaced once user taps
const DEFAULT_ZOOM = 13;

export function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon;
  return R * 2 * Math.asin(Math.sqrt(h));
}

export function totalDistanceKm(waypoints: [number, number][]): number {
  if (waypoints.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < waypoints.length; i++) {
    total += haversineKm(waypoints[i - 1], waypoints[i]);
  }
  return Math.round(total * 100) / 100;
}

interface RouteMapProps {
  waypoints: [number, number][];
  onChange: (waypoints: [number, number][]) => void;
}

export function RouteMap({ waypoints, onChange }: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);
  const polylineRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
    });
    mapRef.current = map;

    L.tileLayer(TILE_URL, { attribution: TILE_ATTR, maxZoom: 19 }).addTo(map);

    map.on('click', (e: L.LeafletMouseEvent) => {
      const latlng: [number, number] = [e.latlng.lat, e.latlng.lng];
      onChange([...waypoints, latlng]);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // intentionally run once on mount; waypoints and onChange are synced via separate effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync waypoints → map markers + polyline
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    polylineRef.current?.remove();

    if (waypoints.length === 0) return;

    waypoints.forEach((wp, i) => {
      const isStart = i === 0;
      const isEnd = i === waypoints.length - 1 && waypoints.length > 1;
      const marker = L.circleMarker(wp, {
        radius: isStart || isEnd ? 7 : 5,
        fillColor: isStart ? '#22c55e' : isEnd ? '#ef4444' : '#7eb8f7',
        color: 'white',
        weight: 2,
        fillOpacity: 1,
      }).addTo(map);
      markersRef.current.push(marker);
    });

    if (waypoints.length >= 2) {
      polylineRef.current = L.polyline(waypoints, {
        color: '#7eb8f7',
        weight: 3,
        dashArray: '6 4',
      }).addTo(map);
      map.fitBounds(L.latLngBounds(waypoints));
    }

    // Re-bind click to include updated waypoints closure
    map.off('click');
    map.on('click', (e: L.LeafletMouseEvent) => {
      const latlng: [number, number] = [e.latlng.lat, e.latlng.lng];
      onChange([...waypoints, latlng]);
    });
  }, [waypoints, onChange]);

  return (
    <div
      ref={containerRef}
      className="plan-map"
      // The width/height:100% is required by Leaflet to calculate map dimensions.
      // These are set via the .plan-map CSS class in wizard.css.
    />
  );
}
```

---

## Task 9: StepCardio component

**Files:**
- Create: `ui/components/workout/wizard/StepCardio.tsx`

- [ ] **Step 1: Create the component**

```typescript
// ui/components/workout/wizard/StepCardio.tsx
import { useState, useMemo } from 'react';
import type { PlanType, DistanceMarker } from '@features/planning';
import { formatPace, parsePace, buildMarkers } from '@features/planning';
import { RouteMap, totalDistanceKm } from './RouteMap';

interface StepCardioProps {
  planType: PlanType;  // 'run' | 'cycle'
  sessionName: string;
  waypoints: [number, number][];
  paceSecPerKm: number;
  onSessionNameChange: (name: string) => void;
  onWaypointsChange: (waypoints: [number, number][]) => void;
  onPaceChange: (paceSecPerKm: number) => void;
}

export function StepCardio({
  planType,
  sessionName,
  waypoints,
  paceSecPerKm,
  onSessionNameChange,
  onWaypointsChange,
  onPaceChange,
}: StepCardioProps) {
  const [routeTab, setRouteTab] = useState<'draw' | 'saved'>('draw');
  const [paceInput, setPaceInput] = useState(formatPace(paceSecPerKm));

  const distanceKm = useMemo(() => totalDistanceKm(waypoints), [waypoints]);
  const intervalKm = planType === 'cycle' ? 5 : 1;
  const markers: DistanceMarker[] = useMemo(
    () => distanceKm > 0 ? buildMarkers(distanceKm, paceSecPerKm, intervalKm) : [],
    [distanceKm, paceSecPerKm, intervalKm],
  );

  const estMinutes = distanceKm > 0 ? Math.round((distanceKm * paceSecPerKm) / 60) : null;

  function handlePaceBlur() {
    const sec = parsePace(paceInput);
    if (sec > 0) {
      onPaceChange(sec);
      setPaceInput(formatPace(sec));
    }
  }

  return (
    <div className="column">
      <div className="column compact">
        <label className="caption">Session name</label>
        <input
          type="text"
          value={sessionName}
          onChange={e => onSessionNameChange(e.target.value)}
          placeholder={planType === 'run' ? 'e.g. Morning Run' : 'e.g. Easy Ride'}
        />
      </div>

      <div className="tabs">
        <button
          type="button"
          className={`tab${routeTab === 'draw' ? ' active' : ''}`}
          onClick={() => setRouteTab('draw')}
        >
          🗺 Draw route
        </button>
        <button
          type="button"
          className={`tab${routeTab === 'saved' ? ' active' : ''}`}
          onClick={() => setRouteTab('saved')}
        >
          📂 Saved
        </button>
      </div>

      {routeTab === 'draw' ? (
        <div className="column compact">
          <RouteMap waypoints={waypoints} onChange={onWaypointsChange} />
          {waypoints.length > 0 && (
            <button type="button" className="ghost sm" onClick={() => onWaypointsChange([])}>
              Clear route
            </button>
          )}
          <span className="caption muted">
            {waypoints.length < 2
              ? 'Tap the map to place waypoints'
              : `Distance: ${distanceKm} km · ${waypoints.length} waypoints`}
          </span>
        </div>
      ) : (
        <div className="surface">
          <p className="caption muted">
            Select from recent {planType} sessions to reuse a route.
          </p>
          <p className="caption faint">(Route selection from history — coming soon)</p>
        </div>
      )}

      <div className="column compact">
        <label className="caption">Target pace (min/km)</label>
        <div className="row compact align-center">
          <input
            type="text"
            value={paceInput}
            onChange={e => setPaceInput(e.target.value)}
            onBlur={handlePaceBlur}
            placeholder="5:00"
            aria-label="Target pace"
          />
          <span className="caption muted">min/km</span>
          {estMinutes && (
            <span className="caption muted">· ~{estMinutes} min est.</span>
          )}
        </div>
      </div>

      {markers.length > 0 && (
        <div className="column compact">
          <span className="caption">Distance markers</span>
          <div className="surface column compact">
            {markers.map(m => (
              <div key={m.distanceKm} className="row space-between">
                <span className="caption muted">{m.distanceKm} km</span>
                <span className="caption mono">{m.cumulativeTime}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## Task 10: StepSwim component

**Files:**
- Create: `ui/components/workout/wizard/StepSwim.tsx`

- [ ] **Step 1: Create the component**

```typescript
// ui/components/workout/wizard/StepSwim.tsx
import { useState, useMemo } from 'react';
import type { DistanceMarker } from '@features/planning';
import { formatPace, parsePace, buildMarkers } from '@features/planning';

interface StepSwimProps {
  sessionName: string;
  poolLengthM: 25 | 50;
  targetDistanceM: number;
  paceSecPer100m: number;
  onSessionNameChange: (name: string) => void;
  onPoolLengthChange: (l: 25 | 50) => void;
  onTargetDistanceChange: (m: number) => void;
  onPaceChange: (secPer100m: number) => void;
}

export function StepSwim({
  sessionName,
  poolLengthM,
  targetDistanceM,
  paceSecPer100m,
  onSessionNameChange,
  onPoolLengthChange,
  onTargetDistanceChange,
  onPaceChange,
}: StepSwimProps) {
  const [paceInput, setPaceInput] = useState(formatPace(paceSecPer100m));

  const distanceKm = targetDistanceM / 1000;
  const paceSecPerKm = paceSecPer100m * 10;  // 100m pace → km pace
  const markers: DistanceMarker[] = useMemo(
    () => distanceKm > 0 ? buildMarkers(distanceKm, paceSecPerKm, 0.1) : [],
    [distanceKm, paceSecPerKm],
  );

  const estMinutes = targetDistanceM > 0
    ? Math.round((targetDistanceM / 100) * paceSecPer100m / 60)
    : null;

  function handlePaceBlur() {
    const sec = parsePace(paceInput);
    if (sec > 0) {
      onPaceChange(sec);
      setPaceInput(formatPace(sec));
    }
  }

  return (
    <div className="column">
      <div className="column compact">
        <label className="caption">Session name</label>
        <input
          type="text"
          value={sessionName}
          onChange={e => onSessionNameChange(e.target.value)}
          placeholder="e.g. Swim Session"
        />
      </div>

      <div className="column compact">
        <label className="caption">Pool length</label>
        <div className="tabs">
          <button
            type="button"
            className={`tab${poolLengthM === 25 ? ' active' : ''}`}
            onClick={() => onPoolLengthChange(25)}
          >
            25 m
          </button>
          <button
            type="button"
            className={`tab${poolLengthM === 50 ? ' active' : ''}`}
            onClick={() => onPoolLengthChange(50)}
          >
            50 m
          </button>
        </div>
      </div>

      <div className="column compact">
        <label className="caption">Target distance (metres)</label>
        <input
          type="number"
          min={100}
          step={poolLengthM}
          value={targetDistanceM}
          onChange={e => onTargetDistanceChange(Math.max(0, Number(e.target.value)))}
        />
      </div>

      <div className="column compact">
        <label className="caption">Target pace (min/100m)</label>
        <div className="row compact align-center">
          <input
            type="text"
            value={paceInput}
            onChange={e => setPaceInput(e.target.value)}
            onBlur={handlePaceBlur}
            placeholder="2:00"
            aria-label="Target pace"
          />
          <span className="caption muted">min/100m</span>
          {estMinutes && <span className="caption muted">· ~{estMinutes} min est.</span>}
        </div>
      </div>

      {markers.length > 0 && (
        <div className="column compact">
          <span className="caption">Distance markers</span>
          <div className="surface column compact">
            {markers.map(m => (
              <div key={m.distanceKm} className="row space-between">
                <span className="caption muted">{Math.round(m.distanceKm * 1000)} m</span>
                <span className="caption mono">{m.cumulativeTime}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## Task 11: StepSchedule component

**Files:**
- Create: `ui/components/workout/wizard/StepSchedule.tsx`

- [ ] **Step 1: Create the component**

```typescript
// ui/components/workout/wizard/StepSchedule.tsx

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

interface StepScheduleProps {
  scheduledDate: string;  // 'YYYY-MM-DD'
  scheduledTime: string;  // 'HH:MM'
  notes: string;
  onDateChange: (d: string) => void;
  onTimeChange: (t: string) => void;
  onNotesChange: (n: string) => void;
}

export function StepSchedule({
  scheduledDate,
  scheduledTime,
  notes,
  onDateChange,
  onTimeChange,
  onNotesChange,
}: StepScheduleProps) {
  return (
    <div className="column">
      <div className="column compact">
        <label className="caption" htmlFor="plan-date">Date</label>
        <input
          id="plan-date"
          type="date"
          value={scheduledDate}
          min={todayStr()}
          onChange={e => onDateChange(e.target.value)}
        />
      </div>

      <div className="column compact">
        <label className="caption" htmlFor="plan-time">Time</label>
        <input
          id="plan-time"
          type="time"
          value={scheduledTime}
          onChange={e => onTimeChange(e.target.value)}
        />
      </div>

      <div className="column compact">
        <label className="caption" htmlFor="plan-notes">Notes (optional)</label>
        <textarea
          id="plan-notes"
          value={notes}
          onChange={e => onNotesChange(e.target.value)}
          placeholder="Any notes about this session…"
          maxLength={300}
          rows={3}
        />
      </div>
    </div>
  );
}
```

---

## Task 12: StepReview component

**Files:**
- Create: `ui/components/workout/wizard/StepReview.tsx`

- [ ] **Step 1: Create the component**

```typescript
// ui/components/workout/wizard/StepReview.tsx
import type { WizardData } from './PlanWizard';
import { formatPace, buildMarkers } from '@features/planning';
import type { DistanceMarker } from '@features/planning';

const TYPE_EMOJI: Record<string, string> = {
  gym: '🏋️', run: '🏃', cycle: '🚴', swim: '🏊',
};

function formatScheduledAt(scheduledAt: number): string {
  return new Date(scheduledAt).toLocaleString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

interface StepReviewProps {
  data: WizardData;
  scheduledAt: number;  // pre-computed Unix ms
  onSave: () => void;
  saving: boolean;
}

export function StepReview({ data, scheduledAt, onSave, saving }: StepReviewProps) {
  const { type } = data;
  if (!type) return null;

  let markers: DistanceMarker[] = [];
  let distKm = 0;
  if ((type === 'run' || type === 'cycle') && data.distanceKm && data.paceSecPerKm) {
    distKm = data.distanceKm;
    const intervalKm = type === 'cycle' ? 5 : 1;
    markers = buildMarkers(distKm, data.paceSecPerKm, intervalKm);
  }
  if (type === 'swim' && data.targetDistanceM && data.paceSecPer100m) {
    distKm = data.targetDistanceM / 1000;
    markers = buildMarkers(distKm, data.paceSecPer100m * 10, 0.1);
  }

  return (
    <div className="column">
      <div className="surface column compact">
        <div className="row compact align-center">
          <span>{TYPE_EMOJI[type]}</span>
          <span className="caption">{type.toUpperCase()}</span>
        </div>
        <span className="detail">{data.sessionName || '(Untitled)'}</span>
        <span className="caption muted">{formatScheduledAt(scheduledAt)}</span>

        {type === 'gym' && data.exercises && data.exercises.length > 0 && (
          <div className="column compact">
            {data.exercises.map((ex, i) => (
              <span key={i} className="caption">
                {ex.name} — {ex.sets}×{ex.reps}
                {ex.weightKg > 0 ? ` · ${ex.weightKg} kg` : ''}
              </span>
            ))}
          </div>
        )}

        {(type === 'run' || type === 'cycle') && distKm > 0 && (
          <span className="caption muted">
            {distKm} km · {formatPace(data.paceSecPerKm ?? 300)}/km ·{' '}
            ~{Math.round((distKm * (data.paceSecPerKm ?? 300)) / 60)} min
          </span>
        )}

        {type === 'swim' && data.targetDistanceM && (
          <span className="caption muted">
            {data.targetDistanceM} m · {formatPace(data.paceSecPer100m ?? 120)}/100m ·{' '}
            ~{Math.round((data.targetDistanceM / 100) * (data.paceSecPer100m ?? 120) / 60)} min
          </span>
        )}
      </div>

      {markers.length > 0 && (
        <div className="column compact">
          <span className="caption">Markers (first and last)</span>
          <div className="surface column compact">
            {[markers[0], markers[markers.length - 1]]
              .filter(Boolean)
              .map((m, i) => (
                <div key={i} className="row space-between">
                  <span className="caption muted">
                    {type === 'swim'
                      ? `${Math.round(m.distanceKm * 1000)} m`
                      : `${m.distanceKm} km`}
                  </span>
                  <span className="caption mono">{m.cumulativeTime}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {data.notes && (
        <div className="surface compact">
          <span className="caption muted">{data.notes}</span>
        </div>
      )}

      <button type="button" className="primary" onClick={onSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save plan'}
      </button>
      <span className="caption muted center">Appears in Workout tab and Schedule</span>
    </div>
  );
}
```

---

## Task 13: PlanWizard shell

**Files:**
- Create: `ui/components/workout/wizard/PlanWizard.tsx`

This is the only component that imports `StepType`, `StepGym`, `StepCardio`, `StepSwim`, `StepSchedule`, and `StepReview`. It owns all wizard state.

- [ ] **Step 1: Create the wizard shell**

```typescript
// ui/components/workout/wizard/PlanWizard.tsx
import { useState, useCallback } from 'react';
import { useCommand } from '@ui/bindings';
import { handlePlanSession } from '@features/planning';
import type { PlanType, PlannedExercise } from '@features/planning';
import type { Id } from '@shared/types';
import { StepType } from './StepType';
import { StepGym } from './StepGym';
import { StepCardio } from './StepCardio';
import { StepSwim } from './StepSwim';
import { StepSchedule } from './StepSchedule';
import { StepReview } from './StepReview';
import { totalDistanceKm } from './RouteMap';
import { buildMarkers } from '@features/planning';

const USER_ID = 'user-001' as Id<'User'>;

export interface WizardData {
  type: PlanType | null;
  sessionName: string;
  exercises: PlannedExercise[];
  waypoints: [number, number][];
  distanceKm: number;
  paceSecPerKm: number;
  poolLengthM: 25 | 50;
  targetDistanceM: number;
  paceSecPer100m: number;
  scheduledDate: string;
  scheduledTime: string;
  notes: string;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseScheduledAt(date: string, time: string): number {
  const [h, m] = time.split(':').map(Number);
  const d = new Date(date);
  d.setHours(h ?? 7, m ?? 0, 0, 0);
  return d.getTime();
}

const EMPTY: WizardData = {
  type: null,
  sessionName: '',
  exercises: [],
  waypoints: [],
  distanceKm: 0,
  paceSecPerKm: 300,
  poolLengthM: 25,
  targetDistanceM: 1000,
  paceSecPer100m: 120,
  scheduledDate: todayStr(),
  scheduledTime: '07:30',
  notes: '',
};

const STEP_LABELS = ['Type', 'Configure', 'Schedule', 'Review'];

function canAdvance(step: number, data: WizardData): boolean {
  if (step === 0) return data.type !== null;
  if (step === 1) {
    if (data.type === 'gym') return data.sessionName.trim().length > 0;
    if (data.type === 'run' || data.type === 'cycle')
      return data.sessionName.trim().length > 0 && data.paceSecPerKm > 0;
    if (data.type === 'swim')
      return data.sessionName.trim().length > 0 && data.targetDistanceM > 0 && data.paceSecPer100m > 0;
  }
  if (step === 2) return data.scheduledDate.length > 0 && data.scheduledTime.length > 0;
  return true;
}

interface PlanWizardProps {
  onClose: () => void;
  onSaved: () => void;
}

export function PlanWizard({ onClose, onSaved }: PlanWizardProps) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(EMPTY);
  const { dispatch: planSession, pending: saving } = useCommand(handlePlanSession);

  const update = useCallback((patch: Partial<WizardData>) => {
    setData(prev => ({ ...prev, ...patch }));
  }, []);

  async function handleSave() {
    if (!data.type) return;
    const scheduledAt = parseScheduledAt(data.scheduledDate, data.scheduledTime);
    const distanceKm = (data.type === 'run' || data.type === 'cycle')
      ? totalDistanceKm(data.waypoints)
      : data.type === 'swim'
        ? data.targetDistanceM / 1000
        : undefined;

    const intervalKm = data.type === 'cycle' ? 5 : data.type === 'swim' ? 0.1 : 1;
    const paceForMarkers = data.type === 'swim'
      ? data.paceSecPer100m * 10
      : data.paceSecPerKm;
    const distanceMarkers = distanceKm && distanceKm > 0
      ? buildMarkers(distanceKm, paceForMarkers, intervalKm)
      : undefined;

    await planSession({
      type: 'PlanSession',
      userId: USER_ID,
      planType: data.type,
      name: data.sessionName || data.type,
      scheduledAt,
      notes: data.notes,
      exercises: data.type === 'gym' ? data.exercises : undefined,
      routeWaypoints: (data.type === 'run' || data.type === 'cycle') ? data.waypoints : undefined,
      distanceKm: distanceKm,
      paceSecPerKm: (data.type === 'run' || data.type === 'cycle') ? data.paceSecPerKm : undefined,
      distanceMarkers,
      poolLengthM: data.type === 'swim' ? data.poolLengthM : undefined,
      targetDistanceM: data.type === 'swim' ? data.targetDistanceM : undefined,
      paceSecPer100m: data.type === 'swim' ? data.paceSecPer100m : undefined,
    });
    onSaved();
  }

  const scheduledAt = parseScheduledAt(data.scheduledDate, data.scheduledTime);
  const distanceKmForReview = (data.type === 'run' || data.type === 'cycle')
    ? totalDistanceKm(data.waypoints)
    : 0;

  function renderStep() {
    switch (step) {
      case 0:
        return (
          <StepType
            selected={data.type}
            onSelect={type => {
              update({ type });
              setStep(1);
            }}
          />
        );
      case 1:
        if (data.type === 'gym') {
          return (
            <StepGym
              sessionName={data.sessionName}
              exercises={data.exercises}
              onSessionNameChange={sessionName => update({ sessionName })}
              onExercisesChange={exercises => update({ exercises })}
            />
          );
        }
        if (data.type === 'run' || data.type === 'cycle') {
          return (
            <StepCardio
              planType={data.type}
              sessionName={data.sessionName}
              waypoints={data.waypoints}
              paceSecPerKm={data.paceSecPerKm}
              onSessionNameChange={sessionName => update({ sessionName })}
              onWaypointsChange={waypoints => update({ waypoints, distanceKm: totalDistanceKm(waypoints) })}
              onPaceChange={paceSecPerKm => update({ paceSecPerKm })}
            />
          );
        }
        if (data.type === 'swim') {
          return (
            <StepSwim
              sessionName={data.sessionName}
              poolLengthM={data.poolLengthM}
              targetDistanceM={data.targetDistanceM}
              paceSecPer100m={data.paceSecPer100m}
              onSessionNameChange={sessionName => update({ sessionName })}
              onPoolLengthChange={poolLengthM => update({ poolLengthM })}
              onTargetDistanceChange={targetDistanceM => update({ targetDistanceM })}
              onPaceChange={paceSecPer100m => update({ paceSecPer100m })}
            />
          );
        }
        return null;
      case 2:
        return (
          <StepSchedule
            scheduledDate={data.scheduledDate}
            scheduledTime={data.scheduledTime}
            notes={data.notes}
            onDateChange={scheduledDate => update({ scheduledDate })}
            onTimeChange={scheduledTime => update({ scheduledTime })}
            onNotesChange={notes => update({ notes })}
          />
        );
      case 3:
        return (
          <StepReview
            data={{ ...data, distanceKm: distanceKmForReview }}
            scheduledAt={scheduledAt}
            onSave={handleSave}
            saving={saving}
          />
        );
      default:
        return null;
    }
  }

  return (
    <div className="wizard-overlay">
      <header className="row space-between align-center">
        <div className="row compact">
          {STEP_LABELS.map((_, i) => (
            <div key={i} className={`dot${i === step ? ' active' : ''}`} />
          ))}
        </div>
        <span className="detail">
          {step < STEP_LABELS.length ? STEP_LABELS[step] : 'Plan'}
        </span>
        <button type="button" className="ghost icon sm" onClick={onClose} aria-label="Close">
          ×
        </button>
      </header>

      <div>
        {renderStep()}
      </div>

      {step < 3 && (
        <footer className="row">
          {step > 0 && (
            <button type="button" className="ghost" onClick={() => setStep(s => s - 1)}>
              ← Back
            </button>
          )}
          <button
            type="button"
            className="primary grow"
            disabled={!canAdvance(step, data)}
            onClick={() => setStep(s => s + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## Task 14: UpcomingPlans component

**Files:**
- Create: `ui/components/workout/UpcomingPlans.tsx`

- [ ] **Step 1: Create the component**

```typescript
// ui/components/workout/UpcomingPlans.tsx
import { useQuery } from '@ui/bindings';
import type { PlannedSession } from '@features/planning';

const TYPE_EMOJI: Record<string, string> = {
  gym: '🏋️', run: '🏃', cycle: '🚴', swim: '🏊',
};

function formatWhen(scheduledAt: number): string {
  return new Date(scheduledAt).toLocaleString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export function UpcomingPlans() {
  const all = (useQuery<PlannedSession[]>('planned_sessions') ?? []) as PlannedSession[];
  const upcoming = all
    .filter(p => p.scheduledAt > Date.now())
    .slice(0, 5);

  if (upcoming.length === 0) return null;

  return (
    <div className="surface column compact">
      <span className="eyebrow">Upcoming</span>
      <div className="column compact">
        {upcoming.map(plan => (
          <div key={plan.id} className="row align-center">
            <span aria-hidden>{TYPE_EMOJI[plan.type] ?? '📋'}</span>
            <div className="column compact grow">
              <span className="detail">{plan.name}</span>
              <span className="caption muted">{formatWhen(plan.scheduledAt)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Task 15: LogScreenV2 modifications

**Files:**
- Modify: `ui/layouts/LogScreenV2.tsx`

Three changes are needed:
1. Import `PlanWizard` and `UpcomingPlans`
2. Add `showPlan` state
3. Update the "no session" branch to show the Plan button, UpcomingPlans, and wizard overlay

- [ ] **Step 1: Add imports at the top of LogScreenV2.tsx**

Find the imports block. After the last existing import, add:

```typescript
import { PlanWizard } from '@ui/components/workout/wizard/PlanWizard';
import { UpcomingPlans } from '@ui/components/workout/UpcomingPlans';
```

The `@ui` alias maps to the `ui/` folder per `vite.config.ts`.

- [ ] **Step 2: Add `showPlan` state**

Find the line inside `LogScreenV2()`:

```typescript
const [showPicker, setShowPicker] = useState(false);
```

Add this line immediately below it:

```typescript
const [showPlan, setShowPlan] = useState(false);
```

- [ ] **Step 3: Update the no-session render branch**

Find this block (around line 1743–1783):

```typescript
  if (!hasSession && !isEditing) {
    return (
      <UndoToastProvider>
        <div className="column">
          <button
            type="button"
            className="surface secondary"
            onClick={() => startSession({ type: 'StartSession', userId: USER_ID, name: 'Workout' })}
          >
            New Workout
          </button>

          <ScheduleStrip
            strengthSessions={strengthHistory}
            cardioSessions={cardioView.sessions}
          />

          <SessionFilterBar
            filters={sessionFilters}
            onChange={setSessionFilters}
            exerciseOptions={allExerciseNames}
          />

          <div className="column compact">
            ...
          </div>
        </div>
      </UndoToastProvider>
    );
  }
```

Replace it with:

```typescript
  if (!hasSession && !isEditing) {
    return (
      <UndoToastProvider>
        {showPlan && (
          <PlanWizard
            onClose={() => setShowPlan(false)}
            onSaved={() => setShowPlan(false)}
          />
        )}
        <div className="column">
          <div className="row">
            <button
              type="button"
              className="surface secondary grow"
              onClick={() => startSession({ type: 'StartSession', userId: USER_ID, name: 'Workout' })}
            >
              New Workout
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => setShowPlan(true)}
            >
              Plan
            </button>
          </div>

          <UpcomingPlans />

          <ScheduleStrip
            strengthSessions={strengthHistory}
            cardioSessions={cardioView.sessions}
          />

          <SessionFilterBar
            filters={sessionFilters}
            onChange={setSessionFilters}
            exerciseOptions={allExerciseNames}
          />

          <div className="column compact">
            {combinedSessions.length === 0 ? (
              <p className="caption">No sessions found</p>
            ) : (
              combinedSessions.map((entry) =>
                entry.kind === 'strength' ? (
                  <StrengthSessionItem
                    key={entry.session.id}
                    session={entry.session}
                    matchedExercise={entry.matchedExercise}
                  />
                ) : (
                  <CardioSessionItem key={entry.session.id} session={entry.session} />
                )
              )
            )}
          </div>
        </div>
      </UndoToastProvider>
    );
  }
```

- [ ] **Step 4: Verify no TypeScript errors**

```
npx tsc --noEmit
```
Expected: no new errors.

---

## Task 16: TrainingPlansScreen modifications

**Files:**
- Modify: `ui/layouts/TrainingPlansScreen.tsx`

Add a "Planned Sessions" section that shows upcoming planned sessions grouped by date.

- [ ] **Step 1: Add imports at the top of TrainingPlansScreen.tsx**

After the existing imports, add:

```typescript
import { useQuery } from '@ui/bindings';
import type { PlannedSession } from '@features/planning';
```

Note: `useQuery` may already be imported — if so, just add the `PlannedSession` type import.

- [ ] **Step 2: Add the planned sessions hook inside the main component**

Find the `export function TrainingPlansScreen()` function body. Locate the existing state declarations near the top of the function. Add this after them:

```typescript
const plannedSessions = (useQuery<PlannedSession[]>('planned_sessions') ?? []) as PlannedSession[];
const upcomingPlanned = plannedSessions
  .filter(p => p.scheduledAt > Date.now())
  .slice(0, 10);
```

- [ ] **Step 3: Add a helper component above `TrainingPlansScreen` (or inline)**

Add this function before `export function TrainingPlansScreen()`:

```typescript
const PLAN_EMOJI: Record<string, string> = {
  gym: '🏋️', run: '🏃', cycle: '🚴', swim: '🏊',
};

function PlannedSessionCard({ plan }: { plan: PlannedSession }) {
  const when = new Date(plan.scheduledAt).toLocaleString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  });
  return (
    <div className="surface column compact">
      <div className="row align-center space-between">
        <div className="row compact align-center">
          <span aria-hidden>{PLAN_EMOJI[plan.type] ?? '📋'}</span>
          <span className="detail">{plan.name}</span>
        </div>
        <span className="caption muted">{when}</span>
      </div>
      {plan.distanceKm != null && (
        <span className="caption muted">{plan.distanceKm} km</span>
      )}
      {plan.exercises && plan.exercises.length > 0 && (
        <span className="caption muted">{plan.exercises.length} exercises</span>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Insert the planned sessions section into the JSX**

Inside the `TrainingPlansScreen` render, find the first `<div className="column">` (or `<div className="stack">`) that wraps the main content. Insert this block at the top, before the existing plan/calendar sections:

```typescript
{upcomingPlanned.length > 0 && (
  <div className="surface column">
    <span className="caption">PLANNED SESSIONS</span>
    <div className="column compact">
      {upcomingPlanned.map(plan => (
        <PlannedSessionCard key={plan.id} plan={plan} />
      ))}
    </div>
  </div>
)}
```

- [ ] **Step 5: Verify TypeScript and run dev server**

```
npx tsc --noEmit
```

Then start the dev server and verify:
1. Workout tab shows a "Plan" button next to "New Workout"
2. Tapping "Plan" opens the wizard overlay
3. Selecting a type advances to step 2
4. Gym step shows session name + exercise picker
5. Run/Cycle step shows the map (click to add waypoints) + pace input + markers
6. Swim step shows pool length, distance, pace, markers
7. Schedule step shows date/time/notes inputs
8. Review shows summary and "Save plan" saves without error
9. After saving, "Upcoming" section appears in Workout tab
10. Schedule screen shows the plan in "Planned Sessions"

```
npm run dev
```

---

## Self-Review Checklist

- [x] **Spec coverage:**
  - Entry point in Workout tab → Task 15 (Plan button)
  - Step 1 type choice (gym/run/cycle/swim) → Task 6 (StepType)
  - Step 2a gym (exercise picker + sets/reps/weight) → Task 7 (StepGym)
  - Step 2b cardio (Leaflet map, draw/saved, pace, markers) → Tasks 8+9 (RouteMap + StepCardio)
  - Step 2c swim (no map, pool length, distance, pace/100m) → Task 10 (StepSwim)
  - Step 3 schedule (date/time/notes) → Task 11 (StepSchedule)
  - Step 4 review + save → Task 12 (StepReview)
  - Saved routes tab (stub) → StepCardio has "Saved" tab with placeholder text ✓
  - Distance markers every 1km for run, 5km for cycle, 100m for swim → buildMarkers with intervalKm ✓
  - Plan appears in Workout tab → Task 14 + 15 (UpcomingPlans) ✓
  - Plan appears in Schedule screen → Task 16 (TrainingPlansScreen) ✓

- [x] **Placeholder scan:** No TBD/TODO in any step. The Saved routes tab shows "coming soon" text rather than a broken implementation — this is intentional since saved route data would need GPS history integration.

- [x] **Type consistency:**
  - `PlannedExercise` defined in types.ts Task 1, used in StepGym Task 7, WizardData Task 13 ✓
  - `PlanType` defined in types.ts, used in StepType, StepCardio, PlanWizard ✓
  - `WizardData` exported from PlanWizard.tsx, imported in StepReview ✓
  - `formatPace` / `parsePace` / `buildMarkers` defined in markers.ts Task 1, imported in StepCardio, StepSwim, StepReview via `@features/planning` barrel ✓
  - `totalDistanceKm` exported from RouteMap.tsx Task 8, imported in StepCardio and PlanWizard ✓
  - `paceSecPerKm` / `paceSecPer100m` naming consistent across types.ts, command, WizardData ✓
  - `distanceKm` on WizardData updated whenever waypoints change (PlanWizard `onWaypointsChange`) ✓

- [x] **CSS conventions:** Zero inline styles. Existing design-system classes used throughout (`.surface`, `.row`, `.column`, `.dot`, `.dot.active`, `.detail`, `.caption muted`, `.eyebrow`, `.grow`, `.surface.interactive`). New classes in `wizard.css` are kept to the absolute minimum: wizard chrome layout (`.wizard-overlay` + child element selectors), the selected accent border (`.surface.selected`), the Leaflet map container (`.plan-map`), and two functional-sizing helpers (`.input-count`, `.input-weight`).
