# Atomic UI Component System Reference

This document defines a reusable UI component checklist organised around an atomic design system. It is intended for a React/TypeScript app that needs shared components across mobile app, responsive web, and desktop-style layouts.

The goal is to prevent component sprawl by giving each component a clear ownership layer:

- `ui/atoms/*` owns irreducible primitives.
- `ui/layout/*` owns spatial composition primitives and screen shells.
- `ui/molecules/*` owns generic reusable controls and interaction patterns.
- `ui/patterns/*` owns reusable multi-component arrangements.
- `features/*` owns project-specific product components built from the UI system.

---

# Current Implementation Status

The project now treats the checklist in this reference as an ownership map, not only an aspirational list.

Implemented generic additions:

- Atoms: `StatusDot`, `DataValue`, `IconFrame`
- Molecules: `SearchInput`, `ContextMenu`, `Drawer`, `FloatingActionButton`, `NumericStepper`, `PageControl`, `Pagination`, `TimePicker`, `ColorPicker`
- Molecule aliases: `DropdownMenu` -> `Dropdown`, `CommandPalette` -> `Command`
- Patterns: `ErrorStatePanel`, `DataTable`, `FilterBar`, `SettingsSection`, `ListDetailLayout`, `StackedList`, `ToolbarCluster`, `TableOfContents`, `Tree`

Ownership rule for CSS:

- Atoms and layout primitives keep `className` as a narrow composition hook, not as their main styling API.
- Use typed props for typography, alignment, spacing, variants, state, and placement wherever the primitive already supports them.
- Use `className` on atoms/layout only for a consuming component's identity, state hook, container query hook, or domain token mapping.
- Use `Surface` for reusable visual shells and `Layered`/`Layer`/`Overlay`/`FloatingPanel`/`FloatingToolbar` for most positioning.
- New and touched CSS should follow `docs/reference/modern-css-reference-2026.md`: native CSS nesting, cascade layers, component-scoped `@container`, `:has()` where it removes state glue, `@property` for animated custom properties, `color-mix()` for derived tints, and `@starting-style` for mounted overlay transitions.

---

# 1. Design-System Layering Model

## 1.1 Atoms

**Path:** `ui/atoms/*`

Atoms are the smallest reusable visual or data primitives. They should not know about product-specific concepts such as workouts, routes, posts, users, or sessions.

Atoms are allowed to know about:

- Design tokens
- Typography tokens
- Colour roles
- Surface hierarchy
- Icon sizing
- Shape / radius
- Status semantics
- Data formatting primitives

Atoms should avoid:

- Business logic
- Routing
- API calls
- Feature-specific copy
- Complex internal layouts
- Modal / overlay logic

### Use atoms when

- You need a consistent primitive across the whole app.
- The component maps closely to a design token or HTML primitive.
- The component can be used inside many unrelated molecules or patterns.

---

## 1.2 Layout

**Path:** `ui/layout/*`

Layout components define spatial relationships. They should not impose product-specific visuals beyond spacing, alignment, containment, scrolling, layering, and responsive behaviour.

Layout components are responsible for:

- Flex/grid composition
- Responsive container behaviour
- Safe-area spacing
- Scroll areas
- Fixed/sticky regions
- Layering and z-index rules
- Screen shells
- App/web layout variants

Layout components should avoid:

- Product-specific naming
- Data fetching
- Business rules
- Feature-specific rendering decisions

### Use layout components when

- You are positioning components relative to each other.
- You need consistent row/column/grid behaviour.
- You need reusable responsive shells.
- You need a generic layering model for maps, overlays, panels, and toolbars.

---

## 1.3 Molecules

**Path:** `ui/molecules/*`

Molecules are reusable controls or interaction components composed from atoms and layout primitives. They are generic enough to be reused across many features.

Molecules are responsible for:

- User input
- Selection
- Menus
- Popovers
- Dialogs
- Floating controls
- Reusable feedback components
- Small repeated control groups

Molecules should avoid:

- Feature-specific data models
- Product-specific screen assumptions
- Hardcoded feature copy
- Fetching or persistence logic

### Use molecules when

- The component has behaviour, not just styling.
- The component is still generic across multiple domains.
- The component combines atoms into an interactive unit.

---

## 1.4 Patterns

**Path:** `ui/patterns/*`

Patterns are reusable arrangements of molecules, atoms, and layout primitives. They represent repeated UI structures rather than individual controls.

Patterns are responsible for:

- Common form layouts
- Search/filter/sort arrangements
- Page headers
- Empty/error/loading layouts
- Data display arrangements
- Feed/list/card arrangements
- Responsive control compositions

Patterns should avoid:

- Owning feature-specific business logic
- Knowing API shape
- Hardcoded project entities
- Becoming full screens

### Use patterns when

- A UI arrangement appears in multiple features.
- The composition has consistent layout and behaviour.
- The pattern can receive content/configuration through props.

---

## 1.5 Feature Components

**Path:** `features/*`

Feature components are product-specific. They should compose atoms, layout, molecules, and patterns into concrete app experiences.

Examples:

- `features/training-log/components/SessionCard`
- `features/planning/components/RouteToolbar`
- `features/health/components/SleepSummaryTile`
- `features/social/components/ActivityFeedItem`

Feature components are allowed to know about:

- Product data models
- Domain terminology
- Business rules
- Feature-specific actions
- Feature-specific empty states
- Route/navigation decisions

Feature components should avoid duplicating:

- Generic buttons
- Generic inputs
- Generic cards
- Generic modals
- Generic layout primitives
- Generic loading/error/empty patterns

---

# 2. Ownership Rules

## 2.1 General rule

A component belongs in the lowest layer where it can remain truthful, reusable, and domain-neutral.

For example:

| Component | Correct Layer | Reason |
|---|---:|---|
| `Text` | `ui/atoms` | Irreducible typography primitive |
| `Button` | `ui/molecules` | Interactive control composed from text/icon/layout |
| `Row` | `ui/layout` | Spatial primitive |
| `Modal` | `ui/molecules` | Generic overlay behaviour |
| `SearchFilterBar` | `ui/patterns` | Reusable multi-control arrangement |
| `WorkoutSessionCard` | `features/training-log` | Product-specific domain component |

