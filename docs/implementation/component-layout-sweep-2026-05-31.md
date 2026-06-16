# Component Layout Sweep Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert all raw `className="row|column|cluster|surface|grow"` divs in `ui/components` and `ui/screens` to their corresponding layout/atom components (`Row`, `Column`, `Cluster`, `Surface`, `Spacer`), then purge legacy CSS aliases.

**Architecture:** Pure structural swap — zero visual change. Each raw layout div becomes the matching component via props; non-layout classes pass through as `className`. Surface combos that mix styling + layout wrap the layout component inside Surface. All changes are mechanical and reviewable area by area.

**Tech Stack:** React TSX, TypeScript, CSS custom properties, layout primitives in `ui/layout/`, atoms in `ui/atoms/`.

---

## Mapping Cheatsheet

Use this reference throughout every task. **Do not deviate from it.**

| Raw className | Component | Notes |
|---|---|---|
| `row` | `<Row>` | default gap=3 |
| `row compact` | `<Row gap={1}>` | |
| `row gap-0` | `<Row gap={0}>` | |
| `row align-center` | `<Row align="center">` | |
| `row align-top` | `<Row align="start">` | legacy alias |
| `row align-bottom` | `<Row align="end">` | legacy alias |
| `row space-between` | `<Row justify="between">` | legacy alias |
| `row center` | `<Row justify="center">` | legacy alias |
| `row space-between align-center` | `<Row justify="between" align="center">` | |
| `row compact align-center` | `<Row gap={1} align="center">` | |
| `row align-center compact space-between` | `<Row align="center" justify="between" gap={1}>` | |
| `row wrap` | `<Row wrap>` | |
| `row wrap align-center` | `<Row wrap align="center">` | |
| `column` | `<Column>` | default gap=4 |
| `column compact` | `<Column gap={1}>` | |
| `column gap-0` | `<Column gap={0}>` | |
| `column align-center` | `<Column align="center">` | |
| `column align-left` | `<Column align="start">` | legacy alias |
| `column align-right` | `<Column align="end">` | legacy alias |
| `column space-between` | `<Column justify="between">` | legacy alias |
| `column center` | `<Column justify="center">` | legacy alias |
| `column compact align-center` | `<Column gap={1} align="center">` | |
| `cluster` | `<Cluster>` | default gap=2 |
| `cluster compact` | `<Cluster gap={1}>` | |
| `grow` (standalone div) | `<Spacer>` | replace the whole element |
| `scroll-row` | `<ScrollRow>` | |
| `surface` | `<Surface>` | |
| `surface flat` | `<Surface variant="flat">` | |
| `surface plain` | `<Surface variant="plain">` | |
| `surface ghost` | `<Surface variant="ghost">` | |
| `surface accent` | `<Surface variant="accent">` | |
| `surface tight` | `<Surface pad="sm">` | |
| `surface bare` / `surface pad-none` | `<Surface pad="none">` | |
| `surface column [mods]` | `<Surface><Column [props]>…</Column></Surface>` | nest layout inside Surface |
| `surface row [mods]` | `<Surface><Row [props]>…</Row></Surface>` | nest layout inside Surface |
| Extra non-layout classes | pass via `className` prop | e.g. `className="photo-thumb"` |
| Semantic element (`<section>`, `<ul>`) | `as` prop on Row/Column/Cluster/Surface | |
| `onClick` on div | `onClick` prop on Row/Column/Cluster | already supported |

**Import path:** check an existing file in the same folder that imports `Grid` or other layout components for the correct alias (typically `@ui/layout` and `@ui/atoms`).

**Surface + layout combos:** When a `<div>` carries both surface styling (`surface`, `surface flat`, etc.) AND a layout class, **nest** the layout component inside `<Surface>`:
```tsx
// Before
<div className="surface column compact">…</div>
// After
<Surface>
  <Column gap={1}>…</Column>
</Surface>
```
If the surface already has a variant/pad, keep those props on `<Surface>`:
```tsx
// Before
<div className="surface flat row align-center">…</div>
// After
<Surface variant="flat">
  <Row align="center">…</Row>
</Surface>
```

