# Feature: health

Canonical health chart data (resting HR, HRV, sleep, weight, etc.) organised by category. Named in `STRUCTURE.md` as the canonical example of the commands → events → projections → viewStore loop.

## Commands
`SeedHealthCharts`

## Events
`HealthChartsSeeded`

## Projections
`health_charts`

## Queries
`getHealthCharts()`, `getHealthChartsForCategory(slug)`

## Dependencies
- `core/events`, `shared/types`
- `data/projections/builders`
- Seeded once at startup (prototype mode) by `data/mock/seed.ts`
- No direct UI imports — consumed via `useQuery('health_charts')` in `HealthOverviewTab` and the health widgets
