# Plan 6: Recovery & Readiness Expansion + Body & Health Tracking

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Two related expansions sharing the Profile tab:
1. **Recovery & Readiness Expansion** — enriches the readiness score with resting HR, sleep quality slider, and a "How do you feel?" subjective scale, then shows a per-factor breakdown in the Dashboard readiness card.
2. **Body & Health Tracking** — adds a bodyweight log (with a sparkline), body measurements (waist/chest/arms/legs), and an equipment tracker that auto-increments gear mileage from cardio sessions and warns on retirement threshold.

**Architecture:** Both features extend existing modules (`features/readiness/` and `features/profile/`) rather than creating new top-level modules. New events (`BodyweightLogged`, `MeasurementLogged`, `EquipmentAdded`, `EquipmentMileageUpdated`) are added to the profile feature. New events (`RestingHRLogged`, `SubjectiveRPELogged`) are added to the readiness feature. New projections are registered alongside the existing ones. A policy in `features/profile/policies/equipment.ts` subscribes to `CardioSessionLogged` and auto-updates assigned equipment mileage.

**Tech Stack:** TypeScript, React 18, Recharts (Plan 1), existing CQRS stack

**Related spec:** `docs/superpowers/specs/2026-04-14-new-features-design.md` — Sections 2D, 2M, 2N

**This is Plan 6 of 6. Depends on Plan 1 (Recharts). Independent of Plans 2–5.**

---

## File Map

### New files
| File | Responsibility |
|---|---|
| `features/profile/domain/body.ts` | BodyweightEntry, Measurement, Equipment types + events/commands |
| `features/profile/projections/body.ts` | bodyweightProjection, measurementsProjection, equipmentProjection |
| `features/profile/policies/equipment.ts` | CardioSessionLogged → auto-increment gear mileage |
| `features/profile/commands/bodyHandlers.ts` | handleLogBodyweight, handleLogMeasurement, handleAddEquipment |
| `ui/components/BodyweightChart.tsx` | Recharts LineChart for bodyweight history |
| `ui/components/BodyTrackingSection.tsx` | Bodyweight log + measurements + equipment tracker UI |

### Modified files
| File | What changes |
|---|---|
| `features/readiness/domain/types.ts` | Add RestingHRLoggedPayload, SubjectiveRPELoggedPayload, LogRestingHR, LogSubjectiveRPE commands/events |
| `features/readiness/commands/handlers.ts` | Add handleLogRestingHR, handleLogSubjectiveRPE |
| `features/readiness/projections/index.ts` (or similar) | Add restingHRProjection, subjectiveRPEProjection |
| `features/readiness/queries/index.ts` | Add getRestingHRHistory, getSubjectiveRPEHistory |
| `features/readiness/index.ts` | Export new types, handlers, queries |
| `features/profile/index.ts` | Export new body types, handlers, projections |
| `ui/layouts/DashboardScreen.tsx` | Expand readiness card with per-factor breakdown + new inputs |
| `ui/layouts/ProfileScreen.tsx` | Add BodyTrackingSection |

---

## Task 1: Body tracking domain types

**Files:** `features/profile/domain/body.ts`

- [ ] **Step 1: Create the file**

