# Feature: scheduling

Personal appointments and joined event participation. Drag-reorder is event-sourced.

## Commands
`AddAppointment`, `UpdateAppointment`, `DeleteAppointment`, `ReorderAppointments`, `JoinEvent`, `LeaveEvent`

## Events
`AppointmentAdded`, `AppointmentUpdated`, `AppointmentDeleted`, `AppointmentsReordered`, `EventJoined`, `EventLeft`

## Projections
`appointments_by_date`, `joined_events`, `schedule_for_day`

## Queries
`getScheduleForDay(date)`, `getAppointments(range)`, `getJoinedEvents(range)`

## Dependencies
- `core/events`, `core/computation`, `shared/contracts`
- Reads from `data/repositories` and `data/projections/views`
- No direct UI imports
