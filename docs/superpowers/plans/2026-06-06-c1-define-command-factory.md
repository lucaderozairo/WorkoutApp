# C1: defineCommand Factory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a `defineCommand(definition)` factory that returns a typed async handler `(cmd: TCmd) => Promise<TResult>`. The factory's single execute step calls `eventRepository.commit()` — the persistence path cannot be bypassed by accident. Handlers become pure `execute` functions that describe what events to emit; the factory handles committing them.

**Architecture:** The factory lives in `data/define-command.ts` (it depends on `data/event-repository`). It accepts a definition object with one method: `execute(cmd): Promise<{ events, result? }>`. The returned handler calls execute, commits all returned events in one `commit()` call, then returns the result. For testing, call `definition.execute(cmd)` directly — no infrastructure needed. All 20 existing command handler files migrate to this pattern; the `import { eventRepository }` in each is replaced with `import { defineCommand }`.

**Tech Stack:** TypeScript, Vitest. Path alias: `@data` → `data/`.

---

## File map

| Create | `data/define-command.ts` |
| Create | `data/define-command.test.ts` |
| Modify | `features/habits/commands/handlers.ts` (pilot) |
| Modify | `features/goals/commands/handlers.ts` |
| Modify | `features/training_plans/commands/handlers.ts` |
| Modify | `features/training_log/commands/handlers.ts` |
| Modify | `features/cardio/commands/handlers.ts` |
| Modify | `features/profile/commands/handlers.ts` |
| Modify | `features/profile/commands/bodyHandlers.ts` |
| Modify | `features/conditions/commands/handlers.ts` |
| Modify | `features/health/commands/handlers.ts` |
| Modify | `features/planning/commands/handlers.ts` |
| Modify | `features/news_feed/commands/handlers.ts` |
| Modify | `features/scheduling/commands/handlers.ts` |
| Modify | `features/insights/commands/handlers.ts` |
| Modify | `features/achievements/commands/handlers.ts` |
| Modify | `features/coaching/commands/handlers.ts` |
| Modify | `features/nutrition/commands/handlers.ts` |
| Modify | `features/progress_analysis/commands/handlers.ts` |
| Modify | `features/readiness/commands/handlers.ts` |
| Modify | `features/social/commands/handlers.ts` |
| Modify | `features/stretching/commands/handlers.ts` |

---

### Task 1: Create defineCommand factory with tests

**Files:**
- Create: `data/define-command.ts`
- Create: `data/define-command.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// data/define-command.test.ts
import { describe, it, expect, vi } from 'vitest';
import type { DomainEvent, Id } from '@shared/types';
import type { EventStore, EventBus } from './event-repository';
import { EventRepository } from './event-repository';
import { defineCommand } from './define-command';

function makeStore(): EventStore & { calls: DomainEvent[] } {
  const calls: DomainEvent[] = [];
  return { calls, append: async (e) => { calls.push(e); } };
}

function makeBus(): EventBus & { published: DomainEvent[] } {
  const published: DomainEvent[] = [];
  return { published, publish: async (e) => { published.push(e); } };
}

function makeRepo() {
  const store = makeStore();
  const bus = makeBus();
  return { repo: new EventRepository(store, bus), store, bus };
}

function makeEvent(type: string): DomainEvent {
  return { type, aggregateId: 'agg' as Id, aggregateType: 'T', timestamp: 1, version: 1, payload: null };
}

describe('defineCommand', () => {
  it('calls execute with the command', async () => {
    const executeSpy = vi.fn().mockResolvedValue({ events: [] });
    const { repo } = makeRepo();
    const handler = defineCommand({ execute: executeSpy }, repo);
    await handler({ type: 'DoThing' });
    expect(executeSpy).toHaveBeenCalledWith({ type: 'DoThing' });
  });

  it('persists events returned by execute', async () => {
    const { repo, store } = makeRepo();
    const event = makeEvent('ThingDone');
    const handler = defineCommand({ execute: async () => ({ events: [event] }) }, repo);
    await handler({});
    expect(store.calls).toEqual([event]);
  });

  it('publishes events to the bus after persisting', async () => {
    const { repo, bus } = makeRepo();
    const event = makeEvent('ThingDone');
    const handler = defineCommand({ execute: async () => ({ events: [event] }) }, repo);
    await handler({});
    expect(bus.published).toEqual([event]);
  });

  it('returns the result from execute', async () => {
    const { repo } = makeRepo();
    const handler = defineCommand(
      { execute: async () => ({ events: [], result: 'abc-id' }) },
      repo,
    );
    const result = await handler({});
    expect(result).toBe('abc-id');
  });

  it('returns undefined when execute omits result', async () => {
    const { repo } = makeRepo();
    const handler = defineCommand({ execute: async () => ({ events: [] }) }, repo);
    const result = await handler({});
    expect(result).toBeUndefined();
  });

  it('does not call commit when execute returns no events', async () => {
    const { repo } = makeRepo();
    const commitSpy = vi.spyOn(repo, 'commit');
    const handler = defineCommand({ execute: async () => ({ events: [] }) }, repo);
    await handler({});
    expect(commitSpy).toHaveBeenCalledWith([]);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

Run: `npx vitest run data/define-command.test.ts`
Expected: FAIL — `Cannot find module './define-command'`

- [ ] **Step 3: Implement the factory**

```typescript
// data/define-command.ts
import type { DomainEvent } from '@shared/types';
import { EventRepository, eventRepository as defaultRepo } from './event-repository';

