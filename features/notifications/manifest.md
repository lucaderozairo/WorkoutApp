# Feature: notifications

In-app notification center and a rules engine that maps incoming events to notification messages. **Not event-sourced** — uses plain TS classes (`NotificationCenter`, `NotificationRulesEngine`, `NotificationPreferences`) rather than the commands/events/projections pattern.

## Commands
None (the feature exposes class APIs: `NotificationCenter.add/getAll/markRead`, `NotificationRulesEngine.evaluate`).

## Events
None of its own. `NotificationRulesEngine.evaluate(event)` accepts a loosely-typed `NotificationEvent` (any `{ type, … }` shape).

## Projections
None.

## Queries
None — UI calls into the class instances directly.

## Dependencies
- None — pure TS, no event bus or view store integration yet.

> This feature is an outlier from the project's event-sourced convention. If it grows beyond the in-memory class API, it should migrate to commands/events/projections (see `features/cardio/manifest.md`).
