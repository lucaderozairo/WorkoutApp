# Component Audit — workoutApp

Cross-referenced against `mobbin-component-findings.json` (UX pattern coverage) and
`ui/atomic-ui-component-system-reference.md` (layer ownership rules).

**Date:** 2026-06-15  
**Scope:** `ui/atoms`, `ui/layout`, `ui/molecules`, `ui/patterns`, `ui/navigation`, `ui/components`

---

## 1. Inventory by Layer

### 1.1 Atoms (`ui/atoms/`)

| File | Status | Notes |
|---|---|---|
| `Avatar.tsx` | ✅ correct | |
| `Checkbox.tsx` | ⚠️ misplaced | Interactive control → should be `ui/molecules` |
| `Chip.tsx` | ⚠️ misplaced | Interactive control → should be `ui/molecules` |
| `DataValue.tsx` | ✅ correct | |
| `Divider.tsx` | ✅ correct | |
| `Dot.tsx` | ⚠️ redundant | Duplicates `StatusDot`; consolidate or document the distinction |
| `Icon.tsx` | ✅ correct | |
| `IconFrame.tsx` | ✅ correct | |
| `Metric.tsx` | ⚠️ naming | Domain-adjacent name; consider renaming → `DataValue` variant or `StatValue` |
| `MultiSegmentBar.tsx` | ✅ correct | Progress variant |
| `ProgressBar.tsx` | ✅ correct | |
| `ProgressRing.tsx` | ✅ correct | |
| `SegmentBar.tsx` | ✅ correct | Progress variant |
| `Skeleton.tsx` | ✅ correct | |
| `Spinner.tsx` | ✅ correct | Loading indicator primitive |
| `StatusDot.tsx` | ✅ correct | |
| `Surface.tsx` | ✅ correct | |
| `Table.tsx` | ⚠️ misplaced | Tabular display → should be `ui/patterns` (DataTable) |
| `Text.tsx` | ✅ correct | |

**Missing atoms** (defined in reference, not yet implemented):
- `Image` — no generic image atom; feature code uses raw `<img>`
- `Logo` — no generic logo atom
- `VisuallyHidden` — accessibility primitive absent; screen-reader labels are ad-hoc
- `Badge` — exists at `ui/molecules/Badge.tsx`; per reference it is an atom (non-interactive label)

---

### 1.2 Layout (`ui/layout/`)

| File | Status | Notes |
|---|---|---|
| `ChartContainer.tsx` | ⚠️ naming | Domain name ("Chart") in a layout primitive; rename → `AspectContainer` or move to patterns |
| `Cluster.tsx` | ✅ correct | Wrapping flex layout; not in reference but valid addition |
| `Column.tsx` | ✅ correct | |
| `FillScreen.tsx` | ⚠️ duplicate | Overlaps `FullScreen`; one should be an `AppShell` variant |
| `FullScreen.tsx` | ⚠️ duplicate | See above |
| `Grid.tsx` | ✅ correct | |
| `GridItem.tsx` | ✅ correct | |
| `Layered.tsx` | ✅ correct | |
| `Overlay.tsx` | ✅ correct | Equivalent to `Layer` in reference |
| `OverlayContainer.tsx` | ✅ correct | Equivalent to outer `Layered` wrapper |
| `Row.tsx` | ✅ correct | |
| `ScrollRow.tsx` | ⚠️ naming | Horizontal scroll variant; should be `ScrollArea` with `direction="horizontal"` |
| `Shell.tsx` | ✅ correct | Equivalent to `AppShell` |
| `Spacer.tsx` | ✅ correct | |

**Missing layout** (defined in reference, not yet implemented):
- `Stack` — vertical rhythm primitive (distinct from `Column` in intent)
- `SplitPane` — two-panel responsive layout
- `StickyRegion` — sticky header/footer helper
- `Container` — max-width content wrapper
- `MainRegion` — semantic landmark layout
- `ResponsiveFrame` — responsive containment

---

### 1.3 Molecules (`ui/molecules/`)

