# Event Bus

In-process pub/sub for domain events. Synchronous dispatch by default; async via `core/queue/job_queue` for slow consumers.

## API
- `publish(event)` — fan out to all subscribers, awaits sync handlers
- `subscribe(eventType, handler, options)` — register a consumer
- `unsubscribe(token)` — remove a subscription

## Ordering
Events are delivered in publish order *per aggregate*. Cross-aggregate ordering is not guaranteed and consumers must not depend on it.

## Failure handling
- Sync handler throws → logged, error event published, original publish re-raises
- Async handler throws → routed to `core/queue/dead_letter`

## Backpressure
Sync handlers run inline. If a handler is slow, it should be marked async at registration time so it goes through the queue instead of blocking publish.
