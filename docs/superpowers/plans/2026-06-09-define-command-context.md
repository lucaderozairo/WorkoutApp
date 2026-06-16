# defineCommand Context Deepening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deepen `defineCommand` so handlers declare their projections once and receive pre-loaded state + an atomic commit helper — eliminating the 19 duplicated `applyAndStore` closures and making handlers testable without a viewStore mock.

**Architecture:** `defineCommand` gains an optional `projections` array. When provided, it pre-loads each projection's state from viewStore (with localStorage fallback) and passes it as `ctx.state` to the handler. `ctx.commit(events)` applies events to all declared projections and persists them. Handlers become pure: given state, produce events. This plan migrates the cardio feature as the reference; other features follow the same pattern independently.

**Tech Stack:** TypeScript, Vitest, existing `ProjectionBuilder`, `viewStore`, `loadFromStorage` infrastructure.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `data/define-command.ts` | Add `projections` + `CommandContext` to `CommandDefinition` |
| Modify | `data/define-command.test.ts` | Tests for the new projection-aware path |
| Modify | `features/cardio/commands/handlers.ts` | Migrate to `ctx.state` + `ctx.commit()` (reference impl) |
| Modify | `features/cardio/commands/handlers.test.ts` | Update tests if needed |

All other `features/*/commands/handlers.ts` files follow the same pattern but are out of scope for this plan. Each can be migrated independently in follow-up PRs.

---

## Task 1: Extend defineCommand with CommandContext

**Files:**
- Modify: `data/define-command.ts`
- Modify: `data/define-command.test.ts`

- [x] **Step 1.1: Write failing tests for the projection-aware path**

Add to `data/define-command.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { defineCommand } from './define-command';
import { ProjectionBuilder } from './projections/builders';
import { viewStore } from './projections/views';

// Simple counter projection for testing
interface CounterState { count: number }
type CounterEvent = { type: 'Incremented'; aggregateId: string; aggregateType: string; timestamp: number; version: number; payload: { by: number } };

const counterProjection = new ProjectionBuilder<CounterState, CounterEvent>({ count: 0 })
  .on('Incremented', (state, event) => ({ count: state.count + event.payload.by }))
  .build();

describe('defineCommand with projections', () => {
  it('pre-loads projection state into ctx.state', async () => {
    counterProjection.setState({ count: 5 });
    viewStore.set('counter', { count: 5 });

    const handler = defineCommand({
      projections: [{ key: 'counter' as const, projection: counterProjection }],
      execute: async (_cmd: { amount: number }, ctx) => {
        expect(ctx.state.counter.count).toBe(5);
        return ctx.commit([]);
      },
    });

    await handler({ amount: 1 });
  });

  it('applies events to all declared projections via ctx.commit', async () => {
    counterProjection.setState({ count: 0 });
    viewStore.set('counter', { count: 0 });

    const event: CounterEvent = {
      type: 'Incremented',
      aggregateId: 'test',
      aggregateType: 'Test',
      timestamp: Date.now(),
      version: 1,
      payload: { by: 3 },
    };

    const handler = defineCommand({
      projections: [{ key: 'counter' as const, projection: counterProjection }],
      execute: async (_cmd: void, ctx) => ctx.commit([event]),
    });

    await handler();
    expect(viewStore.get<CounterState>('counter')?.count).toBe(3);
  });

  it('still works without projections (backward compatible)', async () => {
    const handler = defineCommand({
      execute: async (_cmd: string) => ({ events: [], result: 'ok' }),
    });
    const result = await handler('test');
    expect(result).toBe('ok');
  });
});
```

- [x] **Step 1.2: Run tests — fail**

```bash
npx vitest run data/define-command.test.ts
```
Expected: FAIL — `projections` not recognised

- [x] **Step 1.3: Rewrite `data/define-command.ts`**

