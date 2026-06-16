# CSS Ownership Audit - 2026-06-15

## Purpose

This audit records the intended CSS owner for each reusable UI responsibility after the generic atomic component pass. A component may map to a class, a safe native element selector, a data or ARIA state selector, or to composition through atoms and layout primitives.

CSS should stay close to behavior, state, mechanics, private constraints, and domain token mapping. Generic typography, layout, surfaces, overlays, and value display should come from primitives first.

## Selector Ownership Inventory

| Area | Primary selectors | Owner | Classification | Action |
| --- | --- | --- | --- | --- |
| Button | `button[data-ui="button"]`, `.button`, input submit/reset/button | `Button` molecule and native form controls | `keep-css-behavior` | Keep base control behavior here. Native `button` alone is intentionally not used because raw buttons such as switches, tabs, and page dots have their own mechanics. |
| Button variants | `.primary`, `.secondary`, `.ghost`, `.destructive`, `.sm`, `.lg`, `.icon`, `.block`, `.active` when scoped under button owner selectors | `Button` molecule | `keep-css-behavior` | Keep as variant/state selectors. Prefer typed `Button` props over passing these through `className`. |
| Surface | `.surface`, `.flat`, `.ghost`, `.inset`, `.accent`, `.selected`, `.interactive` | `Surface` atom | `handoff-to-Surface` | Product CSS should not recreate card/panel/tile shells. Use `Surface` first, then keep only private constraints in product CSS. |
| Text | `h1`-`h6`, `.display`, `.brand`, `.eyebrow`, `.detail`, `.caption`, `.muted`, `.faint`, `.mono` | `Text`, `Metric`, `DataValue`, semantic HTML | `handoff-to-Text` | Product CSS should not repeat these for local labels, captions, values, or helper text. Use `Text` props and semantic `as`. |
| Layout | `.row`, `.column`, `.cluster`, `.grid`, `.grid-*`, `.gap-*`, `.align-*`, `.justify-*` | `Row`, `Column`, `Cluster`, `Grid` | `handoff-to-Row/Column/Cluster/Grid` | Product CSS should avoid generic flex/grid/gap/alignment rules unless the rule is a private component constraint. |
| Layering | `.layered`, `.layer`, `.layer-pin-*`, `.layer-z-*`, `.modal`, `.drawer`, `.action-sheet`, `.menu-popover` | `Layered`, `Layer`, `Overlay`, `Modal`, `Drawer`, `ActionSheet`, `Popover`, `FloatingPanel` | `handoff-to-Layer/Overlay` and `keep-css-behavior` | Keep mount, top-layer, anchoring, and z-role mechanics. Compose content layout with atoms/layout. |
| Labels | `.badge`, `.chip`, `.tag`, `.dot`, `.status-dot` | `Badge`, `Chip`, `Dot`, `StatusDot` atoms/molecules | `handoff-to-Text` and `keep-css-behavior` | Keep compact indicator mechanics. Domain color aliases belong in `@layer project`. |
| Metrics | `.metric`, `.data-value-*` | `Metric`, `DataValue` atoms | `handoff-to-Metric/DataValue` | Product CSS should not style numeric readouts directly unless drawing a chart/SVG. |
| Route planner | `.route-planner-*`, `.activity-chip`, `.activity-dot`, `.surface-mix-*`, `.elevation-profile-*`, `.route-explore-*` | Route/product components | `keep-css-behavior`, `keep-css-domain-mapping`, mixed handoff candidates | Keep route-specific mechanics and token mapping. Move repeated icon/text/layout patterns to primitives during targeted component migrations. |
| Map overrides | `.leaflet-*`, `.route-map-*`, `.waypoint-badge`, `.route-anchor` | Leaflet integration and route map components | `keep-css-behavior` | Keep in overrides/project CSS because the DOM is external or SVG/map-specific. |
| Widgets | `.widget-*`, sleep/macro/habit selectors | Widget components | `keep-css-behavior`, `keep-css-domain-mapping`, mixed handoff candidates | Keep chart/bar/private grid mechanics. Use primitives for widget titles, labels, values, and shells. |
| Training plans | `.training-day-*`, `.schedule-event-*` | Training plan components | `keep-css-domain-mapping`, mixed handoff candidates | Keep sport/date mapping. Avoid local text/layout duplication when components already compose `Text`, `DataValue`, `Row`, or `Column`. |

## High-Confidence Handoffs

- Use `Surface` for card, panel, tile, list item, and popover/dropdown shells before adding product shell CSS.
- Use `Text` for captions, labels, helper text, muted/faint text, mono text, truncation, and nowrap behavior.
- Use `Metric` or `DataValue` for measurements, stats, dates, durations, pace, counts, percentages, and deltas.
- Use `Row`, `Column`, `Cluster`, and `Grid` for generic spatial composition. Product CSS may still define fixed tracks, scroll constraints, or intrinsic component dimensions.
- Use `Layered`, `Layer`, `Overlay`, `Popover`, `FloatingPanel`, `Modal`, `Drawer`, and `ActionSheet` for placement and top-layer behavior.

## Current Primitive Gaps

- Growth and shrink behavior remains intentionally deferred to the grid-first layout refactor. Do not add broad `grow` or `shrink` props until that plan is implemented.
- Route rail items and activity chips are product-specific controls. Keep their domain classes unless they become reusable outside route planning.
- Some button-like controls use native `button` elements for mechanics but are not `Button` instances. Do not style all `button` elements globally.

## Modern CSS Notes

- Touched CSS should remain in the correct cascade layer declared in `styling/global.css`.
- Use native nesting for selector-local state.
- Prefer `@container` over viewport queries when the component responds to parent size.
- Use `:has()` where it removes state glue without adding fragility.
- Use `color-mix()` for derived tints.
- Use `@starting-style` for mounted overlay transitions.
- Avoid required experimental-only `@mixin`, `@apply`, `if()`, masonry, and sibling functions.

## Expected Existing Warnings

`node scripts/check-ui-atomic.mjs` currently reports a small existing baseline: `WidgetPrototypeScreen` visual/layering classes and one raw control in `PainScale`. This audit does not expand scope to those unless a later pass targets the prototype and session pain scale.
