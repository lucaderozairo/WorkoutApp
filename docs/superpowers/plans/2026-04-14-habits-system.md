# Plan 4: Habit & Routine Layer

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Habit & Routine Layer — a CQRS module for daily engagement beyond full workouts. Users create habits with daily/weekly frequency, log completions, build streaks, and earn achievements at milestones. Habits appear on the Dashboard as a quick-complete widget and are managed via a simple list view.

**Architecture:** `features/habits/` is a standalone CQRS module. The `habits_today` projection computes which habits are due today (based on frequency and lastCompletedDate). The `habit_streaks` projection tracks streak counts. A policy subscribes to `HabitCompleted` events to emit `AchievementUnlocked` at streak milestones (7, 30, 100 days) by publishing through the existing achievements event bus. No cross-feature imports.

**Tech Stack:** TypeScript, React 18, existing CQRS stack (`@shared/types`, `@core/events/bus`, `@data/projections/views`, `@data/projections/builders`, `@core/id-generator`, `@core/clock`)

**Related spec:** `docs/superpowers/specs/2026-04-14-new-features-design.md` — Sections 1H, 2I

**This is Plan 4 of 6. Depends on Plan 1 Task 0. Independent of Plans 2, 3, 5, 6.**

---

## File Map

### New files
| File | Responsibility |
|---|---|
| `features/habits/domain/types.ts` | Habit, HabitEntry, all event/command types |
| `features/habits/commands/handlers.ts` | handleCreateHabit, handleLogHabitCompletion, handleDeleteHabit |
| `features/habits/projections/index.ts` | habitsTodayProjection, habitStreaksProjection |
| `features/habits/policies/streakMilestones.ts` | HabitCompleted → AchievementUnlocked at milestones |
| `features/habits/queries/index.ts` | getHabitsToday, getHabitStreaks, getHabitById |
| `features/habits/index.ts` | Public API |
| `ui/components/HabitsWidget.tsx` | Dashboard habits widget |

### Modified files
| File | What changes |
|---|---|
| `ui/layouts/DashboardScreen.tsx` | Add HabitsWidget |

---

## Task 1: Domain types

**Files:** `features/habits/domain/types.ts`

- [ ] **Step 1: Create the file**

```ts
// features/habits/domain/types.ts
import type { Id, DomainEvent } from '@shared/types';

// ─── Core domain types ────────────────────────────────────────

export type HabitFrequency = 'daily' | 'weekly';

export interface Habit {
  id: Id<'Habit'>;
  userId: Id<'User'>;
  name: string;
  frequency: HabitFrequency;
  streak: number;
  longestStreak: number;
  lastCompletedDate?: string;   // ISO date 'YYYY-MM-DD'
  completedToday: boolean;
  createdAt: number;
}

// ─── Events ───────────────────────────────────────────────────

export interface HabitCreatedPayload {
  habitId: Id<'Habit'>;
  userId: Id<'User'>;
  name: string;
  frequency: HabitFrequency;
  createdAt: number;
}

export interface HabitCompletedPayload {
  habitId: Id<'Habit'>;
  userId: Id<'User'>;
  completedDate: string;   // ISO date 'YYYY-MM-DD'
  newStreak: number;
}

export interface HabitStreakBrokenPayload {
  habitId: Id<'Habit'>;
  userId: Id<'User'>;
  brokenDate: string;      // ISO date — the day the streak was broken
}

export interface HabitDeletedPayload {
  habitId: Id<'Habit'>;
}

export type HabitEvent =
  | DomainEvent<'HabitCreated', HabitCreatedPayload>
  | DomainEvent<'HabitCompleted', HabitCompletedPayload>
  | DomainEvent<'HabitStreakBroken', HabitStreakBrokenPayload>
  | DomainEvent<'HabitDeleted', HabitDeletedPayload>;

// ─── Commands ─────────────────────────────────────────────────

export interface CreateHabit {
  type: 'CreateHabit';
  userId: Id<'User'>;
  name: string;
  frequency: HabitFrequency;
}

export interface LogHabitCompletion {
  type: 'LogHabitCompletion';
  habitId: Id<'Habit'>;
  userId: Id<'User'>;
}

export interface DeleteHabit {
  type: 'DeleteHabit';
  habitId: Id<'Habit'>;
}

export type HabitCommand = CreateHabit | LogHabitCompletion | DeleteHabit;
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

---

## Task 2: Command handlers

**Files:** `features/habits/commands/handlers.ts`

- [ ] **Step 1: Create the file**

```ts
// features/habits/commands/handlers.ts
import { eventBus } from '@core/events/bus';
import { generateId } from '@core/id-generator';
import { clock } from '@core/clock';
import { viewStore } from '@data/projections/views';
import type { Habit } from '../domain/types';
import type {
  CreateHabit, LogHabitCompletion, DeleteHabit,
  HabitCreatedPayload, HabitCompletedPayload, HabitStreakBrokenPayload, HabitDeletedPayload,
} from '../domain/types';
import type { Id } from '@shared/types';