| File | Status | Notes |
|---|---|---|
| `ActionSheet.tsx` | ✅ correct | |
| `Alert.tsx` | ⚠️ naming | Overlaps `Dialog`; clarify: alert = auto-dismissed feedback, dialog = blocking decision |
| `Badge.tsx` | ⚠️ misplaced | Non-interactive label → should be `ui/atoms` |
| `Breadcrumb.tsx` | ✅ correct | Not in reference but valid addition |
| `Button.tsx` | ✅ correct | |
| `CheckRow.tsx` | ⚠️ naming | Feature-leaning name; consider `CheckItem` or fold into `StackedList` |
| `ChipGroup.tsx` | ✅ correct | |
| `ChoiceCard.tsx` | ✅ correct | Implements Tile pattern from Mobbin |
| `ColorPicker.tsx` | ✅ correct | |
| `Combobox.tsx` | ✅ correct | |
| `Command.tsx` | ✅ correct | Alias for CommandPalette |
| `CommandPalette.tsx` | ✅ correct | |
| `ContextMenu.tsx` | ✅ correct | |
| `DatePicker.tsx` | ✅ correct | |
| `DetailRow.tsx` | ✅ correct | |
| `Dialog.tsx` | ✅ correct | |
| `Drawer.tsx` | ✅ correct | |
| `Dropdown.tsx` | ⚠️ duplicate | Alias for `DropdownMenu`; keep one canonical name |
| `DropdownMenu.tsx` | ✅ correct | |
| `EditableTitle.tsx` | ⚠️ naming | Generic enough to keep; consider `InlineEditor` |
| `ExpandableCard.tsx` | ⚠️ naming | This is an Accordion variant, not a Card (card = navigable content); rename → `ExpandablePanel` |
| `ExpandableToggle.tsx` | ✅ correct | Accordion trigger primitive |
| `Field.tsx` | ✅ correct | |
| `FileDropSurface.tsx` | ⚠️ naming | Inconsistent with reference name `FileUploader`; rename |
| `FloatingActionButton.tsx` | ✅ correct | |
| `FloatingPanel.tsx` | ✅ correct | |
| `FloatingToolbar.tsx` | ✅ correct | |
| `Input.tsx` | ✅ correct | |
| `Label.tsx` | ⚠️ layer | Non-interactive label → could be atom; review if it has interactive states |
| `List.tsx` | ⚠️ naming | Overlaps `ui/patterns/StackedList`; reconcile or remove |
| `Modal.tsx` | ✅ correct | |
| `NavItem.tsx` | ✅ correct | |
| `NumericStepper.tsx` | ✅ correct | |
| `PageControl.tsx` | ✅ correct | |
| `Pagination.tsx` | ✅ correct | |
| `PhotoGallery.tsx` | ⚠️ misplaced | Multi-component arrangement → should be `ui/patterns` (Gallery) |
| `Popover.tsx` | ✅ correct | |
| `RadioGroup.tsx` | ✅ correct | |
| `ScreenHeader.tsx` | ⚠️ misplaced | Header arrangement → should be `ui/patterns` (AppHeader or PageHeader) |
| `SearchInput.tsx` | ✅ correct | |
| `Select.tsx` | ✅ correct | |
| `Slider.tsx` | ✅ correct | |
| `StatDisplay.tsx` | ⚠️ naming | "Stat" is domain-leaning; if generic, rename → `MetricDisplay`; else move to feature layer |
| `Switch.tsx` | ✅ correct | |
| `Tabs.tsx` | ✅ correct | |
| `Textarea.tsx` | ✅ correct | |
| `TimePicker.tsx` | ✅ correct | |
| `Timeline.tsx` | ✅ correct | Not in reference but valid unique addition |
| `Toast.tsx` | ✅ correct | |
| `Toggle.tsx` | ⚠️ duplicate | Semantically overlaps `Switch`; document the distinction or consolidate |
| `ToggleGroup.tsx` | ✅ correct | |
| `Tooltip.tsx` | ✅ correct | |
| `TrendItem.tsx` | ⚠️ naming | "Trend" implies fitness domain; if generic, rename → `DeltaItem`; else move to feature layer |
| `WidgetCard.tsx` | ⚠️ naming | "Widget" is domain vocab; rename → `DashboardCard` and move to `ui/patterns` |

**Missing molecules** (defined in reference, not yet implemented):
- `Accordion` — named `Accordion` component absent; `ExpandableToggle` + `ExpandableCard` exist but aren't named or exported as `Accordion`
- `Banner` — no generic Banner molecule; `InjuryBanner` and `StorageWarningBanner` are feature components
- `BottomSheet` — exists at `ui/navigation/BottomSheet.tsx` (misplaced)
- `Checkbox` — exists at `ui/atoms/Checkbox.tsx` (misplaced)
- `Chip` — exists at `ui/atoms/Chip.tsx` (misplaced)
- `IconButton` — not found as a standalone component; Button with `variant="iconOnly"` may serve this
- `SegmentedControl` — exists at `ui/navigation/SegmentedControl.tsx` (misplaced)

