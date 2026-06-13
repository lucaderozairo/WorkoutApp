# Feature: insights

Auto-generated insights surfaced in Progress. Owns the single insight system —
generation (the cross-domain policy) and storage (event-sourced projection) both
live here; there is no separate coaching feature.

## Commands

`emitInsight({ type, title, message, sport?, exerciseId? })` — the one insight
write-path. Driven by the policy, not by direct user action.

## Events

`PlateauDetected`, `PRAchieved`, `VolumeSpike`, `FrequencyDrop`, `OvertrainingRisk`
— all share one payload; severity is derived from the type at projection time.

## Policies

`registerInsightsPolicy()` — on `SessionFinished`, synthesises insights from
read-models (training load, exercise plateaus, deload signals) and emits them.

## Projections

`insights` — a single rolling, de-duplicated feed (newest first, capped).

## Queries

`getInsights()`

## Dependencies

- `core/events`, `shared/contracts`
- Reads `data/projections/views` read-models (health_metrics, exercise_progressions,
  plan_adherence, session_rpe_history)
- Subscribes to `@features/training_log/contract` event names
- No direct UI imports
