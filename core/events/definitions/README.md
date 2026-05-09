# Event Definitions

One file per event type. Events are versioned and immutable. Renaming fields is forbidden — add a new version and an upcaster instead.

Files in this directory contain only schema and validation. They never reference handlers, projections, or UI.

## Naming
`<feature>.<PastTenseVerb>` — e.g. `training_log.SetLogged`, `cardio.RunRecorded`.
