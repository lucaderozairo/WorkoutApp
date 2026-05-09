# Dependency Container

A single registration point for all injectable services. Features and UI layers receive dependencies via constructor injection — never via global imports.

## Registration categories

- **Singletons** — `EventBus`, `EventStore`, `Logger`, `Clock`, `IdGenerator`, `JobQueue`
- **Scoped** — per-request or per-screen (e.g., `QueryContext`)
- **Transient** — created per call (e.g., command handlers)

## Resolution rules
1. Features may only resolve interfaces declared in `shared/contracts`.
2. UI may only resolve query handlers and command dispatchers.
3. Direct resolution of `data/*` from UI is forbidden — must go through a feature.

## Test substitution
The container exposes a `withOverrides(...)` API used in tests to swap real implementations for fakes. Production code never calls this.
