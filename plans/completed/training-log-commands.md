# Training Log — New Commands for Log Page Redesign

## Context
The log page redesign (`plans/todo/log-page-redesign.md`) introduces interactions the current domain can't serve:
- unchecking a logged set → needs `RemoveSet`
- reorder mode → needs `ReorderBlocks`
- per-exercise rest default → needs `SetBlockRest`
- long-press comment → needs `UpdateSetComment`
- superset grouping as a first-class concept → needs `AddToSuperset` / `LeaveSuperset`

All commands follow the existing event-sourced pattern in `features/training_log/`:
1. Add command type + payload to `domain/types.ts`.
2. Add matching event type + payload.
3. Extend reducers in `domain/reducers.ts`.
4. Add handler in `commands/handlers.ts`.
5. Update affected projections in `projections/` and queries in `queries/`.

## Scope
In scope: `features/training_log/*` only. No UI imports; no changes to other features.
Out of scope: migrations for old event streams (these are additive events; existing streams continue to replay correctly).

---

## 1. `RemoveSet`

### Command
```ts
export interface RemoveSet {
  type: 'RemoveSet';
  sessionId: Id<'Session'>;
  blockId: Id<'Block'>;
  setNumber: number;
}
```

### Event
```ts
DomainEvent<'SetRemoved', SetRemovedPayload>

export interface SetRemovedPayload {
  sessionId: Id<'Session'>;
  blockId: Id<'Block'>;
  setNumber: number;
}
```

### Reducer behavior
- Remove the set with matching `setNumber` from `block.sets`.
- Renumber remaining sets: any set with `setNumber > removed` decrements by 1.
- If the removed set was flagged PR, recompute PR flag for that block (next-highest weight × reps).