export interface CommandDefinition<TCmd, TResult = void> {
  execute(cmd: TCmd): Promise<{ events: DomainEvent[]; result?: TResult }>;
}

/**
 * Returns a typed async handler `(cmd: TCmd) => Promise<TResult>`.
 *
 * The handler calls `definition.execute(cmd)`, commits all returned events via
 * `eventRepository.commit()`, then returns the result. The second `repo`
 * parameter is only used in tests — production code uses the singleton.
 */
export function defineCommand<TCmd, TResult = void>(
  definition: CommandDefinition<TCmd, TResult>,
  repo: EventRepository = defaultRepo,
): (cmd: TCmd) => Promise<TResult> {
  return async (cmd) => {
    const { events, result } = await definition.execute(cmd);
    await repo.commit(events);
    return result as TResult;
  };
}
```

- [ ] **Step 4: Run tests to confirm they pass**

Run: `npx vitest run data/define-command.test.ts`
Expected: 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add data/define-command.ts data/define-command.test.ts
git commit -m "feat(data): add defineCommand factory — typed handler with guaranteed commit"
```

---

### Task 2: Migrate habits handlers (pilot)

Validate the pattern end-to-end on the smallest full-featured handler file before migrating the rest.

**Files:**
- Modify: `features/habits/commands/handlers.ts`

**Migration pattern — before/after:**

```typescript
// BEFORE:
import { eventRepository } from '@data/event-repository';

export async function handleCreateHabit(cmd: CreateHabit): Promise<Id<'Habit'>> {
  const habitId = generateId<'Habit'>();
  const payload = { ... };
  await eventRepository.commit([{ type: 'HabitCreated', ... payload }]);
  return habitId;
}

// AFTER:
import { defineCommand } from '@data/define-command';

export const handleCreateHabit = defineCommand<CreateHabit, Id<'Habit'>>({
  execute: async (cmd) => {
    const habitId = generateId<'Habit'>();
    const payload = { ... };
    return {
      result: habitId,
      events: [{ type: 'HabitCreated', ... payload }],
    };
  },
});
```

For **void-returning** handlers (no `result`):
```typescript
export const handleDeleteHabit = defineCommand<DeleteHabit>({
  execute: async (cmd) => {
    return {
      events: [{ type: 'HabitDeleted', aggregateId: cmd.habitId, ... }],
    };
  },
});
```

For handlers that **conditionally emit multiple events** (like `handleLogHabitCompletion` which may emit `HabitStreakBroken` before `HabitCompleted`): collect into an array and return all at once.

```typescript
export const handleLogHabitCompletion = defineCommand<LogHabitCompletion>({
  execute: async (cmd) => {
    const habits = viewStore.get('habits_today') ?? [];
    const habit = habits.find(h => h.id === cmd.habitId);
    if (!habit || habit.completedToday) return { events: [] };

    const events: DomainEvent[] = [];
    if (!isConsecutive && habit.streak > 0 && habit.lastCompletedDate) {
      events.push({ type: 'HabitStreakBroken', ... });
    }
    events.push({ type: 'HabitCompleted', ... });
    return { events };
  },
});
```

- [ ] **Step 1: Rewrite handlers.ts using the pattern above**

Replace all 4 functions. The logic inside each `execute` body is identical to the current function body, except:
- Remove the `await eventRepository.commit([...])` call
- Collect events into an array and `return { events, result? }` instead

- [ ] **Step 2: Run habits tests**

