# Analytics Pipelines

Event-stream → feature-store transformations. Each pipeline declares:
- Input event types
- Window (tumbling, sliding, session)
- Output features written to `feature_store`

Pipelines are pure with respect to their inputs. Re-running a pipeline over the same events produces identical features.

## Examples
- `weekly_volume_per_exercise` — sums set tonnage per exercise per ISO week
- `pace_trend_per_sport` — rolling 4-week pace average per cardio sport
- `frequency_per_muscle_group` — sessions per muscle group per week