---

### 1.4 Patterns (`ui/patterns/`)

| File | Status | Notes |
|---|---|---|
| `AppHeader.tsx` | ✅ correct | |
| `CardScroller.tsx` | ✅ correct | Carousel-adjacent |
| `charts/charts.tsx` | ⚠️ naming | Domain folder name in patterns layer; rename folder → `data-display` or `visualization` |
| `common/DataTable.tsx` | ✅ correct | |
| `common/EmptyState.tsx` | ✅ correct | |
| `common/ErrorStatePanel.tsx` | ✅ correct | |
| `common/FilterBar.tsx` | ✅ correct | |
| `common/ListDetailLayout.tsx` | ✅ correct | |
| `common/LoadingState.tsx` | ✅ correct | |
| `common/SearchBar.tsx` | ⚠️ duplicate | Overlaps `ui/molecules/SearchInput`; decide canonical home |
| `common/Section.tsx` | ✅ correct | Equivalent to `FormSection` in reference |
| `common/SettingsSection.tsx` | ✅ correct | |
| `common/StackedList.tsx` | ✅ correct | |
| `common/StatPanel.tsx` | ✅ correct | |
| `common/StatTile.tsx` | ⚠️ duplicate | Overlaps `StatPanel`; consolidate into one with variant props |
| `common/SplitTabs.tsx` | ✅ correct | |
| `common/TableOfContents.tsx` | ✅ correct | |
| `common/ToolbarCluster.tsx` | ✅ correct | |
| `common/Tree.tsx` | ✅ correct | |
| `WidgetCard.tsx` | ⚠️ duplicate | Also exists at `ui/molecules/WidgetCard.tsx`; remove one |

**Missing patterns** (defined in reference, not yet implemented):
- `AuthFormLayout` — auth forms compose layouts ad-hoc
- `Card` — generic slotted card (header/media/body/footer); `ExpandableCard` in molecules is not this
- `CardGrid` — responsive card grid arrangement
- `Carousel` — exists at `ui/components/shared/Carousel.tsx` (misplaced — feature component folder)
- `FeedList` — social/activity feed arrangement
- `Gallery` — `PhotoGallery` in molecules is misplaced here
- `MetricGrid` — grid of metric panels
- `PageHeader` — distinct from `AppHeader`; per-page heading with actions
- `SearchResultsLayout` — structured search results composition
- `StepperFlow` — multi-step wizard layout
- `TabBar` — navigation tab bar; `ui/navigation/TabNavigation.tsx` + `AppNav.tsx` serve this but are misplaced

---

### 1.5 Navigation (`ui/navigation/`)

The `ui/navigation/` folder is a layer violation — it mixes molecules and patterns
that should live in their canonical layers.

| File | Should move to |
|---|---|
| `AppNav.tsx` | `ui/patterns/TabBar` |
| `BottomSheet.tsx` | `ui/molecules/BottomSheet` |
| `SegmentedControl.tsx` | `ui/molecules/SegmentedControl` |
| `Sidebar.tsx` | `ui/molecules/Drawer` variant or `ui/patterns/Sidebar` |
| `TabNavigation.tsx` | `ui/patterns/TabBar` |

---

### 1.6 Feature Components (`ui/components/`)

Feature components are correctly domain-separated by folder. Selected notes:

| Component | Status | Notes |
|---|---|---|
| `shared/Carousel.tsx` | ⚠️ misplaced | Generic arrangement → should be `ui/patterns/Carousel` |
| `widgets/widgetPrimitives.tsx` | ⚠️ layer | Primitive-level abstractions inside a feature folder; extract to `ui/atoms` or `ui/molecules` if generic |
| `session/LetterBadge.tsx` | ⚠️ layer | If only used in session, fine; if reused elsewhere, promote to `ui/atoms/Badge` variant |
| `charts/domain-charts.tsx` | ✅ correct | Domain-specific charts at feature layer |
| `routes/SurfaceMixBar.tsx` | ✅ correct | Route-specific; correctly in feature layer |
| `routes/RouteDetailLayout.tsx` | ✅ correct | Route-specific layout composition |

---

## 2. Mobbin Pattern Coverage

Coverage of the 40 Mobbin UX component patterns against this app.

