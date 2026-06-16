# Atomic Finish-Session Command Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 5-sequential-handler `useFinishSession` submit flow with a single `FinishSessionWithDetails` command that emits all required events atomically in one `eventRepository.commit()` call.

**Architecture:** Add a new compound command type. A single handler builds all the events (note, rename, start-time, finish, details) and returns them together — `defineCommand` commits the whole array atomically. `useFinishSession` calls one handler instead of five. The individual handlers (`handleRenameSession`, etc.) are untouched and remain usable independently.

**Tech Stack:** TypeScript, Vitest, React, existing `defineCommand` / `applyAll` infrastructure.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `features/training_log/domain/types.ts` | Add `FinishSessionWithDetails` command type |
| Modify | `features/training_log/commands/handlers.ts` | Add `handleFinishSessionWithDetails` handler |
| Modify | `features/training_log/commands/handlers.test.ts` | Add integration test |
| Modify | `features/training_log/index.ts` | Export new handler |
| Modify | `ui/screens/session/useFinishSession.ts` | Use single handler in `submit()` |

---

## Task 1: Add FinishSessionWithDetails command type

**Files:**
- Modify: `features/training_log/domain/types.ts`

- [ ] **Step 1.1: Add FinishSessionWithDetails interface**

In `features/training_log/domain/types.ts`, in the commands section, add after `UpdateSessionDetails`:

```typescript
/** Bundles all finish-session edits into one atomic command. */
export interface FinishSessionWithDetails {
  type: 'FinishSessionWithDetails';
  sessionId: Id<'Activity'>;
  name?: string;
  startedAt?: number;
  finishedAt?: number;
  notes?: string;
  sessionRpe?: number;
  tags?: string[];
  media?: string[];
}
```

Add to the `TrainingLogCommand` union:

```typescript
| FinishSessionWithDetails
```

- [ ] **Step 1.2: `npx tsc --noEmit` — 0 errors**

- [ ] **Step 1.3: Commit**

```bash
git add features/training_log/domain/types.ts
git commit -m "feat(training_log): add FinishSessionWithDetails command type"
```

---

## Task 2: Implement handleFinishSessionWithDetails handler

**Files:**
- Modify: `features/training_log/commands/handlers.ts`
- Modify: `features/training_log/commands/handlers.test.ts`

- [ ] **Step 2.1: Write failing test**

Add to `features/training_log/commands/handlers.test.ts`:

```typescript
import {
  handleStartSession, handleAddBlock, handleLogStrengthSet,
  handleFinishSessionWithDetails,
} from './handlers';
import type { ActivitiesState } from '../projections';

describe('handleFinishSessionWithDetails', () => {
  it('finishes session atomically — name, note, start-time, details all applied', async () => {
    const USER = 'u-finish-1' as Id<'User'>;
    const start = await handleStartSession({ type: 'StartSession', userId: USER, name: 'Old Name' });
    expect(start.ok).toBe(true);
    const sessionId = (start as { ok: true; value: { sessionId: string } }).value.sessionId as Id<'Activity'>;

    await handleFinishSessionWithDetails({
      type: 'FinishSessionWithDetails',
      sessionId,
      name: 'New Name',
      notes: 'Great session',
      sessionRpe: 8,
      tags: ['push', 'upper'],
      finishedAt: Date.now(),
    });

    const state = viewStore.get<ActivitiesState>('sessions');
    const session = state?.byId[sessionId];
    expect(session).toBeDefined();
    expect(session?.name).toBe('New Name');
    expect(session?.notes).toBe('Great session');
    expect(session?.status).toBe('finished');
    expect(session?.rpe).toBe(8);
    expect(session?.tags).toEqual(['push', 'upper']);
  });

  it('skips rename event if name is undefined', async () => {
    const USER = 'u-finish-2' as Id<'User'>;
    await handleStartSession({ type: 'StartSession', userId: USER, name: 'Keep This Name' });
    const active = viewStore.get<ActivityView>('active_session');
    expect(active).not.toBeNull();
    const sessionId = active!.id;

    await handleFinishSessionWithDetails({
      type: 'FinishSessionWithDetails',
      sessionId,
      sessionRpe: 7,
    });

    const state = viewStore.get<ActivitiesState>('sessions');
    const session = state?.byId[sessionId];
    expect(session?.name).toBe('Keep This Name');
    expect(session?.status).toBe('finished');
  });
});
```

- [ ] **Step 2.2: Run test — fail**

