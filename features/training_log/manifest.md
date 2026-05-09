# Feature: training_log

Training sessions, blocks (exercise groupings), sets, and related session metadata.
Owns the event-sourced session/block/set model used by logging and history.

## Commands

### Session lifecycle
- `StartSession` — open a new session for a user.
- `FinishSession` — close the active session; emits enriched `SessionFinished` with exercise summaries for downstream consumers (progression, coaching).
- `DeleteSession` — remove a session.
- `RenameSession` — inline rename (active or finished).
- `UpdateSessionStartTime` — correct `startedAt` after the fact.
- `UpdateSessionNote` — session-level freeform notes.

### Blocks (one block = one exercise within a session)
- `AddBlock` — add an exercise block.
- `UpdateBlockNote` — per-block freeform notes.
- `SetBlockType` — `straight | superset | circuit | emom | amrap`.
- `SetBlockRounds` — round count for rounds-based block types.
- `SetBlockRest` — target rest (0..600 s).
- `ReorderBlocks` — explicit reorder (toggle-on-drag from UI).
- `AddToSuperset` / `LeaveSuperset` — group / ungroup blocks (auto-ungroups when <2 remain).

### Sets
- `LogStrengthSet`, `LogCardioSet` — append a set.
- `UpdateSet` — edit weight/reps/distance/duration/isWarmup (any subset).
- `RemoveSet` — delete + renumber remaining sets.
- `ChangeSetType` — `normal | dropset | giant | emom | amrap`.
- `LogRPE` — 1..10 RPE per set.
- `ToggleSetFailed` — mark set as failure.
- `UpdateSetComment` — per-set freeform comment.

PR flagging is **auto-detected** by the reducer (highest non-warmup weight×reps per block). The `PRFlagged` event still exists for manual/backfill flagging.

## Events

Mirrors the command list: `SessionStarted`, `SessionFinished`, `SessionDeleted`, `SessionRenamed`, `SessionStartTimeUpdated`, `SessionNoteUpdated`, `BlockAdded`, `BlockNoteUpdated`, `BlockTypeSet`, `BlockRoundsSet`, `BlockRestSet`, `BlocksReordered`, `BlockAddedToSuperset`, `BlockLeftSuperset`, `SetLogged`, `SetUpdated`, `SetRemoved`, `SetTypeChanged`, `SetCommentUpdated`, `RPELogged`, `SetFailed`, `PRFlagged`.

## Projections

- `active_session` — the single in-progress session (nulls on `SessionFinished` / `SessionDeleted`).
- `editing_session` — full `TrainingLogState` (all sessions, flat). Survives finish so the log page can edit completed sessions by id.
- `session_history` — compact list of completed sessions, newest first.
- `recent_exercises` — distinct exercises (keyed by `category::name.lower()`) with `lastUsedAt` + `useCount`, sorted desc.

## Queries

- `getActiveSession()` → `ActiveSessionView | null`
- `getEditingSession(sessionId)` → `TrainingSession | undefined`
- `getSessionHistory()` → `SessionHistoryItem[]`
- `getRecentExercises(limit?)` → `RecentExercise[]`

## Dependencies

- `core/events`, `core/id-generator`, `core/clock`, `shared/types`
- Reads from `data/repositories` and `data/projections/views`
- Publishes `SessionFinished` via `core/events/bus` for cross-feature policies (progression, coaching, adherence, goals, streaks, training-load, equipment mileage)
- No direct UI imports
