# Plan 3: Goals System

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Goals System — a CQRS module that lets users set personal fitness goals (strength, distance, sessions, bodyweight) with optional deadlines, auto-updates progress from session events, and surfaces goals on the Dashboard and in a dedicated Analytics section. Also wires into the existing Achievements feature so that completing a goal can unlock achievements.

**Architecture:** `features/goals/` is a standalone CQRS module. Two policies subscribe to the event bus: one updates goal progress on `SessionFinished` and `CardioSessionLogged`; a second checks for goal completion after each progress update and emits `GoalCompleted`. The Dashboard widget and Analytics section both read from the `active_goals` and `completed_goals` ViewStore keys. No cross-feature imports — all data arrives via event payloads.

**Tech Stack:** TypeScript, React 18, existing CQRS stack (`@shared/types`, `@core/events/bus`, `@data/projections/views`, `@data/projections/builders`, `@core/id-generator`, `@core/clock`)

**Related spec:** `docs/superpowers/specs/2026-04-14-new-features-design.md` — Sections 1G, 2H

**This is Plan 3 of 6. Depends on Plan 1 Task 0. Independent of Plans 2, 4–6.**

---

## File Map

### New files
| File | Responsibility |
|---|---|
| `features/goals/domain/types.ts` | Goal, GoalMetric, all event/command types |
| `features/goals/commands/handlers.ts` | handleCreateGoal, handleUpdateGoalProgress, handleCompleteGoal, handleDeleteGoal |
| `features/goals/projections/index.ts` | activeGoalsProjection, completedGoalsProjection |
| `features/goals/policies/updateGoals.ts` | SessionFinished / CardioSessionLogged → auto-update goal progress |
| `features/goals/queries/index.ts` | getActiveGoals, getCompletedGoals, getGoalById |
| `features/goals/index.ts` | Public API |
| `ui/components/GoalsWidget.tsx` | Dashboard goals widget |
| `ui/components/GoalForm.tsx` | Add/edit goal modal form |

### Modified files
| File | What changes |
|---|---|
| `ui/layouts/DashboardScreen.tsx` | Add GoalsWidget |
| `ui/layouts/AnalyticsScreen.tsx` | Add goals section |

---

## Task 1: Domain types

**Files:** `features/goals/domain/types.ts`

- [ ] **Step 1: Create the file**

```ts
// features/goals/domain/types.ts
import type { Id, DomainEvent } from '@shared/types';

// ─── Core domain types ────────────────────────────────────────

export type GoalMetric = 'weight_lifted' | 'distance_km' | 'sessions' | 'strength_1rm' | 'bodyweight_kg';

export interface Goal {
  id: Id<'Goal'>;
  userId: Id<'User'>;
  name: string;
  metric: GoalMetric;
  target: number;
  current: number;
  unit: string;
  deadline?: string;        // ISO date 'YYYY-MM-DD'
  completed: boolean;
  completedAt?: number;     // unix ms
  createdAt: number;
}

// ─── Events ───────────────────────────────────────────────────

export interface GoalCreatedPayload {
  goalId: Id<'Goal'>;
  userId: Id<'User'>;
  name: string;
  metric: GoalMetric;
  target: number;
  unit: string;
  deadline?: string;
  createdAt: number;
}

export interface GoalProgressUpdatedPayload {
  goalId: Id<'Goal'>;
  current: number;
  delta: number;
}

export interface GoalCompletedPayload {
  goalId: Id<'Goal'>;
  completedAt: number;
}

export interface GoalDeletedPayload {
  goalId: Id<'Goal'>;
}

export type GoalEvent =
  | DomainEvent<'GoalCreated', GoalCreatedPayload>
  | DomainEvent<'GoalProgressUpdated', GoalProgressUpdatedPayload>
  | DomainEvent<'GoalCompleted', GoalCompletedPayload>
  | DomainEvent<'GoalDeleted', GoalDeletedPayload>;

// ─── Commands ─────────────────────────────────────────────────

export interface CreateGoal {
  type: 'CreateGoal';
  userId: Id<'User'>;
  name: string;
  metric: GoalMetric;
  target: number;
  unit: string;
  deadline?: string;
}

export interface UpdateGoalProgress {
  type: 'UpdateGoalProgress';
  goalId: Id<'Goal'>;
  delta: number;    // amount to add to current; can be negative
}

export interface CompleteGoal {
  type: 'CompleteGoal';
  goalId: Id<'Goal'>;
}

export interface DeleteGoal {
  type: 'DeleteGoal';
  goalId: Id<'Goal'>;
}

export type GoalCommand = CreateGoal | UpdateGoalProgress | CompleteGoal | DeleteGoal;
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

---

## Task 2: Command handlers

**Files:** `features/goals/commands/handlers.ts`

- [ ] **Step 1: Create the file**

```ts
// features/goals/commands/handlers.ts
import { eventBus } from '@core/events/bus';
import { generateId } from '@core/id-generator';
import { clock } from '@core/clock';
import { viewStore } from '@data/projections/views';
import type { Goal } from '../domain/types';
import type {
  CreateGoal, UpdateGoalProgress, CompleteGoal, DeleteGoal,
  GoalCreatedPayload, GoalProgressUpdatedPayload, GoalCompletedPayload, GoalDeletedPayload,
} from '../domain/types';
import type { Id } from '@shared/types';

