# Consumers

Subscribers that react to events. Consumers never write events directly — they may invoke commands, which produce new events.

Categories:
- **Projection builders** — fold events into read models
- **Policies** — react with new commands (saga-like flows)
- **Side effects** — push notifications, analytics emit, etc.

All consumers must be idempotent: replays must produce the same result.
