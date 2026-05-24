# Feature: habits

Daily/weekly habit tracking with streak detection.

## Commands
`CreateHabit`, `LogHabitCompletion`, `DeleteHabit`

## Events
`HabitCreated`, `HabitCompleted`, `HabitStreakBroken`, `HabitDeleted`

## Projections
`habits_today`

## Queries
`getHabitsToday()`, `getHabitById(id)`

## Dependencies
- `core/events`, `shared/types`
- `data/projections/builders`
- Policy `registerStreakMilestonePolicy` emits `HabitStreakBroken` when a scheduled completion is missed
- No direct UI imports
