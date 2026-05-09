# Initializers

Ordered startup sequence. Each phase must complete before the next begins.

## Phase 1 — Config
1. Load environment from `config/environments/<env>`.
2. Resolve feature flags from `config/feature_flags`.
3. Resolve enabled plugin set from `config/plugins`.

## Phase 2 — Core
1. Initialize `core/monitoring/logger` with config sink.
2. Start `core/monitoring/metrics` and `core/monitoring/tracing`.
3. Initialize `core/security/secure_storage` and unlock keystore.
4. Start `core/queue/job_queue` (drain pending jobs from previous session).

## Phase 3 — Data
1. Open `data/event_store/log`.
2. Load latest `data/event_store/snapshots` if available.
3. Replay events since snapshot via `data/event_store/replay`.
4. Build/refresh `data/projections/views` (incremental rebuild only).
5. Start `data/sync/scheduler` if sync mode is hybrid or live.

## Phase 4 — Features
1. Read `app/registry/feature_manifest`.
2. For each active feature, register its commands, event handlers, and projections via `app/bootstrap/container`.
3. Start `features/*/policies` (reactive subscriptions to the event bus).

## Phase 5 — Workers
1. Start `core/workers/sync_worker`.
2. Start `core/workers/analytics_worker`.
3. `core/workers/compute_worker` is started lazily on first job.

## Phase 6 — UI
1. Mount platform entrypoint (`app/entrypoints/<platform>`).
2. Resolve initial route from deep link or last-session state.
3. Render.

## Failure handling
Any phase failure halts startup and routes to a recoverable error screen. Phase 3 failures trigger a "rebuild from event log" recovery path.
