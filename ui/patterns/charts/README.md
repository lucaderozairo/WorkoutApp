# Chart Patterns

Composed chart components built from primitives. Pure presentation: take data, render SVG, emit interaction events.

- `ScatterSetsChart` — weight progression for one exercise
- `MultiExerciseChart` — normalized comparison across exercises
- `MonthlyProgressionChart` — cardio metric over months
- `RunSplitsChart` — pace per split
- `ElevationChart` — elevation profile for a route
- `SleepHistoryChart` — 7-night sleep score trend
- `VolumeChart` — weekly tonnage

Charts know nothing about features. They consume `Series` types from `shared/types`.
