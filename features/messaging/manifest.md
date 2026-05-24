# Feature: messaging

Scaffolded but not yet active. Only exports UI shape types (`MockUpcomingCall`, `MockRecentMessage`) consumed by mock data in `data/mock/messages.ts`.

## Commands
None.

## Events
None.

## Projections
None. View store is seeded directly with mock data.

## Queries
None. UI reads mock-shaped values via `useQuery` against the seeded keys.

## Dependencies
- `shared/types` (none currently)
- Mock data lives in `data/mock/messages.ts`

> When real messaging lands, this feature should follow the standard commands/events/projections/queries layout — see `features/cardio/manifest.md` for the template.
