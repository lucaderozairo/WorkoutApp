# Modal Patterns

Reusable modal shells.

- `DayDetailSheet` — bottom sheet showing schedule + sessions for a date
- `SessionDetailModal` — full session view (lift or cardio variant)
- `RunModal` — run-specific detail with route player
- `CardioDetailModal` — generic cardio detail
- `AppointmentModal` — add/edit appointment
- `EventDetailModal` — event info + join/leave action
- `WorkoutDetailModal` — grouped exercises within a workout
- `BlueprintModal` — save / load blueprint flow

Modal shells receive their data via props from the screen layout; they do not query directly. The screen layout owns query subscriptions and passes data down.
