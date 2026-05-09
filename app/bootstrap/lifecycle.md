# Application Lifecycle

Hooks fired by the platform shell. Features subscribe via `core/events/bus`.

## Hooks
- `app.starting` — before any phase 1 work
- `app.ready` — after phase 6 mount
- `app.pause` — backgrounded (mobile) or tab-hidden (web)
- `app.resume` — foregrounded
- `app.shutdown` — graceful termination

## Pause behavior
- `sync_worker` finishes current batch then idles
- `analytics_worker` checkpoints and idles
- Open WebSocket streams downgrade to keepalive
- Pending jobs persist via `job_queue`

## Resume behavior
- Replay any events received via push while paused
- Resume sync if `sync_mode != offline-only`
- Re-subscribe streams
- Refresh time-sensitive projections (conditions, news)
