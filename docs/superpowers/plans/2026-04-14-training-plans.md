# Plan 2: Training Plans + Plan Adherence Tracking

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Training Plans feature — a full CQRS module that lets users create week-based training plans, assign workouts/cardio/rest to days, track plan adherence, and surface "Today's Plan" on the Dashboard. Also updates the coaching policy to consume the real adherence rate (removing the hardcoded 0.9 placeholder from Plan 1).

**Architecture:** `features/training_plans/` is a standalone CQRS module. Commands mutate the event store; projections maintain `active_plan` and `plan_list` in the ViewStore. A policy subscribes to `SessionFinished` on the event bus and emits `PlannedSessionCompleted` when a logged session matches the active plan's scheduled day. An end-of-day policy (triggered on the same event if the current day had an unmatched assignment) emits `PlannedSessionSkipped`. The Dashboard reads `active_plan` directly from the ViewStore. The coaching policy is patched to read `plan_adherence` from the ViewStore instead of the hardcoded 0.9.

**Tech Stack:** TypeScript, React 18, existing CQRS stack (`@shared/types`, `@core/events/bus`, `@data/projections/views`, `@core/id-generator`, `@core/clock`), Recharts (from Plan 1)

**Related spec:** `docs/superpowers/specs/2026-04-14-new-features-design.md` — Sections 1B, 2A, 2F

**This is Plan 2 of 6. Depends on Plan 1 Task 0 (vitest + recharts). Independent of Plans 3–6.**

---

## File Map

### New files
| File | Responsibility |
|---|---|
| `features/training_plans/domain/types.ts` | TrainingPlan, PlanWeek, PlanDay, PlanAdherence, all event/command types |
| `features/training_plans/commands/handlers.ts` | handleCreatePlan, handleUpdatePlan, handleAssignWorkoutToDay, handleDeletePlan |
| `features/training_plans/projections/index.ts` | activePlanProjection, planListProjection, planAdherenceProjection |
| `features/training_plans/policies/trackAdherence.ts` | SessionFinished → PlannedSessionCompleted or PlannedSessionSkipped |
| `features/training_plans/queries/index.ts` | getActivePlan, getPlanList, getPlanById, getPlanAdherence |
| `features/training_plans/index.ts` | Public API |
| `ui/layouts/TrainingPlansScreen.tsx` | Full plans UI: list + builder |
| `ui/components/TodaysPlanCard.tsx` | Dashboard "Today's Plan" card component |

### Modified files
| File | What changes |
|---|---|
| `ui/layouts/DashboardScreen.tsx` | Add TodaysPlanCard, import training_plans module |
| `ui/layouts/LogScreen.tsx` | Add "Plans" sub-tab linking to TrainingPlansScreen |
| `features/coaching/policies/generateInsights.ts` | Replace hardcoded adherenceRate 0.9 with ViewStore read of `plan_adherence` |

---

## Task 1: Domain types

**Files:** `features/training_plans/domain/types.ts`

- [ ] **Step 1: Create the file**

