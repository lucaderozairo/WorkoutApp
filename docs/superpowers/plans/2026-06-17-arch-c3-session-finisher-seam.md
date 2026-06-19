# C3: Deepen the Session-Finisher Seam — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the "which command to call when finishing a session" decision from the UI hook into the `training_log` feature, so `useFinishSession` calls one handler instead of six.

**Architecture:** `useFinishSession` currently imports and dispatches six separate command handlers (`handleFinishSessionWithDetails`, `handleUpdateSessionNote`, `handleRenameSession`, `handleUpdateSessionStartTime`, `handleUpdateSessionDetails`, `handleCreateTemplate`) and embeds the active-vs-finished branching logic. Extract a single `handleFinishOrUpdateSession` command handler in `features/training_log/commands/handlers.ts` that owns the branching and multi-event dispatch internally. The UI hook becomes a thin adapter: collect form state → call one handler → done.

**Tech Stack:** TypeScript, Vitest, React, existing `defineCommand` infrastructure.

---

## File Map

| Action | File |
|--------|------|
| Create | `features/training_log/commands/handlers.test.ts` (extend existing test file) |
| Modify | `features/training_log/commands/handlers.ts` (add new handler) |
| Modify | `features/training_log/index.ts` (export new handler) |
| Modify | `ui/screens/session/useFinishSession.ts` (simplify to one dispatch) |

---

### Task 1: Define the `FinishOrUpdateSession` command type

**Files:**
- Read: `features/training_log/domain/types.ts` (find where command types are defined)
- Modify: `features/training_log/domain/types.ts`

- [ ] **Step 1: Read `features/training_log/domain/types.ts` to find the command union**

  Look for `type TrainingLogCommand` or the list of command interfaces. Find `FinishSessionWithDetails` and `UpdateSessionDetails` as reference types.

- [ ] **Step 2: Add `FinishOrUpdateSession` command type**

  In the commands section of `features/training_log/domain/types.ts`, add:

  ```typescript
  export interface FinishOrUpdateSession {
    type: 'FinishOrUpdateSession';
    sessionId: string;
    isActive: boolean;          // true = session is still running; false = already finished
    name?: string;
    notes?: string;
    sessionRpe?: number;
    tags?: string[];
    startedAt?: number;         // ms epoch
    finishedAt?: number;        // ms epoch — required when isActive = true
  }
  ```

  Also add `FinishOrUpdateSession` to the `TrainingLogCommand` union type (if one exists).

- [ ] **Step 3: TypeScript check**

  Run: `npx tsc --noEmit`
  Expected: zero errors.

- [ ] **Step 4: Commit**

  ```bash
  git add features/training_log/domain/types.ts
  git commit -m "feat(training_log): add FinishOrUpdateSession command type"
  ```

---

### Task 2: Write a failing test for `handleFinishOrUpdateSession`

**Files:**
- Modify: `features/training_log/commands/handlers.test.ts`

- [ ] **Step 1: Write the failing test**

  At the end of `features/training_log/commands/handlers.test.ts`, add:

  ```typescript
  describe('handleFinishOrUpdateSession', () => {
    it('active session: finishes with all details in one call', async () => {
      const USER = 'u-fous-1' as Id<'User'>;
      const start = await handleStartSession({ type: 'StartSession', userId: USER, name: 'Old Name' });
      expect(start.ok).toBe(true);
      const sessionId = (start as { ok: true; value: { sessionId: string } }).value.sessionId as Id<'Activity'>;

      const now = Date.now();
      const result = await handleFinishOrUpdateSession({
        type: 'FinishOrUpdateSession',
        sessionId,
        isActive: true,
        name: 'New Name',
        notes: 'Good session',
        sessionRpe: 7,
        tags: ['legs'],
        finishedAt: now,
      });

      expect(result.ok).toBe(true);
      const state = viewStore.get<ActivitiesState>('sessions');
      const session = state?.byId[sessionId];
      expect(session?.name).toBe('New Name');
      expect(session?.notes).toBe('Good session');
      expect(session?.status).toBe('finished');
      expect(session?.rpe).toBe(7);
    });

    it('finished session: updates note and name separately', async () => {
      const USER = 'u-fous-2' as Id<'User'>;
      const start = await handleStartSession({ type: 'StartSession', userId: USER, name: 'Original' });
      expect(start.ok).toBe(true);
      const sessionId = (start as { ok: true; value: { sessionId: string } }).value.sessionId as Id<'Activity'>;

      await handleFinishSessionWithDetails({
        type: 'FinishSessionWithDetails',
        sessionId,
        sessionRpe: 5,
        finishedAt: Date.now(),
      });

      const result = await handleFinishOrUpdateSession({
        type: 'FinishOrUpdateSession',
        sessionId,
        isActive: false,
        name: 'Updated Name',
        notes: 'Added later',
      });

      expect(result.ok).toBe(true);
      const state = viewStore.get<ActivitiesState>('sessions');
      const session = state?.byId[sessionId];
      expect(session?.name).toBe('Updated Name');
      expect(session?.notes).toBe('Added later');
    });
  });
  ```

  Also add to the imports at the top of the file:
  ```typescript
  import { handleFinishOrUpdateSession } from './handlers';
  ```

