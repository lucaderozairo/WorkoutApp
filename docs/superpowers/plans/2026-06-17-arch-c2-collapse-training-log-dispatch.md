# C2: Collapse the Training-Log Dispatch Layer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Delete the `commit()` pass-through wrapper in `handlers.ts` and migrate `commitTrainingLogEvents` / `commitSessionStartedEvents` from the legacy `defineCommand` Style A (manual `applyAll` in `execute`) to Style B (projection-aware slots with `ctx.commit`), so events are applied through one code path.

**Architecture:** Currently `commit()` at line 377 is a two-line wrapper that only calls `commitTrainingLogEvents`. Both `commitTrainingLogEvents` and `commitSessionStartedEvents` use `defineCommand` Style A: they manually call `applyAll()` inside `execute` before returning `{ events }`, then the `defineCommand` legacy path calls `repo.commit(events)`. Style B lets `ctx.commit(events)` handle both projection application and persistence atomically inside `defineCommand`. After migration, `applyAll` is only needed for bulk replay (`importSessions.ts`, bootstrap) and can be renamed to make that intent explicit.

**Tech Stack:** TypeScript, Vitest, existing `defineCommand` in `data/define-command.ts`.

---

## File Map

| Action | File |
|--------|------|
| Modify | `features/training_log/commands/handlers.ts` |
| Modify | `features/training_log/index.ts` (export rename) |
| Read-only | `data/define-command.ts` (reference for Style B interface) |
| Read-only | `features/training_log/commands/handlers.test.ts` (existing tests must stay green) |

---

### Task 1: Delete the `commit()` pass-through wrapper

The `commit()` function at line 377 is:
```typescript
async function commit(events: TrainingLogEvent[]): Promise<Result<void, string>> {
  return commitTrainingLogEvents(events);
}
```
It has ~18 callers below it — they all call `commit([{ ... }])`. Remove the wrapper by inlining the delegation.

**Files:**
- Modify: `features/training_log/commands/handlers.ts`

- [ ] **Step 1: Write a failing test that verifies a handler dispatches correctly post-refactor**

  The existing tests in `handlers.test.ts` cover `handleStartSession`, `handleAddBlock`, `handleFinishSessionWithDetails`. Run them first to confirm they pass:

  ```bash
  npx vitest run features/training_log/commands/handlers.test.ts
  ```
  Expected: all green. If any fail, stop and fix before proceeding.

- [ ] **Step 2: Delete `commit()` and replace all call sites**

  In `features/training_log/commands/handlers.ts`:

  1. Delete the function at line 377:
     ```typescript
     async function commit(events: TrainingLogEvent[]): Promise<Result<void, string>> {
       return commitTrainingLogEvents(events);
     }
     ```

  2. At every call site that was `return commit([{ ... }])`, change to `return commitTrainingLogEvents([{ ... }])`.
     Example — `handleRemoveSet` was:
     ```typescript
     export async function handleRemoveSet(cmd: RemoveSet): Promise<Result<void, string>> {
       return commit([{
         type: 'SetRemoved',
         ...
       }]);
     }
     ```
     Becomes:
     ```typescript
     export async function handleRemoveSet(cmd: RemoveSet): Promise<Result<void, string>> {
       return commitTrainingLogEvents([{
         type: 'SetRemoved',
         ...
       }]);
     }
     ```
     Apply the same change to every handler that calls `commit(...)`. There are approximately 18 such handlers from `handleRemoveSet` through `handleDeleteSession`.

- [ ] **Step 3: TypeScript check**

  Run: `npx tsc --noEmit`
  Expected: zero errors. No `commit` references should remain in handlers.ts.

- [ ] **Step 4: Run handler tests**

  Run: `npx vitest run features/training_log/commands/handlers.test.ts`
  Expected: all pass.

- [ ] **Step 5: Commit**

  ```bash
  git add features/training_log/commands/handlers.ts
  git commit -m "refactor(training_log): delete commit() pass-through wrapper"
  ```

---

### Task 2: Migrate `commitTrainingLogEvents` to projection-aware Style B

Style A (current):
```typescript
const commitTrainingLogEvents = defineCommand<TrainingLogEvent[], Result<void, string>>({
  execute: async (events) => {
    applyAll(events);
    return { events, result: ok(undefined) };
  },
});
```

Style B: `defineCommand` handles projection application inside `ctx.commit(events)`. The `active_session` and `activity_history` derived writes currently inside `applyAll` need to run after `ctx.commit`.

**Files:**
- Modify: `features/training_log/commands/handlers.ts`

- [ ] **Step 1: Read `data/define-command.ts` to understand projection slot syntax**

  The projection-aware overload signature is:
  ```typescript
  defineCommand({
    projections: [
      { key: 'sessions', projection: sessionProjection },
      { key: 'recent_exercises', projection: recentExercisesProjection },
    ],
    execute: async (cmd, ctx) => {
      // ctx.state.sessions — ActivitiesState (loaded from viewStore or projection)
      // ctx.commit(events) — applies projections, writes viewStore, calls repo.commit
      ...
    },
  })
  ```
  `ctx.commit(events)` applies each event to every declared projection slot, then writes each slot's `getState()` to `viewStore`, then calls `repo.commit(events)`.

