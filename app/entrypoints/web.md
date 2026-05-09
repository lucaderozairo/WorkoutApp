# Web Entrypoint

Platform-specific shell that bootstraps the app on web.

## Responsibilities
- Initialize platform APIs (storage, notifications, sensors)
- Render the platform's root component (`ui/platform/web`)
- Forward platform lifecycle events to `app/bootstrap/lifecycle`
- Handle deep links via `app/navigation/deep_links`

## Does not contain
- Any feature logic
- Any rendering beyond the root mount
- Any data access
