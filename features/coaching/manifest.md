# Feature: coaching

Generates training insights (load, plateau, deload) by reacting to `SessionFinished` events from `training_log`. A read-model / policy feature — listens to other features and writes coaching insights into the view store.

## Commands
`DismissInsight`

## Events
None of its own. Listens to `SessionFinished` (from `training_log`).

## Projections
`active_insights`, `insight_history`

## Queries
`getActiveInsights()`, `getInsightHistory()`

## Dependencies
- `core/events` (event bus subscription)
- `data/projections/views` (reads `health_metrics`, `exercise_progressions`, `plan_adherence`, `session_rpe_history`; writes `active_insights`, `insight_history`)
- Reads from `features/training_log` (event payload) and `features/progression` (projection state)
- No direct UI imports