---

## 2.2 Promotion rule

Start product-specific components inside `features/*`.

Promote them upward only when:

- They are reused in at least two unrelated features.
- Their props can be made domain-neutral.
- They no longer depend on feature-specific data models.
- Their styling can be expressed through tokens and variants.

Example:

```txt
features/training-log/components/SessionActions
    ↓ after repeated generic use
ui/patterns/ActionCluster
```

---

## 2.3 No-leak rule

Lower-level UI components must not import from feature folders.

Allowed dependency direction:

```txt
features/* → ui/patterns → ui/molecules → ui/layout + ui/atoms
```

Not allowed:

```txt
ui/atoms → features/*
ui/molecules → features/*
ui/patterns → features/*
```

---

# 3. Recommended Folder Structure

```txt
src/
  ui/
    atoms/
      Avatar/
      Badge/
      DataValue/
      Divider/
      Icon/
      Image/
      Logo/
      Progress/
      Skeleton/
      StatusDot/
      Surface/
      Text/
      VisuallyHidden/

    layout/
      AppShell/
      Column/
      Container/
      Grid/
      Layer/
      Layered/
      MainRegion/
      ResponsiveFrame/
      Row/
      ScrollArea/
      Spacer/
      SplitPane/
      Stack/
      StickyRegion/

    molecules/
      Accordion/
      ActionSheet/
      Banner/
      BottomSheet/
      Button/
      Checkbox/
      Chip/
      ColorPicker/
      Combobox/
      CommandPalette/
      ContextMenu/
      DatePicker/
      Dialog/
      Drawer/
      DropdownMenu/
      FileUploader/
      FloatingActionButton/
      FloatingPanel/
      FloatingToolbar/
      IconButton/
      Input/
      Modal/
      NumericStepper/
      PageControl/
      Pagination/
      Popover/
      RadioGroup/
      SearchInput/
      SegmentedControl/
      Select/
      Slider/
      Switch/
      Tabs/
      TextArea/
      TimePicker/
      Toast/
      ToggleGroup/
      Tooltip/

    patterns/
      AppHeader/
      AuthFormLayout/
      Card/
      CardGrid/
      Carousel/
      DataTable/
      EmptyStatePanel/
      ErrorStatePanel/
      FeedList/
      FilterBar/
      FormSection/
      Gallery/
      ListDetailLayout/
      LoadingStatePanel/
      MetricGrid/
      PageHeader/
      SearchResultsLayout/
      SettingsSection/
      StackedList/
      StatPanel/
      StepperFlow/
      TabBar/
      TableOfContents/
      ToolbarCluster/
      Tree/

  features/
    training-log/
    planning/
    health/
    social/
    messages/
    profile/
```

---

# 4. `ui/atoms/*`

Atoms are the visual vocabulary of the system.

---

## 4.1 `Surface`

**Description**

A generic container primitive that applies background, border, elevation, radius, and padding roles. `Surface` should not decide layout beyond its own box model.

**Common variants**

- `flat`
- `raised`
- `outlined`
- `inset`
- `glass`
- `interactive`
- `selected`
- `danger`
- `warning`
- `success`

**Use cases**

- Card backgrounds
- Modal panels
- Floating map controls
- Dashboard widgets
- List item shells
- Form sections
- Empty state panels

**Example composition**

```tsx
<Surface variant="outlined" radius="lg" padding="md">
  <Text variant="title">Weekly summary</Text>
</Surface>
```

---

## 4.2 `Text`

**Description**

A typography primitive for rendering semantic text consistently. It should map to typography tokens and semantic HTML elements.

**Common variants**

- `display`
- `headline`
- `title`
- `subtitle`
- `body`
- `bodySmall`
- `caption`
- `label`
- `mono`
- `muted`
- `danger`
- `success`

**Use cases**

- Page titles
- Card headings
- Labels
- Helper text
- Captions
- Empty state copy
- Metric values
- Error messages

**Guidance**

`Text` should support semantic rendering:

```tsx
<Text as="h1" variant="headline">
  Dashboard
</Text>
```

---

## 4.3 `Icon`

**Description**

A controlled icon primitive that standardises size, stroke width, colour, and accessibility behaviour.

**Common variants**

- `decorative`
- `informative`
- `interactive`
- `status`
- `nav`
- `action`

**Use cases**

- Buttons
- Navigation items
- Status indicators
- Empty states
- Metric cards
- Route-planning tools
- Input adornments

**Guidance**

Decorative icons should be hidden from assistive technology. Informative icons require accessible labels.

---

## 4.4 `Avatar`

**Description**

A visual identity primitive for people, teams, organisations, or generated placeholders.

**Common variants**

- `image`
- `initials`
- `icon`
- `group`
- `status`
- `fallback`

**Use cases**

- User profile
- Feed items
- Comments
- Messages
- Club/team membership
- Shared activity cards

---

## 4.5 `Badge`

**Description**

A compact label for status, counts, categories, or metadata.

**Common variants**

- `neutral`
- `info`
- `success`
- `warning`
- `danger`
- `count`
- `pill`
- `dot`

**Use cases**

- Notification count
- PR indicator
- Activity type
- Sync status
- Route difficulty
- Validation state
- Feature availability

---

## 4.6 `Divider`

**Description**

A low-level visual separator.

**Common variants**

- `horizontal`
- `vertical`
- `subtle`
- `strong`
- `inset`
- `fullBleed`

**Use cases**

- Settings lists
- Dropdown groups
- Card sections
- Table sections
- Sidebar groups

---

## 4.7 `Skeleton`

**Description**

A placeholder primitive used while content is loading.

**Common variants**

- `text`
- `circle`
- `rect`
- `media`
- `button`
- `chart`
- `map`

**Use cases**

- Feed loading
- Card loading
- Chart loading
- Table loading
- Map loading
- Profile loading

