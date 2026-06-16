# Atomic Design System Contract

This UI is built as a strict composition system:

```text
styling tokens -> atoms -> layout -> molecules -> patterns -> project components -> screens
```

## Layer Responsibilities

- `styling/*` owns tokens, cascade layers, and reusable class vocabulary.
- `ui/atoms/*` owns irreducible primitives such as `Surface`, `Text`, `Icon`, `Avatar`, and data atoms.
- `ui/layout/*` owns spatial primitives such as `Row`, `Column`, `Grid`, `Layered`, `Layer`, and screen shells.
- `ui/molecules/*` owns generic reusable controls and interaction patterns such as `Button`, `Input`, `Modal`, `Popover`, `Dialog`, `FloatingPanel`, and `FloatingToolbar`.
- `ui/patterns/*` owns reusable multi-molecule arrangements.
- `ui/components/*` owns product-specific UI composed from lower layers.
- `ui/screens/*` owns route orchestration, navigation, query state, and workflow state.

## Screen Rules

Screens compose. They do not create new visual systems.

Allowed in screens:

- Layout primitives from `@ui/layout`.
- Atoms from `@ui/atoms`.
- Molecules from `@ui/molecules`.
- Patterns from `@ui/patterns`.
- Product components from `@ui/components`.
- Feature contracts, feature queries, and sanctioned UI bindings.

Not allowed in screens:

- Raw controls such as `<button>`, `<input>`, `<select>`, and `<textarea>`.
- Hand-rolled modals, popovers, dropdown shells, backdrops, or toast shells.
- Ad hoc floating UI with manual `absolute` / `relative` positioning when `Layered`, `Layer`, `FloatingPanel`, or `FloatingToolbar` can express it.
- Screen-local visual class systems. Region names are fine; reusable visuals belong below screens.

## Floating UI

Use two official floating models:

- **Top-layer overlays:** `Modal`, `Dialog`, `Popover`, and `ActionSheet`.
- **Inset interactive-container overlays:** `Layered` with `Layer`, or the molecule wrappers `FloatingPanel` and `FloatingToolbar`.

For inset overlays, the base container must remain interactive in uncovered areas. The `Layer` shell handles this by disabling pointer events on the layer itself and re-enabling them on its children.

The route planner is the reference implementation: the map is the interactive base, while search, map controls, toolbars, and side panels are layered inset controls.

## Inline Styles

Inline styles are banned by default.

The only approved exception is a runtime CSS custom property, with an eslint-disable comment explaining the data-driven value. Static visual values belong in `styling/*` and must reference tokens.

## Migration Enforcement

Run:

```bash
npm run lint:ui
```

The scanner reports atomic-design violations with `file:line`, category, and suggested primitive. Existing legacy violations are tracked in `scripts/ui-atomic-baseline.json`; new violations fail the command.