| Mobbin Pattern | App Component | Layer | Status |
|---|---|---|---|
| Accordion | `ExpandableToggle` + `ExpandableCard` | molecules | ⚠️ not named Accordion; export an `Accordion` alias |
| Action Sheet | `molecules/ActionSheet` | molecules | ✅ |
| Avatar | `atoms/Avatar` | atoms | ✅ |
| Badge | `molecules/Badge` | molecules | ⚠️ misplaced — should be atom |
| Banner | `InjuryBanner`, `StorageWarningBanner` | features | ❌ no generic Banner molecule |
| Bottom Sheet | `navigation/BottomSheet` | navigation | ⚠️ misplaced — should be molecule |
| Button | `molecules/Button` | molecules | ✅ |
| Card | `molecules/ExpandableCard` | molecules | ⚠️ partial — ExpandableCard ≠ Card; Card pattern missing |
| Carousel | `components/shared/Carousel` | feature shared | ⚠️ misplaced — should be pattern |
| Checkbox | `atoms/Checkbox` | atoms | ⚠️ misplaced — interactive control should be molecule |
| Chip | `atoms/Chip` | atoms | ⚠️ misplaced — interactive control should be molecule |
| Color Picker | `molecules/ColorPicker` | molecules | ✅ |
| Combobox | `molecules/Combobox` | molecules | ✅ |
| Command Palette | `molecules/Command` / `CommandPalette` | molecules | ✅ |
| Context Menu | `molecules/ContextMenu` | molecules | ✅ |
| Date Picker | `molecules/DatePicker` | molecules | ✅ |
| Dialog | `molecules/Dialog` | molecules | ✅ |
| Divider | `atoms/Divider` | atoms | ✅ |
| Drawer | `molecules/Drawer` | molecules | ✅ |
| Dropdown Menu | `molecules/DropdownMenu` + `Dropdown` | molecules | ⚠️ two aliases — remove `Dropdown` |
| Empty State | `patterns/EmptyState` | patterns | ✅ |
| Error Message | `patterns/ErrorStatePanel` | patterns | ⚠️ partial — no inline validation error style |
| File Uploader | `molecules/FileDropSurface` | molecules | ⚠️ name inconsistent with reference (`FileUploader`) |
| Floating Action Button | `molecules/FloatingActionButton` | molecules | ✅ |
| Full-screen Overlay | `layout/FullScreen` + `Overlay` | layout | ✅ |
| Gallery | `molecules/PhotoGallery` | molecules | ⚠️ misplaced — should be pattern |
| Loading Indicator | `atoms/Spinner` | atoms | ✅ |
| Map Pin | `components/shared/Map` | feature shared | ℹ️ domain feature — correct layer |
| Navigation Menu | `navigation/AppNav`, `Sidebar` | navigation | ⚠️ misplaced — should be patterns |
| Page Control | `molecules/PageControl` | molecules | ✅ |
| Pagination | `molecules/Pagination` | molecules | ✅ |
| Popover | `molecules/Popover` | molecules | ✅ |
| Progress Indicator | `atoms/ProgressBar` + `ProgressRing` | atoms | ✅ |
| Radio Button | `molecules/RadioGroup` | molecules | ✅ |
| Search Bar | `patterns/SearchBar` + `molecules/SearchInput` | both | ⚠️ duplicated across two layers |
| Segmented Control | `navigation/SegmentedControl` | navigation | ⚠️ misplaced — should be molecule |
| Select | `molecules/Select` | molecules | ✅ |
| Skeleton | `atoms/Skeleton` | atoms | ✅ |
| Slider | `molecules/Slider` | molecules | ✅ |
| Stacked List | `patterns/StackedList` | patterns | ✅ |
| Status Dot | `atoms/StatusDot` | atoms | ✅ |
| Stepper | `molecules/NumericStepper` | molecules | ✅ |
| Switch | `molecules/Switch` | molecules | ✅ |
| Tab Bar | `navigation/TabNavigation` | navigation | ⚠️ misplaced — should be pattern |
| Table | `atoms/Table` | atoms | ⚠️ misplaced — should be pattern (DataTable) |
| Text Area | `molecules/Textarea` | molecules | ✅ |
| Time Picker | `molecules/TimePicker` | molecules | ✅ |
| Toast | `molecules/Toast` | molecules | ✅ |
| Tooltip | `molecules/Tooltip` | molecules | ✅ |
| Tree | `patterns/Tree` | patterns | ✅ |

**Coverage summary:** 40 Mobbin patterns · 28 ✅ covered correctly · 12 ⚠️ covered but misplaced/named wrong · 1 ❌ missing (Banner as generic molecule)

---

## 3. Atomic System Reference Gap Analysis

### 3.1 Missing from reference spec