- [ ] **Step 2: Replace `commitTrainingLogEvents` with the projection-aware form**

  Replace:
  ```typescript
  const commitTrainingLogEvents = defineCommand<TrainingLogEvent[], Result<void, string>>({
    execute: async (events) => {
      applyAll(events);
      return { events, result: ok(undefined) };
    },
  });
  ```

  With:
  ```typescript
  const commitTrainingLogEvents = defineCommand({
    projections: [
      { key: 'sessions' as const, projection: sessionProjection },
      { key: 'recent_exercises' as const, projection: recentExercisesProjection },
    ],
    execute: async (events: TrainingLogEvent[], ctx): Promise<Result<void, string>> => {
      await ctx.commit(events);
      // Derived views not covered by projection slots:
      const sessions = sessionProjection.getState();
      viewStore.set('active_session', sessions.activeId ? sessions.byId[sessions.activeId] ?? null : null);
      viewStore.set('activity_history', getActivityHistory());
      return ok(undefined);
    },
  });
  ```

  Key differences from Style A:
  - `ctx.commit(events)` replaces `applyAll(events)` for the projection apply + viewStore set steps
  - `sessions` and `recent_exercises` are written by `ctx.commit` via their slots
  - `active_session` and `activity_history` are derived and written explicitly after `ctx.commit`
  - No `{ events, result }` shape returned — Style B returns `TResult` directly

- [ ] **Step 3: Replace `commitSessionStartedEvents` with the projection-aware form**

  Replace:
  ```typescript
  const commitSessionStartedEvents = defineCommand<
    { events: TrainingLogEvent[]; sessionId: string },
    Result<{ sessionId: string }, string>
  >({
    execute: async ({ events, sessionId }) => {
      applyAll(events);
      return { events, result: ok({ sessionId }) };
    },
  });
  ```

  With:
  ```typescript
  const commitSessionStartedEvents = defineCommand({
    projections: [
      { key: 'sessions' as const, projection: sessionProjection },
      { key: 'recent_exercises' as const, projection: recentExercisesProjection },
    ],
    execute: async (
      { events, sessionId }: { events: TrainingLogEvent[]; sessionId: string },
      ctx,
    ): Promise<Result<{ sessionId: string }, string>> => {
      await ctx.commit(events);
      const sessions = sessionProjection.getState();
      viewStore.set('active_session', sessions.activeId ? sessions.byId[sessions.activeId] ?? null : null);
      viewStore.set('activity_history', getActivityHistory());
      return ok({ sessionId });
    },
  });
  ```

- [ ] **Step 4: TypeScript check**

  Run: `npx tsc --noEmit`
  Expected: zero errors.

- [ ] **Step 5: Run handler tests**

  Run: `npx vitest run features/training_log/commands/handlers.test.ts`
  Expected: all pass. Pay attention to `active_session` being set correctly (that's what the existing tests check).

- [ ] **Step 6: Commit**

  ```bash
  git add features/training_log/commands/handlers.ts
  git commit -m "refactor(training_log): migrate commitTrainingLogEvents to projection-aware defineCommand"
  ```

---

### Task 3: Rename `applyAll` to `replayTrainingLogEvents`

`applyAll` is now only called from bulk-replay paths (`importSessions.ts`, bootstrap). Rename it to make that intent explicit and update the barrel export.

**Files:**
- Modify: `features/training_log/commands/handlers.ts`
- Modify: `features/training_log/index.ts`
- Modify: `features/training_log/commands/importSessions.ts`

- [ ] **Step 1: Rename `applyAll` in `handlers.ts`**

  In `handlers.ts`, rename `export function applyAll` to `export function replayTrainingLogEvents`.

  The function body stays the same — it's still the bulk-replay/import path.

- [ ] **Step 2: Update `importSessions.ts`**

  In `features/training_log/commands/importSessions.ts`, change:
  ```typescript
  import { applyAll } from './handlers';
  ```
  to:
  ```typescript
  import { replayTrainingLogEvents } from './handlers';
  ```
  And rename the call site: `applyAll(events)` → `replayTrainingLogEvents(events)`.

- [ ] **Step 3: Update `features/training_log/index.ts`**

  The barrel currently re-exports `applyAll as replayTrainingLogEvents`:
  ```typescript
  export { applyAll as replayTrainingLogEvents } from './commands/handlers';
  ```
  Change to:
  ```typescript
  export { replayTrainingLogEvents } from './commands/handlers';
  ```

- [ ] **Step 4: Grep for any remaining `applyAll` references**

  Run: `grep -r "applyAll" features/ --include="*.ts" --include="*.tsx"`
  Expected: zero results (only docs or comments are acceptable).

- [ ] **Step 5: TypeScript check and full test run**

  Run: `npx tsc --noEmit && npx vitest run features/training_log`
  Expected: zero errors, all tests pass.

- [ ] **Step 6: Commit**

  ```bash
  git add features/training_log/commands/handlers.ts features/training_log/index.ts features/training_log/commands/importSessions.ts
  git commit -m "refactor(training_log): rename applyAll to replayTrainingLogEvents"
  ```

---

## Self-Review

**Spec coverage:** ✓ `commit()` pass-through deleted (Task 1). ✓ `commitTrainingLogEvents` and `commitSessionStartedEvents` migrated to Style B (Task 2). ✓ `applyAll` renamed to clarify replay-only intent (Task 3).

**Placeholder scan:** No placeholders. Every step contains the actual code change.

**Type consistency:** `sessionProjection`, `recentExercisesProjection`, `getActivityHistory`, `ok` — all imported at the top of `handlers.ts` already. The `as const` on projection key strings is required for TypeScript to narrow `K extends keyof ViewRegistry`.