### Validation
- Reject if `sessionId` is not in `activeSessions` (can't mutate finished sessions — mark as open question; may need a "reopen session" flow).
- Reject if block has only one set and user is mid-session (optional — user may want to clear and re-log).

### Projection updates
- `recent_lift_sessions` — decrement set count for that block.
- `exercise_progression` — if the removed set was the highest, recompute last-performance cache.

---

## 2. `ReorderBlocks`

### Command
```ts
export interface ReorderBlocks {
  type: 'ReorderBlocks';
  sessionId: Id<'Session'>;
  blockIds: Id<'Block'>[];   // full desired order, all block IDs in session
}
```

### Event
```ts
DomainEvent<'BlocksReordered', BlocksReorderedPayload>

export interface BlocksReorderedPayload {
  sessionId: Id<'Session'>;
  blockIds: Id<'Block'>[];
}
```

### Reducer behavior
- Validate `blockIds` is a permutation of the session's current block IDs (same set, same length).
- Reassign `block.order` field based on index in `blockIds`.
- Sort `session.blocks` by the new order.

### Validation
- Reject if `blockIds` length ≠ current block count.
- Reject if any id is unknown to the session.
- **Superset invariant**: blocks in the same superset group must stay contiguous. If the new order breaks contiguity, reject with a clear error (UI should prevent this, but domain enforces).

### Why a single "full order" command vs pairwise swaps
- Atomic — one event per reorder session, easier to replay and inspect.
- Matches how the reorder-mode UI will work (user confirms full list on `Done`).

---

## 3. `SetBlockRest`

### Schema change
Add `restSeconds?: number` to `Block` in `domain/types.ts`. Default behavior when absent: fall back to a session-level default (or 90s).

### Command
```ts
export interface SetBlockRest {
  type: 'SetBlockRest';
  sessionId: Id<'Session'>;
  blockId: Id<'Block'>;
  restSeconds: number;   // 0–600
}
```

### Event
```ts
DomainEvent<'BlockRestSet', BlockRestSetPayload>

export interface BlockRestSetPayload {
  sessionId: Id<'Session'>;
  blockId: Id<'Block'>;
  restSeconds: number;
}
```

### Reducer
- Set `block.restSeconds = payload.restSeconds`.
- Clamp to `[0, 600]` in handler before emitting.

### Projection updates
- None required. UI reads directly from the session view.

---

## 4. `UpdateSetComment`

The `StrengthSet.comment` field already exists in `domain/types.ts` but has no command or event.

### Command
```ts
export interface UpdateSetComment {
  type: 'UpdateSetComment';
  sessionId: Id<'Session'>;
  blockId: Id<'Block'>;
  setNumber: number;
  comment: string;   // empty string clears
}
```

### Event
```ts
DomainEvent<'SetCommentUpdated', SetCommentUpdatedPayload>

export interface SetCommentUpdatedPayload {
  sessionId: Id<'Session'>;
  blockId: Id<'Block'>;
  setNumber: number;
  comment: string;
}
```

### Reducer
- Find set, set `set.comment = payload.comment`.
- No-op on cardio sets (comment is strength-only per current type def — or expand type to allow cardio comments; decide during implementation).

---

## 5. Supersets: `AddToSuperset` / `LeaveSuperset`

### Design decision to make first
Two modeling options:

**Option A — Group ID on block** (preferred)
Add `supersetGroupId?: Id<'SupersetGroup'>` to `Block`. Two blocks share a group ⇒ they're a superset. `blockType: 'superset'` becomes derived (block is in a supersetGroup). Order within group is implicit from block order.

**Option B — Keep `blockType: 'superset'` as flag, rely on adjacency**
Simpler but fragile: reordering that separates the blocks silently breaks the group.

**Recommendation**: Option A — explicit group IDs. Prevents the "reorder broke my superset" class of bugs and lets a superset span a contiguous range cleanly.

### Commands (assuming Option A)
```ts
export interface AddToSuperset {
  type: 'AddToSuperset';
  sessionId: Id<'Session'>;
  blockId: Id<'Block'>;
  groupId: Id<'SupersetGroup'>;   // reuse existing group if adding to one; new id otherwise
}

export interface LeaveSuperset {
  type: 'LeaveSuperset';
  sessionId: Id<'Session'>;
  blockId: Id<'Block'>;
}
```

### Events
```ts
DomainEvent<'BlockAddedToSuperset', { sessionId; blockId; groupId }>
DomainEvent<'BlockLeftSuperset',    { sessionId; blockId }>
```

### Reducer
- `AddToSuperset`: set `block.supersetGroupId = groupId`. If group now has ≥2 blocks, they render as a superset.
- `LeaveSuperset`: clear `block.supersetGroupId`. If remaining group has <2 blocks, clear the last member too (auto-ungroup orphans).

### Validation
- `AddToSuperset` requires the target blocks to be adjacent in order. Reject if adding would create a non-contiguous group.
- On `ReorderBlocks`, enforce contiguity (see §2).

---

## 6a. `RenameSession`

### Command
```ts
export interface RenameSession {
  type: 'RenameSession';
  sessionId: Id<'Session'>;
  name: string;
}
```

### Event
```ts
DomainEvent<'SessionRenamed', { sessionId: Id<'Session'>; name: string }>
```

### Reducer
- Set `session.name = payload.name.trim()`.
- Reject empty string.

### UI trigger
- Tap session name in `SessionHeader` → inline edit → blur or Enter dispatches.

## 6. `UpdateSessionStartTime`

For the "tap name to edit date/time" affordance when back-logging a workout.

### Command
```ts
export interface UpdateSessionStartTime {
  type: 'UpdateSessionStartTime';
  sessionId: Id<'Session'>;
  startedAt: number;   // epoch ms
}
```

### Event
```ts
DomainEvent<'SessionStartTimeUpdated', { sessionId; startedAt }>
```

### Reducer
- Update `session.startedAt`.
- If session is `finished` and `startedAt > finishedAt`, reject.

### Note
**Required** per user decision — the log-page redesign exposes date/time editing in PRE-START and in finished-session edit mode.

---

## Implementation order
1. `RemoveSet` — smallest, unblocks uncheck-to-remove UX.
2. `SetBlockRest` — schema addition + straightforward command.
3. `UpdateSetComment` — pure field write, no reducer nuance.
4. `ReorderBlocks` — adds permutation validation; adopt before superset work.
5. `AddToSuperset` / `LeaveSuperset` — depends on schema change + ReorderBlocks invariants.
6. `UpdateSessionStartTime` — only if UX demands it.

## Testing
For each command, add reducer tests covering:
- Happy path.
- Validation rejections (unknown id, wrong state).
- Event replay: apply events to empty state and confirm projection matches direct command dispatch.
- Projection invalidation where relevant (§1, §5).

## Acceptance
- All six commands exported from `features/training_log/index.ts` with `handleX` wrappers matching existing conventions.
- `TrainingLogCommand` and `TrainingLogEvent` union types extended.
- Reducer tests green.
- No UI imports reach into domain internals.
- Existing event streams replay unchanged (new events are additive).

## 7. `SwapBlockExercise` — DEFERRED (blocked on catalog)

Requires catalog to reference target exercise meaningfully. Dropped from this phase; revisit with catalog follow-up plan. In the meantime, users change a block's exercise by removing it and adding a new one (sets are lost — acceptable tradeoff for v1 since the UX still works).

### Original spec (kept for reference when catalog ships)

Replace the exercise reference on an existing block while preserving its logged sets and order. Powers the "Swap exercise" entry in the block ⋯ menu (single-select mode of `ExercisePickerModal`).

### Command
```ts
export interface SwapBlockExercise {
  type: 'SwapBlockExercise';
  sessionId: Id<'Session'>;
  blockId: Id<'Block'>;
  exerciseId: Id<'Exercise'>;
  exerciseName: string;
  exerciseCategory: ExerciseCategory;
}
```

### Event
```ts
DomainEvent<'BlockExerciseSwapped', BlockExerciseSwappedPayload>

export interface BlockExerciseSwappedPayload {
  sessionId: Id<'Session'>;
  blockId: Id<'Block'>;
  exerciseId: Id<'Exercise'>;
  exerciseName: string;
  exerciseCategory: ExerciseCategory;
}
```

### Reducer
- Update `block.exerciseId`, `block.exerciseName`, `block.exerciseCategory`.
- Sets are preserved as-is.
- If new category differs from old (e.g. strength → cardio), flag validation warning but still apply — UI should prevent this selection unless the user confirms.

### Projection updates
- `exercise_progression` — recompute for both old and new exercise ids (sets move from old's history to new's).
- `recent_lift_sessions` — update block's displayed exercise.

### Open question
- Is swapping across categories (strength ↔ cardio) allowed? Sets of one type don't make sense under the other. Lean: reject swap if categories differ; require delete-and-add instead.

## Exercise catalog — DEFERRED

Current reality: no catalog exists. `AddBlock` mints a fresh `exerciseId` per block; `exercise_progression` keys off `exerciseName` normalized. Building a proper catalog aggregate + `CreateExercise` command + seed data doubles Phase 1 scope.

**v1 approach (this redesign)**: `ExercisePickerModal` operates on free-text exercise names:
- **Frequent / Recent** sections read from a new `recent_exercises` projection that derives distinct exercises from past `BlockAdded` events (keyed by normalized name + category). No new commands required.
- **Search** filters the recent list; if no match, offers `+ Use "<query>"` which dispatches a plain `AddBlock` with that free-text name.
- **No muscle / equipment metadata** in v1. Filter bar omits those rows; category-only filtering.
- **No `CreateExercise` / `SwapBlockExercise` / `Exercise` schema extension** this phase.

Follow-up plan (separate file, not yet written): `exercise_catalog` aggregate, `CreateExercise` command, seed global catalog, migrate `AddBlock` to accept `exerciseId`, add muscle/equipment metadata. Revisit after the log-page redesign ships.

## Locked decisions
- **Editing a logged set → new `UpdateSet` command** (not a second `LogStrengthSet`). Keeps the event stream semantically clean; reducer replaces the existing set's fields in place, no renumber.
- **PR flagging stays auto-detected** by the reducer. No user-facing `ToggleSetPR` command.
- **`RemoveSet` UX**: uncheck tap shows a confirmation press + 5-second undo toast. The `RemoveSet` command itself is simple (hard remove, renumber); the confirmation lives in the UI layer.

## `UpdateSet` spec (added per locked decision)
```ts
export interface UpdateSet {
  type: 'UpdateSet';
  sessionId: Id<'Session'>;
  blockId: Id<'Block'>;
  setNumber: number;
  weightKg?: number;
  reps?: number;
  distanceMeters?: number;
  durationSeconds?: number;
  isWarmup?: boolean;
}
// Event: DomainEvent<'SetUpdated', SetUpdatedPayload> with same optional fields.
```
Reducer merges provided fields into the target set; fields omitted are untouched. Re-runs PR detection after the merge (auto-detect rule preserved).

## Post-finish editability (locked)

**Finished sessions remain editable.** All mutation commands (`LogStrengthSet`, `LogCardioSet`, `UpdateSet`, `RemoveSet`, `UpdateSetComment`, `UpdateBlockNote`, `UpdateSessionNote`, `AddBlock`, `ReorderBlocks`, `SwapBlockExercise`, `AddToSuperset`, `LeaveSuperset`, `ChangeSetType`, `LogRPE`, `ToggleSetFailed`, `SetBlockType`, `SetBlockRounds`, `SetBlockRest`) must accept `sessionId` for either `active` or `finished` sessions.

Reducer changes:
- Drop the "active only" guard in every handler.
- `FinishSession` / `SessionFinished` remains a one-way transition (session status `finished`); further edits emit normal events but don't flip status back.
- Projections replay events in order — no change needed.
- `exercise_progression` must recompute correctly when a historical set is edited/removed (it already does on event replay; confirm with tests).

UI implication:
- "Recent sessions" list → tap session → opens the same log screen, but header reads `Editing · <name>` instead of `Finish`. Footer shows `Close` (no finish, already finished).
- No re-Finish button; edits persist as they're dispatched.

## Block notes (confirm wired)

`UpdateBlockNote` already exists in `domain/types.ts` and emits `BlockNoteUpdated`. Make sure the log-page UI surfaces the `📝 Add a note` affordance on every `BlockCard` and that it dispatches this command. No new domain work.

## Open questions
1. Should `RemoveSet` be soft (tombstone) or hard (renumber)? Current lean: hard-remove (simpler, matches user expectation now that the UI provides the undo toast).
2. Superset group ID generation — use `cryptoIdGenerator.next<'SupersetGroup'>()` at handler level? Confirm ID brand naming with `@shared/types`.
3. Cross-category swaps (`SwapBlockExercise` strength ↔ cardio) — reject or allow?
