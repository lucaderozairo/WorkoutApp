# Feature: stretching

Log stretching sessions with support for preset routines and custom sessions. Tracks completed vs planned stretches.

## Commands
`LogStretching`

## Events
`StretchingLogged`

## Projections
`stretching_log`

## Queries
`getStretchingLog()`

## Dependencies
- `core/clock`, `core/id-generator`
- Reads from `data/projections/views`
- No direct UI imports