---

## 4.8 `DataValue`

**Description**

A primitive for rendering numeric or structured data consistently.

**Common variants**

- `number`
- `unit`
- `percentage`
- `duration`
- `distance`
- `pace`
- `weight`
- `date`
- `time`
- `delta`
- `trend`

**Use cases**

- Fitness stats
- Sleep metrics
- Route distance
- Workout volume
- HR zones
- Nutrition totals
- Dashboard widgets

---

## 4.9 `Progress`

**Description**

A primitive visual indicator for completion, loading, or metric progress.

**Common variants**

- `linear`
- `circular`
- `ring`
- `segmented`
- `indeterminate`

**Use cases**

- Upload progress
- Goal progress
- Training readiness
- Macro split
- Step completion
- Loading progress

---

## 4.10 `VisuallyHidden`

**Description**

An accessibility primitive for screen-reader-only text.

**Use cases**

- Icon button labels
- Input descriptions
- Dynamic status updates
- Accessible chart descriptions
- Hidden headings for landmark regions

---

## 4.11 `StatusDot`

**Description**

A tiny coloured circle for indicating live, online, sync, or recording status. Replaces ad-hoc `<span className="dot">` usage scattered across features. It should not carry product-specific meaning beyond a generic status semantic.

**Common variants**

- `live`
- `online`
- `offline`
- `idle`
- `syncing`
- `error`

**Use cases**

- Live recording indicator
- Online/offline presence
- Sync state indicator
- Connection status
- Background task progress indicator
- Real-time data freshness

**Guidance**

Always pair with an accessible label (`aria-label` on a parent or sibling `VisuallyHidden`). The dot itself is `aria-hidden`.

---

# 5. `ui/layout/*`

Layout components define spatial grammar.

---

## 5.1 `Row`

**Description**

A horizontal layout primitive for aligning children in a row.

**Common props**

- `gap`
- `align`
- `justify`
- `wrap`
- `reverse`
- `collapseAt`
- `fullWidth`

**Use cases**

- Button groups
- Card headers
- Toolbar groups
- Metric rows
- Feed item metadata
- Form inline fields

---

## 5.2 `Column`

**Description**

A vertical layout primitive for stacking children.

**Common props**

- `gap`
- `align`
- `justify`
- `scroll`
- `fullHeight`
- `collapse`

**Use cases**

- Form sections
- Card content
- Modal content
- Sidebar content
- Screen body layouts

---

## 5.3 `Stack`

**Description**

A vertical rhythm primitive. Similar to `Column`, but specifically for predictable spacing between content blocks.

**Use cases**

- Article-like content
- Settings pages
- Forms
- Empty states
- Detail pages

---

## 5.4 `Grid`

**Description**

A responsive grid primitive for arranging content in columns and rows.

**Common variants**

- `autoFit`
- `autoFill`
- `fixed`
- `dashboard`
- `masonryLike`
- `responsiveCards`

**Use cases**

- Dashboard widgets
- Card grids
- Gallery views
- Metric panels
- Settings overview
- Responsive screen layouts

---

## 5.5 `Layered`

**Description**

A layout primitive for placing multiple visual layers in the same spatial region.

**Use cases**

- Map with controls
- Image editor with floating tools
- Route planner with markers
- Media viewer with overlays
- Dashboard card with background decoration

**Example composition**

```tsx
<Layered>
  <Layer name="base">
    <Map />
  </Layer>

  <Layer name="top-left">
    <ZoomControls />
  </Layer>

  <Layer name="right-center">
    <FloatingToolbar />
  </Layer>
</Layered>
```

---

## 5.6 `Layer`

**Description**

A positioned child inside `Layered`. It handles placement and stacking without requiring one-off absolute positioning in feature code.

**Common positions**

- `top-left`
- `top-right`
- `bottom-left`
- `bottom-right`
- `center`
- `left-center`
- `right-center`
- `fill`

**Use cases**

- Map controls
- Floating panels
- Tool docks
- Context actions
- Selection overlays
- Media controls

---

## 5.7 `ScrollArea`

**Description**

A controlled scroll container.

**Common variants**

- `vertical`
- `horizontal`
- `both`
- `snap`
- `hiddenScrollbar`
- `nativeScrollbar`

**Use cases**

- Mobile screen body
- Horizontal tool rows
- Feed containers
- Modal body
- Tables
- Carousels

---

## 5.8 `SplitPane`

**Description**

A two-panel responsive layout.

**Common variants**

- `sidebar-main`
- `main-detail`
- `resizable`
- `collapsible`
- `stackOnMobile`

**Use cases**

- Desktop app shell
- Messages layout
- Settings layout
- Route planner side panel
- List/detail views

---

## 5.9 `AppShell`

**Description**

A screen-level layout primitive that defines the global application frame.

**Common variants**

- `mobileApp`
- `mobileWeb`
- `desktopWeb`
- `desktopApp`
- `authenticated`
- `unauthenticated`

**Use cases**

- Mobile header/content/app bar
- Desktop sidebar/content shell
- Website header/content/footer
- Full-screen active workout mode
- Full-screen route planner mode

---

## 5.10 `StickyRegion`

**Description**

A layout helper for sticky headers, sticky footers, and persistent controls.

**Use cases**

- Sticky mobile header
- Sticky filter bar
- Sticky table header
- Persistent save bar
- Bottom action bar

---

# 6. `ui/molecules/*`

Molecules provide generic interaction primitives.

---

## 6.1 `Button`

**Description**

A reusable action control composed from text, icon, loading state, and interaction states.

**Common variants**

- `primary`
- `secondary`
- `tertiary`
- `ghost`
- `destructive`
- `success`
- `link`
- `iconOnly`

**Use cases**

- Submit actions
- Navigation actions
- Dialog actions
- Card actions
- Toolbar actions
- Empty state CTAs

**Required states**

- Default
- Hover
- Pressed
- Focus-visible
- Disabled
- Loading

---

## 6.2 `IconButton`

