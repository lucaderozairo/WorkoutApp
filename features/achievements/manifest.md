# Feature: achievements

Track user achievements across workouts. Checks conditions (session counts, PR weights, cardio distances, consecutive day streaks) and unlocks achievements when thresholds are met.

## Commands
`CheckAchievements`

## Events
`AchievementUnlocked`, `AchievementProgressUpdated`, `AchievementCheckRequested`

## Projections
`user_achievements`

## Queries
`getAchievements()`, `getUnlockedCount()`, `getAchievementById(id)`

## Dependencies
- `core/clock`, `core/events`
- Reads from `data/projections/views`
- Subscribes to: `SessionFinished` (from training_log), `CardioSessionRecorded` (from cardio)
- No direct feature imports — cross-feature data arrives via event bus