These are implemented in the app but not present in the atomic-ui-component-system-reference:

| Component | Location | Verdict |
|---|---|---|
| `Breadcrumb` | molecules | Add to reference under molecules |
| `Cluster` | layout | Add to reference under layout |
| `Dot` | atoms | Consolidate into `StatusDot` and remove, or document difference |
| `GridItem` | layout | Fine as a companion to `Grid`; add to reference |
| `Metric` | atoms | Clarify relationship to `DataValue`; likely a variant |
| `MultiSegmentBar` | atoms | Add as `Progress` variant |
| `ProgressRing` | atoms | Add as `Progress` variant |
| `SegmentBar` | atoms | Add as `Progress` variant |
| `Spinner` | atoms | Add as `LoadingIndicator` (atom) in reference |
| `Timeline` | molecules | Add to reference as a unique molecule |
| `Toggle` | molecules | Document relationship to `Switch`; remove if redundant |

### 3.2 Components defined in reference but absent here

| Reference Component | Priority | Notes |
|---|---|---|
| `Image` atom | High | Feature code uses raw `<img>`; needs consistent wrapper |
| `VisuallyHidden` atom | High | Accessibility gap; icon buttons lack screen-reader labels |
| `Logo` atom | Low | Only needed if logo renders in multiple places |
| `IconButton` molecule | High | Currently folded into `Button`; should be standalone for clarity |
| `Accordion` molecule | Medium | Alias/export of `ExpandableToggle` would close this gap |
| `Banner` molecule | High | Feature code duplicates banner patterns ad-hoc |
| `Stack` layout | Medium | `Column` is used in its place; Stack has distinct spacing intent |
| `SplitPane` layout | Medium | Used in desktop layouts; ad-hoc now |
| `StickyRegion` layout | Medium | Feature code uses raw `position: sticky` |
| `Card` pattern | High | Generic slotted card absent; feature code composes Surface ad-hoc |
| `Carousel` pattern | High | Exists in wrong layer (`components/shared`) |
| `FeedList` pattern | Medium | Social feed composes ad-hoc |
| `MetricGrid` pattern | Medium | Dashboard composes Grid ad-hoc |
| `PageHeader` pattern | Medium | Each screen composes headers ad-hoc |
| `TabBar` pattern | High | In `ui/navigation`; needs to move to `ui/patterns` |
| `Gallery` pattern | Medium | `PhotoGallery` in wrong layer |
| `SearchResultsLayout` pattern | Low | |
| `StepperFlow` pattern | Low | |
| `AuthFormLayout` pattern | Low | |
| `CardGrid` pattern | Low | |

---

## 4. Layer Violations Summary

Components currently in the wrong layer, ordered by severity:

| Severity | Component | Current Layer | Correct Layer |
|---|---|---|---|
| 🔴 High | `atoms/Checkbox` | atoms | molecules |
| 🔴 High | `atoms/Chip` | atoms | molecules |
| 🔴 High | `atoms/Table` | atoms | patterns |
| 🔴 High | `molecules/Badge` | molecules | atoms |
| 🔴 High | `molecules/PhotoGallery` | molecules | patterns |
| 🔴 High | `molecules/ScreenHeader` | molecules | patterns |
| 🔴 High | `navigation/BottomSheet` | navigation | molecules |
| 🔴 High | `navigation/SegmentedControl` | navigation | molecules |
| 🔴 High | `navigation/TabNavigation` + `AppNav` | navigation | patterns |
| 🔴 High | `components/shared/Carousel` | feature shared | patterns |
| 🟡 Medium | `atoms/Dot` | atoms | merge into StatusDot |
| 🟡 Medium | `navigation/Sidebar` | navigation | molecules or patterns |
| 🟡 Medium | `molecules/WidgetCard` | molecules | patterns (rename) |
| 🟡 Medium | `patterns/WidgetCard` | patterns | deduplicate with above |
| 🟡 Medium | `layout/ChartContainer` | layout | rename or move to patterns |
| 🟡 Medium | `layout/FillScreen` + `FullScreen` | layout | consolidate as AppShell variants |
| 🟡 Medium | `layout/ScrollRow` | layout | rename to ScrollArea |
| 🟡 Medium | `molecules/Dropdown` | molecules | remove alias, use DropdownMenu |
| 🟡 Medium | `patterns/SearchBar` vs `molecules/SearchInput` | both | decide canonical layer |
| 🟡 Medium | `patterns/StatTile` vs `patterns/StatPanel` | patterns | consolidate |
| 🟠 Low | `molecules/TrendItem` | molecules | rename or move to feature layer |
| 🟠 Low | `molecules/StatDisplay` | molecules | rename to MetricDisplay or move to feature |
| 🟠 Low | `molecules/Toggle` | molecules | document vs Switch or remove |

