# Project Structure

A quick map of what is live and the layering rules that hold the codebase together.
See [`LAYER_RULES.md`](./LAYER_RULES.md) for import restrictions.

## Live directories

| Path | Role |
|------|------|
| `app/` | React entry point (`app/entrypoints/index.tsx`), router (`app/registry/App.tsx`) |
| `ui/screens/` | Screens — thin orchestrators that compose components and read viewStore via `useQuery` |
| `ui/atoms/` | Generic, zero-dependency UI primitives (Button, Surface, Input, …) |
| `ui/molecules/` | Composed generics built from atoms (Modal, Tabs, ScreenHeader, …) |
| `ui/layout/` | Layout-only components (Grid, Row, Column, Spacer, …) — no business logic |
| `ui/navigation/` | App shell navigation (AppNav, Sidebar, BottomSheet, SegmentedControl) |
| `ui/components/` | Project-specific components grouped by domain (session/, log/, health/, widgets/, …) |
| `ui/patterns/` | Generic visual primitives (e.g. `charts/`) |
| `ui/bindings/` | The single sanctioned UI↔data bridge (`useQuery`, `useCommand`) |
| `ui/icons/` | Activity/sport icon map (`activityIcons.ts`) |
| `features/` | Event-sourced domain modules: `commands/`, `events/`, `projections/`, `queries/`, `domain/` |
| `data/mock/` | Static seed data pushed into the viewStore by `data/mock/seed.ts` in prototype mode |
| `core/` | Cross-cutting infrastructure: `events/` bus, `errors/`, `computation/`, `clock`, `id-generator`, `logger` |
| `shared/` | Types and utilities used across layers (`Id`, `DomainEvent`, `Sport`, `Result`) |
| `config/` | App mode and environment selection (`app-mode.ts`) |
| `styling/` | Global CSS — tokens, layout, buttons, components, route-planner, map (Leaflet overrides), nav |
| `public/` | Static assets + `404.html` (GitHub Pages SPA redirect) |

## Layering rules

See [`LAYER_RULES.md`](./LAYER_RULES.md) for the full dependency matrix. Key rules:

1. **UI never imports from `data/mock/*`.** All mock data flows through the viewStore.
2. **Screens are thin orchestrators.** `ui/screens/` should compose components, plumb route params, and call command handlers — target < 250 lines. Screens above target: `RoutePlannerScreen.tsx` (~745), `TrainingPlansScreen.tsx` (~371), `ProgressScreen.tsx` (~335), `EditSessionScreen.tsx` (~265).
3. **Features own their domain.** Cross-feature communication goes through events, never direct imports.
4. **`features/health` is the canonical example** of the commands → events → projections → viewStore loop.
5. **GitHub Pages mode** (`APP_MODE === 'github-pages'`) skips the mock seeder — no inline `APP_MODE` checks inside view components.
