# Feature: cardio

All cardio sports (run, cycle, swim, row, hike, ski). Single feature with sport discriminator.

## Commands
`RecordCardioSession`, `UpdateCardioSession`, `DeleteCardioSession`, `ImportFromFile`

## Events
`CardioSessionRecorded`, `CardioSessionUpdated`, `CardioSessionDeleted`, `RouteImported`

## Projections
`recent_cardio_sessions`, `monthly_cardio_progression`, `route_library`

## Queries
`getRecentCardioSessions(sport?)`, `getMonthlyProgression(sport, metric, range)`, `getSessionById`

## Dependencies
- `core/events`, `core/computation`, `shared/contracts`
- Reads from `data/repositories` and `data/projections/views`
- No direct UI imports