Run: `npx vitest run features/habits`
Expected: all tests PASS

- [ ] **Step 3: Run full test suite**

Run: `npx vitest run`
Expected: no regressions

- [ ] **Step 4: Commit**

```bash
git add features/habits/commands/handlers.ts
git commit -m "refactor(habits): migrate command handlers to defineCommand factory"
```

---

### Task 3: Migrate goals and training_plans handlers

**Files:**
- Modify: `features/goals/commands/handlers.ts`
- Modify: `features/training_plans/commands/handlers.ts`

These two files use a local helper to build events. Keep the helper, change how it's called:

```typescript
// goals/commands/handlers.ts — helper stays, just return events instead of committing:
function buildGoalEvent<TPayload extends object>(
  type: string, aggregateId: Id, payload: TPayload
): DomainEvent {
  return { type, aggregateId, aggregateType: 'Goal', timestamp: systemClock.now(), version: 1, payload };
}

export const handleCreateGoal = defineCommand<CreateGoal, Id<'Goal'>>({
  execute: async (cmd) => {
    const goalId = generateId<'Goal'>();
    const payload: GoalCreatedPayload = { goalId, userId: cmd.userId, name: cmd.name, ... };
    return { result: goalId, events: [buildGoalEvent('GoalCreated', goalId, payload)] };
  },
});

export const handleUpdateGoalProgress = defineCommand<UpdateGoalProgress>({
  execute: async (cmd) => {
    const goals = viewStore.get('active_goals') ?? [];
    const goal = goals.find(g => g.id === cmd.goalId);
    if (!goal) return { events: [] };
    const newProgress = Math.min(goal.progress + cmd.delta, goal.target);
    const payload: GoalProgressUpdatedPayload = { goalId: cmd.goalId, newProgress };
    return { events: [buildGoalEvent('GoalProgressUpdated', cmd.goalId, payload)] };
  },
});

export const handleCompleteGoal = defineCommand<CompleteGoal>({
  execute: async (cmd) => {
    const payload: GoalCompletedPayload = { goalId: cmd.goalId, completedAt: systemClock.now() };
    return { events: [buildGoalEvent('GoalCompleted', cmd.goalId, payload)] };
  },
});

export const handleDeleteGoal = defineCommand<DeleteGoal>({
  execute: async (cmd) => {
    const payload: GoalDeletedPayload = { goalId: cmd.goalId };
    return { events: [buildGoalEvent('GoalDeleted', cmd.goalId, payload)] };
  },
});
```

- [ ] **Step 1: Migrate goals handlers** (follow the pattern above)
- [ ] **Step 2: Migrate training_plans handlers** (same pattern — 4 functions, no helpers)
- [ ] **Step 3: Run tests**

Run: `npx vitest run features/goals features/training_plans`
Expected: all tests PASS

- [ ] **Step 4: Commit**

```bash
git add features/goals/commands/handlers.ts features/training_plans/commands/handlers.ts
git commit -m "refactor(goals,training-plans): migrate command handlers to defineCommand factory"
```

---

### Task 4: Migrate training_log handlers

`training_log/commands/handlers.ts` is the largest and most complex file — it has ~15 handlers, calls `applyAll()` / `applyAndStore()` AFTER committing, and has one handler (`handleUpdateCardioSessionFull`) that bypasses events entirely.

**Files:**
- Modify: `features/training_log/commands/handlers.ts`

**Special cases to handle:**

1. **Handlers that call `applyAll(events)` or `applyAndStore(events)` after commit.** These projection calls must stay AFTER `eventRepository.commit()`. With defineCommand, the commit happens inside the factory. The projection calls need to move back into the handler or be done via a subscription. The cleanest solution: call them via the existing event bus subscription mechanism (if the projections already subscribe to these events), or call them explicitly after `await handleX(cmd)` at the call site.

   Check whether `applyAll` and `applyAndStore` are already wired as event bus subscriptions. If yes, remove them from handlers entirely — the bus will call them. If no, keep them as explicit calls AFTER the handler:

   ```typescript
   // In the calling UI binding or command dispatcher:
   await handleFinishSession(cmd);
   applyAll(events); // NOT inside the handler — after the handler returns
   ```

   Read the current handler file carefully before migrating. The simplest safe approach: keep `applyAll` / `applyAndStore` inside the `execute` body BEFORE the return (they read from viewStore/bus, not from the commit call, so ordering is fine).

   ```typescript
   export const handleFinishSession = defineCommand<FinishSession>({
     execute: async (cmd) => {
       const events = [ /* build events */ ];
       applyAll(events);   // projection update: happens before commit in execute
       return { events };
       // factory then calls commit(events) — persists and publishes
     },
   });
   ```

   Wait — this means the projection update happens before persistence. The current code calls `commit` then `applyAll`. If you need the same order: call applyAll AFTER the handler returns (at the call site). Pick the approach that matches the existing ordering.

   **Correct ordering:** Read the current handlers.ts to confirm. The plan's guidance: if the file currently does `await commit(events); applyAll(events);`, then in the migrated version do `applyAll` at the call site after `await handleX(cmd)`, not inside `execute`.

