# Feature: profile

User identity, preferences, and injury tracking. Owns the user aggregate.

## Commands
`UpdateProfile`, `SetUnitPreference`, `RecordInjury`, `ResolveInjury`

## Events
`ProfileUpdated`, `UnitsChanged`, `InjuryRecorded`, `InjuryResolved`

## Projections
`profile`, `active_injuries`, `preferences`

## Queries
`getProfile`, `getActiveInjuries`, `getPreferences`

## Dependencies
- `core/events`, `core/computation`, `shared/contracts`
- Reads from `data/repositories` and `data/projections/views`
- No direct UI imports