```typescript
import type { DomainEvent } from '@shared/types';
import { EventRepository, eventRepository as defaultRepo } from './event-repository';
import type { ProjectionBuilder } from './projections/builders';
import { viewStore } from './projections/views';
import { loadFromStorage } from './sources/local/persistence';

// ── Projection slot ──────────────────────────────────────────

export interface ProjectionSlot<TKey extends string, TState> {
  key: TKey;
  projection: ProjectionBuilder<TState, DomainEvent>;
}

// ── CommandContext (projection-aware path) ────────────────────

type InferState<TSlots extends ProjectionSlot<string, unknown>[]> = {
  [K in TSlots[number] as K['key']]: K extends ProjectionSlot<infer _Key, infer TState> ? TState : never;
};

export interface CommandContext<TSlots extends ProjectionSlot<string, unknown>[]> {
  state: InferState<TSlots>;
  commit(events: DomainEvent[]): Promise<void>;
}

// ── CommandDefinition (two overloads) ────────────────────────

export interface CommandDefinitionLegacy<TCmd, TResult = void> {
  execute(cmd: TCmd): Promise<{ events: DomainEvent[]; result?: TResult }>;
}

export interface CommandDefinitionWithProjections<
  TCmd,
  TSlots extends ProjectionSlot<string, unknown>[],
  TResult = void,
> {
  projections: TSlots;
  execute(cmd: TCmd, ctx: CommandContext<TSlots>): Promise<TResult>;
}

export type CommandDefinition<TCmd, TResult = void> =
  | CommandDefinitionLegacy<TCmd, TResult>
  | CommandDefinitionWithProjections<TCmd, ProjectionSlot<string, unknown>[], TResult>;

function isWithProjections<TCmd, TResult>(
  def: CommandDefinition<TCmd, TResult>,
): def is CommandDefinitionWithProjections<TCmd, ProjectionSlot<string, unknown>[], TResult> {
  return 'projections' in def;
}

// ── defineCommand ─────────────────────────────────────────────

export function defineCommand<TCmd, TResult = void>(
  definition: CommandDefinition<TCmd, TResult>,
  repo: EventRepository = defaultRepo,
): (cmd: TCmd) => Promise<TResult> {
  if (!isWithProjections(definition)) {
    // Legacy path — unchanged behaviour
    return async (cmd) => {
      const { events, result } = await definition.execute(cmd);
      await repo.commit(events);
      return result as TResult;
    };
  }

  // Projection-aware path
  return async (cmd) => {
    // Pre-load each projection's state from viewStore (or localStorage fallback)
    const state: Record<string, unknown> = {};
    for (const slot of definition.projections) {
      const live = viewStore.get(slot.key) ?? loadFromStorage(slot.key);
      if (live !== null && live !== undefined) {
        slot.projection.setState(live);
      }
      state[slot.key] = slot.projection.getState();
    }

    const ctx: CommandContext<typeof definition.projections> = {
      state: state as InferState<typeof definition.projections>,
      commit: async (events) => {
        for (const event of events) {
          for (const slot of definition.projections) {
            slot.projection.apply(event as Parameters<typeof slot.projection.apply>[0]);
          }
        }
        for (const slot of definition.projections) {
          viewStore.set(slot.key, slot.projection.getState());
        }
        await repo.commit(events);
      },
    };

    return definition.execute(cmd, ctx);
  };
}
```

- [x] **Step 1.4: Run tests — pass**

```bash
npx vitest run data/define-command.test.ts
```
Expected: PASS (all tests, including existing ones)

- [x] **Step 1.5: `npx tsc --noEmit` — 0 errors**

- [ ] **Step 1.6: Commit**

```bash
git add data/define-command.ts data/define-command.test.ts
git commit -m "feat(defineCommand): add projection-aware CommandContext — handlers can declare projections once"
```

---

## Task 2: Migrate cardio handlers to the new pattern (reference implementation)

**Files:**
- Modify: `features/cardio/commands/handlers.ts`

The cardio feature owns two projections: `recentCardioProjection` (key: `'recent_cardio_sessions'`) and `monthlyCardioProjection` (key: `'monthly_cardio_progression'`). Currently, both are sync'd manually in the local `applyAndStore` closure that every handler calls.

- [x] **Step 2.1: Write test to prove cardio still works after migration**