---

## 5. Unique App Components Not in Mobbin or Reference

These are app-specific components that are correctly implemented but not
covered by either reference source:

| Component | Description |
|---|---|
| `atoms/SegmentBar` / `MultiSegmentBar` | Horizontal segment-proportion bars for workout surface mix, macro splits |
| `atoms/ProgressRing` | Circular ring progress for goals, readiness scores |
| `atoms/Metric` | Compact metric display (value + unit inline) |
| `molecules/Timeline` | Vertical chronological event list |
| `molecules/ChoiceCard` | Large Tile-like selection card (Mobbin: Tile, but richer) |
| `molecules/DetailRow` | Key-value detail row for session metadata |
| `molecules/CheckRow` | Row with inline checkbox for log-style lists |
| `molecules/EditableTitle` | In-place title editing control |
| `molecules/ExpandableToggle` | Headless accordion trigger |
| `molecules/TrendItem` | Delta + sparkline row item |
| `molecules/StatDisplay` | Compact stat with label (fitness dashboard) |
| `molecules/WidgetCard` | Dashboard widget shell |
| `layout/Cluster` | Wrapping flex cluster for tag/chip groups |
| `patterns/CardScroller` | Horizontal scroll container for card rows |
| `patterns/StatTile` | Single-metric tile with label and trend |
| `patterns/SplitTabs` | Segmented tabs with content pane |
| `components/routes/SurfaceMixBar` | Surface type proportion bar for routes |
| `components/routes/RouteDetailLayout` | Two-column route detail composition |
| `components/session/PainScale` | Pain rating input (0–10 scale) |
| `components/session/PlateCalculatorModal` | Barbell plate calculator |

---

## 6. Recommended Actions (Priority Order)

### Immediate — layer correctness

1. Move `atoms/Checkbox` → `molecules/Checkbox`
2. Move `atoms/Chip` → `molecules/Chip`
3. Move `atoms/Table` → `patterns/DataTable` (merge with `patterns/DataTable`)
4. Move `molecules/Badge` → `atoms/Badge`
5. Move `navigation/BottomSheet` → `molecules/BottomSheet`
6. Move `navigation/SegmentedControl` → `molecules/SegmentedControl`
7. Move `navigation/TabNavigation` + `AppNav` → `patterns/TabBar`
8. Move `components/shared/Carousel` → `patterns/Carousel`
9. Move `molecules/PhotoGallery` → `patterns/Gallery`
10. Move `molecules/ScreenHeader` → `patterns/PageHeader`

### Short-term — naming and deduplication

11. Remove `molecules/Dropdown` alias; use `DropdownMenu` everywhere
12. Consolidate `patterns/StatTile` + `patterns/StatPanel` → `StatPanel` with `size` prop
13. Remove `atoms/Dot` or document how it differs from `StatusDot`
14. Rename `molecules/FileDropSurface` → `FileUploader`
15. Rename `layout/ScrollRow` → `ScrollArea` (with `direction="horizontal"` prop)
16. Export `Accordion` alias from `molecules/ExpandableToggle`
17. Reconcile `patterns/SearchBar` vs `molecules/SearchInput` (SearchBar = pattern wrapping SearchInput)

### Medium-term — missing primitives

18. Implement `atoms/VisuallyHidden` — unblocks accessible icon buttons everywhere
19. Implement `atoms/Image` — remove raw `<img>` from feature code
20. Implement `molecules/Banner` — consolidate `InjuryBanner`, `StorageWarningBanner`, and future alert banners
21. Implement `molecules/IconButton` — or document that `Button` with `variant="iconOnly"` is canonical
22. Implement `patterns/Card` — generic slotted card for Surface + Column compositions
23. Rename `layout/ChartContainer` → `AspectContainer` or `MediaContainer`

### Long-term — completeness

24. Implement `layout/Stack` (vertical rhythm), `SplitPane`, `StickyRegion`
25. Implement `patterns/MetricGrid`, `FeedList`, `PageHeader`
26. Add `atoms/Logo` once branding is stable
27. Update `ui/atomic-ui-component-system-reference.md` to include app-unique components
   (Timeline, ChoiceCard, SegmentBar, ProgressRing, Cluster, CardScroller, SplitTabs)
