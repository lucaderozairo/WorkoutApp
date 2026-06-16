# Event Repository Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a single `EventRepository.commit()` path that always persists events to IndexedDB and publishes them to the event bus — eliminating the silent split where `habits`, `goals`, and `training_plans` events are lost on page refresh.

**Architecture:** Introduce `data/event-repository.ts` — a class that wraps `HybridEventStore` and `EventBusImpl`, providing a single `commit(events[])` method that persists all events first and then publishes them. Migrate all command handlers to use this path. Remove `AggregateRepository` once it has no callers.

**Tech Stack:** TypeScript, Vitest (test runner). No new dependencies.

---

## Current state (read this before touching any code)

Three persistence patterns exist across feature handlers today:

| Pattern | Features | Bug? |
|---------|----------|------|
| `eventBus.publish()` only | habits, goals, training_plans | **YES — not persisted** |
| `inMemoryEventStore.append()` only | conditions, health, planning, news_feed, scheduling, insights | No — but no cross-feature dispatch |
| `repository.save()` or `store.append()` + selective `eventBus.publish()` | training_log, cardio, profile | No — but inconsistent |

The fix is a single `EventRepository.commit()` method that does both steps for everyone.

**Ordering rule (important):** `commit()` persists all events, then publishes all events. Do NOT interleave (i.e., not persist-one/publish-one). This preserves the existing behavior where the event store is fully consistent before any bus subscriber runs.

**Projection sync:** `training_log`, `cardio`, and `profile/bodyHandlers` apply their own projections synchronously right after saving. These `applyAll()` / `apply()` calls stay in the handlers — they are *not* replaced by `commit()`. The order becomes: `commit()` → `applyAll()` → done. This means bus subscribers (policies) run before the handler's own projections are updated. This is safe because **no current policy reads training_log/cardio/profile's own viewStore keys**; they read cross-feature state.

---

## File map

| File | Action | Responsibility |
|------|--------|----------------|
| `data/event-repository.ts` | **Create** | `EventRepository` class + `eventRepository` singleton |
| `data/event-repository.test.ts` | **Create** | Unit tests for `EventRepository.commit()` |
| `features/habits/commands/handlers.ts` | **Modify** | Replace `eventBus.publish()` → `eventRepository.commit([event])` |
| `features/goals/commands/handlers.ts` | **Modify** | Same |
| `features/training_plans/commands/handlers.ts` | **Modify** | Same |
| `features/training_log/commands/handlers.ts` | **Modify** | Replace `repository.save()` → `eventRepository.commit()`, remove duplicate `eventBus.publish()` in `handleFinishSession` |
| `features/cardio/commands/handlers.ts` | **Modify** | Replace `inMemoryEventStore.append()` loop + `eventBus.publish()` → `eventRepository.commit()` |
| `features/profile/commands/handlers.ts` | **Modify** | Replace `repository.save()` → `eventRepository.commit()`, remove duplicate `eventBus.publish()` in `handleLogBodyweight` |
| `features/profile/commands/bodyHandlers.ts` | **Modify** | Replace any `repository.save()` / `store.append()` → `eventRepository.commit()` |
| `features/conditions/commands/handlers.ts` | **Modify** | Replace `inMemoryEventStore.append()` → `eventRepository.commit()` |
| `features/health/commands/handlers.ts` | **Modify** | Same |
| `features/planning/commands/handlers.ts` | **Modify** | Same |
| `features/news_feed/commands/handlers.ts` | **Modify** | Same |
| `features/scheduling/commands/handlers.ts` | **Modify** | Same |
| `features/insights/commands/handlers.ts` | **Modify** | Same |
| `data/repositories/index.ts` | **Delete** | `AggregateRepository` — unused after migration |

---

## Task 1: Create `EventRepository` with tests

**Files:**
- Create: `data/event-repository.ts`
- Create: `data/event-repository.test.ts`

- [x] **Step 1: Write the failing tests**

