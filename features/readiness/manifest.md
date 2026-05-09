# Feature: readiness

Sleep tracking and training readiness scoring.

## Commands
`RecordSleep`, `SetReadinessOverride`

## Events
`SleepRecorded`, `ReadinessComputed`, `ReadinessOverridden`

## Projections
`sleep_history`, `readiness_score`

## Queries
`getLastNightSleep`, `getSleepHistory(days)`, `getReadinessScore`

## Dependencies
- `core/events`, `core/computation`, `shared/contracts`
- Reads from `data/repositories` and `data/projections/views`
- No direct UI imports
