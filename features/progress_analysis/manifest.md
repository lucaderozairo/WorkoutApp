# Feature: progress_analysis

Cross-cutting analysis queries used by Progress and Analytics tabs. Owns annotations on charts.

## Commands
`AddAnnotation`, `RemoveAnnotation`, `PinSport`, `ReorderPinnedSports`

## Events
`AnnotationAdded`, `AnnotationRemoved`, `SportPinned`, `PinnedSportsReordered`

## Projections
`annotations_by_exercise`, `pinned_sports`, `exercise_comparison_cache`

## Queries
`getProgressionForExercise`, `compareExercises(ids[])`, `getAnnotations(exerciseId)`, `getPinnedSports`

## Dependencies
- `core/events`, `core/computation`, `shared/contracts`
- Reads from `data/repositories` and `data/projections/views`
- No direct UI imports