Add to `features/cardio/commands/handlers.test.ts` (create file if it doesn't exist):

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { handleRecordCardioSession } from './handlers';
import { viewStore } from '@data/projections/views';
import type { RecentCardioView } from '../projections';
import type { Id } from '@shared/types';

beforeEach(() => {
  viewStore.set('recent_cardio_sessions', { sessions: [] });
  viewStore.set('monthly_cardio_progression', { months: {} });
});

describe('handleRecordCardioSession (with ctx)', () => {
  it('records a cardio session and updates both projections', async () => {
    await handleRecordCardioSession({
      type: 'RecordCardioSession',
      userId: 'u-1' as Id<'User'>,
      sport: 'running',
      durationSeconds: 1800,
      distanceMeters: 5000,
    });

    const state = viewStore.get<RecentCardioView>('recent_cardio_sessions');
    expect(state?.sessions).toHaveLength(1);
    expect(state?.sessions[0].sport).toBe('running');
  });
});
```

- [x] **Step 2.2: Run test — it should already pass (proves baseline)**

```bash
npx vitest run features/cardio/commands/handlers.test.ts
```
Expected: PASS (confirms baseline before migration)

- [x] **Step 2.3: Migrate `handleRecordCardioSession` to use `ctx`**

In `features/cardio/commands/handlers.ts`, replace the `handleRecordCardioSession` definition:

**Before pattern (using `applyAndStore`):**
```typescript
export const handleRecordCardioSession = defineCommand<RecordCardioSession, Result<void, string>>({
  execute: async (cmd) => {
    if (cmd.durationSeconds < 1) return { events: [], result: err("Duration must be at least 1 second") };
    // ... build events ...
    applyAndStore(events);
    return { events, result: ok(undefined) };
  },
});
```

**After pattern (using `ctx`):**
```typescript
export const handleRecordCardioSession = defineCommand<RecordCardioSession, Result<void, string>>({
  projections: [
    { key: 'recent_cardio_sessions' as const, projection: recentCardioProjection },
    { key: 'monthly_cardio_progression' as const, projection: monthlyCardioProjection },
  ],
  execute: async (cmd, ctx) => {
    if (cmd.durationSeconds < 1) return err('Duration must be at least 1 second');
    if (cmd.distanceMeters < 0) return err('Distance must be non-negative');

    const sessionId = cmd.sessionId ?? cryptoIdGenerator.next<'CardioSession'>();

    const event: CardioEvent = {
      type: 'CardioSessionRecorded',
      aggregateId: cmd.userId,
      aggregateType: 'User',
      timestamp: systemClock.now(),
      version: 1,
      payload: {
        sessionId,
        userId: cmd.userId,
        sport: cmd.sport,
        durationSeconds: cmd.durationSeconds,
        distanceMeters: cmd.distanceMeters,
        notes: cmd.notes,
      },
    };

    await ctx.commit([event]);
    return ok(undefined);
  },
});
```

Note: `ctx.commit()` is `async` and returns `void`. The handler returns `TResult` directly (not wrapped in `{ events, result }`).

- [x] **Step 2.4: Apply the same migration to `handleUpdateCardioSession` and `handleDeleteCardioSession`**

Follow the exact same pattern for each: replace `applyAndStore(events); return { events, result: ... }` with `await ctx.commit(events); return result`.

- [x] **Step 2.5: Remove the `applyAndStore` closure and the `loadFromStorage` import if unused**

Once all handlers use `ctx`, the local `applyAndStore` function is dead code. Delete it. If `loadFromStorage` is only used by `applyAndStore`, remove that import too.

- [x] **Step 2.6: Run tests — pass**

```bash
npx vitest run features/cardio/commands/handlers.test.ts
```
Expected: PASS

- [x] **Step 2.7: `npx tsc --noEmit` — 0 errors**

- [ ] **Step 2.8: Commit**

```bash
git add features/cardio/commands/handlers.ts features/cardio/commands/handlers.test.ts
git commit -m "refactor(cardio): migrate handlers to defineCommand ctx — remove applyAndStore"
```

---

## Task 3: Document the migration pattern for remaining features

- [x] **Step 3.1: Add a migration note to the define-command.ts file**

Add a comment block at the top of `data/define-command.ts` (after the imports):

```typescript
/**
 * Migration guide: moving a feature handler from the legacy pattern to the ctx pattern.
 *
 * Legacy (pre-ctx):
 *   defineCommand({ execute: async (cmd) => { applyAndStore(events); return { events, result }; } })
 *
 * New (ctx-aware):
 *   defineCommand({
 *     projections: [{ key: 'my_view' as const, projection: myProjection }],
 *     execute: async (cmd, ctx) => { await ctx.commit(events); return result; },
 *   })
 *
 * Benefits: no applyAndStore boilerplate, projection sync is guaranteed, handlers become pure.
 * See features/cardio/commands/handlers.ts as the reference implementation.
 */
```

- [ ] **Step 3.2: Commit**

```bash
git add data/define-command.ts
git commit -m "docs(defineCommand): add migration guide comment — cardio is the reference"
```
