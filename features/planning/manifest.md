# Feature: planning

Planned-session scheduling and reusable workout templates. Saved routes now live in `features/routes`; this feature keeps the session/template editing surface.

## Commands
`PlanSession`, `DeletePlannedSession`, `SaveTemplate`, `DeleteSavedTemplate`

## Events
`SessionPlanned`, `PlannedSessionDeleted`, `TemplateSaved`, `TemplateDeleted`

## Projections
`planned_sessions`, `saved_templates`

## Queries
`getPlannedSessions()`, `getUpcomingPlans()`

## Dependencies
- `core/events`, `shared/types`
- `data/projections/builders`
- Domain helpers: `formatPace`, `parsePace`, `buildMarkers` (in `domain/markers.ts`)
- Read by `ui/layouts/session/NewSessionScreen` and the wizard's planning/template steps
- No direct UI imports