**Description**

A compact button for icon-only actions.

**Use cases**

- Settings
- Notifications
- Search
- Close
- Back
- More menu
- Map zoom controls
- Edit/delete actions

**Guidance**

Every `IconButton` must have an accessible label.

---

## 6.3 `Input`

**Description**

A generic text input component with label, helper text, validation state, prefix/suffix, and optional icon adornments.

**Common variants**

- `text`
- `email`
- `password`
- `number`
- `search`
- `unit`
- `readonly`

**Use cases**

- Forms
- Search
- Workout logging
- Profile editing
- Numeric metric entry
- Route naming

---

## 6.4 `TextArea`

**Description**

A multi-line text input.

**Use cases**

- Session comments
- Profile bio
- Support messages
- Post captions
- Injury notes
- Route notes

---

## 6.5 `SearchInput`

**Description**

A specialised input for search interactions.

**Common features**

- Clear button
- Loading state
- Search icon
- Recent search support
- Keyboard submit
- Debounced change handling

**Use cases**

- App-wide search
- Exercise search
- Route search
- Feed search
- Message search
- Settings search

---

## 6.6 `Select`

**Description**

A generic selection control.

**Common variants**

- `native`
- `custom`
- `single`
- `multi`
- `searchable`

**Use cases**

- Units
- Activity type
- Sort order
- Privacy level
- Time period
- Equipment selection

---

## 6.7 `Combobox`

**Description**

An input + listbox hybrid for searchable selection.

**Use cases**

- Exercise picker
- Location search
- Tag picker
- User picker
- Club picker
- Food search

---

## 6.8 `Checkbox`

**Description**

A boolean or multi-select input.

**Use cases**

- Multi-filter selection
- Settings toggles
- Checklist flows
- Permission options
- Bulk selection

---

## 6.9 `RadioGroup`

**Description**

A mutually exclusive selection group.

**Use cases**

- Unit system
- Theme choice
- Privacy default
- Activity visibility
- Single-choice onboarding questions

---

## 6.10 `Switch`

**Description**

A binary setting control.

**Use cases**

- Notifications
- Dark mode
- Auto-pause
- Public/private setting
- Sync enablement
- Reduced data mode

---

## 6.11 `Slider`

**Description**

A continuous or stepped value selector.

**Use cases**

- Intensity
- Target heart-rate range
- Map zoom preference
- Volume/brightness-style controls
- Duration ranges
- Goal values

---

## 6.12 `Chip`

**Description**

A compact interactive label.

**Common variants**

- `filter`
- `choice`
- `input`
- `removable`
- `status`
- `category`

**Use cases**

- Activity filters
- Selected exercises
- Tags
- Search refinements
- Feed topics
- Route types

---

## 6.13 `Tabs`

**Description**

A navigation or view-switching control.

**Use cases**

- Profile sections
- Social feed sections
- Calendar views
- Workout list/calendar toggle
- Settings categories
- Detail page sections

---

## 6.14 `SegmentedControl`

**Description**

A compact control for switching between a small number of related options.

**Use cases**

- Day/week/month
- List/grid
- Metric/imperial
- Public/private
- Run/cycle/hike route mode
- Compact/comfortable density

---

## 6.15 `Accordion`

**Description**

A collapsible disclosure component.

**Use cases**

- Settings groups
- FAQ sections
- Exercise details
- Filter groups
- Advanced options
- Session review sections

---

## 6.16 `DropdownMenu`

**Description**

A menu of actions or navigation options anchored to a trigger.

**Use cases**

- More actions
- Sort menu
- Export menu
- Profile menu
- Card actions
- Table row actions

---

## 6.17 `ContextMenu`

**Description**

A contextual action menu triggered by right click, long press, or secondary interaction.

**Use cases**

- Feed item actions
- Message actions
- Map waypoint actions
- Table row actions
- File/import actions

---

## 6.18 `Popover`

**Description**

A lightweight floating panel anchored to a trigger.

**Use cases**

- Inline help
- Mini settings
- Small forms
- Filter popovers
- User preview
- Route marker details

---

## 6.19 `Tooltip`

**Description**

A short contextual explanation displayed on hover, focus, or tap.

**Use cases**

- Icon explanations
- Disabled action reasons
- Truncated text
- Chart point details
- Map control hints

---

## 6.20 `Modal`

**Description**

A blocking overlay used for focused tasks or confirmations.

**Use cases**

- Create/edit form
- Session completion
- Import/export
- Settings sub-flow
- Image/media preview
- Confirmation before destructive action

---

## 6.21 `Dialog`

**Description**

A specific modal pattern for decisions, confirmations, and alerts.

**Use cases**

- Delete confirmation
- Discard workout
- Leave unsaved changes
- Permission explanation
- Critical error alert

---

## 6.22 `Drawer`

**Description**

A side panel that slides over or alongside content.

**Use cases**

- Mobile navigation
- Filter panel
- Route details
- Message details
- Settings navigation
- Desktop inspector panel

---

## 6.23 `BottomSheet`

**Description**

A mobile-first bottom overlay with optional snap points.

**Use cases**

- Mobile action menu
- Route waypoint details
- Activity quick actions
- Filter controls
- Share sheet
- Mobile form preview

---

## 6.24 `ActionSheet`

**Description**

A mobile action chooser, usually for contextual options.

**Use cases**

- Share activity
- Upload source
- More actions
- Delete/report/block decisions
- Media options

---

## 6.25 `FloatingPanel`

**Description**

A floating generic panel that sits above content without necessarily blocking interaction.

**Use cases**

- Map route summary
- Active workout stats
- Quick settings
- Floating search result
- Inspector panel
- Temporary tool options

---

## 6.26 `FloatingToolbar`

**Description**

A floating cluster of actions, often icon-based.

**Use cases**

- Route planner tools
- Media editing tools
- Map drawing tools
- Active session controls
- Quick formatting tools

---

## 6.27 `Banner`

**Description**

A persistent or semi-persistent message area.

**Use cases**

