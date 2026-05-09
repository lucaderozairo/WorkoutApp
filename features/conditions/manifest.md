# Feature: conditions

Weather and per-sport suitability. Mostly read-through cache over remote provider.

## Commands
`RefreshConditions`

## Events
`ForecastFetched`, `SuitabilityComputed`

## Projections
`current_conditions`, `suitability_by_sport`

## Queries
`getCurrentConditions`, `getSuitability(sport)`

## Dependencies
- `core/events`, `core/computation`, `shared/contracts`
- Reads from `data/repositories` and `data/projections/views`
- No direct UI imports