- [ ] **Step 2: Run the test to confirm it fails**

  Run: `npx vitest run features/training_log/commands/handlers.test.ts`
  Expected: FAIL with `handleFinishOrUpdateSession is not a function` (or similar import error).

---

### Task 3: Implement `handleFinishOrUpdateSession`

**Files:**
- Modify: `features/training_log/commands/handlers.ts`

- [ ] **Step 1: Read `handleFinishSessionWithDetails`, `handleUpdateSessionNote`, `handleRenameSession`, `handleUpdateSessionStartTime`, and `handleUpdateSessionDetails` in `handlers.ts`**

  These are the five handlers whose logic the new handler will absorb. Read each to understand what events they produce.

- [ ] **Step 2: Add the implementation after `handleFinishSessionWithDetails`**

  ```typescript
  export async function handleFinishOrUpdateSession(
    cmd: FinishOrUpdateSession,
  ): Promise<Result<void, string>> {
    if (cmd.isActive) {
      // Active session: one atomic finish-with-details event covers everything
      if (!cmd.finishedAt) return err('finishedAt is required to finish an active session');
      return handleFinishSessionWithDetails({
        type: 'FinishSessionWithDetails',
        sessionId: cmd.sessionId,
        name: cmd.name,
        notes: cmd.notes,
        sessionRpe: cmd.sessionRpe,
        tags: cmd.tags,
        finishedAt: cmd.finishedAt,
      });
    }

    // Already-finished session: dispatch one event per changed field
    const results: Array<Result<void, string>> = [];

    if (cmd.name !== undefined) {
      results.push(await handleRenameSession({
        type: 'RenameSession',
        sessionId: cmd.sessionId,
        name: cmd.name,
      }));
    }

    if (cmd.notes !== undefined) {
      results.push(await handleUpdateSessionNote({
        type: 'UpdateSessionNote',
        sessionId: cmd.sessionId,
        notes: cmd.notes,
      }));
    }

    if (cmd.startedAt !== undefined) {
      results.push(await handleUpdateSessionStartTime({
        type: 'UpdateSessionStartTime',
        sessionId: cmd.sessionId,
        startedAt: cmd.startedAt,
      }));
    }

    if (cmd.sessionRpe !== undefined || cmd.tags !== undefined || cmd.finishedAt !== undefined) {
      results.push(await handleUpdateSessionDetails({
        type: 'UpdateSessionDetails',
        sessionId: cmd.sessionId,
        sessionRpe: cmd.sessionRpe,
        tags: cmd.tags,
        finishedAt: cmd.finishedAt,
      }));
    }

    const failure = results.find(r => !r.ok);
    if (failure) return failure;
    return ok(undefined);
  }
  ```

  Add `FinishOrUpdateSession` to the import list at the top of `handlers.ts`.

- [ ] **Step 3: Run the failing test — expect it to pass now**

  Run: `npx vitest run features/training_log/commands/handlers.test.ts`
  Expected: all tests pass including the new ones.

- [ ] **Step 4: TypeScript check**

  Run: `npx tsc --noEmit`
  Expected: zero errors.

- [ ] **Step 5: Commit**

  ```bash
  git add features/training_log/commands/handlers.ts features/training_log/domain/types.ts features/training_log/commands/handlers.test.ts
  git commit -m "feat(training_log): add handleFinishOrUpdateSession command"
  ```

---

### Task 4: Export from barrel and add to contract

