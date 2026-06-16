# Layer Rules (Lint-Enforceable)

The app has two separate architectural flows:

1. **Backend/domain flow** — event-sourced CQRS modules that own commands, events, projections, queries, storage, and shared contracts.
2. **Frontend/UI flow** — screens users see and interact with, built from an atomic design system.

The frontend may consume backend/domain behavior through feature contracts, queries, commands, and the sanctioned read-model binding. The backend/domain flow must not know about UI modules.

## Backend/domain flow

Backend/domain modules are organized around event-sourced features.

```
app
  -> features
  -> data
  -> core
  -> shared
```

Responsibilities:

| Layer | Owns | May depend on |
|---|---|---|
| `app/*` | bootstrapping, route wiring, registry setup | everything |
| `features/*` | commands, events, reducers, projections, policies, queries | same feature, `data/*`, `core/*`, `shared/*` |
| `data/*` | event store, view store, repositories, data sources, projection infrastructure | `core/*`, `shared/*` |
| `core/*` | framework-agnostic computation, clocks, events, IDs, telemetry | `shared/*` |
| `shared/*` | primitive contracts and cross-feature types | nothing project-specific |

Feature modules never import other feature implementations. Cross-feature behavior happens through domain events, shared contracts, and rare shared projections.

## Frontend/UI flow

Screens are what users see and interact with. They are assembled from an atomic design system:

```
styling tokens
  -> atom primitives
  -> layouts
  -> generic molecules
  -> project-specific components
  -> screens
```

Responsibilities:

| Layer | Owns | Examples |
|---|---|---|
| `styling/*` | design tokens, global CSS rules, component classes | colors, spacing, typography, button/card/input classes |
| `ui/atoms/*` | atom primitives | `Button`, `Text`, `Icon`, `Avatar`, `Checkbox` |
| `ui/layout/*` | layout primitives | `Row`, `Column`, `Grid`, `Surface`, screen shells |
| `ui/molecules/*` | generic reusable UI patterns | action sheets, breadcrumbs, fields, segmented controls |
| `ui/components/*` | project-specific components composed from atoms/layouts/molecules | workout cards, health views, session components |
| `ui/screens/*` | route-level user workflows and screen state | dashboard, sessions, progress, routes, profile |
| `ui/bindings/*` | sanctioned React adapter for feature commands and read models | `useCommand`, `useQuery` |

CSS should style the atomic design system first. Prefer reusable classes and tokens on atoms, layouts, molecules, and project-specific components. Screens should mostly arrange components and connect state; they should not create one-off visual systems.

## Dependency direction

A layer may only depend on layers below it, plus explicitly sanctioned seams.

```
app               <- may depend on everything
ui/screens        <- ui/components, ui/molecules, ui/layout, ui/atoms, ui/bindings, features, core, shared
ui/components     <- ui/molecules, ui/layout, ui/atoms, features, core, shared
ui/molecules      <- ui/layout, ui/atoms, core, shared
ui/layout         <- ui/atoms, core, shared
ui/atoms          <- core, shared
ui/bindings       <- data/projections/views, features, shared
features          <- same feature, data, core, shared
data              <- core, shared
core              <- shared
shared            <- nothing project-specific
styling           <- nothing
config            <- nothing
```

`ui/bindings/*` is the named seam where React talks to the read model and command handlers. Other UI modules should go through bindings, feature contracts, feature queries, or project-specific components rather than importing storage/infrastructure directly.

## Forbidden imports (catch in CI)

| From | To | Why |
|---|---|---|
| `ui/*` except `ui/bindings/*` | `data/*` | UI must not couple to infrastructure; bindings are the single adapter |
| `ui/*` | `features/*/commands` | UI dispatches via bindings or feature public exports, not command internals |
| `features/*` | `ui/*` | Backend/domain modules have no UI knowledge |
| `features/*` | `features/<other>/*` implementation modules | Cross-feature behavior uses events/contracts |
| `data/*` | `features/*` runtime modules | Data infrastructure must not depend on feature implementation |
| `core/*` | `features/*` | Core is feature-agnostic |
| `core/*` | `data/*` | Core has no I/O |
| `shared/*` | anything project-specific | Shared stays reusable and dependency-light |
| `styling/*` | TypeScript modules | CSS/tokens style UI; they do not depend on app logic |

## Cross-feature communication

Features never call each other directly.

They communicate by:

1. **Events** — feature A emits, feature B subscribes.
2. **Shared contracts** — feature A and B agree on a stable type or event name.
3. **Shared projections** — both read the same view, rarely; this is usually a design smell unless documented.

If feature A needs feature B to do work, feature A emits an event and feature B's policy reacts.

## CSS discipline

CSS belongs to the design system, not individual screens.

- Define visual language in `styling/*` with tokens first.
- Style atoms, layouts, molecules, and project-specific components with reusable classes.
- Use layout primitives for spacing and arrangement instead of one-off screen CSS.
- Avoid inline styles. Dynamic values should flow through CSS custom properties with a documented exception.
- Do not create a parallel visual system inside a screen.