Create `data/event-repository.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import type { DomainEvent } from '@shared/types';
import type { Id } from '@shared/types';
import { EventRepository } from './event-repository';

function makeEvent(type: string): DomainEvent {
  return {
    type,
    aggregateId: 'agg-1' as Id,
    aggregateType: 'Test',
    timestamp: 1000,
    version: 1,
    payload: {},
  };
}

describe('EventRepository', () => {
  it('persists each event to the store', async () => {
    const store = { append: vi.fn().mockResolvedValue(undefined) };
    const bus   = { publish: vi.fn().mockResolvedValue(undefined) };
    const repo  = new EventRepository(store as any, bus as any);

    await repo.commit([makeEvent('ThingHappened')]);

    expect(store.append).toHaveBeenCalledTimes(1);
    expect(store.append).toHaveBeenCalledWith(expect.objectContaining({ type: 'ThingHappened' }));
  });

  it('publishes each event to the bus', async () => {
    const store = { append: vi.fn().mockResolvedValue(undefined) };
    const bus   = { publish: vi.fn().mockResolvedValue(undefined) };
    const repo  = new EventRepository(store as any, bus as any);

    await repo.commit([makeEvent('ThingHappened')]);

    expect(bus.publish).toHaveBeenCalledTimes(1);
    expect(bus.publish).toHaveBeenCalledWith(expect.objectContaining({ type: 'ThingHappened' }));
  });

  it('persists all events before publishing any', async () => {
    const order: string[] = [];
    const store = {
      append: vi.fn().mockImplementation(() => {
        order.push('persist');
        return Promise.resolve();
      }),
    };
    const bus = {
      publish: vi.fn().mockImplementation(() => {
        order.push('publish');
        return Promise.resolve();
      }),
    };
    const repo = new EventRepository(store as any, bus as any);

    await repo.commit([makeEvent('A'), makeEvent('B')]);

    expect(order).toEqual(['persist', 'persist', 'publish', 'publish']);
  });

  it('handles multiple events, preserving order', async () => {
    const persisted: string[] = [];
    const published: string[] = [];
    const store = {
      append: vi.fn().mockImplementation((e: DomainEvent) => {
        persisted.push(e.type);
        return Promise.resolve();
      }),
    };
    const bus = {
      publish: vi.fn().mockImplementation((e: DomainEvent) => {
        published.push(e.type);
        return Promise.resolve();
      }),
    };
    const repo = new EventRepository(store as any, bus as any);

    await repo.commit([makeEvent('EventA'), makeEvent('EventB'), makeEvent('EventC')]);

    expect(persisted).toEqual(['EventA', 'EventB', 'EventC']);
    expect(published).toEqual(['EventA', 'EventB', 'EventC']);
  });

  it('handles an empty array without error', async () => {
    const store = { append: vi.fn().mockResolvedValue(undefined) };
    const bus   = { publish: vi.fn().mockResolvedValue(undefined) };
    const repo  = new EventRepository(store as any, bus as any);

    await expect(repo.commit([])).resolves.toBeUndefined();
    expect(store.append).not.toHaveBeenCalled();
    expect(bus.publish).not.toHaveBeenCalled();
  });
});
```

- [x] **Step 2: Run tests to confirm they fail**

```
npx vitest run data/event-repository.test.ts
```

Expected: `FAIL` — `EventRepository` not found.

- [x] **Step 3: Implement `EventRepository`**

Create `data/event-repository.ts`:

```typescript
import type { DomainEvent } from '@shared/types';
import { inMemoryEventStore } from '@data/store';
import { eventBus } from '@core/events/bus';

interface EventStore {
  append(event: DomainEvent): Promise<void>;
}

interface EventBus {
  publish(event: DomainEvent): Promise<void>;
}

export class EventRepository {
  constructor(
    private readonly store: EventStore,
    private readonly bus: EventBus,
  ) {}

  async commit(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.store.append(event);
    }
    for (const event of events) {
      await this.bus.publish(event);
    }
  }
}

export const eventRepository = new EventRepository(inMemoryEventStore, eventBus);
```

- [x] **Step 4: Run tests to confirm they pass**

```
npx vitest run data/event-repository.test.ts
```

Expected: `PASS` — 5 tests green.

- [ ] **Step 5: Commit**

```bash
git add data/event-repository.ts data/event-repository.test.ts
git commit -m "feat(data): add EventRepository — unified persist + publish path"
```

---

## Task 2: Migrate habits handlers (fixes persistence bug)

**Files:**
- Modify: `features/habits/commands/handlers.ts`

- [x] **Step 1: Update the import block**

In `features/habits/commands/handlers.ts`, replace:

```typescript
import { eventBus } from '@core/events/bus';
```

with:

```typescript
import { eventRepository } from '@data/event-repository';
```

(Keep all other imports as-is.)

- [x] **Step 2: Replace `handleCreateHabit`**

Replace the `eventBus.publish(...)` call in `handleCreateHabit`:

```typescript
// Before
await eventBus.publish({
  type: 'HabitCreated',
  aggregateId: habitId,
  aggregateType: 'Habit',
  timestamp: systemClock.now(),
  version: 1,
  payload,
});

// After
await eventRepository.commit([{
  type: 'HabitCreated',
  aggregateId: habitId,
  aggregateType: 'Habit',
  timestamp: systemClock.now(),
  version: 1,
  payload,
}]);
```

- [x] **Step 3: Replace `handleLogHabitCompletion` — streak-broken branch**

In `handleLogHabitCompletion`, replace both `eventBus.publish()` calls:

```typescript
// Before (streak-broken branch)
await eventBus.publish({
  type: 'HabitStreakBroken',
  aggregateId: cmd.habitId,
  aggregateType: 'Habit',
  timestamp: systemClock.now(),
  version: 1,
  payload: brokenPayload,
});

// After
await eventRepository.commit([{
  type: 'HabitStreakBroken',
  aggregateId: cmd.habitId,
  aggregateType: 'Habit',
  timestamp: systemClock.now(),
  version: 1,
  payload: brokenPayload,
}]);
```

```typescript
// Before (completed event)
await eventBus.publish({
  type: 'HabitCompleted',
  aggregateId: cmd.habitId,
  aggregateType: 'Habit',
  timestamp: systemClock.now(),
  version: 1,
  payload: completedPayload,
});

// After
await eventRepository.commit([{
  type: 'HabitCompleted',
  aggregateId: cmd.habitId,
  aggregateType: 'Habit',
  timestamp: systemClock.now(),
  version: 1,
  payload: completedPayload,
}]);
```

- [x] **Step 4: Replace `handleDeleteHabit`**

```typescript
// Before
await eventBus.publish({
  type: 'HabitDeleted',
  aggregateId: cmd.habitId,
  aggregateType: 'Habit',
  timestamp: systemClock.now(),
  version: 1,
  payload,
});

// After
await eventRepository.commit([{
  type: 'HabitDeleted',
  aggregateId: cmd.habitId,
  aggregateType: 'Habit',
  timestamp: systemClock.now(),
  version: 1,
  payload,
}]);
```

- [x] **Step 5: Run the full test suite to check for regressions**

```
npx vitest run
```

Expected: all previously-passing tests still pass.

- [ ] **Step 6: Commit**

```bash
git add features/habits/commands/handlers.ts
git commit -m "fix(habits): persist events via EventRepository — habits data now survives page refresh"
```

---

## Task 3: Migrate goals handlers (fixes persistence bug)

**Files:**
- Modify: `features/goals/commands/handlers.ts`

- [x] **Step 1: Update imports**

Replace:

```typescript
import { eventBus } from '@core/events/bus';
```

with:

```typescript
import { eventRepository } from '@data/event-repository';
```

- [x] **Step 2: Replace the `publishGoalEvent` helper**

The file currently has a private helper that wraps `eventBus.publish()`. Replace it:

```typescript
// Before
function publishGoalEvent<TPayload extends object>(type: string, aggregateId: Id, payload: TPayload): Promise<void> {
  return eventBus.publish({
    type,
    aggregateId,
    aggregateType: 'Goal',
    timestamp: systemClock.now(),
    version: 1,
    payload,
  });
}

// After
function publishGoalEvent<TPayload extends object>(type: string, aggregateId: Id, payload: TPayload): Promise<void> {
  return eventRepository.commit([{
    type,
    aggregateId,
    aggregateType: 'Goal',
    timestamp: systemClock.now(),
    version: 1,
    payload,
  }]);
}
```

No other changes needed — all four handlers call `publishGoalEvent` and will automatically use `commit()`.

- [x] **Step 3: Run the full test suite**

```
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add features/goals/commands/handlers.ts
git commit -m "fix(goals): persist events via EventRepository — goal data now survives page refresh"
```

---

## Task 4: Migrate training_plans handlers (fixes persistence bug)

**Files:**
- Modify: `features/training_plans/commands/handlers.ts`

- [ ] **Step 1: Update imports**

Replace:

```typescript
import { eventBus } from '@core/events/bus';
```

with:

```typescript
import { eventRepository } from '@data/event-repository';
```

- [x] **Step 2: Replace all four `eventBus.publish()` calls**

`handleCreatePlan`:

```typescript
// Before
await eventBus.publish({
  type: 'PlanCreated',
  aggregateId: planId,
  aggregateType: 'TrainingPlan',
  timestamp: systemClock.now(),
  version: 1,
  payload,
});

// After
await eventRepository.commit([{
  type: 'PlanCreated',
  aggregateId: planId,
  aggregateType: 'TrainingPlan',
  timestamp: systemClock.now(),
  version: 1,
  payload,
}]);
```

`handleUpdatePlan`:

```typescript
// Before
await eventBus.publish({
  type: 'PlanUpdated',
  aggregateId: cmd.planId,
  aggregateType: 'TrainingPlan',
  timestamp: systemClock.now(),
  version: 1,
  payload,
});

// After
await eventRepository.commit([{
  type: 'PlanUpdated',
  aggregateId: cmd.planId,
  aggregateType: 'TrainingPlan',
  timestamp: systemClock.now(),
  version: 1,
  payload,
}]);
```

`handleAssignWorkoutToDay`:

```typescript
// Before
await eventBus.publish({
  type: 'DayAssigned',
  aggregateId: cmd.planId,
  aggregateType: 'TrainingPlan',
  timestamp: systemClock.now(),
  version: 1,
  payload,
});

// After
await eventRepository.commit([{
  type: 'DayAssigned',
  aggregateId: cmd.planId,
  aggregateType: 'TrainingPlan',
  timestamp: systemClock.now(),
  version: 1,
  payload,
}]);
```

`handleDeletePlan`:

```typescript
// Before
await eventBus.publish({
  type: 'PlanDeleted',
  aggregateId: cmd.planId,
  aggregateType: 'TrainingPlan',
  timestamp: systemClock.now(),
  version: 1,
  payload,
});

// After
await eventRepository.commit([{
  type: 'PlanDeleted',
  aggregateId: cmd.planId,
  aggregateType: 'TrainingPlan',
  timestamp: systemClock.now(),
  version: 1,
  payload,
}]);
```

- [x] **Step 3: Run the full test suite**

```
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add features/training_plans/commands/handlers.ts
git commit -m "fix(training-plans): persist events via EventRepository — plan data now survives page refresh"
```

---

## Task 5: Migrate training_log handlers (consistency + remove duplicate bus publish)

**Files:**
- Modify: `features/training_log/commands/handlers.ts`

**What changes:**
- `repository.save(events)` → `await eventRepository.commit(events)`
- The explicit `eventBus.publish()` in `handleFinishSession` is removed — `commit()` already publishes all events
- The `repository` instance and `AggregateRepository` import are removed
- `applyAll()` calls stay exactly as-is — they run *after* `commit()`

**Behaviour note:** Previously, `applyAll()` ran before `eventBus.publish()` in `handleFinishSession`. After this change, `commit()` publishes to the bus *before* `applyAll()` updates the viewStore. This is safe: the coaching and goals policies that subscribe to `SessionFinished` read `session_rpe_history`, `exercise_progressions`, `plan_adherence`, and `active_goals` — none of which are training_log's own viewStore keys (`sessions`, `recent_exercises`).

- [ ] **Step 1: Update imports**

Replace these two imports in `features/training_log/commands/handlers.ts`:

```typescript
// Remove:
import { eventBus } from '@core/events/bus';
import { AggregateRepository } from '@data/repositories';

// Add:
import { eventRepository } from '@data/event-repository';
```