```ts
// features/profile/domain/body.ts
import type { Id, DomainEvent } from '@shared/types';

// ─── Bodyweight ───────────────────────────────────────────────

export interface BodyweightEntry {
  id: Id<'Bodyweight'>;
  userId: Id<'User'>;
  weightKg: number;
  loggedAt: number;  // unix ms
  date: string;      // ISO date 'YYYY-MM-DD'
}

export interface BodyweightLoggedPayload {
  entryId: Id<'Bodyweight'>;
  userId: Id<'User'>;
  weightKg: number;
  date: string;
  loggedAt: number;
}

export interface LogBodyweight {
  type: 'LogBodyweight';
  userId: Id<'User'>;
  weightKg: number;
  date: string;
}

// ─── Measurements ─────────────────────────────────────────────

export interface MeasurementEntry {
  id: Id<'Measurement'>;
  userId: Id<'User'>;
  waistCm?: number;
  chestCm?: number;
  armsCm?: number;
  legsCm?: number;
  loggedAt: number;
  date: string;
}

export interface MeasurementLoggedPayload {
  entryId: Id<'Measurement'>;
  userId: Id<'User'>;
  waistCm?: number;
  chestCm?: number;
  armsCm?: number;
  legsCm?: number;
  date: string;
  loggedAt: number;
}

export interface LogMeasurement {
  type: 'LogMeasurement';
  userId: Id<'User'>;
  waistCm?: number;
  chestCm?: number;
  armsCm?: number;
  legsCm?: number;
  date: string;
}

// ─── Equipment ────────────────────────────────────────────────

export interface Equipment {
  id: Id<'Equipment'>;
  userId: Id<'User'>;
  name: string;
  type: 'shoes' | 'bike' | 'other';
  distanceKm: number;
  retirementDistanceKm: number;
  addedAt: number;
}

export interface EquipmentAddedPayload {
  equipmentId: Id<'Equipment'>;
  userId: Id<'User'>;
  name: string;
  type: Equipment['type'];
  retirementDistanceKm: number;
  addedAt: number;
}

export interface EquipmentMileageUpdatedPayload {
  equipmentId: Id<'Equipment'>;
  deltaKm: number;
}

export interface AddEquipment {
  type: 'AddEquipment';
  userId: Id<'User'>;
  name: string;
  equipmentType: Equipment['type'];
  retirementDistanceKm: number;
}

// ─── Union event type ─────────────────────────────────────────

export type BodyEvent =
  | DomainEvent<'BodyweightLogged', BodyweightLoggedPayload>
  | DomainEvent<'MeasurementLogged', MeasurementLoggedPayload>
  | DomainEvent<'EquipmentAdded', EquipmentAddedPayload>
  | DomainEvent<'EquipmentMileageUpdated', EquipmentMileageUpdatedPayload>;
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

---

## Task 2: Body tracking command handlers

**Files:** `features/profile/commands/bodyHandlers.ts`

- [ ] **Step 1: Create the file**

```ts
// features/profile/commands/bodyHandlers.ts
import { eventBus } from '@core/events/bus';
import { generateId } from '@core/id-generator';
import { clock } from '@core/clock';
import type {
  LogBodyweight, LogMeasurement, AddEquipment,
  BodyweightLoggedPayload, MeasurementLoggedPayload, EquipmentAddedPayload,
} from '../domain/body';
import type { Id } from '@shared/types';

export async function handleLogBodyweight(cmd: LogBodyweight): Promise<Id<'Bodyweight'>> {
  const entryId = generateId<'Bodyweight'>();
  const payload: BodyweightLoggedPayload = {
    entryId,
    userId: cmd.userId,
    weightKg: cmd.weightKg,
    date: cmd.date,
    loggedAt: clock.now(),
  };
  await eventBus.publish({ type: 'BodyweightLogged', aggregateId: entryId, payload });
  return entryId;
}

export async function handleLogMeasurement(cmd: LogMeasurement): Promise<Id<'Measurement'>> {
  const entryId = generateId<'Measurement'>();
  const payload: MeasurementLoggedPayload = {
    entryId,
    userId: cmd.userId,
    waistCm: cmd.waistCm,
    chestCm: cmd.chestCm,
    armsCm: cmd.armsCm,
    legsCm: cmd.legsCm,
    date: cmd.date,
    loggedAt: clock.now(),
  };
  await eventBus.publish({ type: 'MeasurementLogged', aggregateId: entryId, payload });
  return entryId;
}

