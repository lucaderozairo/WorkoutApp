# Analytics Worker

Runs `core/analytics/pipelines` and `core/analytics/inference` jobs.

## Schedule
- Hourly: refresh feature store from new events
- Daily: retrain lightweight models (insights thresholds)
- On-demand: when user opens Analytics tab and projection is stale
