# Feature: progression

Per-exercise volume history and plateau detection. A read-model / policy feature — listens to `SessionFinished` from `training_log` and updates a single view-store key.

## Commands
None.

## Events
None of its own. Listens to `SessionFinished` (from `training_log`).

## Projections
`exercise_progressions` (written directly via `viewStore.set` from the policy, not via a `ProjectionBuilder`).

## Queries
`getProgressionForExercise(name)`, `getAllProgressions()`

## Dependencies
- `core/events` (event bus subscription via `registerProgressionPolicy`)
- `data/projections/views` (writes `exercise_progressions`)
- Reads from `features/training_log` (event payload)
- No direct UI imports