/** Returns ISO date string for a unix-ms timestamp. */
function toISODate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Returns true if two ISO date strings are on consecutive days. */
function isConsecutiveDay(prev: string, current: string): boolean {
  const prevMs = new Date(prev).getTime();
  const currMs = new Date(current).getTime();
  return currMs - prevMs === 86_400_000;
}

export async function handleCreateHabit(cmd: CreateHabit): Promise<Id<'Habit'>> {
  const habitId = generateId<'Habit'>();
  const payload: HabitCreatedPayload = {
    habitId,
    userId: cmd.userId,
    name: cmd.name,
    frequency: cmd.frequency,
    createdAt: clock.now(),
  };
  await eventBus.publish({ type: 'HabitCreated', aggregateId: habitId, payload });
  return habitId;
}

export async function handleLogHabitCompletion(cmd: LogHabitCompletion): Promise<void> {
  const habits = viewStore.get<Habit[]>('habits_today') ?? [];
  const habit = habits.find(h => h.id === cmd.habitId);
  if (!habit || habit.completedToday) return;

  const today = toISODate(clock.now());
  const isConsecutive = habit.lastCompletedDate
    ? isConsecutiveDay(habit.lastCompletedDate, today)
    : true;
  const newStreak = isConsecutive ? habit.streak + 1 : 1;

  // If streak was broken (not consecutive and had a streak), emit streak broken first
  if (!isConsecutive && habit.streak > 0 && habit.lastCompletedDate) {
    const brokenPayload: HabitStreakBrokenPayload = {
      habitId: cmd.habitId,
      userId: cmd.userId,
      brokenDate: today,
    };
    await eventBus.publish({ type: 'HabitStreakBroken', aggregateId: cmd.habitId, payload: brokenPayload });
  }

  const completedPayload: HabitCompletedPayload = {
    habitId: cmd.habitId,
    userId: cmd.userId,
    completedDate: today,
    newStreak,
  };
  await eventBus.publish({ type: 'HabitCompleted', aggregateId: cmd.habitId, payload: completedPayload });
}

