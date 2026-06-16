# UI Component Library Critique

Date: 2026-06-06

## Scope

This review focuses on the reusable UI layer in:

- `ui/atoms`
- `ui/molecules`
- `ui/layout`
- supporting CSS in `styling/*.css`

I also compared the current inventory against the current shadcn/ui component catalog on 2026-06-06:

- https://ui.shadcn.com/docs/components

This is not a visual review of individual screens. It is a critique of the library as a system: how cohesive it is, how easy it is to extend, and which reusable building blocks are still missing.

## Short verdict

The library is already past the "random component pile" stage. It has a real center of gravity:

- `Surface`, `Field`, `Button`, `Row` / `Column` / `Grid`, and the popover-based overlay family are trying to act like the core grammar.
- The CSS layer structure is thoughtful and mostly supports that goal.
- The form layer is the most mature part of the system.

The weak point is consistency of ownership. Some primitives are true components with a stable API, while others still depend on broad element selectors, inline styles, or ad hoc class combinations. That makes the library feel cohesive in familiar flows, but fragile when new screens push it in slightly different directions.

If I had to summarize the system in one line: the design language is coherent, but the component contract is not yet strict enough.

## Current inventory

### Atoms

Current atoms are reasonably complete for basic chrome:

- `Avatar`
- `Checkbox`
- `Chip`
- `Divider`
- `Dot`
- `Icon`
- `Metric`
- `ProgressBar`
- `SegmentBar`
- `Skeleton`
- `Spinner`
- `Surface`
- `Table`
- `Text`

This is a healthy base. The strongest atoms are `Surface`, `Text`, `Icon`, `Spinner`, and `Skeleton`.

### Molecules

The molecule layer covers most everyday app interactions:

- actions: `Button`, `Dropdown`, `Popover`, `Tooltip`, `Modal`, `Dialog`, `ActionSheet`, `Toast`
- forms: `Field`, `Input`, `Textarea`, `Select`, `RadioGroup`, `Switch`, `Slider`, `ChoiceCard`
- navigation / data display: `Tabs`, `Badge`, `List`, `NavItem`, `ScreenHeader`, `DetailRow`, `StatDisplay`, `Timeline`, `WidgetCard`
- special-purpose compositions: `ExpandableCard`, `ChipGroup`, `PainScale`, `PhotoGallery`, `TrendItem`, `EditableTitle`

This is broad enough to support the app without constantly dropping into screen-specific markup.

### Layout

The layout layer has the right primitives:

- 1D: `Row`, `Column`, `Cluster`, `ScrollRow`
- 2D: `Grid`, `GridItem`
- structural wrappers: `Shell`, `FullScreen`, `FillScreen`, `Spacer`
- overlays: `Layered`, `Layer`, `Overlay`, `OverlayContainer`
- chart wrapper: `ChartContainer`

This is a good direction. The recent `Grid` cleanup improved this layer.

## Cohesion assessment

### What is cohesive

#### 1. Surface vocabulary is recognizable

`Surface` is clearly trying to be your "card / panel / grouped container" primitive, and that is the right move for a clinical product UI.

Relevant files:

- `ui/atoms/Surface.tsx`
- `styling/surface.css`

Strength:

- The variants map to a small visual vocabulary: `default`, `plain`, `flat`, `accent`, `ghost`.
- Padding is mostly standardized.
- Selection and interactivity are modeled explicitly, not reinvented in every screen.

#### 2. Form composition has a real center

`Field` is probably the healthiest component in the library.

Relevant files:

- `ui/molecules/Field.tsx`
- `ui/molecules/Input.tsx`
- `ui/molecules/Select.tsx`
- `ui/molecules/RadioGroup.tsx`
- `styling/forms.css`

Strength:

- Labels, hint text, error text, and `aria-describedby` are centralized.
- Input-like controls share a common pattern.
- `Fieldset` and `FormActions` show that you are thinking in workflows, not just raw controls.

This is very close to the kind of abstraction that pays off long term.

#### 3. Overlay strategy is better than average

Using the native Popover API as a shared overlay foundation is a strong architectural choice for this product.

Relevant files:

- `ui/molecules/Modal.tsx`
- `ui/molecules/Popover.tsx`
- `ui/molecules/Dropdown.tsx`
- `ui/molecules/ActionSheet.tsx`
- `styling/overlays.css`

Strength:

- You have a common top-layer mental model.
- Light-dismiss and escape behavior are delegated to the platform where possible.
- The CSS is trying to unify modal, menu, and sheet behaviors instead of inventing separate stacks.

That is exactly the kind of systems thinking a real design system needs.

### Where cohesion breaks

#### 1. CSS still owns too much by element type, not by component

This is the biggest structural weakness in the library.

Relevant files:

- [styling/buttons.css](../styling/buttons.css)
- [styling/forms.css](../styling/forms.css)
- [ui/molecules/Button.tsx](../ui/molecules/Button.tsx)

Examples:

- `buttons.css` styles every `button`, `input[type="button"]`, `input[type="submit"]`, and `input[type="reset"]`.
- `forms.css` styles nearly every bare `input`, `textarea`, and `select`.
- `Button.tsx` itself does not emit a stable base class like `button`; it relies on global element styling and variant classes.

Why this hurts cohesion:

- The visual system stops being component-owned and becomes tag-owned.
- Any naked `button` anywhere in the app automatically becomes part of the design system, whether it should or not.
- It becomes harder to reason about which styles belong to reusable UI and which are just HTML defaults.
- New components inherit behavior by accident instead of by explicit adoption.

This directly conflicts with the goal you described: CSS and nested selectors should define component variations, not the other way around. Right now, a meaningful part of the system is still "HTML tag plus utility class" rather than "component with explicit contract."

#### 2. Several primitives still leak implementation details through ad hoc classes

Relevant files:

- [ui/atoms/Surface.tsx](../ui/atoms/Surface.tsx)
- [styling/surface.css](../styling/surface.css)
- [ui/molecules/Dropdown.tsx](../ui/molecules/Dropdown.tsx)
- [ui/molecules/Popover.tsx](../ui/molecules/Popover.tsx)

Examples:

- `Surface` exposes `variant` and `pad`, but CSS also supports classes like `.inset` and `.pinned` that are not part of the TypeScript API.
- `Dropdown` depends on class strings such as `menu-popover`, `column`, `gap-1`, and `anchor-left`.
- `Popover` accepts `align`, but the prop is not actually used.

Why this hurts cohesion:

- The real API is split between TypeScript props and undocumented CSS classes.
- A teammate cannot tell from the component signature which variants are official.
- Molecules begin to depend on internal class choreography instead of stable primitive contracts.

This is the main sign that the system is halfway between "component library" and "shared styling kit."

#### 3. Semantic completeness varies a lot between components

Some components are thoughtfully structured, while others stop at the visual shell.

Best example:

- `Field` provides ids, labels, error wiring, and fieldset grouping.

Weaker examples:

- [ui/molecules/Tabs.tsx](../ui/molecules/Tabs.tsx)
- [ui/layout/ChartContainer.tsx](../ui/layout/ChartContainer.tsx)
- [ui/atoms/Table.tsx](../ui/atoms/Table.tsx)

Problems:

- `Tabs` renders tab buttons, but there is no `tablist`, no `TabsContent`, and no panel relationship.
- `ChartContainer` uses inline styles for height and empty-state centering, which makes it more like a helper than a stable layout primitive.
- `Table` is only a thin shell around raw table tags, and the export surface is incomplete relative to how people expect table primitives to work.

Why this hurts cohesion:

- Consumers cannot assume components represent complete interaction patterns.
- The library is inconsistent about whether it offers primitives, complete widgets, or just convenience wrappers.

#### 4. Some abstractions are too screen-shaped to belong where they live

Relevant files:

- [ui/molecules/TrendItem.tsx](../ui/molecules/TrendItem.tsx)
- [ui/molecules/PainScale.tsx](../ui/molecules/PainScale.tsx)
- [ui/molecules/WidgetCard.tsx](../ui/molecules/WidgetCard.tsx)
- [ui/patterns/common/EmptyState.tsx](../ui/patterns/common/EmptyState.tsx)

These are useful, but several of them feel closer to patterns than generic molecules.

Why this matters:

- Once domain-shaped compositions enter the library core, they anchor CSS around today's screens.
- That makes future reuse harder because the system starts encoding feature assumptions into supposedly generic layers.

`EmptyState` is especially telling: it is generic enough to be reusable, but it sits in `ui/patterns` instead of the library surface, which suggests the layer boundaries are not fully settled.

## Concrete findings

### High-value problems

#### 1. `Surface` has drift between API and CSS

Evidence:

- `Surface` supports `variant`, `pad`, `interactive`, and `selected` in [ui/atoms/Surface.tsx](../ui/atoms/Surface.tsx)
- CSS also defines `.inset` and `.pinned` in [styling/surface.css](../styling/surface.css)

Impact:

- Consumers have to know undocumented class names to access real visual states.
- `Surface` is not the single source of truth for surface variants.

Recommendation:

- Either promote `inset` / `pinned` into the `Surface` prop API, or move them out of the atom layer and treat them as project-level modifiers.

#### 2. `Surface` has a real bug in `pad-xs`

Evidence:

- `padding: var (--s-1);` in [styling/surface.css](../styling/surface.css)

Impact:

- `pad="xs"` does not reliably work.
- This is exactly the kind of tiny drift that makes a design system feel flaky.

Recommendation:

- Fix it immediately and add a tiny usage test or story-like fixture around surface padding variants.

#### 3. `Tabs` is visually reusable but behaviorally incomplete

Evidence:

- [ui/molecules/Tabs.tsx](../ui/molecules/Tabs.tsx)

Problems:

- no `role="tablist"`
- no panel abstraction
- no keyboard navigation contract
- no content association via ids / `aria-controls`

Impact:

- Every screen using tabs has to solve the second half of the pattern itself.
- This lowers trust in the molecule layer.

Recommendation:

- Split into `Tabs`, `TabsList`, `TabsTrigger`, and `TabsContent`, or offer a single high-level tabs primitive with the full accessibility contract.

#### 4. `ChartContainer` is too helper-like

Evidence:

- inline `style={{ height: px }}` and inline flex centering in [ui/layout/ChartContainer.tsx](../ui/layout/ChartContainer.tsx)

Impact:

- Height and state behavior are not expressed through system classes or CSS variables.
- This breaks the "CSS defines component variations" rule.

Recommendation:

- Move chart height variants into CSS classes like `chart-sm`, `chart-md`, etc, or expose a CSS custom property class contract.

#### 5. Overlay APIs are close, but not unified enough

Evidence:

- [ui/molecules/Popover.tsx](../ui/molecules/Popover.tsx)
- [ui/molecules/Dropdown.tsx](../ui/molecules/Dropdown.tsx)
- [ui/molecules/Modal.tsx](../ui/molecules/Modal.tsx)
- [ui/molecules/ActionSheet.tsx](../ui/molecules/ActionSheet.tsx)

Problems:

- `Popover` has an `align` prop that is currently unused.
- `Dropdown` and `Popover` both create trigger buttons internally, which limits composition.
- The close behavior is implemented slightly differently across the family.

Impact:

- The family looks related but does not yet feel like one composable overlay system.

Recommendation:

- Standardize around the same trigger/content model and align semantics, or explicitly keep `Dropdown` as the opinionated menu wrapper and make `Popover` the fully composable base.

#### 6. Table primitives are too thin for the role they imply

Evidence:

- [ui/atoms/Table.tsx](../ui/atoms/Table.tsx)
- [ui/atoms/index.ts](../ui/atoms/index.ts)

Problems:

- You export `Table`, `TableHead`, `TableRow`, `TableCell`, but not a fuller set like body, caption, header, or footer primitives.
- The naming is mildly confusing: `TableHead` is actually `thead`, while `TableCell` can conditionally render `th`.

Impact:

- Consumers still think in raw HTML structure, not a reusable table API.
- The component does not buy enough consistency to justify its existence yet.

Recommendation:

- Either make it a complete table primitive family, or collapse it back to styling raw table markup until you are ready to support the whole pattern.

### Medium-value problems

#### 7. Toast is functional, but lifecycle and polish are basic

Evidence:

- [ui/molecules/Toast.tsx](../ui/molecules/Toast.tsx)

Observations:

- `setTimeout` is not cleaned up if the provider unmounts.
- There is no pause-on-hover or dedupe behavior.
- It works more like an app utility than a library-quality feedback system.

Recommendation:

- Keep the API, but harden the internals if toast usage expands.

#### 8. `Shell` is a layout wrapper, not yet a layout system

Evidence:

- [ui/layout/Shell.tsx](../ui/layout/Shell.tsx)
- [ui/molecules/Shell.tsx](../ui/molecules/Shell.tsx)

Problem:

- `Shell` is exported from both layout and molecules, which suggests the layer boundary is muddy.
- The component mostly passes slots through to a grid and leaves the real structure to CSS and call sites.

Impact:

- It is useful, but not yet decisive enough to anchor application scaffolding.

Recommendation:

- Keep `Shell` in layout only.
- Decide whether it is the canonical app scaffold or just a convenience wrapper.

#### 9. Expand / collapse behavior is split between CSS tricks and component semantics

Evidence:

- [ui/molecules/ExpandableCard.tsx](../ui/molecules/ExpandableCard.tsx)

Observation:

- The CSS-only checkbox pattern is clever, but it makes the component less composable than a real collapsible primitive.

Impact:

- Harder to control from app state.
- Harder to coordinate with analytics, keyboard patterns, or persistence.

Recommendation:

- Treat this as a temporary convenience component, not the final collapsible pattern.

## Missing components and variations compared with shadcn/ui

As of 2026-06-06, shadcn/ui lists these components in its main catalog: `Accordion`, `Alert`, `Alert Dialog`, `Aspect Ratio`, `Avatar`, `Badge`, `Breadcrumb`, `Button`, `Button Group`, `Calendar`, `Card`, `Carousel`, `Chart`, `Checkbox`, `Collapsible`, `Combobox`, `Command`, `Context Menu`, `Data Table`, `Date Picker`, `Dialog`, `Direction`, `Drawer`, `Dropdown Menu`, `Empty`, `Field`, `Hover Card`, `Input`, `Input Group`, `Input OTP`, `Item`, `Kbd`, `Label`, `Menubar`, `Native Select`, `Navigation Menu`, `Pagination`, `Popover`, `Progress`, `Radio Group`, `Resizable`, `Scroll Area`, `Select`, `Separator`, `Sheet`, `Sidebar`, `Skeleton`, `Slider`, `Sonner`, `Spinner`, `Switch`, `Table`, `Tabs`, `Textarea`, `Toast`, `Toggle`, `Toggle Group`, `Tooltip`, and `Typography`.

The current project now covers much more of that list than the earlier version of this critique suggested. `Command`, `Combobox`, `DatePicker`, `Breadcrumb`, `Toggle`, `ToggleGroup`, `Label`, `Field`, and `Empty` exist in `ui/molecules`. The useful gaps are now less about raw names and more about variation depth.

### High-priority missing variations

These would reduce screen-level improvisation the fastest.

#### 1. `ButtonGroup`

Current status:

- Missing as a first-class primitive.
- Related controls exist as `ToggleGroup`, `SegmentedControl`, and adjacent `Button` usage.

Why it matters:

- The app has toolbars, filters, split-action opportunities, and compact command surfaces.
- A `ButtonGroup` would standardize joined borders, roving focus expectations, grouped disabled states, and split-button menus.

Recommended API shape:

- `ButtonGroup`
- `ButtonGroupButton`
- optional `ButtonGroupSeparator`
- optional split trigger pattern using the existing `Dropdown`

#### 2. `InputGroup`

Current status:

- Partial via `Input` leading / trailing slots and `.field-control`.
- Missing as an explicit component family.

Why it matters:

- Workout data entry naturally needs units, prefixes, suffixes, inline steppers, search icons, clear buttons, and attached actions.
- `Input` slots cover simple cases, but do not define a complete grammar for attached controls.

Recommended API shape:

- `InputGroup`
- `InputGroupInput`
- `InputGroupAddon`
- `InputGroupButton`
- `InputGroupText`

This should become the canonical way to render values like weight + unit, duration + stepper, search + clear, and URL/file-like rows.

#### 3. `Item`

Current status:

- Partial via `List`, `ListItem`, `DetailRow`, `TrendItem`, `SessionListItem`, and `ChoiceCard`.
- Missing as a neutral content row/card primitive.

Why it matters:

- There are many repeated rows with leading media/icon, title, description, metadata, and actions.
- Today those patterns are split across generic molecules and screen-shaped components.

Recommended API shape:

- `Item`
- `ItemMedia`
- `ItemContent`
- `ItemTitle`
- `ItemDescription`
- `ItemActions`

This would let app-specific rows compose from one stable primitive instead of making a new row grammar per feature.

#### 4. `DataTable`

Current status:

- `Table` has a fuller primitive family now: header, body, footer, caption, row, cell, and header cell.
- Missing table behaviors: sorting, column alignment config, row selection, sticky header, density, empty state, loading state, and responsive overflow.

Why it matters:

- Analytics, exercise history, session history, and training plans are exactly where a performance app earns trust through dense data.
- A plain table is not enough once users need comparison and scanning.

Recommended API shape:

