# Project Structure

A quick map of what is live, what is archived, and the layering rules that hold
the codebase together. For the deeper architectural intent see
[`architecture_suggested.md`](./architecture_suggested.md) and
[`LAYER_RULES.md`](./LAYER_RULES.md).

## Live directories

| Path | Role |
|------|------|
| `app/` | React entry point, router, top-level shell |
| `ui/layouts/` | Screens — thin orchestrators that compose components and read viewStore via `useQuery` |
| `ui/components/` | Reusable presentational components (health, session, log, widgets, social, modals, …) |
| `ui/bindings/` | The single sanctioned UI↔data bridge (`useQuery`, `useCommand`). Subscribes to viewStore. |
| `ui/patterns/` | Generic visual primitives (e.g. `charts/`) |
| `ui/data/` | Static catalogs used by UI (e.g. `EXERCISES`) — never user data |
| `features/` | Event-sourced domain modules: `commands/`, `events/`, `projections/`, `queries/`, `domain/types.ts` |
| `data/mock/` | Static seed data pushed into the viewStore by `data/mock/seed.ts` in prototype mode |
| `data/projections/` | `ProjectionBuilder`, `projectionRegistry`, `viewStore` |
| `data/sources/` | File parsers (GPS, MFP CSV), local persistence, remote stubs |
| `data/store/` | `inMemoryEventStore` (`HybridEventStore`) |
| `core/` | Cross-cutting infrastructure: `events/` bus, `errors/`, `computation/`, `clock`, `id-generator`, `logger` |
| `shared/` | Types and utilities used across layers (`Id`, `DomainEvent`, `Sport`, `Result`) |
| `config/` | App mode, environment selection |
| `styling/` | Global CSS — tokens, layout, buttons, components, wizard, nav |
| `public/` | Static assets + `404.html` (GitHub Pages SPA redirect) |

## Archived / historical

These exist as reference and are not imported by live code:

- `prototypes/dashboard-widgets.html` — static HTML widget mockup
- `docs/html prototypes/` — 11 historical HTML mockups
- `docs/superpowers/`, `docs/ARCHITECTURE_ANALYSIS.md` — design notes
- `evaluate/` — empty results bucket
- `plugins/installed/` — README-only placeholder
- `core/analytics/`, `core/monitoring/`, `core/queue/`, `core/security/`, `core/telemetry/`, `core/workers/` — stub directories for planned subsystems
- `plans/` — implementation plan files (completed and todo)

## Layering rules

These are enforced by convention; future ESLint rules should formalise them.

1. **UI never imports from `data/mock/*`.** All mock data flows through the
   viewStore. UI components read with `useQuery(key)` and dispatch with
   `useCommand(handler)`. Mock-display types live in `features/<x>/domain/mock-types.ts`
   and are re-exported from `features/<x>/index.ts`.
2. **Screens are thin orchestrators.** `ui/layouts/*.tsx` should compose
   components, plumb route params, and call command handlers — not contain
   inline presentational JSX. Target < 250 lines per layout. `LogScreen.tsx` is
   the current exception (legacy size; partial decomposition complete, more
   to extract in `ui/components/session/`).
3. **Features own their domain.** Each feature module exports its types,
   events, commands, projections, and queries. Cross-feature imports go
   through the feature's public `index.ts`.
4. **`features/health` is the canonical example** of the
   commands → events → projections → viewStore loop. Use it (and
   `features/planning`) as templates for new features.
5. **GitHub Pages mode** (`APP_MODE === 'github-pages'`) skips the mock
   seeder entirely. The app renders empty states naturally — no inline
   `APP_MODE !== 'github-pages'` checks should live inside view components.