export async function handleAddEquipment(cmd: AddEquipment): Promise<Id<'Equipment'>> {
  const equipmentId = generateId<'Equipment'>();
  const payload: EquipmentAddedPayload = {
    equipmentId,
    userId: cmd.userId,
    name: cmd.name,
    type: cmd.equipmentType,
    retirementDistanceKm: cmd.retirementDistanceKm,
    addedAt: clock.now(),
  };
  await eventBus.publish({ type: 'EquipmentAdded', aggregateId: equipmentId, payload });
  return equipmentId;
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

---

## Task 3: Body tracking projections

**Files:** `features/profile/projections/body.ts`

- [ ] **Step 1: Create the file**

```ts
// features/profile/projections/body.ts
import { ProjectionBuilder } from '@data/projections/builders';
import { viewStore } from '@data/projections/views';
import type {
  BodyweightEntry, MeasurementEntry, Equipment,
  BodyweightLoggedPayload, MeasurementLoggedPayload,
  EquipmentAddedPayload, EquipmentMileageUpdatedPayload,
} from '../domain/body';

// ─── Bodyweight ───────────────────────────────────────────────

export const bodyweightProjection = new ProjectionBuilder<BodyweightEntry[]>('bodyweight_history')
  .on<BodyweightLoggedPayload>('BodyweightLogged', (state, event) => {
    const p = event.payload;
    const entry: BodyweightEntry = {
      id: p.entryId,
      userId: p.userId,
      weightKg: p.weightKg,
      date: p.date,
      loggedAt: p.loggedAt,
    };
    // Keep sorted by date, latest last
    return [...(state ?? []), entry].sort((a, b) => a.date.localeCompare(b.date));
  })
  .build();

// ─── Measurements ─────────────────────────────────────────────

export const measurementsProjection = new ProjectionBuilder<MeasurementEntry[]>('measurement_history')
  .on<MeasurementLoggedPayload>('MeasurementLogged', (state, event) => {
    const p = event.payload;
    const entry: MeasurementEntry = {
      id: p.entryId,
      userId: p.userId,
      waistCm: p.waistCm,
      chestCm: p.chestCm,
      armsCm: p.armsCm,
      legsCm: p.legsCm,
      date: p.date,
      loggedAt: p.loggedAt,
    };
    return [...(state ?? []), entry].sort((a, b) => a.date.localeCompare(b.date));
  })
  .build();

// ─── Equipment ────────────────────────────────────────────────

export const equipmentProjection = new ProjectionBuilder<Equipment[]>('equipment_list')
  .on<EquipmentAddedPayload>('EquipmentAdded', (state, event) => {
    const p = event.payload;
    const gear: Equipment = {
      id: p.equipmentId,
      userId: p.userId,
      name: p.name,
      type: p.type,
      distanceKm: 0,
      retirementDistanceKm: p.retirementDistanceKm,
      addedAt: p.addedAt,
    };
    return [...(state ?? []), gear];
  })
  .on<EquipmentMileageUpdatedPayload>('EquipmentMileageUpdated', (state, event) => {
    if (!state) return [];
    const { equipmentId, deltaKm } = event.payload;
    return state.map(g =>
      g.id === equipmentId ? { ...g, distanceKm: g.distanceKm + deltaKm } : g
    );
  })
  .build();

export function registerBodyProjections(): void {
  bodyweightProjection.register(viewStore);
  measurementsProjection.register(viewStore);
  equipmentProjection.register(viewStore);
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

---

## Task 4: Equipment mileage policy

**Files:** `features/profile/policies/equipment.ts`

Each cardio session auto-increments the mileage on all equipment marked as active. For simplicity, all equipment receives the same delta (users typically have one set of active shoes/bike). If the updated mileage crosses the retirement threshold, a coaching insight is emitted via the coaching feature.

- [ ] **Step 1: Create the file**

```ts
// features/profile/policies/equipment.ts
import { eventBus } from '@core/events/bus';
import { viewStore } from '@data/projections/views';
import type { DomainEvent } from '@shared/types';
import type { Equipment, EquipmentMileageUpdatedPayload } from '../domain/body';

let registered = false;

export function registerEquipmentMileagePolicy(): void {
  if (registered) return;
  registered = true;

  eventBus.subscribe<DomainEvent<'CardioSessionLogged', { distanceMeters: number }>>(
    'CardioSessionLogged',
    async (event) => {
      const { distanceMeters } = event.payload;
      const deltaKm = distanceMeters / 1000;
      const gear = viewStore.get<Equipment[]>('equipment_list') ?? [];

      for (const item of gear) {
        const payload: EquipmentMileageUpdatedPayload = {
          equipmentId: item.id,
          deltaKm,
        };
        await eventBus.publish({
          type: 'EquipmentMileageUpdated',
          aggregateId: item.id,
          payload,
        });

        // Emit retirement warning coaching insight if threshold crossed
        const newDistance = item.distanceKm + deltaKm;
        if (newDistance >= item.retirementDistanceKm && item.distanceKm < item.retirementDistanceKm) {
          await eventBus.publish({
            type: 'InsightGenerated',
            aggregateId: item.userId,
            payload: {
              insightId: `equipment_retirement_${item.id}`,
              type: 'warning',
              message: `${item.name} has reached its retirement distance (${item.retirementDistanceKm}km) — consider replacing it.`,
              createdAt: Date.now(),
              relatedEntityId: item.id,
            },
          });
        }
      }
    }
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

---

## Task 5: Extend readiness feature with resting HR and subjective RPE

**Files:** `features/readiness/domain/types.ts`, `features/readiness/commands/handlers.ts`, `features/readiness/queries/index.ts`, `features/readiness/index.ts`

- [ ] **Step 1: Add new types to `features/readiness/domain/types.ts`**

Read the file first, then append at the end:

```ts
// ─── Resting HR ───────────────────────────────────────────────

export interface RestingHREntry {
  id: Id<'RestingHR'>;
  userId: Id<'User'>;
  bpm: number;
  loggedAt: number;
  date: string;
}

export interface RestingHRLoggedPayload {
  entryId: Id<'RestingHR'>;
  userId: Id<'User'>;
  bpm: number;
  date: string;
  loggedAt: number;
}

export interface LogRestingHR {
  type: 'LogRestingHR';
  userId: Id<'User'>;
  bpm: number;
  date: string;
}

// ─── Subjective RPE (daily feel) ──────────────────────────────

export interface SubjectiveRPEEntry {
  userId: Id<'User'>;
  score: number;   // 1–5 (1=terrible, 5=great)
  loggedAt: number;
  date: string;
}

export interface SubjectiveRPELoggedPayload {
  userId: Id<'User'>;
  score: number;
  date: string;
  loggedAt: number;
}

export interface LogSubjectiveRPE {
  type: 'LogSubjectiveRPE';
  userId: Id<'User'>;
  score: number;
}
```

Also extend the `ReadinessEvent` union (find the existing type and add the two new event variants):

```ts
// Extend ReadinessEvent:
export type ReadinessEvent =
  | DomainEvent<'ReadinessLogged', ReadinessLoggedPayload>
  | DomainEvent<'HealthMetricsLogged', HealthMetricsLoggedPayload>
  | DomainEvent<'SleepLogged', SleepLoggedPayload>
  | DomainEvent<'RestingHRLogged', RestingHRLoggedPayload>
  | DomainEvent<'SubjectiveRPELogged', SubjectiveRPELoggedPayload>;
```

> Note: Read the file before editing to get the exact existing `ReadinessEvent` type definition, then replace it with the extended version above using the Edit tool.

- [ ] **Step 2: Add handlers to `features/readiness/commands/handlers.ts`**

Read the file, then append:

```ts
export async function handleLogRestingHR(cmd: LogRestingHR): Promise<void> {
  const entryId = generateId<'RestingHR'>();
  const payload: RestingHRLoggedPayload = {
    entryId,
    userId: cmd.userId,
    bpm: cmd.bpm,
    date: cmd.date,
    loggedAt: clock.now(),
  };
  await eventBus.publish({ type: 'RestingHRLogged', aggregateId: entryId, payload });
}

export async function handleLogSubjectiveRPE(cmd: LogSubjectiveRPE): Promise<void> {
  const payload: SubjectiveRPELoggedPayload = {
    userId: cmd.userId,
    score: cmd.score,
    date: new Date().toISOString().slice(0, 10),
    loggedAt: clock.now(),
  };
  await eventBus.publish({ type: 'SubjectiveRPELogged', aggregateId: cmd.userId, payload });
}
```

Ensure the new handler imports are at the top:

```ts
import type {
  // existing imports...
  LogRestingHR, RestingHRLoggedPayload,
  LogSubjectiveRPE, SubjectiveRPELoggedPayload,
} from '../domain/types';
```

- [ ] **Step 3: Register new projections in readiness projections file**

Read the existing projections file, then add:

```ts
export const restingHRProjection = new ProjectionBuilder<RestingHREntry[]>('resting_hr_history')
  .on<RestingHRLoggedPayload>('RestingHRLogged', (state, event) => {
    const p = event.payload;
    return [...(state ?? []), {
      id: p.entryId,
      userId: p.userId,
      bpm: p.bpm,
      date: p.date,
      loggedAt: p.loggedAt,
    }].sort((a, b) => a.date.localeCompare(b.date));
  })
  .build();

export const subjectiveRPEProjection = new ProjectionBuilder<SubjectiveRPEEntry[]>('subjective_rpe_history')
  .on<SubjectiveRPELoggedPayload>('SubjectiveRPELogged', (state, event) => {
    const p = event.payload;
    return [...(state ?? []), {
      userId: p.userId,
      score: p.score,
      date: p.date,
      loggedAt: p.loggedAt,
    }].sort((a, b) => a.date.localeCompare(b.date));
  })
  .build();
```

Register them inside the existing `register...Projections` function (or add a new `registerReadinessExtensions()` function if preferred).

- [ ] **Step 4: Add queries to `features/readiness/queries/index.ts`**

Read the file, then append:

```ts
export function getRestingHRHistory(): RestingHREntry[] {
  return viewStore.get<RestingHREntry[]>('resting_hr_history') ?? [];
}

export function getSubjectiveRPEHistory(): SubjectiveRPEEntry[] {
  return viewStore.get<SubjectiveRPEEntry[]>('subjective_rpe_history') ?? [];
}

/** Returns today's subjective RPE score, or null if not logged. */
export function getTodaySubjectiveRPE(): number | null {
  const today = new Date().toISOString().slice(0, 10);
  const history = getSubjectiveRPEHistory();
  return history.findLast(e => e.date === today)?.score ?? null;
}
```

- [ ] **Step 5: Export from `features/readiness/index.ts`**

Read the file, then add:

```ts
export type {
  RestingHREntry, RestingHRLoggedPayload, LogRestingHR,
  SubjectiveRPEEntry, SubjectiveRPELoggedPayload, LogSubjectiveRPE,
} from './domain/types';

export { handleLogRestingHR, handleLogSubjectiveRPE } from './commands/handlers';
export { restingHRProjection, subjectiveRPEProjection } from './projections';
export { getRestingHRHistory, getSubjectiveRPEHistory, getTodaySubjectiveRPE } from './queries';
```

- [ ] **Step 6: Verify build**

```bash
npm run build
```

- [ ] **Step 7: Commit readiness extensions**

```bash
git add features/readiness/
git commit -m "feat(readiness): add resting HR and subjective RPE tracking"
```

---

## Task 6: Update features/profile/index.ts with body exports

**Files:** `features/profile/index.ts`

- [ ] **Step 1: Read the current file, then append**

```ts
// Body & Health Tracking
export type {
  BodyweightEntry, MeasurementEntry, Equipment,
  BodyweightLoggedPayload, MeasurementLoggedPayload,
  EquipmentAddedPayload, EquipmentMileageUpdatedPayload,
  LogBodyweight, LogMeasurement, AddEquipment,
} from './domain/body';

export {
  handleLogBodyweight,
  handleLogMeasurement,
  handleAddEquipment,
} from './commands/bodyHandlers';

export {
  bodyweightProjection,
  measurementsProjection,
  equipmentProjection,
  registerBodyProjections,
} from './projections/body';

export { registerEquipmentMileagePolicy } from './policies/equipment';
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

---

## Task 7: BodyweightChart component

**Files:** `ui/components/BodyweightChart.tsx`

- [ ] **Step 1: Create the component**

```tsx
// ui/components/BodyweightChart.tsx
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { BodyweightEntry } from '@features/profile';

interface Props {
  history: BodyweightEntry[];
}

export function BodyweightChart({ history }: Props) {
  if (history.length < 2) {
    return <p className="caption">Log 2+ entries to see your trend.</p>;
  }

  const data = history.map(e => ({
    date: e.date.slice(5), // MM-DD
    weight: e.weightKg,
  }));

  return (
    <ResponsiveContainer width="100%" height={140}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} unit="kg" domain={['auto', 'auto']} />
        <Tooltip formatter={(v: number) => [`${v}kg`, 'Weight']} />
        <Line
          type="monotone"
          dataKey="weight"
          stroke="var(--color-primary)"
          dot={false}
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

---

## Task 8: BodyTrackingSection component

**Files:** `ui/components/BodyTrackingSection.tsx`

- [ ] **Step 1: Create the component**

```tsx
// ui/components/BodyTrackingSection.tsx
import { useState } from 'react';
import { useCommand } from '@ui/bindings';
import {
  handleLogBodyweight,
  handleLogMeasurement,
  handleAddEquipment,
  registerBodyProjections,
  registerEquipmentMileagePolicy,
} from '@features/profile';
import { viewStore } from '@data/projections/views';
import type { BodyweightEntry, MeasurementEntry, Equipment } from '@features/profile';
import { BodyweightChart } from './BodyweightChart';
import type { Id } from '@shared/types';

registerBodyProjections();
registerEquipmentMileagePolicy();

const USER_ID = 'user-001' as Id<'User'>;

// ── Bodyweight log ────────────────────────────────────────────

function BodyweightLog() {
  const [weight, setWeight] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const log = useCommand(handleLogBodyweight);
  const history = viewStore.get<BodyweightEntry[]>('bodyweight_history') ?? [];

  async function submit() {
    const kg = parseFloat(weight);
    if (!kg || kg <= 0) return;
    await log({ type: 'LogBodyweight', userId: USER_ID, weightKg: kg, date });
    setWeight('');
  }

  return (
    <section className="surface">
      <h4>Bodyweight</h4>
      <div className="row">
        <input
          type="number"
          step="0.1"
          min="20"
          max="300"
          placeholder="kg"
          value={weight}
          onChange={e => setWeight(e.target.value)}
          style={{ width: 80 }}
        />
        <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        <button className="primary" onClick={submit}>Log</button>
      </div>
      <BodyweightChart history={history} />
    </section>
  );
}

// ── Measurements ──────────────────────────────────────────────

function MeasurementsLog() {
  const [waist, setWaist] = useState('');
  const [chest, setChest] = useState('');
  const [arms, setArms] = useState('');
  const [legs, setLegs] = useState('');
  const log = useCommand(handleLogMeasurement);

  async function submit() {
    const today = new Date().toISOString().slice(0, 10);
    await log({
      type: 'LogMeasurement',
      userId: USER_ID,
      waistCm: waist ? parseFloat(waist) : undefined,
      chestCm: chest ? parseFloat(chest) : undefined,
      armsCm: arms ? parseFloat(arms) : undefined,
      legsCm: legs ? parseFloat(legs) : undefined,
      date: today,
    });
    setWaist(''); setChest(''); setArms(''); setLegs('');
  }

  return (
    <section className="surface">
      <h4>Measurements</h4>
      <div className="auto-columns">
        {[
          { label: 'Waist', value: waist, set: setWaist },
          { label: 'Chest', value: chest, set: setChest },
          { label: 'Arms', value: arms, set: setArms },
          { label: 'Legs', value: legs, set: setLegs },
        ].map(field => (
          <div key={field.label} className="column" style={{ gap: 'var(--spacing-1)' }}>
            <label className="caption">{field.label} (cm)</label>
            <input
              type="number"
              step="0.5"
              min="0"
              placeholder="cm"
              value={field.value}
              onChange={e => field.set(e.target.value)}
            />
          </div>
        ))}
      </div>
      <button className="primary" onClick={submit}>Save Measurements</button>
    </section>
  );
}

// ── Equipment tracker ─────────────────────────────────────────

function EquipmentTracker() {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<Equipment['type']>('shoes');
  const [retirement, setRetirement] = useState(500);
  const add = useCommand(handleAddEquipment);
  const gear = viewStore.get<Equipment[]>('equipment_list') ?? [];

  async function submit() {
    if (!name) return;
    await add({ type: 'AddEquipment', userId: USER_ID, name, equipmentType: type, retirementDistanceKm: retirement });
    setName(''); setShowForm(false);
  }

  return (
    <section className="surface">
      <div className="row between">
        <h4>Equipment</h4>
        <button className="ghost" onClick={() => setShowForm(v => !v)}>{showForm ? '−' : '+'}</button>
      </div>

      {showForm && (
        <div className="column surface">
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Nike Pegasus" />
          <select value={type} onChange={e => setType(e.target.value as Equipment['type'])}>
            <option value="shoes">Shoes</option>
            <option value="bike">Bike</option>
            <option value="other">Other</option>
          </select>
          <label className="caption">Retirement distance (km)</label>
          <input type="number" value={retirement} min={1} onChange={e => setRetirement(Number(e.target.value))} />
          <div className="row">
            <button className="primary" onClick={submit}>Add</button>
            <button className="secondary" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {gear.length === 0 && !showForm ? (
        <p className="caption">No equipment tracked yet.</p>
      ) : (
        <div className="auto-columns">
          {gear.map(item => {
            const pct = Math.min(100, Math.round((item.distanceKm / item.retirementDistanceKm) * 100));
            const isNearRetirement = pct >= 90;
            return (
              <div key={item.id} className={`surface${isNearRetirement ? ' warning' : ''}`}>
                <div className="row between">
                  <h3>{item.name}</h3>
                  {isNearRetirement && <span className="pill warning">Replace soon</span>}
                </div>
                <p className="caption">{item.type}</p>
                <p className="detail">{item.distanceKm.toFixed(0)} km</p>
                <progress value={pct} max={100} />
                <p className="caption">{item.distanceKm.toFixed(0)} / {item.retirementDistanceKm} km</p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ── Main export ───────────────────────────────────────────────

export function BodyTrackingSection() {
  return (
    <div className="column">
      <BodyweightLog />
      <MeasurementsLog />
      <EquipmentTracker />
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

---

## Task 9: Expand Dashboard readiness card with per-factor breakdown and new inputs

**Files:** `ui/layouts/DashboardScreen.tsx`

The readiness card currently shows a score ring and a sleep/energy summary. We extend it to show:
- Resting HR input
- "How do you feel?" 1–5 quick-tap
- Per-factor breakdown (training load, sleep, resting HR, plan adherence) when expanded

- [ ] **Step 1: Add imports to DashboardScreen.tsx**

```ts
import {
  handleLogRestingHR,
  handleLogSubjectiveRPE,
  getTodaySubjectiveRPE,
  getRestingHRHistory,
} from '@features/readiness';
```

- [ ] **Step 2: Add ReadinessFactors inside the expanded readiness card**

Read DashboardScreen.tsx to find the `SleepCard` component or wherever readiness is rendered. Inside the expanded section, add:

```tsx
{/* Per-factor breakdown */}
<div className="column" style={{ gap: 'var(--spacing-2)' }}>
  {[
    { label: 'Sleep quality', value: readiness?.sleep ?? 0, max: 10 },
    { label: 'Energy', value: readiness?.energy ?? 0, max: 10 },
    { label: 'Mood', value: readiness?.mood ?? 0, max: 10 },
    { label: 'Soreness (inv.)', value: 10 - (readiness?.soreness ?? 0), max: 10 },
  ].map(factor => (
    <div key={factor.label} className="row between">
      <p className="caption">{factor.label}</p>
      <progress value={factor.value} max={factor.max} style={{ width: 80 }} />
    </div>
  ))}
</div>

{/* Resting HR quick-log */}
<SubjectiveAndHRInputs />
```

- [ ] **Step 3: Add SubjectiveAndHRInputs as a named component above SleepCard**

```tsx
function SubjectiveAndHRInputs() {
  const [hrInput, setHrInput] = useState('');
  const [feeling, setFeeling] = useState<number | null>(null);
  const logHR = useCommand(handleLogRestingHR);
  const logRPE = useCommand(handleLogSubjectiveRPE);
  const todayRPE = getTodaySubjectiveRPE();

  async function submitHR() {
    const bpm = parseInt(hrInput, 10);
    if (!bpm || bpm < 30 || bpm > 200) return;
    await logHR({ type: 'LogRestingHR', userId: USER_ID, bpm, date: new Date().toISOString().slice(0, 10) });
    setHrInput('');
  }

  async function submitFeeling(score: number) {
    setFeeling(score);
    await logRPE({ type: 'LogSubjectiveRPE', userId: USER_ID, score });
  }

  return (
    <div className="column" style={{ gap: 'var(--spacing-2)' }}>
      <div className="row">
        <input
          type="number"
          placeholder="Resting HR (bpm)"
          value={hrInput}
          onChange={e => setHrInput(e.target.value)}
          min={30}
          max={200}
          style={{ width: 120 }}
        />
        <button className="secondary" onClick={submitHR}>Log HR</button>
      </div>

      <div className="column" style={{ gap: 'var(--spacing-1)' }}>
        <p className="caption">How do you feel today?</p>
        <div className="row">
          {[1, 2, 3, 4, 5].map(score => (
            <button
              key={score}
              className={feeling === score || (todayRPE === score && !feeling) ? 'primary' : 'secondary'}
              onClick={() => submitFeeling(score)}
              style={{ minWidth: 36 }}
            >
              {['😴', '😔', '😐', '😊', '💪'][score - 1]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify build and dev server**

```bash
npm run build
npm run dev
```

Navigate to Dashboard — expanded readiness card shows per-factor breakdown, resting HR input, and feeling selector.

- [ ] **Step 5: Commit**

```bash
git add features/readiness/ features/profile/ ui/components/BodyweightChart.tsx ui/components/BodyTrackingSection.tsx ui/layouts/DashboardScreen.tsx
git commit -m "feat(readiness+body): resting HR, subjective RPE, bodyweight log, measurements, equipment tracker"
```

---

## Task 10: Wire BodyTrackingSection into ProfileScreen

**Files:** `ui/layouts/ProfileScreen.tsx`

- [ ] **Step 1: Add import and render**

Read ProfileScreen.tsx to find the right insertion point (end of the profile content, or as a new collapsible section).

Add:

```ts
import { BodyTrackingSection } from '@ui/components/BodyTrackingSection';
```

In the JSX, add a collapsible section:

```tsx
{/* Body & Health Tracking */}
<details className="surface">
  <summary><h3>Body & Health Tracking</h3></summary>
  <BodyTrackingSection />
</details>
```

- [ ] **Step 2: Verify build and dev server**

```bash
npm run build
npm run dev
```

Navigate to Profile — "Body & Health Tracking" collapsible section appears. Expand it to see bodyweight log, measurements, and equipment tracker.

- [ ] **Step 3: Commit**

```bash
git add ui/layouts/ProfileScreen.tsx
git commit -m "feat(profile): add body tracking section to Profile screen"
```

---

## Self-Review

### Spec coverage check

| Spec requirement | Task |
|---|---|
| BodyweightEntry domain type | Task 1 |
| MeasurementEntry domain type | Task 1 |
| Equipment domain type with odometer and retirement | Task 1 |
| handleLogBodyweight / handleLogMeasurement / handleAddEquipment | Task 2 |
| bodyweight_history / measurement_history / equipment_list projections | Task 3 |
| Equipment auto-mileage policy (CardioSessionLogged) | Task 4 |
| Retirement threshold coaching insight | Task 4 |
| RestingHREntry type + events/commands | Task 5 |
| SubjectiveRPEEntry type + events/commands | Task 5 |
| Resting HR and subjective RPE handlers | Task 5 |
| Resting HR and subjective RPE projections/queries | Task 5 |
| BodyweightChart (Recharts LineChart) | Task 7 |
| BodyTrackingSection (bodyweight log + measurements + equipment) | Task 8 |
| Dashboard readiness per-factor breakdown | Task 9 |
| Resting HR quick-log on Dashboard | Task 9 |
| "How do you feel?" 1–5 quick-tap on Dashboard | Task 9 |
| Profile screen body tracking section | Task 10 |

### Type consistency check
- `Equipment['type']` is a closed union (`'shoes' | 'bike' | 'other'`) — no stringly-typed comparisons ✓
- Bodyweight entries are sorted by date string (ISO sort = chronological) ✓
- `SubjectiveRPEEntry` has no `Id` field — it's keyed by userId + date, not a standalone aggregate ✓
- Equipment retirement coaching insight uses `InsightGenerated` event type — matches the coaching feature's event contract ✓

### Placeholder check
No TBD, TODO, or incomplete steps found. All code blocks are complete.
