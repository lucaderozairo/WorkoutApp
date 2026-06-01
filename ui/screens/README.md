# Layouts

Top-level screen compositions. Each route in `app/navigation/router` maps to one layout.

## Screens
- `dashboard_screen` — composes all dashboard widgets in scrollable column
- `log_screen` — current workout being logged
- `progress_screen` — feed mode + analyse mode with toggle
- `analytics_screen` — analyse mode only (no feed, no toggle)
- `social_screen` — events directory + friend activity
- `profile_screen` — profile + readiness + diagnostics
- `session_detail_screen` — full session view
- `session_edit_screen` — editable session
- `event_detail_screen` — event participation

## Composition rules
- Layouts subscribe to queries via `ui/bindings`
- Layouts pass data down to widgets and modals as props
- Layouts own only screen-level view state (open modal id, scroll position)
- All other state lives in features or `ui/view_state`
