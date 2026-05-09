# Environments

One subdirectory per environment.

- `dev/` — local dev, mocked remotes
- `staging/` — staging cluster, real but isolated data
- `prod/` — production

Each environment file declares: API endpoints, log levels, sync mode, feature flag overrides, telemetry destinations.
