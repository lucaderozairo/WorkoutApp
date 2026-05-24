# Feature: planning

Planned-session scheduling, saved cardio routes, and reusable workout templates. The active editing surface (per recent commits) — handles the wizard's plan/route/template lifecycle.

## Commands
`PlanSession`, `DeletePlannedSession`, `SaveRoute`, `DeleteSavedRoute`, `SaveTemplate`, `DeleteSavedTemplate`

## Events
`SessionPlanned`, `PlannedSessionDeleted`, `RouteSaved`, `RouteDeleted`, `TemplateSaved`, `TemplateDeleted`

## Projections
`planned_sessions`, `saved_routes`, `saved_templates`

## Queries
`getPlannedSessions()`, `getUpcomingPlans()`, `getSavedRoutes()`

## Dependencies
- `core/events`, `shared/types`
- `data/projections/builders`
- Domain helpers: `formatPace`, `parsePace`, `buildMarkers` (in `domain/markers.ts`)
- Read by `ui/layouts/session/NewSessionScreen`, the wizard's `StepCardio`, and the saved-routes screen
- No direct UI imports