- Storage warning
- Offline mode warning
- Sync issue
- Injury warning
- App update notice
- Permission reminder

---

## 6.28 `Toast`

**Description**

A temporary feedback message.

**Use cases**

- Save success
- Undo delete
- Export complete
- Sync failed
- Route copied
- Workout discarded

---

## 6.29 `Pagination`

**Description**

A navigation control for paged data.

**Use cases**

- Tables
- Search results
- Admin-style views
- Long history views
- Import review screens

---

## 6.30 `CommandPalette`

**Description**

A full-screen or panel command launcher with fuzzy search over a list of actions or navigation targets. Controlled externally via `open`/`onClose`. Composes `SearchInput`, `Surface`, and `ScrollArea`.

**Common features**

- Fuzzy search filtering
- Keyboard navigation (arrow keys + Enter)
- Action groups with headings
- Keyboard shortcut hints
- Recent/pinned items

**Use cases**

- App-wide action search
- Quick navigation
- Developer / power-user toolbar
- Settings search shortcut
- Recent items launcher

---

## 6.31 `DatePicker`

**Description**

A calendar date-selection control.

**Common variants**

- `inline`
- `popover`
- `range`

**Common props**

- `value`
- `onChange`
- `min`
- `max`
- `locale`
- `disabled`

**Use cases**

- Session date entry
- Schedule event creation
- Goal deadline selection
- Training plan date range
- Export date range

---

## 6.32 `FileUploader`

**Description**

A drag-and-drop and click-to-browse file input. Emits a file list; performs no upload logic itself.

**Common props**

- `accept`
- `multiple`
- `maxSize`
- `onFiles`
- `disabled`

**Use cases**

- GPX route import
- CSV health data import
- Profile photo upload
- Bulk log import
- Attachment send

---

## 6.33 `FloatingActionButton`

**Description**

A circular FAB for the primary mobile action on a screen. Composes `IconButton`. Not to be used for secondary actions.

**Common variants**

- `primary`
- `secondary`
- `extended` (icon + label)

**Use cases**

- Start workout
- Create route
- Log session
- Compose message
- Add entry

---

## 6.34 `NumericStepper`

**Description**

An increment/decrement control for numeric values with configurable min, max, and step. Composes `Input` and `IconButton`.

**Common props**

- `value`
- `onChange`
- `min`
- `max`
- `step`
- `disabled`

**Use cases**

- Set count
- Rep target
- Rest duration
- Goal value
- Serving size

---

## 6.35 `PageControl`

**Description**

A read-only dot or line indicator showing position within a carousel or paged scroll. Performs no navigation itself — callers handle swiping/scrolling.

**Common props**

- `count`
- `activeIndex`

**Common variants**

- `dot`
- `line`
- `numbered`

**Use cases**

- Onboarding screens
- Carousel position
- Image gallery position
- Multi-step indicator (display only)
- Horizontal scroll position

---

## 6.36 `TimePicker`

**Description**

A time selection control.

**Common variants**

- `wheel`
- `input`
- `inline`

**Common props**

- `value`
- `onChange`
- `step`
- `locale`
- `use12Hour`

**Use cases**

- Session start time
- Scheduled notification time
- Race event time
- Sleep/wake targets
- Calendar event time

---

# 7. `ui/patterns/*`

Patterns are reusable compositions.

---

## 7.1 `PageHeader`

**Description**

A standard page-level heading area.

**Typical composition**

- `Text`
- `Row`
- `Button`
- `IconButton`
- `Badge`
- `ToolbarCluster`

**Use cases**

- Dashboard header
- Workout page header
- Profile header
- Settings header
- Route planner header

---

## 7.2 `AppHeader`

**Description**

A global or screen-level app header.

**Use cases**

- Mobile top bar
- Desktop content header
- Website header
- Authenticated app chrome
- Search/action header

---

## 7.3 `ToolbarCluster`

**Description**

A reusable grouped toolbar arrangement.

**Use cases**

- Page actions
- Map tools
- Table tools
- Filter/sort controls
- Editor controls

---

## 7.4 `FilterBar`

**Description**

A reusable filter/search/sort arrangement.

**Typical composition**

- `SearchInput`
- `Chip`
- `Select`
- `SegmentedControl`
- `Button`
- `Popover`

**Use cases**

- Workout filtering
- Feed filtering
- Route filtering
- Message search
- Table filtering
- Exercise search

---

## 7.5 `FormSection`

**Description**

A labelled form grouping with description, fields, validation, and optional actions.

**Use cases**

- Settings forms
- Profile editing
- Workout creation
- Route creation
- Food logging
- Account management

---

## 7.6 `AuthFormLayout`

**Description**

A standard authentication form composition.

**Use cases**

- Login
- Signup
- Password reset
- Verification code
- Account recovery

---

## 7.7 `EmptyStatePanel`

**Description**

A standardised no-content state.

**Typical composition**

- `Icon`
- `Text`
- `Button`
- `Surface`

**Use cases**

- No workouts
- No search results
- No messages
- No routes
- No saved items
- First-use onboarding prompt

---

## 7.8 `ErrorStatePanel`

**Description**

A standardised error state with recovery actions.

**Use cases**

- Network error
- Failed import
- Failed sync
- Permission denied
- Map loading failure
- Chart data unavailable

---

## 7.9 `LoadingStatePanel`

**Description**

A reusable loading arrangement.

**Use cases**

- Page loading
- Feed loading
- Dashboard widget loading
- Route loading
- Search loading
- Import processing

---

## 7.10 `CardGrid`

**Description**

A responsive grid of cards.

**Use cases**

- Dashboard widgets
- Activity type selection
- Health metrics
- Saved routes
- Achievement gallery
- Settings overview

---

## 7.11 `MetricGrid`

**Description**

A specialised data-display grid for metrics.

**Use cases**

- Fitness dashboard
- Sleep summary
- HRV/resting HR/VO₂ max
- Workout volume
- Nutrition totals
- Weekly progress

---

## 7.12 `StatPanel`

**Description**

