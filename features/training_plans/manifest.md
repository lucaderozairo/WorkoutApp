# Feature: training_plans

Multi-week training programmes with day-of-week workout assignments and adherence tracking.

## Commands
`CreatePlan`, `UpdatePlan`, `AssignWorkoutToDay`, `DeletePlan`

## Events
`PlanCreated`, `PlanUpdated`, `DayAssigned`, `PlanDeleted`, `PlannedSessionCompleted`, `PlannedSessionSkipped`

## Projections
`active_plan`, `plan_list`, `plan_adherence`

## Queries
`getActivePlan()`, `getPlanList()`, `getPlanById(id)`, `getPlanAdherence()`

## Dependencies
- `core/events`, `shared/types`
- `data/projections/builders`
- Policy `registerAdherencePolicy` derives `plan_adherence` from completed/skipped session events
- No direct UI imports