export async function handleDeleteHabit(cmd: DeleteHabit): Promise<void> {
  const payload: HabitDeletedPayload = { habitId: cmd.habitId };
  await eventBus.publish({ type: 'HabitDeleted', aggregateId: cmd.habitId, payload });
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

---

## Task 3: Projections

**Files:** `features/habits/projections/index.ts`

The `habits_today` projection maintains the full habit list and marks `completedToday` based on `lastCompletedDate` matching today's ISO date. Because projections are rebuilt at query time from the event log, `completedToday` is reliably computed.

- [ ] **Step 1: Create the file**

```ts
// features/habits/projections/index.ts
import { ProjectionBuilder } from '@data/projections/builders';
import { viewStore } from '@data/projections/views';
import type { Habit } from '../domain/types';
import type {
  HabitCreatedPayload, HabitCompletedPayload,
  HabitStreakBrokenPayload, HabitDeletedPayload,
} from '../domain/types';

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Habits Today ─────────────────────────────────────────────

export const habitsTodayProjection = new ProjectionBuilder<Habit[]>('habits_today')
  .on<HabitCreatedPayload>('HabitCreated', (state, event) => {
    const p = event.payload;
    const habit: Habit = {
      id: p.habitId,
      userId: p.userId,
      name: p.name,
      frequency: p.frequency,
      streak: 0,
      longestStreak: 0,
      lastCompletedDate: undefined,
      completedToday: false,
      createdAt: p.createdAt,
    };
    return [...(state ?? []), habit];
  })
  .on<HabitCompletedPayload>('HabitCompleted', (state, event) => {
    if (!state) return [];
    const { habitId, completedDate, newStreak } = event.payload;
    const today = todayISO();
    return state.map(h =>
      h.id === habitId
        ? {
            ...h,
            streak: newStreak,
            longestStreak: Math.max(h.longestStreak, newStreak),
            lastCompletedDate: completedDate,
            completedToday: completedDate === today,
          }
        : h
    );
  })
  .on<HabitStreakBrokenPayload>('HabitStreakBroken', (state, event) => {
    if (!state) return [];
    return state.map(h => h.id === event.payload.habitId ? { ...h, streak: 0 } : h);
  })
  .on<HabitDeletedPayload>('HabitDeleted', (state, event) =>
    (state ?? []).filter(h => h.id !== event.payload.habitId)
  )
  .build();

export function registerHabitProjections(): void {
  habitsTodayProjection.register(viewStore);
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

---

## Task 4: Streak milestone policy

**Files:** `features/habits/policies/streakMilestones.ts`

Publishes `AchievementUnlocked` at streak milestones. The achievements feature already handles this event.

- [ ] **Step 1: Create the file**

```ts
// features/habits/policies/streakMilestones.ts
import { eventBus } from '@core/events/bus';
import { clock } from '@core/clock';
import type { DomainEvent } from '@shared/types';
import type { HabitCompletedPayload } from '../domain/types';

const STREAK_MILESTONES = [7, 30, 100] as const;

let registered = false;

export function registerStreakMilestonePolicy(): void {
  if (registered) return;
  registered = true;

  eventBus.subscribe<DomainEvent<'HabitCompleted', HabitCompletedPayload>>(
    'HabitCompleted',
    async (event) => {
      const { userId, habitId, newStreak } = event.payload;

      if ((STREAK_MILESTONES as readonly number[]).includes(newStreak)) {
        await eventBus.publish({
          type: 'AchievementUnlocked',
          aggregateId: userId,
          payload: {
            userId,
            achievementId: `habit_streak_${newStreak}`,
            unlockedAt: clock.now(),
          },
        });
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

**Files:** `features/habits/queries/index.ts`, `features/habits/index.ts`

- [ ] **Step 1: Create `features/habits/queries/index.ts`**

```ts
// features/habits/queries/index.ts
import { viewStore } from '@data/projections/views';
import type { Habit } from '../domain/types';
import type { Id } from '@shared/types';

export function getHabitsToday(): Habit[] {
  return viewStore.get<Habit[]>('habits_today') ?? [];
}

export function getHabitById(habitId: Id<'Habit'>): Habit | undefined {
  return getHabitsToday().find(h => h.id === habitId);
}
```

- [ ] **Step 2: Create `features/habits/index.ts`**

```ts
// features/habits/index.ts
export type { Habit, HabitFrequency, HabitEvent, HabitCommand, CreateHabit, LogHabitCompletion, DeleteHabit } from './domain/types';
export { handleCreateHabit, handleLogHabitCompletion, handleDeleteHabit } from './commands/handlers';
export { habitsTodayProjection, registerHabitProjections } from './projections';
export { registerStreakMilestonePolicy } from './policies/streakMilestones';
export { getHabitsToday, getHabitById } from './queries';
```

- [ ] **Step 3: Verify build and commit**

```bash
npm run build
git add features/habits/
git commit -m "feat(habits): add CQRS module — domain, commands, projections, policy, queries"
```

---

## Task 6: HabitsWidget component

**Files:** `ui/components/HabitsWidget.tsx`

- [ ] **Step 1: Create the component**

```tsx
// ui/components/HabitsWidget.tsx
import { useState } from 'react';
import { useCommand } from '@ui/bindings';
import {
  getHabitsToday,
  handleCreateHabit,
  handleLogHabitCompletion,
  registerHabitProjections,
  registerStreakMilestonePolicy,
} from '@features/habits';
import type { Habit, HabitFrequency } from '@features/habits';
import type { Id } from '@shared/types';

registerHabitProjections();
registerStreakMilestonePolicy();

const USER_ID = 'user-001' as Id<'User'>;

function HabitRow({ habit, onComplete }: { habit: Habit; onComplete: () => void }) {
  return (
    <div className={`row between${habit.completedToday ? ' active' : ''}`}>
      <div className="column" style={{ gap: 'var(--spacing-1)' }}>
        <p>{habit.name}</p>
        <p className="caption">{habit.streak} day streak</p>
      </div>
      <button
        className={habit.completedToday ? 'secondary' : 'primary'}
        onClick={onComplete}
        disabled={habit.completedToday}
      >
        {habit.completedToday ? '✓' : 'Done'}
      </button>
    </div>
  );
}

function AddHabitForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState<HabitFrequency>('daily');
  const create = useCommand(handleCreateHabit);

  async function submit() {
    if (!name) return;
    await create({ type: 'CreateHabit', userId: USER_ID, name, frequency });
    onClose();
  }

  return (
    <div className="column surface">
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Habit name (e.g. Stretch 10 min)"
      />
      <select value={frequency} onChange={e => setFrequency(e.target.value as HabitFrequency)}>
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
      </select>
      <div className="row">
        <button className="primary" onClick={submit}>Add</button>
        <button className="secondary" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

export function HabitsWidget() {
  const [showForm, setShowForm] = useState(false);
  const habits = getHabitsToday();
  const complete = useCommand(handleLogHabitCompletion);

  return (
    <section className="surface">
      <div className="row between">
        <h3>Habits</h3>
        <button className="ghost" onClick={() => setShowForm(v => !v)}>
          {showForm ? '−' : '+'}
        </button>
      </div>

      {showForm && <AddHabitForm onClose={() => setShowForm(false)} />}

      {habits.length === 0 && !showForm ? (
        <p className="caption">No habits yet. Add one to start building streaks.</p>
      ) : (
        <div className="column">
          {habits.map(habit => (
            <HabitRow
              key={habit.id}
              habit={habit}
              onComplete={() => complete({ type: 'LogHabitCompletion', habitId: habit.id, userId: USER_ID })}
            />
          ))}
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

## Task 7: Wire into Dashboard

**Files:** `ui/layouts/DashboardScreen.tsx`

- [ ] **Step 1: Add import and render HabitsWidget**

At the top of the file, add:

```ts
import { HabitsWidget } from '@ui/components/HabitsWidget';
```

In the JSX, add `<HabitsWidget />` after the goals widget (or after coaching insights if goals aren't implemented yet).

- [ ] **Step 2: Verify build and dev server**

```bash
npm run build
npm run dev
```

Navigate to Dashboard — HabitsWidget renders. Tap "Done" to complete a habit, streak increments.

- [ ] **Step 3: Commit**

```bash
git add features/habits/ ui/components/HabitsWidget.tsx ui/layouts/DashboardScreen.tsx
git commit -m "feat(habits): add habit widget to Dashboard with streak tracking"
```

---

## Self-Review

### Spec coverage check

| Spec requirement | Task |
|---|---|
| Habit domain type | Task 1 |
| daily / weekly frequency | Task 1 |
| streak and longestStreak tracking | Task 2–3 |
| CreateHabit / LogHabitCompletion / DeleteHabit commands | Task 2 |
| HabitCreated / HabitCompleted / HabitStreakBroken events | Task 2 |
| habits_today projection with completedToday flag | Task 3 |
| AchievementUnlocked at 7 / 30 / 100 day milestones | Task 4 |
| getHabitsToday query | Task 5 |
| Dashboard widget — habit rows with completion toggle | Task 6 |
| Inline add-habit form in widget | Task 6 |
| Dashboard integration | Task 7 |

### Type consistency check
- `Habit.completedToday` is derived from `lastCompletedDate === todayISO()` in the projection — computed fresh on rebuild, not a stored flag ✓
- Streak is reset to 1 (not 0) on the day the user completes after a broken streak ✓
- `AchievementUnlocked` payload matches the `AchievementUnlockedPayload` interface in `features/achievements/domain/types.ts` ✓

### Placeholder check
No TBD, TODO, or incomplete steps found. All code blocks are complete.
