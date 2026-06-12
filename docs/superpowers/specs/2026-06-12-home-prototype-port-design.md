# Design: Home Screen — Prototype Port (Phase 1)

**Date:** 2026-06-12
**Status:** Approved (design); pending implementation plan
**Scope:** Home screen only. Phone only. First of four surface ports.

## Goal

Adopt the visual look **and** structure of `docs/prototypes/responsiveapp.tsx`'s Home
screen into the real app, re-expressed in the app's design system (tokens, `@layer`
CSS, atomic primitives, zero inline styles — CLAUDE.md rules 1–10). The prototype is a
light-only, hardcoded-hex skeleton; the app's design system already supersedes it
(Geist fonts, tokenized accent, light/dark theming, ring/stage-bar colors, `--r-md`
radii). The port is therefore **restructuring + composition**, not a new visual
language.

### User decisions (locked during brainstorming)

1. Port **both** look and structure (not skin-only or layout-only).
2. Widget grid stays **user-rearrangeable** (existing `useWidgetGrid`); the prototype's
   layout becomes the **default** arrangement, restyled.
3. The two net-new widgets (Calendar, Checklist) are **visual stubs** — thin local/static
   data now, real event-sourced domains deferred to a later spec.
4. **Phone only.** Desktop/tablet (incl. the prototype's right sidebar and session
   table) is a separate future spec.
5. Execution **Approach 1** — restructure & reskin in place, borrowing shared visual
   atoms only where the prototype repeats a pattern.

## Current state

`ui/screens/home/HomeScreen.tsx` is mid-migration:
- Renders `WelcomeWidget` + `SplitTabs` (Upcoming / This Week) — these work.
- The "Widgets" and "Last Sessions" `Section`s are **empty placeholders** (`<></>`).
- `useWidgetGrid` / `WIDGET_REGISTRY` are fully wired but the grid is **never mounted**.

So the widget grid and Last Sessions are effectively greenfield.

`WIDGET_REGISTRY` has 16 widgets but **no Calendar, no Checklist, no Streak**. Readiness
exists. `tokens.css` already defines Geist, the accent, sleep-stage colors, status
colors, and `--r-md`/`--r-lg`.

## Target structure (`HomeScreen.tsx`)

```
Greeting        → WelcomeWidget         (slimmed — §A)
Upcoming/Week   → SplitTabs             (unchanged)
Widgets         → WidgetGrid            (mounted with restyled default set — §B/§C/§D)
Last Sessions   → LastSessionsSection   (new — §E)
```

## A. WelcomeWidget (slim)

The prototype keeps the greeting bare and moves Readiness + Streak into the widget grid.
Today `WelcomeWidget` bundles readiness + streak inline. Slim it to:

- Eyebrow: `{weekday} · {month day}` (existing).
- `<h1>` greeting + display name (existing).
- Workout-this-week line (existing).
- **Remove** the inline streak badge and readiness badge — these become grid widgets.

No data-layer change; the same props can stop being passed for readiness/streak once the
widgets consume the queries directly.

## B. Widget grid — default set & order

Mount `<WidgetGrid>` (the component already exists and is wired in `HomeScreen`). Default
arrangement mirrors the prototype phone Home (2-column grid):

| Order | Widget | Default size | Notes |
|-------|--------|--------------|-------|
| 1 | Sleep | full (`md`/`lg`) | reskin — §D |
| 2 | Weather | full (`wide`) | reskin — §D |
| 3 | Calendar | full (`wide`) | **new** — §C |
| 4 | Readiness | half (`sm`) | minor tweak — §D |
| 5 | Streak | half (`sm`) | **new** — §C |
| 6 | Checklist | full (`wide`) | **new** — §C |

The grid remains rearrangeable / resizable / add-remove via `useWidgetGrid`. Only the
*default* (seed) layout changes. The exact size-token → column-span mapping is confirmed
against `useWidgetGrid`/`WidgetGrid` during planning.

## C. New widgets (3)

