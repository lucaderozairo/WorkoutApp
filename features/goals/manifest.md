# Feature: goals

User-defined fitness goals with progress tracking and completion lifecycle.

## Commands
`CreateGoal`, `UpdateGoalProgress`, `CompleteGoal`, `DeleteGoal`

## Events
`GoalCreated`, `GoalProgressUpdated`, `GoalCompleted`, `GoalDeleted`

## Projections
`active_goals`, `completed_goals`

## Queries
`getActiveGoals()`, `getCompletedGoals()`, `getGoalById(id)`

## Dependencies
- `core/events`, `shared/types`
- `data/projections/builders` (ProjectionBuilder, projectionRegistry)
- Policy `registerGoalUpdatePolicy` syncs progress from external metric events
- No direct UI imports