**Files:**
- Modify: `features/training_log/index.ts`
- Modify: `features/training_log/contract.ts`

- [ ] **Step 1: Export the new handler from the barrel**

  In `features/training_log/index.ts`, add:
  ```typescript
  export { handleFinishOrUpdateSession } from './commands/handlers';
  ```

- [ ] **Step 2: Export the command type from contract**

  In `features/training_log/contract.ts`, add `FinishOrUpdateSession` to the commands export:
  ```typescript
  export type { FinishOrUpdateSession } from './domain/types';
  ```

- [ ] **Step 3: TypeScript check**

  Run: `npx tsc --noEmit`
  Expected: zero errors.

- [ ] **Step 4: Commit**

  ```bash
  git add features/training_log/index.ts features/training_log/contract.ts
  git commit -m "feat(training_log): export handleFinishOrUpdateSession from barrel and contract"
  ```

---

### Task 5: Simplify `useFinishSession`

**Files:**
- Modify: `ui/screens/session/useFinishSession.ts`

- [ ] **Step 1: Read `ui/screens/session/useFinishSession.ts` in full**

  Identify the six `useCommand` calls and the `submit()` function that branches on `isActiveSession`.

- [ ] **Step 2: Replace all six `useCommand` calls with one**

  Remove:
  ```typescript
  const { dispatch: updateNote } = useCommand(handleUpdateSessionNote);
  const { dispatch: renameSession } = useCommand(handleRenameSession);
  const { dispatch: updateStartTime } = useCommand(handleUpdateSessionStartTime);
  const { dispatch: updateDetails } = useCommand(handleUpdateSessionDetails);
  const { dispatch: finishWithDetails } = useCommand(handleFinishSessionWithDetails);
  const { dispatch: saveTemplate } = useCommand(handleCreateTemplate);
  ```

  Replace with:
  ```typescript
  const { dispatch: finishOrUpdate } = useCommand(handleFinishOrUpdateSession);
  const { dispatch: saveTemplate } = useCommand(handleCreateTemplate); // keep — template save is separate
  ```

  Update the imports: remove the five handler imports that are no longer used; add `handleFinishOrUpdateSession`.

- [ ] **Step 3: Simplify `submit()`**

  The `submit()` function currently has an `if (isActiveSession)` branch that calls different handlers. Replace the body with a single call:

  ```typescript
  async function submit() {
    await finishOrUpdate({
      type: 'FinishOrUpdateSession',
      sessionId: form.sessionId,
      isActive: isActiveSession,
      name: form.name !== originalName ? form.name : undefined,
      notes: form.notes !== originalNotes ? form.notes : undefined,
      sessionRpe: form.rpe,
      tags: form.tags,
      startedAt: form.startedAt,
      finishedAt: isActiveSession ? form.endTime : undefined,
    });

    if (form.saveAsTemplate) {
      await saveTemplate({ ... });
    }
  }
  ```

  Adjust field names to match what `useFinishSession` actually uses (read the existing `submit()` to see the exact field names).

- [ ] **Step 4: Run TypeScript check**

  Run: `npx tsc --noEmit`
  Expected: zero errors.

- [ ] **Step 5: Manual smoke test**

  Start the dev server (`npm run dev`) and:
  1. Start a session, add a block, and finish it via the finish-session screen. Verify name, notes, RPE save correctly.
  2. Navigate to a past finished session and edit its name/notes. Verify changes persist.

- [ ] **Step 6: Commit**

  ```bash
  git add ui/screens/session/useFinishSession.ts
  git commit -m "refactor(ui): simplify useFinishSession to one handler dispatch"
  ```

---

## Self-Review

**Spec coverage:** ✓ New `FinishOrUpdateSession` command type (Task 1). ✓ Failing test written before implementation (Task 2). ✓ Handler implemented (Task 3). ✓ Exported from barrel and contract (Task 4). ✓ UI hook simplified (Task 5).

**Placeholder scan:** No placeholders. The `submit()` in Task 5 Step 3 says "adjust field names to match" — that instruction requires reading the existing file first, which is Task 5 Step 1. No code is deferred.

**Type consistency:** `FinishOrUpdateSession` is defined in Task 1 and used consistently in Tasks 2, 3, and 5. The `handleFinishOrUpdateSession` name is consistent throughout.