```bash
npx vitest run features/training_log/commands/handlers.test.ts
```
Expected: FAIL — `handleFinishSessionWithDetails not found`

- [ ] **Step 2.3: Add handler to `features/training_log/commands/handlers.ts`**

Import the new type at the top (it should already be in the existing imports from `../domain/types` — add `FinishSessionWithDetails` to the import list).

Then add the handler after the existing `handleUpdateSessionDetails`:

```typescript
export async function handleFinishSessionWithDetails(
  cmd: FinishSessionWithDetails,
): Promise<Result<void, string>> {
  const sessionsState = viewStore.get<ActivitiesState>('sessions');
  const session = sessionsState?.byId[cmd.sessionId];
  if (!session) return err(`Session ${cmd.sessionId} not found`);

  const exerciseSummaries: ExerciseSummary[] = session.segments.map(seg => ({
    exerciseName: seg.exerciseName,
    exerciseCategory: seg.exerciseCategory,
    setCount: seg.sets.length,
    totalVolume: seg.sets.reduce((acc, s) => acc + (('weightKg' in s ? (s.weightKg ?? 0) : 0) * ('reps' in s ? (s.reps ?? 0) : 0)), 0),
  }));

  const events: TrainingLogEvent[] = [];

  if (cmd.notes !== undefined && cmd.notes !== session.notes) {
    events.push({
      type: 'SessionNoteUpdated',
      aggregateId: cmd.sessionId,
      aggregateType: 'Session',
      timestamp: systemClock.now(),
      version: 1,
      payload: { sessionId: cmd.sessionId, notes: cmd.notes },
    });
  }

  events.push({
    type: 'SessionFinished',
    aggregateId: cmd.sessionId,
    aggregateType: 'Session',
    timestamp: systemClock.now(),
    version: 1,
    payload: {
      sessionId: cmd.sessionId,
      finishedAt: cmd.finishedAt ?? systemClock.now(),
      ...(cmd.sessionRpe !== undefined ? { sessionRpe: cmd.sessionRpe } : {}),
      ...(cmd.tags !== undefined ? { tags: cmd.tags } : {}),
      exerciseSummaries,
    },
  });

  if (cmd.name !== undefined && cmd.name !== session.name) {
    events.push({
      type: 'SessionRenamed',
      aggregateId: cmd.sessionId,
      aggregateType: 'Session',
      timestamp: systemClock.now(),
      version: 1,
      payload: { sessionId: cmd.sessionId, name: cmd.name },
    });
  }

  if (cmd.startedAt !== undefined && cmd.startedAt !== session.startedAt) {
    events.push({
      type: 'SessionStartTimeUpdated',
      aggregateId: cmd.sessionId,
      aggregateType: 'Session',
      timestamp: systemClock.now(),
      version: 1,
      payload: { sessionId: cmd.sessionId, startedAt: cmd.startedAt },
    });
  }

  const hasDetails = cmd.finishedAt !== undefined || cmd.sessionRpe !== undefined || cmd.tags !== undefined || (cmd.media && cmd.media.length > 0);
  if (hasDetails) {
    events.push({
      type: 'SessionUpdated',
      aggregateId: cmd.sessionId,
      aggregateType: 'Session',
      timestamp: systemClock.now(),
      version: 1,
      payload: {
        sessionId: cmd.sessionId,
        ...(cmd.finishedAt !== undefined ? { finishedAt: cmd.finishedAt } : {}),
        ...(cmd.sessionRpe !== undefined ? { rpe: cmd.sessionRpe } : {}),
        ...(cmd.tags !== undefined ? { tags: cmd.tags } : {}),
        ...(cmd.media !== undefined ? { media: cmd.media } : {}),
      },
    });
  }

  return commitTrainingLogEvents(events);
}
```

**Note:** `commitTrainingLogEvents` is the private `defineCommand` wrapper already defined earlier in `handlers.ts`. `TrainingLogEvent`, `ExerciseSummary`, `ActivitiesState` are already imported. `FinishSessionWithDetails` needs to be added to the import list from `../domain/types`.

- [ ] **Step 2.4: Add `handleFinishSessionWithDetails` to the imports in handlers.ts types import line**

The `FinishSessionWithDetails` type must be in the import block at the top of `handlers.ts`. Find the existing import and add it:

```typescript
import type {
  // ... existing types ...
  FinishSessionWithDetails,
  // ...
} from '../domain/types';
```

