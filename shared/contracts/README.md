# Contracts

Interface definitions shared across layers. Implementations live in `core` or `data`; consumers depend only on the interface.

## Examples
- `Clock` — `now() → Instant`. Production impl in `core`, fake in tests.
- `IdGenerator` — `next() → Id`
- `EventStore` — append, read, subscribe
- `Repository<T>` — load, save
- `Logger` — log levels and structured fields
- `JobQueue` — enqueue, dequeue
- `RemoteClient` — generic transport contract

These exist so features and tests can depend on stable interfaces rather than concrete implementations.
