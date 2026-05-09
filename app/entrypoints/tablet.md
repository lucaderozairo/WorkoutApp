# Tablet Entrypoint

Platform-specific shell that bootstraps the app on tablet.

## Responsibilities
- Initialize platform APIs (storage, notifications, sensors)
- Render the platform's root component (`ui/platform/tablet`)
- Forward platform lifecycle events to `app/bootstrap/lifecycle`
- Handle deep links via `app/navigation/deep_links`

## Does not contain
- Any feature logic
- Any rendering beyond the root mount
- Any data access