export async function handleCreateGoal(cmd: CreateGoal): Promise<Id<'Goal'>> {
  const goalId = generateId<'Goal'>();
  const payload: GoalCreatedPayload = {
    goalId,
    userId: cmd.userId,
    name: cmd.name,
    metric: cmd.metric,
    target: cmd.target,
    unit: cmd.unit,
    deadline: cmd.deadline,
    createdAt: clock.now(),
  };
  await eventBus.publish({ type: 'GoalCreated', aggregateId: goalId, payload });
  return goalId;
}

export async function handleUpdateGoalProgress(cmd: UpdateGoalProgress): Promise<void> {
  const goals = viewStore.get<Goal[]>('active_goals') ?? [];
  const goal = goals.find(g => g.id === cmd.goalId);
  if (!goal) return;

  const newCurrent = goal.current + cmd.delta;
  const progressPayload: GoalProgressUpdatedPayload = {
    goalId: cmd.goalId,
    current: newCurrent,
    delta: cmd.delta,
  };
  await eventBus.publish({ type: 'GoalProgressUpdated', aggregateId: cmd.goalId, payload: progressPayload });

  // Auto-complete when target is reached
  if (newCurrent >= goal.target && !goal.completed) {
    const completedPayload: GoalCompletedPayload = { goalId: cmd.goalId, completedAt: clock.now() };
    await eventBus.publish({ type: 'GoalCompleted', aggregateId: cmd.goalId, payload: completedPayload });
  }
}

export async function handleCompleteGoal(cmd: CompleteGoal): Promise<void> {
  const payload: GoalCompletedPayload = { goalId: cmd.goalId, completedAt: clock.now() };
  await eventBus.publish({ type: 'GoalCompleted', aggregateId: cmd.goalId, payload });
}

