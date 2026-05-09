# Job Queue

Durable, ordered queue for deferred work. Jobs survive app restarts.

## Storage
Backed by `data/sources/local` with a `jobs` table. Each job records: id, type, payload, attempts, next_attempt_at, status.

## Retry
Exponential backoff with jitter. Max attempts configurable per job type. Exhausted jobs move to `dead_letter`.