- [ ] **Step 2.5: Run tests — pass**

```bash
npx vitest run features/training_log/commands/handlers.test.ts
```
Expected: all PASS

- [ ] **Step 2.6: Commit**

```bash
git add features/training_log/domain/types.ts features/training_log/commands/handlers.ts features/training_log/commands/handlers.test.ts
git commit -m "feat(training_log): add handleFinishSessionWithDetails — atomic session-finish command"
```

---

## Task 3: Export the new handler and update useFinishSession

**Files:**
- Modify: `features/training_log/index.ts`
- Modify: `ui/screens/session/useFinishSession.ts`

- [ ] **Step 3.1: Export from feature index**

In `features/training_log/index.ts`, find where other handlers are exported and add:

```typescript
export { handleFinishSessionWithDetails } from './commands/handlers';
```

- [ ] **Step 3.2: Update useFinishSession.ts imports**

In `ui/screens/session/useFinishSession.ts`, replace:

```typescript
import {
  handleFinishSession, handleUpdateSessionNote,
  handleRenameSession, handleUpdateSessionStartTime, handleUpdateSessionDetails,
} from '@features/training_log';
```

With:

```typescript
import {
  handleFinishSession,
  handleUpdateSessionNote,
  handleRenameSession,
  handleUpdateSessionStartTime,
  handleUpdateSessionDetails,
  handleFinishSessionWithDetails,
} from '@features/training_log';
```

- [ ] **Step 3.3: Add useCommand binding for the new handler**

In `useFinishSession.ts`, after the existing `useCommand` calls, add:

```typescript
const { dispatch: finishWithDetails } = useCommand(handleFinishSessionWithDetails);
```

- [ ] **Step 3.4: Replace the submit() active-session path**

The `submit` function currently has an `if (isActiveSession)` branch that calls 5 handlers. Replace that branch with:

```typescript
if (isActiveSession) {
  finishedAtRef.current = newFinishedAt ?? Date.now();

  await finishWithDetails({
    type: 'FinishSessionWithDetails',
    sessionId: sid,
    ...(name !== oldName ? { name } : {}),
    ...(notes !== oldNotes ? { notes } : {}),
    ...(rpe !== null ? { sessionRpe: rpe } : {}),
    ...(tags.length > 0 ? { tags } : {}),
    ...(newStartedAt !== undefined && newStartedAt !== oldStartedAt ? { startedAt: newStartedAt } : {}),
    finishedAt: newFinishedAt ?? Date.now(),
    ...(photos.length > 0 ? { media: photos } : {}),
  });

  setFinished(true);
}
```

Keep the `else` (already-finished edit) branch unchanged — it can stay as-is for now.

- [ ] **Step 3.5: `npx tsc --noEmit` — 0 errors**

- [ ] **Step 3.6: Clean up unused useCommand bindings**

The following hooks are now unused in the active-session path:

```typescript
const { dispatch: finish } = useCommand(handleFinishSession);
const { dispatch: updateNote } = useCommand(handleUpdateSessionNote);
const { dispatch: renameSession } = useCommand(handleRenameSession);
const { dispatch: updateStartTime } = useCommand(handleUpdateSessionStartTime);
const { dispatch: updateDetails } = useCommand(handleUpdateSessionDetails);
```

Check if any of these are still used in the `else` branch. If yes, keep them. If the `else` branch also uses them, they remain. If none are used, remove the unused ones to avoid dead code.

- [ ] **Step 3.7: Commit**

```bash
git add features/training_log/index.ts ui/screens/session/useFinishSession.ts
git commit -m "refactor(session): use atomic handleFinishSessionWithDetails in useFinishSession"
```

---

## Task 4: Verify the finish-session flow works in the running app

- [ ] **Step 4.1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 4.2: Manual test — active session finish**

1. Navigate to an active session
2. Fill in name, notes, RPE, tags
3. Submit
4. Verify session appears in history with correct name, notes, tags, RPE
5. Check browser console — no errors

- [ ] **Step 4.3: Manual test — already-finished session edit**

1. Navigate to a finished session → Edit (the `else` path)
2. Change name, save
3. Verify name updated

- [ ] **Step 4.4: Run full test suite**

```bash
npx vitest run
```
Expected: all PASS (or same failures as before this change)

- [ ] **Step 4.5: Commit if any small fixes needed from manual testing**

```bash
git add -p
git commit -m "fix(session): post-review fixes from manual finish-session test"
```