A reusable panel for one or more statistics.

**Use cases**

- Training load
- Weekly distance
- Sleep score
- Calories
- Pace
- Weight trend

---

## 7.13 `FeedList`

**Description**

A standard scrolling feed arrangement.

**Use cases**

- Social feed
- Activity feed
- Notifications
- Club updates
- Comments
- Message previews

---

## 7.14 `DataTable`

**Description**

A reusable table pattern with sorting, filtering, row actions, loading, and empty states.

**Use cases**

- Exercise set table
- Import review
- Workout history
- Nutrition logs
- Device sync logs
- Admin/debug data

---

## 7.15 `SearchResultsLayout`

**Description**

A structured search results composition.

**Use cases**

- Exercise search
- Route search
- User search
- Message search
- Food search
- App-wide search

---

## 7.16 `SettingsSection`

**Description**

A standard settings group arrangement.

**Use cases**

- Account settings
- Appearance
- Units
- Notifications
- Privacy
- Import/export
- Danger zone

---

## 7.17 `ListDetailLayout`

**Description**

A reusable master/detail layout.

**Use cases**

- Messages
- Settings
- Workout history
- Route library
- Notifications
- Saved plans

---

## 7.18 `StepperFlow`

**Description**

A multi-step workflow pattern.

**Use cases**

- Onboarding
- Create workout plan
- Import data
- Create route
- Account setup
- Goal setup

---

## 7.19 `Card`

**Description**

A generic elevated container pattern with optional header, media, body, and footer slots. Composes `Surface` and `Column`. Replaces ad-hoc `Surface`+layout combos that repeat the same slotted structure across features.

**Typical composition**

- `Surface`
- `Column`
- `Text`
- `Row`
- `Image` (optional media slot)
- `Button` / `IconButton` (optional footer)

**Use cases**

- Activity summary card
- Metric summary card
- Route preview card
- Achievement card
- Content preview

---

## 7.20 `Carousel`

**Description**

A horizontally paged content arrangement with `PageControl` indicator and optional prev/next navigation. Wraps `CardScroller` when items are cards, or accepts generic slot content.

**Typical composition**

- `CardScroller`
- `PageControl`
- `IconButton` (prev/next)
- `Row` (controls)

**Use cases**

- Onboarding slides
- Featured route cards
- Achievement unlocks
- Photo gallery pages
- Dashboard widget highlights

---

## 7.21 `Gallery`

**Description**

A responsive image or media grid with an optional lightbox hook. Composes `Grid` and `Image` atoms. Domain-neutral: takes `src`/`alt` pairs, not workout-specific data.

**Typical composition**

- `Grid`
- `Image`
- `Surface` (lightbox overlay, optional)

**Use cases**

- Route photo gallery
- Activity photo review
- Profile media grid
- Achievement badge grid

---

## 7.22 `StackedList`

**Description**

A vertically stacked list of items with optional leading icon or avatar, trailing action, and `Divider` between rows. Replaces repeated `<Column>` + `<Row>` list patterns across features.

**Typical composition**

- `Column`
- `Row`
- `Divider`
- `Avatar` / `Icon` (leading)
- `IconButton` / `DropdownMenu` (trailing)
- `Text`

**Use cases**

- Settings item list
- Notification list
- Saved route list
- Exercise library list
- Message preview list

---

## 7.23 `TabBar`

**Description**

A bottom or top navigation tab bar pattern. Distinct from the `Tabs` molecule, which is a within-page view switcher: `TabBar` is a full navigation bar arrangement with icon and label per item, tied to routing.

**Typical composition**

- `Row`
- `NavItem`
- `Surface`
- `Icon`
- `Text`

**Use cases**

- Mobile bottom navigation
- Desktop top navigation bar
- Section switcher with route-level tabs
- App shell primary navigation

---

## 7.24 `TableOfContents`

**Description**

An anchor-linked list of headings for long-form content. Scrollspy-aware via IntersectionObserver hook — the active heading is highlighted as the user scrolls.

**Typical composition**

- `Column`
- `Text`
- anchor links

**Use cases**

- Settings page section nav
- Documentation sidebar
- Long FAQ page
- Training plan section index
- Profile page anchors

---

## 7.25 `Tree`

**Description**

A collapsible hierarchical list for nested data. Composes `Accordion` internally. Generic: takes a `nodes` prop with `renderNode` callback, no domain types in the pattern itself.

**Common props**

- `nodes`
- `renderNode`
- `defaultExpanded`
- `onToggle`

**Use cases**

- Exercise category browser
- Route folder structure
- Training plan hierarchy
- Settings category tree
- File/import structure review

---

# 8. Feature-Level Component Examples

Feature components compose the design system into domain-specific experiences.

---

## 8.1 Training Log

```txt
features/training-log/
  components/
    SessionCard/
    SessionList/
    SessionReview/
    ExerciseBlock/
    SetTable/
    RestTimer/
    WorkoutFilterPanel/
```

### `SessionCard`

**Built from**

- `Surface`
- `Text`
- `Badge`
- `DataValue`
- `Row`
- `Column`
- `DropdownMenu`
- `Button`

**Use cases**

- Workout history
- Social shared activity preview
- Calendar event summary
- Profile shared sessions

---

### `ExerciseBlock`

**Built from**

- `Surface`
- `Text`
- `Badge`
- `Accordion`
- `DataTable`
- `Row`
- `Column`

**Use cases**

- Session review
- Active workout logging
- Template editing
- Exercise history detail

---

## 8.2 Route Planning

```txt
features/planning/
  components/
    RouteMap/
    RouteToolbar/
    RouteSummaryPanel/
    WaypointMarker/
    DistanceMarker/
    RouteSearchPanel/
```

### `RouteToolbar`

**Built from**

- `FloatingToolbar`
- `IconButton`
- `Tooltip`
- `SegmentedControl`
- `Layer`
- `Layered`

**Use cases**

- Draw route
- Undo/redo
- Cut segment
- Reverse route
- Clear route
- Toggle distance markers
- Switch activity mode