All live in `ui/components/widgets/`, registered in `widgetRegistry.ts`.

- **`StreakHomeWidget`** — eyebrow "Streak", Flame icon + big mono count + "days in a
  row". **Real data** (`training_log_dashboard.streak`). Empty/zero → "No sessions yet".
- **`CalendarHomeWidget`** — header "Today", up to 3 events as `colored dot · name ·
  mono time`. **Stub data.** Empty → "No events today".
- **`ChecklistHomeWidget`** — header "Checklist" + a "＋" affordance (visual only, no add
  flow yet), tickable rows with a check-circle. Toggle is **local component state**
  (non-persistent). **Stub data.** Empty → "No items yet".

### Stub data source

New file `ui/components/widgets/widgetStubs.ts` exporting typed static arrays for calendar
events and checklist items, marked:

```ts
// TODO(home-port): replace with real calendar + checklist event-sourced domains.
// See docs/superpowers/specs/2026-06-12-home-prototype-port-design.md §C.
```

No new `features/` domain is created in this spec.

## D. Reskins (CSS only)

All changes in `styling/home-widgets.css` under `@layer project`, using **existing
tokens** and CSS nesting (`&`). Zero inline styles.

- **Sleep** — recompose to the prototype card: eyebrow "Sleep", large mono duration,
  `bed → wake` line, score circle, 4-segment stage bar, 4 stage labels with colored
  values (`--color-sleep-deep/-rem/-light/-awake`).
- **Weather** — rounded icon tile + large temp + condition + three metrics (wind /
  humidity / UV).
- **Readiness** — add the status word ("Good" / "Steady" / "Low") beneath the existing
  ring; reuse `RingProgress`.

### Shared atoms (borrow from Approach 2 only where repeated)

- **`StageBar`** — segmented horizontal proportion bar (Sleep stages; reusable later).
- **`StatTileRow`** — a row of three mini stat tiles (used by Last Sessions cards; matches
  the prototype's recurring 3-tile pattern).
- Reuse the existing `RingProgress` (in `HomeWidgets.tsx`) rather than re-implementing.

Placement of these atoms (e.g. `ui/patterns` vs colocated) is decided in the plan; they
must not import features (pattern-layer rule).

## E. Last Sessions section (new)

`LastSessionsSection` component replacing the empty placeholder:
- Header "Last Sessions" + "See all" action.
- Renders recent `activity_history` (**real data**, already queried) as prototype cards:
  icon tile · name · date, then a `StatTileRow` (Duration · Volume/Distance · third
  metric).
- Empty → "No recent sessions".

## Data flow

- **Real:** readiness, streak, sleep trend, weather/conditions, activity history,
  appointments — all already available via `useQuery` in `useHomeScreen` / widgets.
- **Stub:** calendar events + checklist items from `widgetStubs.ts`; checklist toggle is
  local state.

## Error / edge handling

Every widget and the Last Sessions section has an explicit empty state (matching the
existing widget empty-state pattern). Stub widgets render correctly with empty arrays.

## Testing

Follow existing patterns (e.g. `ui/screens/cardio/RoutesScreen.test.tsx`):
- Each new widget renders with and without data.
- Checklist toggle flips a row's done state.
- `LastSessionsSection` renders empty and populated.
- `StageBar` / `StatTileRow` render given proportions/values.

## Architecture compliance

- Zero inline `style=`; values via tokens + nested CSS in `@layer project`.
- Widgets remain in `ui/components/widgets` (project/feature-ui layer).
- Shared atoms must not import features.
- Stubs are not a feature domain (deferred).

## Out of scope

Desktop/tablet layouts and the prototype's right sidebar + session table; real
Calendar/Checklist domains; global token retune (accent saturation, shadows); the other
three surface ports (Active Session, Profile/Health, Messaging/Social/Blueprints).

## Deliverables

1. The code described in §A–§E.
2. A static, token-styled `docs/prototypes/home-port-mockup.html` preview of the ported
   phone Home (no server needed).
```