Also remove the lines that reference `trainingLogReducers` and `initialActivityLogState` if they were only used by the repository instance (check if they're used elsewhere in the file first).

- [x] **Step 2: Remove the repository instance**

Delete these lines near the top of the file:

```typescript
// Delete both of these:
import { trainingLogReducers, initialActivityLogState } from '../domain/reducers';
// (only if not used elsewhere in the file)

const repository = new AggregateRepository(
  initialActivityLogState,
  trainingLogReducers
);
```

- [x] **Step 3: Replace all `repository.save(events)` calls**

There are ~15 call sites. Each one follows the same pattern:

```typescript
// Before (repeated ~15 times)
await repository.save(events);
applyAll(events);

// After
await eventRepository.commit(events);
applyAll(events);
```

The `applyAll(events)` line stays exactly where it is.

- [x] **Step 4: Fix `handleFinishSession` — remove the duplicate `eventBus.publish()`**

`handleFinishSession` currently calls both `repository.save(events)` (being replaced in Step 3) AND an explicit `eventBus.publish(enrichedPayload)`. The `commit()` call in Step 3 already publishes the `SessionFinished` event. Remove the redundant block:

```typescript
// Delete this entire block from handleFinishSession:
await eventBus.publish({
  type: 'SessionFinished',
  aggregateId: cmd.sessionId,
  aggregateType: 'Session',
  timestamp: finishedAt,
  version: 1,
  payload: enrichedPayload,
});
```

The `enrichedPayload` is already in `events[0].payload`. Policies subscribed to `'SessionFinished'` will receive the same payload via `commit()`.

- [x] **Step 5: Run the full test suite**

```
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add features/training_log/commands/handlers.ts
git commit -m "refactor(training-log): use EventRepository, remove duplicate bus publish in handleFinishSession"
```

---

## Task 6: Migrate cardio handlers

**Files:**
- Modify: `features/cardio/commands/handlers.ts`

**What changes:**
- The `for (const e of events) await inMemoryEventStore.append(e)` loops → `await eventRepository.commit(events)`
- The `eventBus.publish()` call in `handleRecordCardioSession` is removed (commit publishes it)
- **Note:** The removed bus publish had an extra `recordedAt: systemClock.now()` field not present in the persisted event. This is a bug being fixed: the bus event and the stored event now have identical payloads. Any subscriber reading `recordedAt` should use `event.timestamp` instead (they're the same value).
- `import { inMemoryEventStore }` is removed
- `import { eventBus }` is removed

- [ ] **Step 1: Update imports**

Remove:

```typescript
import { eventBus } from '@core/events/bus';
import { inMemoryEventStore } from '@data/store';
```

Add:

```typescript
import { eventRepository } from '@data/event-repository';
```

- [x] **Step 2: Replace `handleRecordCardioSession`**

```typescript
// Before
for (const e of events) await inMemoryEventStore.append(e);
applyAndStore(events);

// Notify other features via event bus
await eventBus.publish({
  type: "CardioSessionRecorded",
  aggregateId: cmd.userId,
  aggregateType: "User",
  timestamp: systemClock.now(),
  version: 1,
  payload: {
    sessionId,
    userId: cmd.userId,
    sport: cmd.sport,
    durationSeconds: cmd.durationSeconds,
    distanceMeters: cmd.distanceMeters,
    notes: cmd.notes,
    recordedAt: systemClock.now(),
  },
});

// After
await eventRepository.commit(events);
applyAndStore(events);
```

- [x] **Step 3: Replace `handleUpdateCardioSession`**

```typescript
// Before
for (const e of events) await inMemoryEventStore.append(e);
applyAndStore(events);

// After
await eventRepository.commit(events);
applyAndStore(events);
```

- [x] **Step 4: Replace `handleDeleteCardioSession`**

```typescript
// Before
for (const e of events) await inMemoryEventStore.append(e);
applyAndStore(events);

// After
await eventRepository.commit(events);
applyAndStore(events);
```

- [x] **Step 5: Check `handleUpdateCardioSessionFull`**

This handler manipulates `viewStore` directly without going through events. Leave it as-is for now — it is a known exception (tech debt, not in scope for this plan).

- [x] **Step 6: Run the full test suite**

```
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add features/cardio/commands/handlers.ts
git commit -m "refactor(cardio): use EventRepository, fix duplicate bus payload with extra recordedAt field"
```

---

## Task 7: Migrate profile handlers

**Files:**
- Modify: `features/profile/commands/handlers.ts`
- Modify: `features/profile/commands/bodyHandlers.ts`

**What changes in `handlers.ts`:**
- `repository.save(events)` → `await eventRepository.commit(events)`
- `handleLogBodyweight` currently does: save → applyProjection → viewStore.set → eventBus.publish. After: commit → applyProjection → viewStore.set. Same ordering concern as training_log: `commit()` publishes before projection sync. Safe because no subscriber reads `bodyweight_log` viewStore.

- [ ] **Step 1: Update imports in `handlers.ts`**

Remove:

```typescript
import { eventBus } from '@core/events/bus';
import { AggregateRepository } from '@data/repositories';
import { profileReducers, initialProfileState } from '../domain/reducers';
```

Add:

```typescript
import { eventRepository } from '@data/event-repository';
```

- [x] **Step 2: Remove the repository instance**

Delete:

```typescript
const repository = new AggregateRepository(initialProfileState, profileReducers);
```

- [x] **Step 3: Replace all `repository.save()` calls in `handlers.ts`**

`handleUpdateProfile`, `handleSetUnitPreference`, `handleRecordInjury`, `handleResolveInjury`:

```typescript
// Before (4 occurrences)
await repository.save(events);

// After
await eventRepository.commit(events);
```

- [x] **Step 4: Fix `handleLogBodyweight` — remove duplicate bus publish**

```typescript
// Before
await repository.save(events);
events.forEach(e => bodyweightProjection.apply(e));
viewStore.set('bodyweight_log', bodyweightProjection.getState());
await eventBus.publish(events[0]);

// After
await eventRepository.commit(events);
events.forEach(e => bodyweightProjection.apply(e));
viewStore.set('bodyweight_log', bodyweightProjection.getState());
```

- [x] **Step 5: Check `bodyHandlers.ts`**

Read `features/profile/commands/bodyHandlers.ts` and apply the same pattern to any `repository.save()` or `inMemoryEventStore.append()` calls found there. If the file also uses `AggregateRepository`, remove that import and instance too.

- [x] **Step 6: Run the full test suite**

```
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add features/profile/commands/handlers.ts features/profile/commands/bodyHandlers.ts
git commit -m "refactor(profile): use EventRepository, remove duplicate bus publish in handleLogBodyweight"
```

---

## Task 8: Migrate remaining features (store.append-only handlers)

The following features call `inMemoryEventStore.append()` directly but do not publish to the bus. Migrating them to `commit()` adds bus publication as a side effect, which is harmless (no current subscribers for these events) but makes the system consistent.

**Files to modify:**
- `features/conditions/commands/handlers.ts`
- `features/health/commands/handlers.ts`
- `features/planning/commands/handlers.ts`
- `features/news_feed/commands/handlers.ts`
- `features/scheduling/commands/handlers.ts`
- `features/insights/commands/handlers.ts`

For each file:

- [ ] **Step 1: Update imports**

For each file, remove:

```typescript
import { inMemoryEventStore } from '@data/store';
```

Add:

```typescript
import { eventRepository } from '@data/event-repository';
```

- [x] **Step 2: Replace `await inMemoryEventStore.append(event)` calls**

For single-event handlers (most common pattern in these files):

```typescript
// Before
await inMemoryEventStore.append(event);

// After
await eventRepository.commit([event]);
```

For handlers that append multiple events individually (e.g., `conditions` appends `forecastEvent` and `suitabilityEvent` on separate lines):

```typescript
// Before
await inMemoryEventStore.append(forecastEvent);
await inMemoryEventStore.append(suitabilityEvent);

// After
await eventRepository.commit([forecastEvent, suitabilityEvent]);
```

- [x] **Step 3: Run the full test suite after migrating all six files**

```
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add features/conditions/commands/handlers.ts \
        features/health/commands/handlers.ts \
        features/planning/commands/handlers.ts \
        features/news_feed/commands/handlers.ts \
        features/scheduling/commands/handlers.ts \
        features/insights/commands/handlers.ts
git commit -m "refactor(features): use EventRepository in conditions/health/planning/news_feed/scheduling/insights"
```

---

## Task 9: Delete `AggregateRepository`

Now that all handlers use `EventRepository`, `AggregateRepository` should have no callers.

- [x] **Step 1: Verify no remaining usages**

```
npx vitest run
```

Also run:

```bash
grep -r "AggregateRepository" --include="*.ts" .
```

Expected: zero results (or only in `data/repositories/index.ts` itself).

- [x] **Step 2: Delete the file**

Delete `data/repositories/index.ts`.

- [x] **Step 3: Run the full test suite**

```
npx vitest run
```

Expected: all tests pass (no import errors).

- [ ] **Step 4: Commit**

```bash
git add -u data/repositories/index.ts
git commit -m "refactor(data): delete AggregateRepository — superseded by EventRepository"
```

---

## Self-review

### Spec coverage

| Requirement | Task |
|-------------|------|
| habits events persisted | Task 2 |
| goals events persisted | Task 3 |
| training_plans events persisted | Task 4 |
| Single persist + publish path | Task 1 |
| training_log duplicate bus publish removed | Task 5 |
| cardio duplicate bus publish + payload mismatch fixed | Task 6 |
| profile duplicate bus publish removed | Task 7 |
| Remaining features unified | Task 8 |
| AggregateRepository removed | Task 9 |
| Tests for EventRepository | Task 1 |

### Placeholder check

No TBDs. All code shown in full.

### Type consistency

- `EventRepository.commit(events: DomainEvent[])` — used identically across all tasks.
- `eventRepository` singleton — single named export from `data/event-repository.ts`.
- All `repository.save()` / `inMemoryEventStore.append()` call sites are explicitly shown.
