# Inference Runner

Async runner that executes model predictions on demand.

## Flow
1. Caller submits inference job to `job_queue` with model id + input
2. `analytics_worker` picks up the job
3. Runner loads model (cached after first load)
4. Runs prediction
5. Writes result event (e.g. `insights.PlateauDetected`)

Inference is never run synchronously on the UI thread.
