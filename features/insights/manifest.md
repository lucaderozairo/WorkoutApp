# Feature: insights

Auto-generated insights surfaced in Progress and Analytics.

## Commands
(none — driven by analytics pipelines, not user commands)

## Events
`PlateauDetected`, `PRAchieved`, `VolumeSpike`, `FrequencyDrop`, `OvertrainingRisk`

## Projections
`insights_by_sport`, `insights_by_exercise`

## Queries
`getInsightsForSport(sport)`, `getInsightsForExercise(id)`

## Dependencies
- `core/events`, `core/computation`, `shared/contracts`
- Reads from `data/repositories` and `data/projections/views`
- No direct UI imports
