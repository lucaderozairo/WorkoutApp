# Feature: nutrition

Track daily food, supplement, vitamin, and water intake with optional macro tracking.

## Commands
`LogNutrition`, `DeleteNutritionEntry`

## Events
`NutritionLogged`, `NutritionEntryDeleted`

## Projections
`nutrition_log`

## Queries
`getNutritionLog()`, `getTodaysNutrition()`

## Dependencies
- `core/clock`, `core/id-generator`
- Reads from `data/projections/views`
- No direct UI imports