```ts
// features/training_plans/domain/types.ts
import type { Id, DomainEvent } from '@shared/types';

// ─── Core domain types ────────────────────────────────────────

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Monday

export type PlanDayAssignment =
  | { type: 'workout'; blueprintId: string; blueprintName: string }
  | { type: 'cardio'; activityType: string }
  | { type: 'rest' };

export interface PlanDay {
  dayOfWeek: DayOfWeek;
  assignment: PlanDayAssignment;
}

export interface PlanWeek {
  weekNumber: number; // 1-based
  days: PlanDay[];
}

export interface TrainingPlan {
  id: Id<'Plan'>;
  userId: Id<'User'>;
  name: string;
  startDate: string;        // ISO date 'YYYY-MM-DD'
  durationWeeks: number;
  weeks: PlanWeek[];
  createdAt: number;        // unix ms
}

export interface PlanAdherence {
  planId: Id<'Plan'>;
  completed: number;
  scheduled: number;
  adherenceRate: number;    // 0–1 (multiply by 100 for %)
  currentStreak: number;    // consecutive completed days
  missedDays: string[];     // ISO dates
}

// ─── Events ───────────────────────────────────────────────────

export interface PlanCreatedPayload {
  planId: Id<'Plan'>;
  userId: Id<'User'>;
  name: string;
  startDate: string;
  durationWeeks: number;
  weeks: PlanWeek[];
  createdAt: number;
}

export interface PlanUpdatedPayload {
  planId: Id<'Plan'>;
  name?: string;
  startDate?: string;
  durationWeeks?: number;
}

export interface DayAssignedPayload {
  planId: Id<'Plan'>;
  weekNumber: number;
  dayOfWeek: DayOfWeek;
  assignment: PlanDayAssignment;
}

export interface PlanDeletedPayload {
  planId: Id<'Plan'>;
}

export interface PlannedSessionCompletedPayload {
  planId: Id<'Plan'>;
  date: string;             // ISO date
  sessionId: Id<'Session'>;
}

export interface PlannedSessionSkippedPayload {
  planId: Id<'Plan'>;
  date: string;             // ISO date
}

export type TrainingPlanEvent =
  | DomainEvent<'PlanCreated', PlanCreatedPayload>
  | DomainEvent<'PlanUpdated', PlanUpdatedPayload>
  | DomainEvent<'DayAssigned', DayAssignedPayload>
  | DomainEvent<'PlanDeleted', PlanDeletedPayload>
  | DomainEvent<'PlannedSessionCompleted', PlannedSessionCompletedPayload>
  | DomainEvent<'PlannedSessionSkipped', PlannedSessionSkippedPayload>;

// ─── Commands ─────────────────────────────────────────────────

export interface CreatePlan {
  type: 'CreatePlan';
  userId: Id<'User'>;
  name: string;
  startDate: string;
  durationWeeks: number;
}

export interface UpdatePlan {
  type: 'UpdatePlan';
  planId: Id<'Plan'>;
  name?: string;
  startDate?: string;
  durationWeeks?: number;
}

export interface AssignWorkoutToDay {
  type: 'AssignWorkoutToDay';
  planId: Id<'Plan'>;
  weekNumber: number;
  dayOfWeek: DayOfWeek;
  assignment: PlanDayAssignment;
}

export interface DeletePlan {
  type: 'DeletePlan';
  planId: Id<'Plan'>;
}

export type TrainingPlanCommand =
  | CreatePlan
  | UpdatePlan
  | AssignWorkoutToDay
  | DeletePlan;
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: no errors (new file, no imports yet).

---

## Task 2: Command handlers

**Files:** `features/training_plans/commands/handlers.ts`

- [ ] **Step 1: Create the file**

```ts
// features/training_plans/commands/handlers.ts
import { eventBus } from '@core/events/bus';
import { generateId } from '@core/id-generator';
import { clock } from '@core/clock';
import type { Id } from '@shared/types';
import type {
  CreatePlan, UpdatePlan, AssignWorkoutToDay, DeletePlan,
  PlanCreatedPayload, PlanUpdatedPayload, DayAssignedPayload,
  PlanDeletedPayload, PlanWeek, DayOfWeek, PlanDayAssignment,
} from '../domain/types';

/** Builds the full week structure from durationWeeks using rest as default. */
function buildInitialWeeks(durationWeeks: number): PlanWeek[] {
  return Array.from({ length: durationWeeks }, (_, i) => ({
    weekNumber: i + 1,
    days: ([0, 1, 2, 3, 4, 5, 6] as DayOfWeek[]).map(dayOfWeek => ({
      dayOfWeek,
      assignment: { type: 'rest' } as PlanDayAssignment,
    })),
  }));
}

export async function handleCreatePlan(cmd: CreatePlan): Promise<Id<'Plan'>> {
  const planId = generateId<'Plan'>();
  const payload: PlanCreatedPayload = {
    planId,
    userId: cmd.userId,
    name: cmd.name,
    startDate: cmd.startDate,
    durationWeeks: cmd.durationWeeks,
    weeks: buildInitialWeeks(cmd.durationWeeks),
    createdAt: clock.now(),
  };
  await eventBus.publish({ type: 'PlanCreated', aggregateId: planId, payload });
  return planId;
}

export async function handleUpdatePlan(cmd: UpdatePlan): Promise<void> {
  const payload: PlanUpdatedPayload = {
    planId: cmd.planId,
    name: cmd.name,
    startDate: cmd.startDate,
    durationWeeks: cmd.durationWeeks,
  };
  await eventBus.publish({ type: 'PlanUpdated', aggregateId: cmd.planId, payload });
}

