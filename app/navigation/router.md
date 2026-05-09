# Router

Tab-based navigation with nested modal routes. The router holds no business logic — it only maps routes to UI compositions.

## Route table

| Route | Layout | Tab |
|---|---|---|
| `/dashboard` | `ui/layouts/dashboard_screen` | Dashboard |
| `/log` | `ui/layouts/log_screen` | Log |
| `/log/session/:id` | `ui/layouts/session_edit_screen` | Log |
| `/progress` | `ui/layouts/progress_screen` | Progress |
| `/progress/session/:id` | `ui/layouts/session_detail_screen` | Progress |
| `/analytics` | `ui/layouts/analytics_screen` | Analytics |
| `/social` | `ui/layouts/social_screen` | Social |
| `/social/event/:id` | `ui/layouts/event_detail_screen` | Social |
| `/profile` | `ui/layouts/profile_screen` | Profile |
| `/notifications` | `ui/layouts/notifications_screen` | — |

## Modal routes
Modals are addressable so they can be deep-linked and back-button-aware.

| Route | Modal pattern |
|---|---|
| `/dashboard/day/:date` | `DayDetailSheet` |
| `/dashboard/appointment/:id` | `AppointmentModal` |
| `/*/session-popup/:id` | `SessionPopup` |

## Guards
- Auth guard: redirects to `/profile/auth` if `core/security/auth` reports no valid session.
- Feature-flag guard: hides routes for features absent from the active manifest.
- Onboarding guard: forces `/profile/onboarding` until completion event recorded.

## Notes
- The router is the *only* place that knows about screens. Features and UI patterns never import from `app/navigation/`.
- Tab order is configurable via `config/feature_flags`; the router reads it once at mount.