---

### `RouteSummaryPanel`

**Built from**

- `FloatingPanel`
- `Surface`
- `Text`
- `DataValue`
- `Button`
- `Row`
- `Column`

**Use cases**

- Show route distance
- Show estimated time
- Show elevation summary
- Save route
- Start route
- Edit route name

---

## 8.3 Health

```txt
features/health/
  components/
    SleepSummaryTile/
    MetricTrendCard/
    ReadinessPanel/
    InjuryWarningBanner/
    NutritionSummary/
```

### `MetricTrendCard`

**Built from**

- `Surface`
- `Text`
- `DataValue`
- `Badge`
- `Progress`
- `Column`

**Use cases**

- HRV
- Resting HR
- VO₂ max
- Weight trend
- Sleep score
- Calories

---

## 8.4 Social

```txt
features/social/
  components/
    ActivityFeedItem/
    CommentThread/
    KudosButton/
    ShareSheet/
    ClubEventCard/
```

### `ActivityFeedItem`

**Built from**

- `Surface`
- `Avatar`
- `Text`
- `Badge`
- `Button`
- `IconButton`
- `DropdownMenu`
- `Column`
- `Row`

**Use cases**

- Activity post
- Shared workout
- Club update
- Event completion post
- Route share

---

## 8.5 Messages

```txt
features/messages/
  components/
    ConversationList/
    ConversationPreview/
    MessageBubble/
    MessageComposer/
    AttachmentPreview/
```

### `MessageComposer`

**Built from**

- `TextArea`
- `IconButton`
- `Button`
- `Row`
- `Surface`
- `Popover`

**Use cases**

- Direct message
- Group message
- Share workout with comment
- Send route link

---

# 9. State Checklist For Every Component

Every reusable component should define how it behaves across these states.

## 9.1 Interaction states

- [ ] Default
- [ ] Hover
- [ ] Active / pressed
- [ ] Focus-visible
- [ ] Disabled
- [ ] Selected
- [ ] Expanded
- [ ] Collapsed

## 9.2 Data states

- [ ] Empty
- [ ] Loading
- [ ] Skeleton
- [ ] Error
- [ ] Success
- [ ] Warning
- [ ] Pending
- [ ] Synced
- [ ] Offline

## 9.3 Content states

- [ ] Short content
- [ ] Long content
- [ ] Truncated content
- [ ] Overflow content
- [ ] Missing optional content
- [ ] Image unavailable
- [ ] Count overflow, e.g. `99+`

## 9.4 Responsive states

- [ ] Compact
- [ ] Comfortable
- [ ] Mobile
- [ ] Tablet
- [ ] Desktop
- [ ] Container-narrow
- [ ] Container-wide
- [ ] Touch input
- [ ] Pointer input

## 9.5 Accessibility states

- [ ] Keyboard reachable
- [ ] Screen-reader labelled
- [ ] Focus trapped where required
- [ ] Escape closes overlays
- [ ] Reduced motion
- [ ] High contrast
- [ ] Dark mode
- [ ] Error announced
- [ ] Loading announced where required

---

# 10. Variant Naming Guidance

Use semantic variants rather than one-off visual names.

Prefer:

```tsx
<Button variant="primary" />
<Surface variant="raised" />
<Badge tone="warning" />
<Text variant="caption" />
```

Avoid:

```tsx
<Button variant="orangeBigButton" />
<Surface variant="cardWithShadow2" />
<Badge variant="yellowSmall" />
<Text variant="grey13" />
```

Visual implementation should live in CSS tokens, not component names.

---

# 11. Composition Examples

## 11.1 Dashboard Metric Card

```tsx
<Surface variant="raised" padding="md" radius="lg">
  <Column gap="sm">
    <Row justify="between" align="center">
      <Text variant="label">Sleep score</Text>
      <Badge tone="success">Good</Badge>
    </Row>

    <DataValue value={82} suffix="/100" variant="number" />

    <Progress variant="linear" value={82} />
  </Column>
</Surface>
```

**Layer breakdown**

```txt
Surface      → atom
Column/Row   → layout
Text         → atom
Badge        → atom
DataValue    → atom
Progress     → atom
```

This remains a generic card unless renamed to `SleepSummaryTile`, at which point it becomes a feature component.

---

## 11.2 Route Planner Map Layout

```tsx
<Layered>
  <Layer position="fill">
    <RouteMap />
  </Layer>

  <Layer position="top-left">
    <FloatingPanel>
      <ZoomControls />
    </FloatingPanel>
  </Layer>

  <Layer position="left-center">
    <RouteSummaryPanel />
  </Layer>

  <Layer position="right-center">
    <RouteToolbar />
  </Layer>
</Layered>
```

**Layer breakdown**

```txt
Layered/Layer        → layout
FloatingPanel        → molecule
ZoomControls         → pattern or feature component
RouteSummaryPanel    → feature component
RouteToolbar         → feature component
RouteMap             → feature component
```

---

## 11.3 Search And Filter Bar

```tsx
<FilterBar>
  <SearchInput placeholder="Search workouts" />

  <Chip selected>Runs</Chip>
  <Chip>Gym</Chip>
  <Chip>Cycle</Chip>

  <Select label="Sort" />
</FilterBar>
```

**Layer breakdown**

```txt
FilterBar      → pattern
SearchInput    → molecule
Chip           → molecule
Select         → molecule
```

---

# 12. Decision Tree: Where Should A Component Live?

## Question 1: Is it an irreducible visual primitive?

Examples:

- Text
- Surface
- Icon
- Avatar
- Badge
- Divider
- Skeleton
- Data value

Place it in:

```txt
ui/atoms/*
```

---

## Question 2: Is it only responsible for spacing, layout, scrolling, or layering?

Examples:

- Row
- Column
- Grid
- Layered
- SplitPane
- AppShell
- ScrollArea

Place it in:

```txt
ui/layout/*
```

---

## Question 3: Is it a generic interactive control?

Examples:

- Button
- Input
- Select
- Popover
- Modal
- Dialog
- Drawer
- FloatingToolbar

Place it in:

```txt
ui/molecules/*
```

---

## Question 4: Is it a repeated arrangement of multiple generic UI components?

Examples:

- FilterBar
- PageHeader
- EmptyStatePanel
- MetricGrid
- DataTable
- SettingsSection

Place it in:

```txt
ui/patterns/*
```

---

## Question 5: Does it contain product-specific terminology or business logic?

Examples:

- SessionCard
- ExerciseBlock
- RouteToolbar
- SleepSummaryTile
- ActivityFeedItem

Place it in:

```txt
features/*
```

---

# 13. Checklist For Adding A New Component

Before adding a component, answer:

- [ ] What layer does it belong to?
- [ ] Is the name domain-neutral or feature-specific?
- [ ] Does it duplicate an existing component?
- [ ] Does it rely on design tokens rather than hardcoded values?
- [ ] Does it support required interaction states?
- [ ] Does it support responsive/container states?
- [ ] Does it support dark mode?
- [ ] Does it support keyboard interaction where relevant?
- [ ] Does it have an accessible label/name where relevant?
- [ ] Does it avoid importing from higher-level layers?
- [ ] Does it expose variants through props or classes?
- [ ] Does it avoid inline styles unless explicitly justified?
- [ ] Does it have examples in Storybook or a local component gallery?
- [ ] Does it have empty/loading/error states where applicable?
- [ ] Does it degrade gracefully on small screens?

---

# 14. Practical Component Inventory Checklist

## Atoms

- [ ] `Avatar`
- [ ] `Badge`
- [ ] `DataValue`
- [ ] `Divider`
- [ ] `Icon`
- [ ] `Image`
- [ ] `Logo`
- [ ] `Progress`
- [ ] `Skeleton`
- [ ] `StatusDot`
- [ ] `Surface`
- [ ] `Text`
- [ ] `VisuallyHidden`

## Layout

- [ ] `AppShell`
- [ ] `Column`
- [ ] `Container`
- [ ] `Grid`
- [ ] `Layer`
- [ ] `Layered`
- [ ] `MainRegion`
- [ ] `ResponsiveFrame`
- [ ] `Row`
- [ ] `ScrollArea`
- [ ] `Spacer`
- [ ] `SplitPane`
- [ ] `Stack`
- [ ] `StickyRegion`

## Molecules

- [ ] `Accordion`
- [ ] `ActionSheet`
- [ ] `Banner`
- [ ] `BottomSheet`
- [ ] `Button`
- [ ] `Checkbox`
- [ ] `Chip`
- [ ] `ColorPicker`
- [ ] `Combobox`
- [ ] `CommandPalette`
- [ ] `ContextMenu`
- [ ] `DatePicker`
- [ ] `Dialog`
- [ ] `Drawer`
- [ ] `DropdownMenu`
- [ ] `FileUploader`
- [ ] `FloatingActionButton`
- [ ] `FloatingPanel`
- [ ] `FloatingToolbar`
- [ ] `IconButton`
- [ ] `Input`
- [ ] `Modal`
- [ ] `NumericStepper`
- [ ] `PageControl`
- [ ] `Pagination`
- [ ] `Popover`
- [ ] `RadioGroup`
- [ ] `SearchInput`
- [ ] `SegmentedControl`
- [ ] `Select`
- [ ] `Slider`
- [ ] `Switch`
- [ ] `Tabs`
- [ ] `TextArea`
- [ ] `TimePicker`
- [ ] `Toast`
- [ ] `ToggleGroup`
- [ ] `Tooltip`

## Patterns

- [ ] `AppHeader`
- [ ] `AuthFormLayout`
- [ ] `Card`
- [ ] `CardGrid`
- [ ] `Carousel`
- [ ] `DataTable`
- [ ] `EmptyStatePanel`
- [ ] `ErrorStatePanel`
- [ ] `FeedList`
- [ ] `FilterBar`
- [ ] `FormSection`
- [ ] `Gallery`
- [ ] `ListDetailLayout`
- [ ] `LoadingStatePanel`
- [ ] `MetricGrid`
- [ ] `PageHeader`
- [ ] `SearchResultsLayout`
- [ ] `SettingsSection`
- [ ] `StackedList`
- [ ] `StatPanel`
- [ ] `StepperFlow`
- [ ] `TabBar`
- [ ] `TableOfContents`
- [ ] `ToolbarCluster`
- [ ] `Tree`

---

# 15. Recommended Implementation Standard

Each component folder should contain:

```txt
ComponentName/
  ComponentName.tsx
  ComponentName.css
  ComponentName.types.ts
  ComponentName.test.tsx
  ComponentName.stories.tsx
  index.ts
```

For simple atoms, this may be reduced to:

```txt
Text/
  Text.tsx
  Text.css
  index.ts
```

---

# 16. CSS Enforcement Guidance

Use component-local class scopes and variants.

Example:

```css
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  border-radius: var(--radius-md);
  font: var(--font-label);
  transition:
    background-color 160ms ease,
    border-color 160ms ease,
    color 160ms ease;

  &.primary {
    background: var(--color-action-primary-bg);
    color: var(--color-action-primary-fg);
  }

  &.secondary {
    background: var(--color-action-secondary-bg);
    color: var(--color-action-secondary-fg);
  }

  &:focus-visible {
    outline: var(--focus-ring);
    outline-offset: var(--focus-offset);
  }

  &:disabled {
    opacity: var(--opacity-disabled);
    cursor: not-allowed;
  }
}
```

Prefer:

```tsx
<Button variant="primary" size="md" />
```

Over:

```tsx
<button className="big-orange-submit-button" />
```

---

# 17. Final Principle

A strong atomic design system is not just a folder structure. It is an ownership model.

The important question is not only:

```txt
What does this component look like?
```

The stronger question is:

```txt
Who owns this responsibility?
```

Once ownership is clear, the system becomes easier to enforce, easier to test, and harder to accidentally fragment.