**`grow` with extra classes:** When `<div className="grow someOtherClass">` is used (i.e. it's not a pure spacer), keep it as a `<div className="grow someOtherClass">` — only convert pure `grow` divs with no other purpose.

---

## File Structure

**Read-only (reference):**
- `ui/layout/_classes.ts` — Gap / Align / Justify types
- `ui/layout/Row.tsx`, `Column.tsx`, `Cluster.tsx`, `Spacer.tsx`, `ScrollRow.tsx`
- `ui/atoms/Surface.tsx`
- `styling/layout.css` — current class definitions (to be purged in Task 7)

**Modified per task (listed in each task below).**

---

## Task 1: session/ — high-volume files

**Files (modify):**
- `ui/components/session/SessionDetail.tsx` (22 row, 19 col, 3 cluster, 22 surface)
- `ui/components/session/FinishedView.tsx` (17 row, 9 col, 1 cluster, 9 surface)
- `ui/components/session/BlockCard.tsx` (10 row, 4 col, 1 cluster, 4 surface, 1 grow)
- `ui/components/session/SetRow.tsx` (7 row, 2 col, 1 cluster, 2 surface, 1 grow)

- [ ] **Step 1: Convert SessionDetail.tsx**

  Open `ui/components/session/SessionDetail.tsx`. Apply the mapping cheatsheet to every raw layout div. Add imports at the top for `Row`, `Column`, `Cluster`, `Surface` from the same alias used by Grid in this file (or the nearest sibling file). Example conversions:
  ```tsx
  // Before
  <div className="row space-between align-center">
  // After
  <Row justify="between" align="center">

  // Before
  <div className="column compact">
  // After
  <Column gap={1}>

  // Before
  <div className="surface column">
  // After
  <Surface>
    <Column>

  // Before
  <div className="grow" />
  // After
  <Spacer />
  ```

- [ ] **Step 2: Convert FinishedView.tsx**

  Same pattern. File already imports `Grid` — extend that import line to include `Row`, `Column`, `Cluster`, `Spacer` alongside Grid.

- [ ] **Step 3: Convert BlockCard.tsx + SetRow.tsx**

  Same pattern. Each file likely has no existing layout imports — add them.

- [ ] **Step 4: TypeScript check**

  Run: `npx tsc --noEmit`
  Expected: no new errors.

- [ ] **Step 5: Grep regression — session/**

  Run: `grep -rn "className=\"row\|className=\"column\|className=\"cluster" ui/components/session/`
  Expected: zero matches (excluding intentional pass-through className on `<Surface>` or `<Row>` itself, which would look like `className="photo-thumb"` not `className="row"`).

- [ ] **Step 6: Commit**

  ```
  git add ui/components/session/SessionDetail.tsx ui/components/session/FinishedView.tsx ui/components/session/BlockCard.tsx ui/components/session/SetRow.tsx
  git commit -m "refactor(session): swap raw layout divs for Row/Column/Cluster/Surface in high-volume session files"
  ```

---

## Task 2: session/ — remaining files

**Files (modify):**
- `ui/components/session/SessionHeader.tsx` (4 row, 6 col)
- `ui/components/session/InjuryBanner.tsx` (4 row, 2 col)
- `ui/components/session/ExerciseSection.tsx` (3 row, 3 col, 1 grow)
- `ui/components/session/WorkoutView.tsx` (3 row, 5 col, 3 surface)
- `ui/components/session/CardioEditor.tsx` (1 row, 1 col, 1 surface)
- `ui/components/session/SessionGpsPreview.tsx` (1 surface)

- [ ] **Step 1: Convert all remaining session/ files**

  Apply the cheatsheet to each file. Add imports as needed.

- [ ] **Step 2: TypeScript check**

  `npx tsc --noEmit` — expect clean.

- [ ] **Step 3: Grep regression — full session/**

  `grep -rn "className=\"row\|className=\"column\|className=\"cluster\|className=\"surface" ui/components/session/`
  Expected: zero plain layout-only matches.

- [ ] **Step 4: Commit**

  ```
  git add ui/components/session/
  git commit -m "refactor(session): complete raw layout sweep in session/ components"
  ```

---

## Task 3: widgets/ — high-volume files

**Files (modify):**
- `ui/components/widgets/DashboardMiniWidgets.tsx` (22 row, 23 col, 1 cluster, 16 surface, 1 grow)
- `ui/components/widgets/DashWidgets.tsx` (17 row, 11 col, 17 surface, 5 grow)
- `ui/components/widgets/WeatherWidget.tsx` (8 row, 12 col, 6 surface)
- `ui/components/widgets/SleepWidgets.tsx` (5 row, 12 col, 1 cluster, 3 surface)

- [ ] **Step 1: Convert DashboardMiniWidgets.tsx**

  File already imports Grid — extend to include Row/Column/Cluster/Surface/Spacer.
  Apply cheatsheet. Pay attention to `grow` — DashWidgets has 5 grow divs; each standalone `<div className="grow" />` → `<Spacer />`.

- [ ] **Step 2: Convert DashWidgets.tsx**

  Same. Already imports Grid (check).

- [ ] **Step 3: Convert WeatherWidget.tsx + SleepWidgets.tsx**

  Same pattern.

- [ ] **Step 4: TypeScript check + grep regression**

  `npx tsc --noEmit`
  `grep -rn "className=\"row\|className=\"column\|className=\"cluster\|className=\"surface" ui/components/widgets/DashboardMiniWidgets.tsx ui/components/widgets/DashWidgets.tsx ui/components/widgets/WeatherWidget.tsx ui/components/widgets/SleepWidgets.tsx`

- [ ] **Step 5: Commit**

  ```
  git add ui/components/widgets/DashboardMiniWidgets.tsx ui/components/widgets/DashWidgets.tsx ui/components/widgets/WeatherWidget.tsx ui/components/widgets/SleepWidgets.tsx
  git commit -m "refactor(widgets): swap raw layout divs for layout components in high-volume widget files"
  ```

---

## Task 4: widgets/ — remaining files

**Files (modify):**
- `ui/components/widgets/SleepReviewWidget.tsx` (5 row, 1 col, 3 surface, 1 grow)
- `ui/components/widgets/CalendarWidgets.tsx` (2 row, 2 col, 2 surface)
- `ui/components/widgets/WelcomeWidget.tsx` (2 row, 1 surface)
- `ui/components/widgets/ExportDataWidget.tsx` (1 row, 1 surface)
- `ui/components/widgets/EditDisplayNameWidget.tsx` (1 row)
- `ui/components/widgets/PlanRouteWidget.tsx` (1 surface)
- `ui/components/widgets/ImportDataWidget.tsx` (1 surface)

- [ ] **Step 1: Convert all remaining widget files**

  Apply cheatsheet. Add imports.

- [ ] **Step 2: TypeScript check + grep regression — full widgets/**

  `npx tsc --noEmit`
  `grep -rn "className=\"row\|className=\"column\|className=\"cluster\|className=\"surface" ui/components/widgets/`

- [ ] **Step 3: Commit**

  ```
  git add ui/components/widgets/
  git commit -m "refactor(widgets): complete raw layout sweep in widgets/ components"
  ```

---

## Task 5: modals/

**Files (modify):**
- `ui/components/modals/SettingsModal.tsx` (10 row, 6 col)
- `ui/components/modals/ImportModal.tsx` (7 row, 11 col, 3 surface)
- `ui/components/modals/ShareModal.tsx` (3 row, 1 surface)

- [ ] **Step 1: Convert all modals/ files**

  Apply cheatsheet. Add imports.

- [ ] **Step 2: TypeScript check + grep regression**

  `npx tsc --noEmit`
  `grep -rn "className=\"row\|className=\"column\|className=\"cluster\|className=\"surface" ui/components/modals/`

- [ ] **Step 3: Commit**

  ```
  git add ui/components/modals/
  git commit -m "refactor(modals): swap raw layout divs for layout components"
  ```

---

## Task 6: log/

**Files (modify):**
- `ui/components/log/SessionListItem.tsx` (2 row, 8 col, 2 cluster, 2 surface)
- `ui/components/log/FinishSessionModal.tsx` (3 row, 3 col, 2 cluster, 1 surface, 1 grow)
- `ui/components/log/WeekCalendar.tsx` (3 row, 2 col)
- `ui/components/log/ExercisePicker.tsx` (1 row, 3 col, 2 cluster, 1 surface)
- `ui/components/log/ScheduleStrip.tsx` (2 row, 1 col)
- `ui/components/log/RestTimerAlert.tsx` (2 row)
- `ui/components/log/MonthCalendar.tsx` (3 row, 2 col)
- `ui/components/log/UndoToast.tsx` (1 surface)

- [ ] **Step 1: Convert all log/ files**

  Apply cheatsheet. Add imports.

- [ ] **Step 2: TypeScript check + grep regression**

  `npx tsc --noEmit`
  `grep -rn "className=\"row\|className=\"column\|className=\"cluster\|className=\"surface" ui/components/log/`

- [ ] **Step 3: Commit**

  ```
  git add ui/components/log/
  git commit -m "refactor(log): swap raw layout divs for layout components"
  ```

---

## Task 7: social/

**Files (modify):**
- `ui/components/social/PostCard.tsx` (5 row, 3 col, 1 cluster, 1 surface)
- `ui/components/social/ActivityPostCard.tsx` (4 row, 8 col, 2 cluster, 2 surface)
- `ui/components/social/GroupsTab.tsx` (2 row, 1 col, 1 surface)
- `ui/components/social/EventsTab.tsx` (2 row, 1 col, 1 surface)
- `ui/components/social/FeedTab.tsx` (1 row, 1 surface)

- [ ] **Step 1: Convert all social/ files**

- [ ] **Step 2: TypeScript check + grep regression**

  `npx tsc --noEmit`
  `grep -rn "className=\"row\|className=\"column\|className=\"cluster\|className=\"surface" ui/components/social/`

- [ ] **Step 3: Commit**

  ```
  git add ui/components/social/
  git commit -m "refactor(social): swap raw layout divs for layout components"
  ```

---

## Task 8: profile/ + health/

**Files (modify):**
- `ui/components/profile/HealthOverviewTab.tsx` (3 row, 5 col, 1 cluster, 1 grow)
- `ui/components/profile/ActivitiesTab.tsx` (2 row, 2 col, 2 surface)
- `ui/components/health/InjuriesView.tsx` (1 row, 2 col, 1 surface)
- `ui/components/health/HealthChartsList.tsx` (1 row, 1 surface)
- All other health/ views with single `className="column"` (17 files): VitalsView, SymptomsView, StressView, SleepView, SkinTemperatureView, RoutesView, ReadinessView, NutritionView, MentalWellbeingView, MedicationsView, HeartView, HearingView, HealthRecordsView, GoalsRecordsView, CycleTrackingView, BodyMeasurementsView, BodyBatteryView, ActivityMobilityView, SleepView

- [ ] **Step 1: Convert profile/ files**

  Apply cheatsheet. HealthOverviewTab already imports Grid — extend import.

- [ ] **Step 2: Convert health/ files**

  For the 17 single-column health views, each has exactly one `<div className="column">` wrapping the view content. Convert to `<Column>`:
  ```tsx
  // Before
  <div className="column">
    {/* view content */}
  </div>
  // After
  import { Column } from '@ui/layout';
  // ...
  <Column>
    {/* view content */}
  </Column>
  ```

- [ ] **Step 3: TypeScript check + grep regression**

  `npx tsc --noEmit`
  `grep -rn "className=\"row\|className=\"column\|className=\"cluster\|className=\"surface" ui/components/profile/ ui/components/health/`

- [ ] **Step 4: Commit**

  ```
  git add ui/components/profile/ ui/components/health/
  git commit -m "refactor(profile/health): swap raw layout divs for layout components"
  ```

---

## Task 9: workout/ + shared/

**Files (modify):**
- `ui/components/workout/WorkoutFilterBar.tsx` (5 row, 3 col, 3 cluster, 2 surface, 4 grow)
- `ui/components/shared/Carousel.tsx` (2 row)

- [ ] **Step 1: Convert WorkoutFilterBar.tsx + Carousel.tsx**

  Apply cheatsheet. `WorkoutFilterBar` has 4 grow divs — each `<div className="grow" />` → `<Spacer />`.

- [ ] **Step 2: TypeScript check + grep regression — full ui/components/**

  This is the final components pass — do a full sweep:
  `npx tsc --noEmit`
  `grep -rn "className=\"row\b\|className=\"column\b\|className=\"cluster\b\|className=\"surface\b\|className=\"grow\b" ui/components/`
  Expected: zero plain-layout matches (any remaining matches should be clearly intentional pass-through classes on non-layout elements).

- [ ] **Step 3: Commit**

  ```
  git add ui/components/workout/ ui/components/shared/
  git commit -m "refactor(workout/shared): complete ui/components raw layout sweep"
  ```

---

## Task 10: ui/screens/ sweep

**Files (modify):**
- `ui/screens/progress/TrainingPlansScreen.tsx` (~9 raw occ)
- `ui/screens/profile/ProfileScreen.tsx` (column compact, cluster)
- `ui/screens/home/HomeScreen.tsx` (surface row align-center)
- `ui/screens/health/WeatherScreen.tsx` (if any raw remaining)
- `ui/screens/health/NotificationsScreen.tsx` (if any raw remaining)

- [ ] **Step 1: Audit each screen file first**

  Read each file. Identify raw layout classNames vs ones already using components. Only convert the raw ones.

- [ ] **Step 2: Convert TrainingPlansScreen.tsx**

  Particular patterns to watch for: `<Surface className="column compact">` → `<Surface><Column gap={1}>…</Column></Surface>`.

- [ ] **Step 3: Convert remaining screen files**

  Apply cheatsheet. Files may be mostly already migrated — just finish the stragglers.

- [ ] **Step 4: TypeScript check + grep regression — ui/screens/**

  `npx tsc --noEmit`
  `grep -rn "className=\"row\b\|className=\"column\b\|className=\"cluster\b\|className=\"surface\b\|className=\"grow\b" ui/screens/`

- [ ] **Step 5: Commit**

  ```
  git add ui/screens/
  git commit -m "refactor(screens): complete raw layout class sweep in ui/screens"
  ```

---

## Task 11: CSS legacy alias purification

Now that all conversions are done, remove the legacy CSS aliases that existed only to support the raw className patterns. These are in `styling/layout.css`.

**File (modify):**
- `styling/layout.css`

**Legacy aliases to remove** (search for and delete these rule blocks):
- `.row.compact`, `.column.compact`, `.cluster.compact` → replaced by `gap-1`
- `.row.space-between`, `.column.space-between` → replaced by `justify-between`
- `.row.space-around`, `.column.space-around` → replaced by `justify-around`
- `.row.center`, `.column.center` → replaced by `justify-center`
- `.row.align-top`, `.row.align-bottom` → replaced by `align-start`/`align-end`
- `.column.align-left`, `.column.align-right` → replaced by `align-start`/`align-end`

**Before removing each alias:** grep the entire codebase to confirm zero usages remain:
```
grep -rn "class.*\bcompact\b\|class.*\bspace-between\b\|class.*\bcenter\b\|class.*\balign-top\b\|class.*\balign-bottom\b\|class.*\balign-left\b\|class.*\balign-right\b" ui/
```
If any match is a raw className string (not a component className pass-through), convert it first before deleting the alias.

- [ ] **Step 1: Grep for remaining legacy class usages across ui/**

  Run the grep above. Document any remaining raw usages.

- [ ] **Step 2: Fix any remaining usages found**

  Apply cheatsheet to each. They should be zero after Tasks 1–10.

- [ ] **Step 3: Remove legacy alias blocks from layout.css**

  Delete the rule blocks listed above. Keep `gap-0` through `gap-5`, `align-*`, `justify-*`, `wrap` — those are the canonical names the components emit.

- [ ] **Step 4: TypeScript check**

  `npx tsc --noEmit`

- [ ] **Step 5: Visual spot-check**

  Run the dev app. Navigate to: Dashboard, Session Detail, Progress, Profile, a modal. Confirm layout matches design — no gaps collapsed, no alignment broken. Refer to DESIGN.md spacing guide.

- [ ] **Step 6: Commit**

  ```
  git add styling/layout.css
  git commit -m "refactor(css): purge legacy layout aliases (compact, space-between, center, align-top/bottom)"
  ```

---

## Task 12: Code graph rebuild + plan archival

- [ ] **Step 1: Rebuild code graph**

  Run:
  ```
  python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"
  ```

- [ ] **Step 2: Move plan to completed**

  ```
  git mv plans/todo/component-layout-sweep-2026-05-31.md plans/completed/component-layout-sweep-2026-05-31.md
  git mv plans/todo/atomic-layout-component-consistency.md plans/completed/atomic-layout-component-consistency.md
  git add plans/
  git commit -m "docs: archive completed layout sweep plans"
  ```

---

## Verification Summary

After each task:
1. `npx tsc --noEmit` — no new type errors
2. Grep regression — zero raw layout-only className matches in the area
3. Visual parity — run dev app, spot-check the area (optional per task, mandatory for Task 11)

Final regression (after Task 10):
```
grep -rn "className=\"row\b\|className=\"column\b\|className=\"cluster\b" ui/
```
Expected: matches only inside layout component source files themselves (`Row.tsx`, `Column.tsx`, etc.) and intentional non-layout pass-throughs.

---

## Non-Goals (guardrails)

- **No visual change** — structural swap only
- Don't convert non-layout divs (`q-row`, `photo-thumb`, `toast-stack`, named component wrappers)
- Don't touch `Grid`/`GridItem` usages — already components
- Don't redesign — if a combo can't map cleanly, pass extra classes via `className` prop
- Don't add features or refactor beyond the swap