2. **`handleUpdateCardioSessionFull`**: this handler mutates viewStore directly without events. Leave it as `async function handleUpdateCardioSessionFull(...)` unchanged — do not convert it to `defineCommand`. It is a known tech debt item.

- [ ] **Step 1: Read `features/training_log/commands/handlers.ts` in full before editing**
- [ ] **Step 2: Migrate all handlers except `handleUpdateCardioSessionFull`** (follow the pattern; handle applyAll ordering per the notes above)
- [ ] **Step 3: Leave `handleUpdateCardioSessionFull` as an `async function`** — it does not use events and cannot be migrated without a larger refactor
- [ ] **Step 4: Run training_log tests**

Run: `npx vitest run features/training_log`
Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add features/training_log/commands/handlers.ts
git commit -m "refactor(training-log): migrate command handlers to defineCommand factory"
```

---

### Task 5: Migrate cardio, profile, and profile/bodyHandlers

**Files:**
- Modify: `features/cardio/commands/handlers.ts`
- Modify: `features/profile/commands/handlers.ts`
- Modify: `features/profile/commands/bodyHandlers.ts`

**Special case — cardio:** `handleUpdateCardioSessionFull` (like training_log) mutates viewStore directly. Leave it as `async function`. Migrate all other cardio handlers.

**Special case — profile:** `handleLogBodyweight` calls both event commit AND a direct viewStore/projection update. Apply the same ordering principle from Task 4 — migration is straightforward, move viewStore direct writes into the execute body or keep them after the handler at the call site.

- [ ] **Step 1: Migrate cardio handlers** (all except `handleUpdateCardioSessionFull`)
- [ ] **Step 2: Migrate profile/handlers.ts**
- [ ] **Step 3: Migrate profile/bodyHandlers.ts**
- [ ] **Step 4: Run tests**

Run: `npx vitest run features/cardio features/profile`
Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add features/cardio/commands/handlers.ts features/profile/commands/handlers.ts features/profile/commands/bodyHandlers.ts
git commit -m "refactor(cardio,profile): migrate command handlers to defineCommand factory"
```

---

### Task 6: Migrate remaining 11 handler files

**Files** (all follow the standard pattern — no special cases):
- `features/conditions/commands/handlers.ts`
- `features/health/commands/handlers.ts`
- `features/planning/commands/handlers.ts`
- `features/news_feed/commands/handlers.ts`
- `features/scheduling/commands/handlers.ts`
- `features/insights/commands/handlers.ts`
- `features/achievements/commands/handlers.ts`
- `features/coaching/commands/handlers.ts`
- `features/nutrition/commands/handlers.ts`
- `features/progress_analysis/commands/handlers.ts`
- `features/readiness/commands/handlers.ts`
- `features/social/commands/handlers.ts`
- `features/stretching/commands/handlers.ts`

For each file:
1. Replace `import { eventRepository } from '@data/event-repository'` with `import { defineCommand } from '@data/define-command'`
2. Convert each `export async function handleX(cmd: XCmd): Promise<TResult>` to `export const handleX = defineCommand<XCmd, TResult>({ execute: async (cmd) => { ... return { events, result? }; } })`
3. The execute body is the same logic minus the `await eventRepository.commit([...])` call — instead collect events and return them

- [ ] **Step 1: Migrate all 13 files** (group them into batches of 3-4 and run `npx tsc --noEmit` after each batch)
- [ ] **Step 2: Run full test suite**

Run: `npx vitest run`
Expected: all tests PASS

- [ ] **Step 3: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add features/conditions/ features/health/ features/planning/ features/news_feed/ features/scheduling/ features/insights/ features/achievements/ features/coaching/ features/nutrition/ features/progress_analysis/ features/readiness/ features/social/ features/stretching/
git commit -m "refactor(features): migrate remaining command handlers to defineCommand factory"
```