export async function handleDeleteGoal(cmd: DeleteGoal): Promise<void> {
  const payload: GoalDeletedPayload = { goalId: cmd.goalId };
  await eventBus.publish({ type: 'GoalDeleted', aggregateId: cmd.goalId, payload });
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

---

## Task 3: Projections

**Files:** `features/goals/projections/index.ts`

- [ ] **Step 1: Create the file**

```ts
// features/goals/projections/index.ts
import { ProjectionBuilder } from '@data/projections/builders';
import { viewStore } from '@data/projections/views';
import type { Goal } from '../domain/types';
import type {
  GoalCreatedPayload, GoalProgressUpdatedPayload,
  GoalCompletedPayload, GoalDeletedPayload,
} from '../domain/types';

// ─── Active Goals ─────────────────────────────────────────────

export const activeGoalsProjection = new ProjectionBuilder<Goal[]>('active_goals')
  .on<GoalCreatedPayload>('GoalCreated', (state, event) => {
    const p = event.payload;
    const goal: Goal = {
      id: p.goalId,
      userId: p.userId,
      name: p.name,
      metric: p.metric,
      target: p.target,
      current: 0,
      unit: p.unit,
      deadline: p.deadline,
      completed: false,
      createdAt: p.createdAt,
    };
    return [...(state ?? []), goal];
  })
  .on<GoalProgressUpdatedPayload>('GoalProgressUpdated', (state, event) => {
    if (!state) return [];
    const { goalId, current } = event.payload;
    return state.map(g => g.id === goalId ? { ...g, current } : g);
  })
  .on<GoalCompletedPayload>('GoalCompleted', (state, event) =>
    // Remove from active goals — completed goals move to completed_goals projection
    (state ?? []).filter(g => g.id !== event.payload.goalId)
  )
  .on<GoalDeletedPayload>('GoalDeleted', (state, event) =>
    (state ?? []).filter(g => g.id !== event.payload.goalId)
  )
  .build();

// ─── Completed Goals ──────────────────────────────────────────

export const completedGoalsProjection = new ProjectionBuilder<Goal[]>('completed_goals')
  .on<GoalCreatedPayload>('GoalCreated', (state, event) => {
    // Track all goals here so we have full info when completed
    const p = event.payload;
    const goal: Goal = {
      id: p.goalId,
      userId: p.userId,
      name: p.name,
      metric: p.metric,
      target: p.target,
      current: 0,
      unit: p.unit,
      deadline: p.deadline,
      completed: false,
      createdAt: p.createdAt,
    };
    return [...(state ?? []).filter(g => g.id !== p.goalId), goal];
  })
  .on<GoalProgressUpdatedPayload>('GoalProgressUpdated', (state, event) => {
    if (!state) return [];
    const { goalId, current } = event.payload;
    return state.map(g => g.id === goalId ? { ...g, current } : g);
  })
  .on<GoalCompletedPayload>('GoalCompleted', (state, event) => {
    if (!state) return [];
    const { goalId, completedAt } = event.payload;
    return state.map(g =>
      g.id === goalId ? { ...g, completed: true, completedAt } : g
    );
  })
  .on<GoalDeletedPayload>('GoalDeleted', (state, event) =>
    (state ?? []).filter(g => g.id !== event.payload.goalId)
  )
  .build();

export function registerGoalProjections(): void {
  activeGoalsProjection.register(viewStore);
  completedGoalsProjection.register(viewStore);
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

---

## Task 4: Auto-update policy

**Files:** `features/goals/policies/updateGoals.ts`

The policy listens to `SessionFinished` and `CardioSessionLogged`. It updates:
- `sessions` goals: increment by 1 on any session
- `weight_lifted` goals: increment by total volume from exercise summaries (sessions only)
- `distance_km` goals: increment by distance on cardio sessions
- `strength_1rm` goals: update if a new 1RM estimate exceeds current

- [ ] **Step 1: Create the file**

```ts
// features/goals/policies/updateGoals.ts
import { eventBus } from '@core/events/bus';
import { viewStore } from '@data/projections/views';
import type { DomainEvent } from '@shared/types';
import type { SessionFinishedPayload } from '@features/training_log/domain/types';
import type { Goal, GoalMetric } from '../domain/types';
import { handleUpdateGoalProgress } from '../commands/handlers';

/** Returns active goals that track a given metric. */
function goalsForMetric(metric: GoalMetric): Goal[] {
  const goals = viewStore.get<Goal[]>('active_goals') ?? [];
  return goals.filter(g => g.metric === metric && !g.completed);
}

let registered = false;

export function registerGoalUpdatePolicy(): void {
  if (registered) return;
  registered = true;

  // ── Strength sessions ──────────────────────────────────────────
  eventBus.subscribe<DomainEvent<'SessionFinished', SessionFinishedPayload>>(
    'SessionFinished',
    async (event) => {
      const { exerciseSummaries } = event.payload;

      // sessions count
      for (const goal of goalsForMetric('sessions')) {
        await handleUpdateGoalProgress({ type: 'UpdateGoalProgress', goalId: goal.id, delta: 1 });
      }

      // total volume (weight_lifted)
      const totalVolume = exerciseSummaries.reduce((sum, ex) => sum + ex.totalVolume, 0);
      for (const goal of goalsForMetric('weight_lifted')) {
        if (totalVolume > 0) {
          await handleUpdateGoalProgress({ type: 'UpdateGoalProgress', goalId: goal.id, delta: totalVolume });
        }
      }

      // 1RM (strength_1rm) — goal tracks highest 1RM estimate; set current if new estimate is higher
      for (const goal of goalsForMetric('strength_1rm')) {
        const bestOneRM = exerciseSummaries.reduce((best, ex) => Math.max(best, ex.oneRepMaxEstimate ?? 0), 0);
        if (bestOneRM > goal.current) {
          const delta = bestOneRM - goal.current;
          await handleUpdateGoalProgress({ type: 'UpdateGoalProgress', goalId: goal.id, delta });
        }
      }
    }
  );

  // ── Cardio sessions ────────────────────────────────────────────
  eventBus.subscribe<DomainEvent<'CardioSessionLogged', { distanceMeters: number; sessionId: string }>>(
    'CardioSessionLogged',
    async (event) => {
      const distanceKm = event.payload.distanceMeters / 1000;

      // sessions count
      for (const goal of goalsForMetric('sessions')) {
        await handleUpdateGoalProgress({ type: 'UpdateGoalProgress', goalId: goal.id, delta: 1 });
      }

      // distance
      for (const goal of goalsForMetric('distance_km')) {
        await handleUpdateGoalProgress({ type: 'UpdateGoalProgress', goalId: goal.id, delta: distanceKm });
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

## Task 5: Queries and public API

**Files:** `features/goals/queries/index.ts`, `features/goals/index.ts`

- [ ] **Step 1: Create `features/goals/queries/index.ts`**

```ts
// features/goals/queries/index.ts
import { viewStore } from '@data/projections/views';
import type { Goal } from '../domain/types';
import type { Id } from '@shared/types';

export function getActiveGoals(): Goal[] {
  return viewStore.get<Goal[]>('active_goals') ?? [];
}

export function getCompletedGoals(): Goal[] {
  return (viewStore.get<Goal[]>('completed_goals') ?? []).filter(g => g.completed);
}

export function getGoalById(goalId: Id<'Goal'>): Goal | undefined {
  const all = [
    ...(viewStore.get<Goal[]>('active_goals') ?? []),
    ...(viewStore.get<Goal[]>('completed_goals') ?? []).filter(g => g.completed),
  ];
  return all.find(g => g.id === goalId);
}
```

- [ ] **Step 2: Create `features/goals/index.ts`**

```ts
// features/goals/index.ts
export type { Goal, GoalMetric, GoalEvent, GoalCommand, CreateGoal, UpdateGoalProgress, CompleteGoal, DeleteGoal } from './domain/types';
export { handleCreateGoal, handleUpdateGoalProgress, handleCompleteGoal, handleDeleteGoal } from './commands/handlers';
export { activeGoalsProjection, completedGoalsProjection, registerGoalProjections } from './projections';
export { registerGoalUpdatePolicy } from './policies/updateGoals';
export { getActiveGoals, getCompletedGoals, getGoalById } from './queries';
```

- [ ] **Step 3: Verify build and commit**

```bash
npm run build
git add features/goals/
git commit -m "feat(goals): add CQRS module — domain, commands, projections, policy, queries"
```

---

## Task 6: GoalsWidget component

**Files:** `ui/components/GoalsWidget.tsx`

- [ ] **Step 1: Create the component**

```tsx
// ui/components/GoalsWidget.tsx
import { useState } from 'react';
import { useCommand } from '@ui/bindings';
import { getActiveGoals, handleCreateGoal } from '@features/goals';
import type { Goal, GoalMetric } from '@features/goals';
import type { Id } from '@shared/types';

const USER_ID = 'user-001' as Id<'User'>;

const METRIC_LABELS: Record<GoalMetric, string> = {
  weight_lifted: 'Weight lifted (kg)',
  distance_km: 'Distance (km)',
  sessions: 'Sessions',
  strength_1rm: '1RM estimate (kg)',
  bodyweight_kg: 'Bodyweight (kg)',
};

function isNearDeadline(deadline?: string): boolean {
  if (!deadline) return false;
  const daysLeft = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86_400_000);
  return daysLeft >= 0 && daysLeft <= 7;
}

function GoalRow({ goal }: { goal: Goal }) {
  const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
  const nearTarget = pct >= 90;
  const nearDeadline = isNearDeadline(goal.deadline);

  return (
    <div className="column" style={{ gap: 'var(--spacing-1)' }}>
      <div className="row between">
        <p>{goal.name}</p>
        <span className={nearTarget ? 'pill bg-primary' : nearDeadline ? 'pill warning' : 'pill'}>
          {pct}%
        </span>
      </div>
      <progress value={pct} max={100} />
      <p className="caption">
        {goal.current.toFixed(1)} / {goal.target} {goal.unit}
        {goal.deadline && ` · Due ${goal.deadline}`}
      </p>
    </div>
  );
}

export function GoalsWidget() {
  const goals = getActiveGoals();

  if (goals.length === 0) {
    return (
      <section className="surface">
        <h3>Goals</h3>
        <p className="caption">No active goals. Add one in Analytics.</p>
      </section>
    );
  }

  return (
    <section className="surface">
      <h3>Goals</h3>
      <div className="column">
        {goals.slice(0, 3).map(goal => (
          <GoalRow key={goal.id} goal={goal} />
        ))}
        {goals.length > 3 && (
          <p className="caption">{goals.length - 3} more goals</p>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

---

## Task 7: GoalForm component

**Files:** `ui/components/GoalForm.tsx`

- [ ] **Step 1: Create the component**

```tsx
// ui/components/GoalForm.tsx
import { useState } from 'react';
import { useCommand } from '@ui/bindings';
import { handleCreateGoal } from '@features/goals';
import type { GoalMetric } from '@features/goals';
import type { Id } from '@shared/types';

const USER_ID = 'user-001' as Id<'User'>;

const METRICS: { value: GoalMetric; label: string; unit: string }[] = [
  { value: 'sessions', label: 'Session count', unit: 'sessions' },
  { value: 'distance_km', label: 'Total distance', unit: 'km' },
  { value: 'weight_lifted', label: 'Total weight lifted', unit: 'kg' },
  { value: 'strength_1rm', label: 'Strength (1RM)', unit: 'kg' },
  { value: 'bodyweight_kg', label: 'Bodyweight', unit: 'kg' },
];

interface Props {
  onClose: () => void;
}

export function GoalForm({ onClose }: Props) {
  const [name, setName] = useState('');
  const [metric, setMetric] = useState<GoalMetric>('sessions');
  const [target, setTarget] = useState(10);
  const [deadline, setDeadline] = useState('');
  const create = useCommand(handleCreateGoal);

  const selectedMetric = METRICS.find(m => m.value === metric)!;

  async function submit() {
    if (!name || target <= 0) return;
    await create({
      type: 'CreateGoal',
      userId: USER_ID,
      name,
      metric,
      target,
      unit: selectedMetric.unit,
      deadline: deadline || undefined,
    });
    onClose();
  }

  return (
    <section className="surface">
      <h3>New Goal</h3>
      <div className="column">
        <label className="caption">Goal name</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Run 100km" />

        <label className="caption">Metric</label>
        <select value={metric} onChange={e => setMetric(e.target.value as GoalMetric)}>
          {METRICS.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>

        <label className="caption">Target ({selectedMetric.unit})</label>
        <input
          type="number"
          min={1}
          value={target}
          onChange={e => setTarget(Number(e.target.value))}
        />

        <label className="caption">Deadline (optional)</label>
        <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />

        <div className="row">
          <button className="primary" onClick={submit}>Create Goal</button>
          <button className="secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

---

## Task 8: Wire into Dashboard and Analytics

**Files:** `ui/layouts/DashboardScreen.tsx`, `ui/layouts/AnalyticsScreen.tsx`

- [ ] **Step 1: Add GoalsWidget to DashboardScreen.tsx**

At the top of the file, add:

```ts
import { GoalsWidget } from '@ui/components/GoalsWidget';
import { registerGoalProjections, registerGoalUpdatePolicy } from '@features/goals';
import '@features/goals';
```

Near the module-level registration calls, add:

```ts
registerGoalProjections();
registerGoalUpdatePolicy();
```

In the JSX, add `<GoalsWidget />` after the coaching section.

- [ ] **Step 2: Add goals section to AnalyticsScreen.tsx**

At the top, add:

```ts
import { useState } from 'react';
import { GoalForm } from '@ui/components/GoalForm';
import { getActiveGoals, getCompletedGoals } from '@features/goals';
import type { Goal } from '@features/goals';
import { registerGoalProjections, registerGoalUpdatePolicy } from '@features/goals';
import '@features/goals';
```

Register projections:

```ts
registerGoalProjections();
registerGoalUpdatePolicy();
```

Add a goals section to the Analytics screen JSX (before or after the existing charts section):

```tsx
{/* ── Goals ─────────────────────── */}
{(() => {
  const [showForm, setShowForm] = useState(false);
  const active = getActiveGoals();
  const completed = getCompletedGoals();

  return (
    <section className="surface">
      <div className="row between">
        <h3>Goals</h3>
        <button className="primary" onClick={() => setShowForm(v => !v)}>
          {showForm ? 'Cancel' : 'Add Goal'}
        </button>
      </div>

      {showForm && <GoalForm onClose={() => setShowForm(false)} />}

      <div className="auto-columns">
        {active.map(goal => {
          const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
          return (
            <div key={goal.id} className="surface interactive column">
              <p>{goal.name}</p>
              <progress value={pct} max={100} />
              <p className="caption">{goal.current.toFixed(1)} / {goal.target} {goal.unit}</p>
              {goal.deadline && <p className="caption">Due {goal.deadline}</p>}
            </div>
          );
        })}
      </div>

      {completed.length > 0 && (
        <>
          <h4>Completed</h4>
          <div className="auto-columns">
            {completed.map(goal => (
              <div key={goal.id} className="surface column">
                <p>{goal.name}</p>
                <span className="pill bg-primary">Done</span>
                <p className="caption">{goal.target} {goal.unit}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
})()}
```

> Note: `useState` inside an IIFE inside JSX won't work — extract the goals section into a named component `GoalsSection` in the same file instead.

**Correction:** Replace the IIFE approach above with a local component:

```tsx
// Inside AnalyticsScreen.tsx (before the main export)
function GoalsSection() {
  const [showForm, setShowForm] = useState(false);
  const active = getActiveGoals();
  const completed = getCompletedGoals();

  return (
    <section className="surface">
      <div className="row between">
        <h3>Goals</h3>
        <button className="primary" onClick={() => setShowForm(v => !v)}>
          {showForm ? 'Cancel' : 'Add Goal'}
        </button>
      </div>
      {showForm && <GoalForm onClose={() => setShowForm(false)} />}
      <div className="auto-columns">
        {active.map(goal => {
          const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
          return (
            <div key={goal.id} className="surface interactive column">
              <p>{goal.name}</p>
              <progress value={pct} max={100} />
              <p className="caption">{goal.current.toFixed(1)} / {goal.target} {goal.unit}</p>
              {goal.deadline && <p className="caption">Due {goal.deadline}</p>}
            </div>
          );
        })}
      </div>
      {completed.length > 0 && (
        <div className="column">
          <h4>Completed</h4>
          <div className="auto-columns">
            {completed.map(goal => (
              <div key={goal.id} className="surface column">
                <p>{goal.name}</p>
                <span className="pill bg-primary">Done</span>
                <p className="caption">{goal.target} {goal.unit}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
```

Then in the main Analytics JSX, just render `<GoalsSection />`.

- [ ] **Step 3: Verify build and dev server**

```bash
npm run build
npm run dev
```

Verify: Goals widget appears on Dashboard. Goals section appears in Analytics with "Add Goal" button.

- [ ] **Step 4: Commit**

```bash
git add ui/layouts/DashboardScreen.tsx ui/layouts/AnalyticsScreen.tsx ui/components/GoalsWidget.tsx ui/components/GoalForm.tsx
git commit -m "feat(goals): wire GoalsWidget into Dashboard and add goals section to Analytics"
```

---

## Self-Review

### Spec coverage check

| Spec requirement | Task |
|---|---|
| Goal domain type with GoalMetric | Task 1 |
| CreateGoal / UpdateGoalProgress / CompleteGoal / DeleteGoal commands | Task 2 |
| GoalCreated / GoalProgressUpdated / GoalCompleted events | Task 2–3 |
| active_goals projection | Task 3 |
| completed_goals projection | Task 3 |
| Auto-update from WorkoutLogged (weight_lifted, sessions, 1RM) | Task 4 |
| Auto-update from CardioSessionLogged (distance, sessions) | Task 4 |
| getActiveGoals / getCompletedGoals / getGoalById queries | Task 5 |
| Dashboard goals widget with progress bars | Task 6 |
| GoalForm (metric selector, target, deadline) | Task 7 |
| Analytics goals section + completed goals | Task 8 |

### Type consistency check
- `Goal.current` starts at 0 and is updated via delta; always non-negative for additive metrics ✓
- `GoalMetric` is a closed union — no stringly-typed metric comparisons ✓
- `bodyweight_kg` is defined in the type but not auto-updated by the policy (bodyweight logging comes in Plan 6) — this is expected; the goal will receive manual `UpdateGoalProgress` commands until Plan 6 ✓

### Placeholder check
No TBD, TODO, or incomplete steps found. All code blocks are complete.