- Keep `Table` for raw semantic markup.
- Add `DataTable` as the opinionated pattern for sortable, selectable, loading-aware views.

#### 5. `Collapsible` / `Accordion`

Current status:

- Partial via `ExpandableCard`.
- Missing a controlled, semantic primitive.

Why it matters:

- Training blocks, exercise details, health metrics, and settings groups all need progressive disclosure.
- `ExpandableCard` is useful, but it is too card-shaped to be the canonical expand/collapse behavior.

Recommended API shape:

- `Collapsible`
- `CollapsibleTrigger`
- `CollapsibleContent`
- optional `Accordion` wrapper when a group needs single-open behavior.

### Medium-priority missing variations

#### 6. `HoverCard`

Current status:

- Missing.
- Could build on `Popover`.

Why it matters:

- Good fit for desktop-only explanations of dense stats, route metadata, readiness factors, and chart points.
- Should remain informational, not a hidden primary workflow.

#### 7. `Kbd`

Current status:

- Missing.

Why it matters:

- Small but important if `Command` becomes a real command palette.
- Helps document shortcuts without inventing local keycap styling.

#### 8. `Pagination`

Current status:

- Missing.

Why it matters:

- Useful once history and analytics lists exceed simple scrolling.
- Lower priority until there is a paginated query or table view that needs it.

#### 9. `ContextMenu`

Current status:

- Missing.

Why it matters:

- Could help with desktop power-user flows around session rows, exercise rows, and route objects.
- Should not be introduced until the same actions are available through visible controls.

#### 10. `ScrollArea`

Current status:

- Partial via `ScrollRow`.
- Missing as a general vertical/horizontal scroll container with shadows, keyboard support, and stable sizing.

Why it matters:

- Useful for long menus, dense panels, and mobile sheets.
- Keep native scrolling behavior; do not add decorative custom scrollbars.

### Low-priority or likely unnecessary

These exist in shadcn/ui, but they do not currently look like strong fits for this product:

- `Input OTP`
- `Menubar`
- `Navigation Menu`
- `Aspect Ratio`
- `Resizable`
- `Direction`
- `Sonner` as a separate dependency, because the project already has `Toast`

### Existing equivalents or partial equivalents

These are not missing, but their contracts may need tightening:

- `Card` -> `Surface`, `WidgetCard`, and `ChoiceCard`
- `Sheet` / `Drawer` -> `ActionSheet`, `BottomSheet`, and `Modal`
- `Separator` -> `Divider`
- `Native Select` -> `Select`
- `Select` -> partially covered by native `Select` and `Combobox`
- `Calendar` -> project-specific `MonthCalendar` / `WeekCalendar`, plus native-input `DatePicker`
- `Carousel` -> `ui/components/shared/Carousel.tsx`
- `Sidebar` -> `ui/navigation/Sidebar.tsx`
- `Chart` -> `ChartContainer` and `ui/patterns/charts`
- `Typography` -> `Text` plus global typography tokens
- `Empty` -> `ui/molecules/Empty.tsx`
- `Command` -> `ui/molecules/Command.tsx`, though it is still basic
- `Combobox` -> `ui/molecules/Combobox.tsx`, though keyboard behavior needs hardening

## Suggested component roadmap

### First pass: tighten the contract

Do this before adding lots of new components.

1. Make button and form styling component-owned, not tag-owned.
2. Finish the `Surface` API so CSS-only variants stop leaking around it.
3. Upgrade `Tabs`, `Table`, and `ChartContainer` from helper-level abstractions into complete primitives or demote them.
4. Remove duplicate exports and unclear layer placement such as `Shell` in molecules.

### Second pass: fill the most useful gaps

After the contract is cleaner, add:

1. `ButtonGroup`
2. `InputGroup`
3. `Item`
4. `DataTable`
5. `Collapsible`
6. `Accordion`
7. `HoverCard`
8. `Kbd`

### Third pass: expand the expert toolset

Only after the first two passes:

1. `Pagination`
2. `ContextMenu`
3. `ScrollArea`
4. `Resizable`, only if route planning or analytics panels need user-adjustable panes

## Bottom line

This is already a credible in-house UI library. The system has enough real structure that further investment will compound instead of disappearing into churn.

The next win is not "add more components." The next win is to make the existing components stricter, more semantic, and less dependent on broad CSS inheritance. Once that is done, adding shadcn-style pieces like `Command`, `Combobox`, and `DatePicker` will actually strengthen the system instead of just increasing inventory.