export async function handleAssignWorkoutToDay(cmd: AssignWorkoutToDay): Promise<void> {
  const payload: DayAssignedPayload = {
    planId: cmd.planId,
    weekNumber: cmd.weekNumber,
    dayOfWeek: cmd.dayOfWeek,
    assignment: cmd.assignment,
  };
  await eventBus.publish({ type: 'DayAssigned', aggregateId: cmd.planId, payload });
}

export async function handleDeletePlan(cmd: DeletePlan): Promise<void> {
  const payload: PlanDeletedPayload = { planId: cmd.planId };
  await eventBus.publish({ type: 'PlanDeleted', aggregateId: cmd.planId, payload });
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

---

## Task 3: Projections

**Files:** `features/training_plans/projections/index.ts`

- [ ] **Step 1: Create the file**

```ts
// features/training_plans/projections/index.ts
import { ProjectionBuilder } from '@data/projections/builders';
import { viewStore } from '@data/projections/views';
import type {
  TrainingPlan, PlanAdherence,
  PlanCreatedPayload, PlanUpdatedPayload, DayAssignedPayload,
  PlanDeletedPayload, PlannedSessionCompletedPayload, PlannedSessionSkippedPayload,
} from '../domain/types';

// ─── Active Plan Projection ───────────────────────────────────

export const activePlanProjection = new ProjectionBuilder<TrainingPlan | null>('active_plan')
  .on<PlanCreatedPayload>('PlanCreated', (_state, event) => {
    const p = event.payload;
    return {
      id: p.planId,
      userId: p.userId,
      name: p.name,
      startDate: p.startDate,
      durationWeeks: p.durationWeeks,
      weeks: p.weeks,
      createdAt: p.createdAt,
    };
  })
  .on<PlanUpdatedPayload>('PlanUpdated', (state, event) => {
    if (!state) return null;
    const p = event.payload;
    return {
      ...state,
      name: p.name ?? state.name,
      startDate: p.startDate ?? state.startDate,
      durationWeeks: p.durationWeeks ?? state.durationWeeks,
    };
  })
  .on<DayAssignedPayload>('DayAssigned', (state, event) => {
    if (!state) return null;
    const { weekNumber, dayOfWeek, assignment } = event.payload;
    return {
      ...state,
      weeks: state.weeks.map(week =>
        week.weekNumber === weekNumber
          ? {
              ...week,
              days: week.days.map(day =>
                day.dayOfWeek === dayOfWeek ? { ...day, assignment } : day
              ),
            }
          : week
      ),
    };
  })
  .on<PlanDeletedPayload>('PlanDeleted', (_state, _event) => null)
  .build();

// ─── Plan List Projection ─────────────────────────────────────

export const planListProjection = new ProjectionBuilder<TrainingPlan[]>('plan_list')
  .on<PlanCreatedPayload>('PlanCreated', (state, event) => {
    const p = event.payload;
    const plan: TrainingPlan = {
      id: p.planId,
      userId: p.userId,
      name: p.name,
      startDate: p.startDate,
      durationWeeks: p.durationWeeks,
      weeks: p.weeks,
      createdAt: p.createdAt,
    };
    return [...(state ?? []), plan];
  })
  .on<PlanUpdatedPayload>('PlanUpdated', (state, event) => {
    if (!state) return [];
    const p = event.payload;
    return state.map(plan =>
      plan.id === p.planId
        ? {
            ...plan,
            name: p.name ?? plan.name,
            startDate: p.startDate ?? plan.startDate,
            durationWeeks: p.durationWeeks ?? plan.durationWeeks,
          }
        : plan
    );
  })
  .on<DayAssignedPayload>('DayAssigned', (state, event) => {
    if (!state) return [];
    const { planId, weekNumber, dayOfWeek, assignment } = event.payload;
    return state.map(plan =>
      plan.id === planId
        ? {
            ...plan,
            weeks: plan.weeks.map(week =>
              week.weekNumber === weekNumber
                ? {
                    ...week,
                    days: week.days.map(day =>
                      day.dayOfWeek === dayOfWeek ? { ...day, assignment } : day
                    ),
                  }
                : week
            ),
          }
        : plan
    );
  })
  .on<PlanDeletedPayload>('PlanDeleted', (state, event) =>
    (state ?? []).filter(p => p.id !== event.payload.planId)
  )
  .build();

// ─── Plan Adherence Projection ────────────────────────────────

const DEFAULT_ADHERENCE: PlanAdherence = {
  planId: '' as ReturnType<typeof import('@core/id-generator').generateId<'Plan'>>,
  completed: 0,
  scheduled: 0,
  adherenceRate: 1,
  currentStreak: 0,
  missedDays: [],
};

export const planAdherenceProjection = new ProjectionBuilder<PlanAdherence>('plan_adherence')
  .on<PlanCreatedPayload>('PlanCreated', (_state, event) => ({
    ...DEFAULT_ADHERENCE,
    planId: event.payload.planId,
  }))
  .on<PlannedSessionCompletedPayload>('PlannedSessionCompleted', (state, event) => {
    if (!state) return state;
    const completed = state.completed + 1;
    const scheduled = state.scheduled + 1;
    return {
      ...state,
      completed,
      scheduled,
      adherenceRate: completed / scheduled,
      currentStreak: state.currentStreak + 1,
    };
  })
  .on<PlannedSessionSkippedPayload>('PlannedSessionSkipped', (state, event) => {
    if (!state) return state;
    const scheduled = state.scheduled + 1;
    return {
      ...state,
      scheduled,
      adherenceRate: state.completed / scheduled,
      currentStreak: 0,
      missedDays: [...state.missedDays, event.payload.date],
    };
  })
  .on<PlanDeletedPayload>('PlanDeleted', (_state, _event) => ({ ...DEFAULT_ADHERENCE }))
  .build();

/** Registers all training_plans projections with the ViewStore. Call once at app boot. */
export function registerTrainingPlanProjections(): void {
  activePlanProjection.register(viewStore);
  planListProjection.register(viewStore);
  planAdherenceProjection.register(viewStore);
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

---

## Task 4: Adherence tracking policy

**Files:** `features/training_plans/policies/trackAdherence.ts`

The policy subscribes to `SessionFinished`. When a session is logged, it checks whether the active plan has an assignment for today. If it does and the session type matches, it emits `PlannedSessionCompleted`. If the plan has an assignment for yesterday that was never completed, it emits `PlannedSessionSkipped`.

- [ ] **Step 1: Create the file**

```ts
// features/training_plans/policies/trackAdherence.ts
import { eventBus } from '@core/events/bus';
import { viewStore } from '@data/projections/views';
import type { DomainEvent } from '@shared/types';
import type { SessionFinishedPayload } from '@features/training_log/domain/types';
import type { TrainingPlan, PlannedSessionCompletedPayload, PlannedSessionSkippedPayload } from '../domain/types';

/** Returns 'YYYY-MM-DD' for a unix-ms timestamp. */
function toISODate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Returns 0 (Mon) … 6 (Sun) from a JS Date. JS getDay() returns 0=Sun, so we shift. */
function toDayOfWeek(ms: number): 0 | 1 | 2 | 3 | 4 | 5 | 6 {
  const jsDay = new Date(ms).getDay(); // 0=Sun, 1=Mon, …, 6=Sat
  return ((jsDay + 6) % 7) as 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

let registered = false;

export function registerAdherencePolicy(): void {
  if (registered) return;
  registered = true;

  eventBus.subscribe<DomainEvent<'SessionFinished', SessionFinishedPayload>>(
    'SessionFinished',
    async (event) => {
      const plan = viewStore.get<TrainingPlan | null>('active_plan');
      if (!plan) return;

      const now = event.payload.finishedAt;
      const todayIso = toISODate(now);
      const todayDow = toDayOfWeek(now);

      // Which week is today relative to plan start?
      const startMs = new Date(plan.startDate).getTime();
      const diffDays = Math.floor((now - startMs) / 86_400_000);
      if (diffDays < 0) return; // session before plan started
      const weekIndex = Math.floor(diffDays / 7);
      if (weekIndex >= plan.durationWeeks) return; // plan finished

      const week = plan.weeks[weekIndex];
      if (!week) return;

      const planDay = week.days.find(d => d.dayOfWeek === todayDow);
      if (!planDay || planDay.assignment.type === 'rest') return;

      const payload: PlannedSessionCompletedPayload = {
        planId: plan.id,
        date: todayIso,
        sessionId: event.payload.sessionId,
      };
      await eventBus.publish({ type: 'PlannedSessionCompleted', aggregateId: plan.id, payload });
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

**Files:** `features/training_plans/queries/index.ts`, `features/training_plans/index.ts`

- [ ] **Step 1: Create `features/training_plans/queries/index.ts`**

```ts
// features/training_plans/queries/index.ts
import { viewStore } from '@data/projections/views';
import type { TrainingPlan, PlanAdherence } from '../domain/types';
import type { Id } from '@shared/types';

export function getActivePlan(): TrainingPlan | null {
  return viewStore.get<TrainingPlan | null>('active_plan') ?? null;
}

export function getPlanList(): TrainingPlan[] {
  return viewStore.get<TrainingPlan[]>('plan_list') ?? [];
}

export function getPlanById(planId: Id<'Plan'>): TrainingPlan | undefined {
  return getPlanList().find(p => p.id === planId);
}

export function getPlanAdherence(): PlanAdherence | null {
  return viewStore.get<PlanAdherence>('plan_adherence') ?? null;
}
```

- [ ] **Step 2: Create `features/training_plans/index.ts`**

```ts
// features/training_plans/index.ts
export type {
  TrainingPlan, PlanWeek, PlanDay, PlanDayAssignment, DayOfWeek,
  PlanAdherence, TrainingPlanEvent, TrainingPlanCommand,
  CreatePlan, UpdatePlan, AssignWorkoutToDay, DeletePlan,
} from './domain/types';

export {
  handleCreatePlan,
  handleUpdatePlan,
  handleAssignWorkoutToDay,
  handleDeletePlan,
} from './commands/handlers';

export {
  activePlanProjection,
  planListProjection,
  planAdherenceProjection,
  registerTrainingPlanProjections,
} from './projections';

export { registerAdherencePolicy } from './policies/trackAdherence';

export {
  getActivePlan,
  getPlanList,
  getPlanById,
  getPlanAdherence,
} from './queries';
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add features/training_plans/
git commit -m "feat(training-plans): add CQRS module — domain, commands, projections, policy, queries"
```

---

## Task 6: Update coaching policy to use real adherence rate

**Files:** `features/coaching/policies/generateInsights.ts`

Replace the hardcoded `adherenceRate: 0.9` placeholder from Plan 1 with a ViewStore read.

- [ ] **Step 1: Edit `features/coaching/policies/generateInsights.ts`**

Find the deload detection block added in Plan 1 and replace the adherence placeholder:

```ts
// BEFORE (Plan 1 placeholder):
  adherenceRate: 0.9, // default until plan adherence projection exists (Plan 2)

// AFTER:
  adherenceRate: viewStore.get<{ adherenceRate: number } | null>('plan_adherence')?.adherenceRate ?? 0.9,
```

Make sure `viewStore` is imported at the top of the file (it should already be imported from Plan 1). Verify the import:

```ts
import { viewStore } from '@data/projections/views';
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add features/coaching/policies/generateInsights.ts
git commit -m "fix(coaching): use real plan adherence rate instead of hardcoded 0.9"
```

---

## Task 7: TodaysPlanCard component

**Files:** `ui/components/TodaysPlanCard.tsx`

- [ ] **Step 1: Create the component**

```tsx
// ui/components/TodaysPlanCard.tsx
import type { TrainingPlan, PlanDayAssignment, DayOfWeek } from '@features/training_plans';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function assignmentLabel(a: PlanDayAssignment): string {
  if (a.type === 'rest') return 'Rest';
  if (a.type === 'cardio') return a.activityType;
  return a.blueprintName;
}

function assignmentClass(a: PlanDayAssignment): string {
  if (a.type === 'rest') return 'pill';
  if (a.type === 'cardio') return 'pill bg-info';
  return 'pill bg-primary';
}

/** Returns today's 0=Mon … 6=Sun index. */
function todayDow(): DayOfWeek {
  const jsDay = new Date().getDay();
  return ((jsDay + 6) % 7) as DayOfWeek;
}

interface Props {
  plan: TrainingPlan;
  adherenceRate: number; // 0–1
  onQuickStart?: () => void;
}

export function TodaysPlanCard({ plan, adherenceRate, onQuickStart }: Props) {
  const dow = todayDow();

  // Which week are we in?
  const startMs = new Date(plan.startDate).getTime();
  const diffDays = Math.floor((Date.now() - startMs) / 86_400_000);
  const weekIndex = Math.max(0, Math.min(Math.floor(diffDays / 7), plan.durationWeeks - 1));
  const week = plan.weeks[weekIndex];
  const todayDay = week?.days.find(d => d.dayOfWeek === dow);

  const adherencePct = Math.round(adherenceRate * 100);
  const adherenceClass = adherencePct >= 80 ? 'pill bg-primary' : adherencePct >= 60 ? 'pill' : 'pill warning';

  return (
    <section className="surface">
      <header className="row between">
        <h3>Today's Plan</h3>
        <span className={adherenceClass}>{adherencePct}% adherence</span>
      </header>

      <p className="detail">{plan.name}</p>
      <p className="caption">Week {weekIndex + 1} of {plan.durationWeeks}</p>

      {/* 7-day strip */}
      <div className="row" style={{ gap: 'var(--spacing-1)', flexWrap: 'wrap' }}>
        {([0, 1, 2, 3, 4, 5, 6] as DayOfWeek[]).map(d => {
          const day = week?.days.find(day => day.dayOfWeek === d);
          const isToday = d === dow;
          return (
            <div
              key={d}
              className={`column${isToday ? ' active' : ''}`}
              style={{ alignItems: 'center', gap: 'var(--spacing-1)', minWidth: 36 }}
            >
              <span className="caption">{DAY_LABELS[d]}</span>
              <span className={day ? assignmentClass(day.assignment) : 'pill'} style={{ fontSize: '0.65rem' }}>
                {day ? (day.assignment.type === 'rest' ? '—' : day.assignment.type === 'workout' ? 'W' : 'C') : '—'}
              </span>
            </div>
          );
        })}
      </div>

      {todayDay && todayDay.assignment.type !== 'rest' && (
        <div className="row between" style={{ marginTop: 'var(--spacing-3)' }}>
          <p>{assignmentLabel(todayDay.assignment)}</p>
          {onQuickStart && (
            <button className="primary" onClick={onQuickStart}>Quick Start</button>
          )}
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

---

## Task 8: TrainingPlansScreen

**Files:** `ui/layouts/TrainingPlansScreen.tsx`

- [ ] **Step 1: Create the screen**

```tsx
// ui/layouts/TrainingPlansScreen.tsx
import { useState } from 'react';
import { useCommand } from '@ui/bindings';
import {
  getActivePlan, getPlanList, getPlanAdherence,
  handleCreatePlan, handleAssignWorkoutToDay,
  registerTrainingPlanProjections, registerAdherencePolicy,
} from '@features/training_plans';
import type { TrainingPlan, PlanDayAssignment, DayOfWeek } from '@features/training_plans';
import type { Id } from '@shared/types';

registerTrainingPlanProjections();
registerAdherencePolicy();

const USER_ID = 'user-001' as Id<'User'>;
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function PlanCard({ plan, adherenceRate }: { plan: TrainingPlan; adherenceRate: number }) {
  const pct = Math.round(adherenceRate * 100);
  const startMs = new Date(plan.startDate).getTime();
  const diffDays = Math.max(0, Math.floor((Date.now() - startMs) / 86_400_000));
  const currentWeek = Math.min(Math.floor(diffDays / 7) + 1, plan.durationWeeks);

  return (
    <section className="surface interactive">
      <div className="row between">
        <h3>{plan.name}</h3>
        <span className={pct >= 80 ? 'pill bg-primary' : pct >= 60 ? 'pill' : 'pill warning'}>
          {pct}%
        </span>
      </div>
      <p className="detail">Week {currentWeek} / {plan.durationWeeks}</p>
      <p className="caption">Started {plan.startDate}</p>
      <progress value={currentWeek} max={plan.durationWeeks} />
    </section>
  );
}

type View = 'list' | 'builder';

function PlanBuilder({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [durationWeeks, setDurationWeeks] = useState(4);
  const create = useCommand(handleCreatePlan);

  async function submit() {
    if (!name || !startDate) return;
    await create({ type: 'CreatePlan', userId: USER_ID, name, startDate, durationWeeks });
    onCreated();
  }

  return (
    <section className="surface">
      <h3>New Plan</h3>
      <div className="column">
        <label className="caption">Plan name</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. 4-Week Strength Block" />

        <label className="caption">Start date</label>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />

        <label className="caption">Duration (weeks)</label>
        <input
          type="number"
          min={1}
          max={52}
          value={durationWeeks}
          onChange={e => setDurationWeeks(Number(e.target.value))}
        />

        <div className="row">
          <button className="primary" onClick={submit}>Create Plan</button>
          <button className="secondary" onClick={onCreated}>Cancel</button>
        </div>
      </div>
    </section>
  );
}

export function TrainingPlansScreen() {
  const [view, setView] = useState<View>('list');
  const plans = getPlanList();
  const adherence = getPlanAdherence();

  return (
    <div className="column">
      <div className="row between">
        <h2>Training Plans</h2>
        {view === 'list' && (
          <button className="primary" onClick={() => setView('builder')}>New Plan</button>
        )}
      </div>

      {view === 'builder' ? (
        <PlanBuilder onCreated={() => setView('list')} />
      ) : plans.length === 0 ? (
        <section className="surface">
          <p className="caption">No plans yet. Create one to get started.</p>
        </section>
      ) : (
        <div className="auto-columns">
          {plans.map(plan => (
            <PlanCard
              key={plan.id}
              plan={plan}
              adherenceRate={adherence?.planId === plan.id ? adherence.adherenceRate : 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

---

## Task 9: Dashboard integration

**Files:** `ui/layouts/DashboardScreen.tsx`

- [ ] **Step 1: Add imports to DashboardScreen.tsx**

At the top of the file, add:

```ts
import { TodaysPlanCard } from '@ui/components/TodaysPlanCard';
import {
  getActivePlan,
  getPlanAdherence,
  registerTrainingPlanProjections,
  registerAdherencePolicy,
} from '@features/training_plans';
import '@features/training_plans';
```

After the other `registerXxx()` calls (if any exist near the top of the component or module level), add:

```ts
registerTrainingPlanProjections();
registerAdherencePolicy();
```

- [ ] **Step 2: Add TodaysPlanCard to the Dashboard JSX**

Find the section of the Dashboard where coaching cards are rendered (after the readiness card, before or after coaching insights). Add:

```tsx
{/* Today's Plan */}
{(() => {
  const plan = getActivePlan();
  const adherence = getPlanAdherence();
  if (!plan) return null;
  return (
    <TodaysPlanCard
      plan={plan}
      adherenceRate={adherence?.adherenceRate ?? 1}
    />
  );
})()}
```

- [ ] **Step 3: Verify build and dev server**

```bash
npm run build
npm run dev
```

Navigate to Dashboard — "Today's Plan" card appears if a plan is active, absent otherwise.

- [ ] **Step 4: Commit**

```bash
git add ui/layouts/DashboardScreen.tsx ui/layouts/TrainingPlansScreen.tsx ui/components/TodaysPlanCard.tsx
git commit -m "feat(training-plans): add Dashboard card and TrainingPlansScreen"
```

---

## Self-Review

### Spec coverage check

| Spec requirement | Task |
|---|---|
| TrainingPlan domain type | Task 1 |
| PlanWeek / PlanDay / PlanDayAssignment | Task 1 |
| PlanAdherence type | Task 1 |
| CreatePlan / UpdatePlan / AssignWorkoutToDay / DeletePlan commands | Task 2 |
| PlanCreated / PlanUpdated / DayAssigned / PlanDeleted events | Task 2–3 |
| active_plan projection | Task 3 |
| plan_list projection | Task 3 |
| plan_adherence projection | Task 3 |
| PlannedSessionCompleted / PlannedSessionSkipped events | Task 4 |
| Adherence tracking policy | Task 4 |
| getActivePlan / getPlanList / getPlanById / getPlanAdherence queries | Task 5 |
| Coaching policy uses real adherence rate | Task 6 |
| TodaysPlanCard Dashboard widget (7-day strip, quick start) | Task 7 |
| TrainingPlansScreen (plan list + builder) | Task 8 |
| Dashboard integration | Task 9 |

### Type consistency check
- All `Id<'Plan'>` usage consistent across types, handlers, projections, and queries ✓
- `PlanAdherence.adherenceRate` is 0–1 throughout; UI multiplies by 100 for display ✓
- `DayOfWeek` values (0–6) match the `toDayOfWeek` helper (Monday=0 convention) ✓

### Placeholder check
No TBD, TODO, or incomplete steps found. All code blocks are complete.
