# Transitions

Cross-screen animation definitions. Pure presentation; no logic.

## Defaults
- Tab switch: instant cross-fade (200ms)
- Push within tab: slide-from-right (300ms, ease-out)
- Modal present: slide-from-bottom (350ms, spring)
- Sheet present: spring rise with backdrop fade

## Per-route overrides
- `dashboard → day_detail`: shared-element transition on date cell
- `progress → session_detail`: hero transition on session card
- `social → event_detail`: shared-element on event banner

## Reduced motion
When the OS reports reduced-motion preference, all transitions collapse to a 100ms opacity fade.
