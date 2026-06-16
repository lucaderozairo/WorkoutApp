# Raw Element Elimination & Variant API Migration

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Status:** [x] COMPLETE - all 5 phases done as of 2026-06-14. Violations reduced: 133 -> 116 (overlay pass) -> 49 (this plan). 49 remaining `screen-visual-class` warnings are structural/domain classNames on layout primitives (e.g. `route-explore-*`, `appbar`, `header`) - tracked as next phase targets.

**Goal:** Replace every raw `<div>` and `<button>` in `ui/screens/` with proper primitive/layout components, and phase out `className` hacks on high-level components in favour of typed variant props.

**Architecture:** All visual elements in screens must originate from primitives (`ui/atoms/`, `ui/molecules/`, `ui/layout/`). Layout glue uses `Row`/`Column`/`Cluster`/`Surface`; interactive elements use `Button`/`Chip`; text uses `Text`. Project-specific button patterns (map controls, sidebar rail items, activity chips) get thin wrapper components in `ui/components/<domain>/` that compose primitives and expose a clean props API.

**Tech Stack:** React 18, TypeScript strict, CSS layers (`@layer project` for domain styles), Phosphor icons via `Icon` atom.

> **Deferred:** Adding `grow`/`shrink` boolean props to `Row`/`Column`/`Cluster`/`Surface` is intentionally excluded. The proper fix is restructuring parent containers to use `Grid` with `fr`/`auto` tracks so children never self-declare flex sizing. See -> `docs/superpowers/plans/2026-06-05-grid-first-layout-refactor.md`. Until that plan runs, leave existing `className="grow"` / `className="shrink-0"` usages in place.

---

## Audit Summary

### RoutePlannerScreen.tsx (`ui/screens/cardio/RoutePlannerScreen.tsx`)
Heaviest offender - 14 raw `<div>`s, 13 raw `<button>`s, 6 raw `<input>`s.

Key patterns:
- Map control buttons: `<button className="ghost icon sm" data-map-btn>`
- Sidebar rail items: `<button className="side-rail-item active">`
- Bottom sheet: `<div className="bottom-sheet" data-snap={snap}>`
- Activity chips: `<button className="activity-chip column gap-1">`
- Pace presets: `<button className="sm column pad-sm">`
- Saved route cards: `<button className="surface pad-sm flat interactive">`
- Layout containers: raw `<div className="side-rail">`, `"side-content column gap-1"`, `"desktop-only"`, `"mobile-only"`

Also passes `className` on composed components:
- `<Button className="sm">` -> should be `<Button size="sm">`
- `<Button className="active">` -> needs `active` prop on Button
- `<Text className="nowrap">` -> needs `nowrap` prop

### TrainingPlansScreen.tsx (`ui/screens/progress/TrainingPlansScreen.tsx`)
15 raw elements, many with inline `style={}` - violates rule 6 (no hardcoded values) and rule 8 (no inline styles).

### Other screens (minor)
- `LogScreen`: `<button className="surface interactive">`, `<p className="caption">`
- `NewSessionScreen`: `<button className="column align-center surface card">`
- `SavedRoutesScreen`: `<div className="surface column gap-1 interactive">`
- `HomeScreen`: `<div role="status" aria-live="polite">` (keep - ARIA not on Surface)

---

## Files Created / Modified

| Action | Path |
|--------|------|
| Modify | `ui/atoms/Text.tsx` |
| Modify | `ui/molecules/Button.tsx` |
| Create | `ui/components/route-planner/MapControlButton.tsx` |
| Create | `ui/components/route-planner/SideRailItem.tsx` |
| Create | `ui/components/route-planner/ActivityChip.tsx` |
| Modify | `ui/screens/cardio/RoutePlannerScreen.tsx` |
| Create | `ui/components/training-plans/ScheduleEventBlock.tsx` |
| Create | `styling/training-plans.css` |
| Modify | `styling/global.css` |
| Modify | `ui/screens/progress/TrainingPlansScreen.tsx` |
| Modify | `ui/screens/log/LogScreen.tsx` |
| Modify | `ui/screens/log/NewSessionScreen.tsx` |
| Modify | `ui/screens/routes/SavedRoutesScreen.tsx` |

---

## Phase 1 - Primitive Prop Extensions

> Tasks for grow/shrink on Row/Column/Cluster/Surface are **deferred** - see `docs/superpowers/plans/2026-06-05-grid-first-layout-refactor.md`. During Phase 3 migrations, leave any `className="grow"` / `className="shrink-0"` usages as-is.

### Task 1.1: Add `nowrap` prop to `Text`

**Files:**
- Modify: `ui/atoms/Text.tsx`

- [x] **Step 1: Add `nowrap` prop**

```tsx
// ui/atoms/Text.tsx
interface TextProps {
  size?: TextSize;
  color?: TextColor;
  mono?: boolean;
  bold?: boolean;
  truncate?: boolean;
  nowrap?: boolean;       // <- add
  as?: ElementType;
  className?: string;
  children: ReactNode;
}

// In the classes array:
const classes = [
  SIZE_CLASS[size],
  COLOR_CLASS[color],
  mono     ? 'mono'     : '',
  bold     ? 'bold'     : '',
  truncate ? 'truncate' : '',
  nowrap   ? 'nowrap'   : '',  // <- add
  className,
].filter(Boolean).join(' ');
```

- [x] **Step 2: Commit**

```bash
git add ui/atoms/Text.tsx
git commit -m "feat(atoms): add nowrap prop to Text"
```

---

### Task 1.2: Add `active` and `icon-sm` size to `Button`

**Files:**
- Modify: `ui/molecules/Button.tsx`

- [x] **Step 1: Add `active` prop and `icon-sm` size**

```tsx
// ui/molecules/Button.tsx
type Size = 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  leading?: ReactNode;
  trailing?: ReactNode;
  loading?: boolean;
  success?: boolean;
  active?: boolean;       // <- add
  block?: boolean;
  children?: ReactNode;
}

const SIZE_CLASS: Record<Size, string> = {
  sm:        'sm',
  md:        '',
  lg:        'lg',
  icon:      'icon',
  'icon-sm': 'icon sm',  // <- add
};

// In the classes array:
const classes = [
  VARIANT_CLASS[variant],
  SIZE_CLASS[size],
  block  ? 'block'  : '',
  active ? 'active' : '',  // <- add
  className,
].filter(Boolean).join(' ');
```

- [x] **Step 2: Commit**

```bash
git add ui/molecules/Button.tsx
git commit -m "feat(molecules): add active prop and icon-sm size to Button"
```

---

## Phase 2 - New Project-Specific Components

### Task 2.1: Create `MapControlButton`

**Files:**
- Create: `ui/components/route-planner/MapControlButton.tsx`

- [x] **Step 1: Create the component**

```tsx
// ui/components/route-planner/MapControlButton.tsx
import type { ButtonHTMLAttributes } from 'react';
import { Button } from '../../molecules/Button';
import { Icon } from '../../atoms/Icon';
import type { IconName } from '../../atoms/Icon';

interface MapControlButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName;
  active?: boolean;
}

export function MapControlButton({ icon, active, ...rest }: MapControlButtonProps) {
  return (
    <Button variant="ghost" size="icon-sm" active={active} data-map-btn {...rest}>
      <Icon name={icon} size="sm" />
    </Button>
  );
}
```

- [x] **Step 2: Verify `Icon` exports an `IconName` type** - grep `ui/atoms/Icon.tsx` for the type name and adjust the import if it differs.

- [x] **Step 3: Commit**

```bash
git add ui/components/route-planner/MapControlButton.tsx
git commit -m "feat(route-planner): add MapControlButton component"
```

---

### Task 2.2: Create `SideRailItem`

**Files:**
- Create: `ui/components/route-planner/SideRailItem.tsx`

- [x] **Step 1: Create the component**

```tsx
// ui/components/route-planner/SideRailItem.tsx
import type { ReactNode } from 'react';
import { Button } from '../../molecules/Button';

interface SideRailItemProps {
  id: string;
  label: string;
  icon: ReactNode;
  active?: boolean;
  onClick: () => void;
}

export function SideRailItem({ id, label, icon, active, onClick }: SideRailItemProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      active={active}
      className="side-rail-item"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      data-panel={id}
    >
      {icon}
      <span>{label}</span>
    </Button>
  );
}
```

- [x] **Step 2: Commit**

```bash
git add ui/components/route-planner/SideRailItem.tsx
git commit -m "feat(route-planner): add SideRailItem component"
```

---

### Task 2.3: Create `ActivityChip`

**Files:**
- Create: `ui/components/route-planner/ActivityChip.tsx`

- [x] **Step 1: Create the component**

```tsx
// ui/components/route-planner/ActivityChip.tsx
import type { ReactNode } from 'react';
import { Button } from '../../molecules/Button';
import { Column } from '../../layout/Column';

interface ActivityChipProps {
  id: string;
  label: string;
  dot: ReactNode;
  active?: boolean;
  onClick: () => void;
}

export function ActivityChip({ id, label, dot, active, onClick }: ActivityChipProps) {
  return (
    <Button
      variant="ghost"
      active={active}
      className="activity-chip"
      onClick={onClick}
      data-id={id}
    >
      <Column gap={1} align="center">
        {dot}
        <span>{label}</span>
      </Column>
    </Button>
  );
}
```

- [x] **Step 2: Commit**

```bash
git add ui/components/route-planner/ActivityChip.tsx
git commit -m "feat(route-planner): add ActivityChip component"
```

---

## Phase 3 - RoutePlannerScreen Migration

### Task 3.1: Replace raw `<button>` elements in RoutePlannerScreen

**Files:**
- Modify: `ui/screens/cardio/RoutePlannerScreen.tsx`

- [x] **Step 1: Add imports**

```tsx
import { Button } from '../../../molecules/Button';
import { MapControlButton } from '../../../components/route-planner/MapControlButton';
import { SideRailItem } from '../../../components/route-planner/SideRailItem';
import { ActivityChip } from '../../../components/route-planner/ActivityChip';
```
(Adjust relative depth to actual file location in `ui/screens/cardio/`.)

- [x] **Step 2: Replace map control buttons**

```tsx
// Before (zoom in, ~line 201):
<button className="ghost sm" onClick={() => mapRef.current?.zoomIn()} aria-label="Zoom in" data-map-btn>
  <MagnifyingGlassPlus />
</button>

// After:
<MapControlButton icon="magnifying-glass-plus" onClick={() => mapRef.current?.zoomIn()} aria-label="Zoom in" />
```
Apply same pattern to: zoom out, fit route, locate me, close/open layer picker, layer selector buttons (with `active={baseLayerId === l.id}`).

- [x] **Step 3: Replace side rail item buttons (~line 287)**

```tsx
// Before:
<button key={item.id} className={`side-rail-item${sidePanel === item.id && sideOpen ? ' active' : ''}`}
  onClick={() => handleRailClick(item.id)} aria-label={item.label} aria-pressed={...}>
  {item.icon}<span>{item.label}</span>
</button>

// After:
<SideRailItem key={item.id} id={item.id} label={item.label} icon={item.icon}
  active={sidePanel === item.id && sideOpen} onClick={() => handleRailClick(item.id)} />
```

- [x] **Step 4: Replace bottom sheet tab buttons (~line 359)**

```tsx
// Before:
<button key={tab.id} className={`tab${sidePanel === tab.id ? ' active' : ''}`}
  onClick={() => { setSidePanel(tab.id); }}>{tab.label}</button>

// After:
<Button key={tab.id} variant="ghost" active={sidePanel === tab.id} className="tab"
  onClick={() => { setSidePanel(tab.id); }}>{tab.label}</Button>
```

- [x] **Step 5: Replace bottom sheet handle button (~line 351)**

```tsx
// Before:
<button className="handle" onClick={() => setSnap(...)} aria-label="Toggle sheet">

// After:
<Button variant="ghost" className="handle" onClick={() => setSnap(...)} aria-label="Toggle sheet" />
```

- [x] **Step 6: Replace activity chip buttons (~line 462)**

```tsx
// Before:
<button key={a.id} data-id={a.id}
  className={`activity-chip column gap-1 align-center${activity === a.id ? ' active' : ''}`}
  onClick={() => setActivity(a.id)}>
  <span data-id={a.id} className="activity-dot">...</span>
  <span>...</span>
</button>

// After:
<ActivityChip key={a.id} id={a.id} label={a.label}
  dot={<span data-id={a.id} className="activity-dot">{a.icon}</span>}
  active={activity === a.id} onClick={() => setActivity(a.id)} />
```

- [x] **Step 7: Replace pace preset buttons (~line 548)**

```tsx
// Before:
<button key={p} className={`sm column pad-sm${pacePreset === p ? ' active' : ''}`}
  onClick={() => handlePacePreset(p)}>
  <span>{p.charAt(0).toUpperCase() + p.slice(1)}</span>
  <span className="caption faint">{formatPace(paceForPreset(p))}</span>
</button>

// After:
<Button key={p} variant="ghost" size="sm" active={pacePreset === p} className="pad-sm"
  onClick={() => handlePacePreset(p)}>
  <Column gap={0} align="center">
    <Text>{p.charAt(0).toUpperCase() + p.slice(1)}</Text>
    <Text size="caption" color="faint">{formatPace(paceForPreset(p))}</Text>
  </Column>
</Button>
```

- [x] **Step 8: Replace saved route card buttons (~line 726)**

```tsx
// Before:
<button key={route.id} className="surface pad-sm flat interactive"
  onClick={() => handleLoadSavedRoute(route)}>

// After (Surface is polymorphic):
<Surface key={route.id} as="button" variant="flat" pad="sm" interactive
  onClick={() => handleLoadSavedRoute(route)}>
```

- [x] **Step 9: TypeScript check**

```bash
npx tsc --noEmit
```

- [x] **Step 10: Commit**

```bash
git add ui/screens/cardio/RoutePlannerScreen.tsx
git commit -m "refactor(route-planner): replace raw button elements with primitives"
```

---

### Task 3.2: Replace raw `<input>` elements in RoutePlannerScreen

**Files:**
- Modify: `ui/screens/cardio/RoutePlannerScreen.tsx`

- [x] **Step 1: Replace search inputs with `SearchBar`**

```tsx
// Before (~line 122):
<input className="input grow" placeholder="Search a place, address, or lat/lng..."
  value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={...} />

// After:
<SearchBar value={searchQuery} onChange={setSearchQuery}
  placeholder="Search a place, address, or lat/lng..." onSubmit={handleSearch} />
```

- [x] **Step 2: Replace route name inputs with `Input` (~lines 133, 373)**

```tsx
// Before:
<input className="input grow" placeholder="Route name..." value={routeName} onChange={...} />

// After:
<Input placeholder="Route name..." value={routeName} onChange={e => setRouteName(e.target.value)} />
```

- [x] **Step 3: Replace pace text input (~line 531)**

```tsx
// Before:
<input className="input sm" placeholder="m:ss" value={paceInput} onChange={...} />

// After (if Input has no size prop, use className="sm" as interim):
<Input className="sm" placeholder="m:ss" value={paceInput} onChange={...} onBlur={...} onKeyDown={...} />
```

- [x] **Step 4: Replace range slider (~line 539)**

```tsx
// Before:
<input type="range" min={120} max={540} value={paceSecondsPerKm} onChange={...} />

// After:
<Slider min={120} max={540} value={paceSecondsPerKm} onChange={v => setPaceSecondsPerKm(v)} />
```

- [x] **Step 5: Commit**

```bash
git add ui/screens/cardio/RoutePlannerScreen.tsx
git commit -m "refactor(route-planner): replace raw input elements with Input/SearchBar/Slider"
```

---

### Task 3.3: Replace raw `<div>` containers + phase out className in RoutePlannerScreen

**Files:**
- Modify: `ui/screens/cardio/RoutePlannerScreen.tsx`

- [x] **Step 1: Replace responsive wrapper divs**

```tsx
<div className="desktop-only">  ->  <Row className="desktop-only">
<div className="mobile-only column gap-1">  ->  <Column gap={1} className="mobile-only">
```

- [x] **Step 2: Replace sidebar structure divs (~line 282)**

```tsx
<div className={`side${sideOpen ? '' : ' collapsed'}`}>
  <div className="side-rail">
  <div className="side-content column gap-1">

->

<Row className={`side${sideOpen ? '' : ' collapsed'}`}>
  <Column className="side-rail">
  <Column gap={1} className="side-content">
```

- [x] **Step 3: Replace bottom sheet div (~line 350)** - retain className="grow"/"shrink-0" until grid plan runs

```tsx
<div className="bottom-sheet" data-snap={snap}>
  <button className="handle" .../>
  <div className="body column grow scroll-y">
    <div className="tabs shrink-0">

->

<Surface variant="ghost" pad="none" className="bottom-sheet" data-snap={snap}>
  <Button variant="ghost" className="handle" .../>
  <Column className="grow scroll-y">
    <Row className="tabs shrink-0">
```

- [x] **Step 4: Replace elevation panel / chart divs (~line 246)**

```tsx
<div className="desktop-only">
  <div data-elevation-panel className="shrink-0">
  <div className="grow" data-mini-chart>
  <div data-chart>

->

<Row className="desktop-only">
  <Column className="shrink-0" data-elevation-panel>
  <Column className="grow" data-mini-chart>
  <Column data-chart>
```

- [x] **Step 5: Replace surface mix bar divs (~line 646)**

```tsx
<div className="surface-mix-bar">
  <div key={s.key} className="surface-mix-segment" data-surface={s.key} style={{ flex: s.pct }}>

->

<Row className="surface-mix-bar">
  <Column key={s.key} className="surface-mix-segment" data-surface={s.key} style={{ flex: s.pct }}>
```

Note: `style={{ flex: s.pct }}` is data-driven (not hardcoded), acceptable per token rules.

- [x] **Step 6: Phase out className where props now exist**

```tsx
<Button className="sm">      -> <Button size="sm">
<Button className="active">  -> <Button active>
<Text className="nowrap">    -> <Text nowrap>
<Row className="gap-0">      -> <Row gap={0}>

// Keep as-is (deferred to grid-first plan):
<Row className="shrink-0">
<Column className="grow">
<Surface className="grow">
```

- [x] **Step 7: TypeScript check**

```bash
npx tsc --noEmit
```

- [x] **Step 8: Commit**

```bash
git add ui/screens/cardio/RoutePlannerScreen.tsx
git commit -m "refactor(route-planner): replace raw div containers with layout primitives"
```

---

## Phase 4 - TrainingPlansScreen Migration

### Task 4.1: Create `ScheduleEventBlock`

**Files:**
- Create: `ui/components/training-plans/ScheduleEventBlock.tsx`
- Create: `styling/training-plans.css`
- Modify: `styling/global.css`

- [x] **Step 1: Create component**

```tsx
// ui/components/training-plans/ScheduleEventBlock.tsx
import { Column } from '../../layout/Column';
import { Text } from '../../atoms/Text';

interface ScheduleEventBlockProps {
  sport: string;
  title: string;
  subtitle: string;
}

export function ScheduleEventBlock({ sport, title, subtitle }: ScheduleEventBlockProps) {
  return (
    <Column className="schedule-event-block" data-sport={sport}>
      <Text bold>{title}</Text>
      <Text size="caption" color="muted">{subtitle}</Text>
    </Column>
  );
}
```

- [x] **Step 2: Create `styling/training-plans.css`**

```css
.schedule-event-block {
  border-radius: var(--radius-sm);
  padding: var(--space-xs) var(--space-sm);
  border-left: 3px solid var(--c-accent);
}

.schedule-event-block[data-sport="run"]  { border-color: var(--c-run);  background: color-mix(in srgb, var(--c-run)  12%, transparent); }
.schedule-event-block[data-sport="bike"] { border-color: var(--c-bike); background: color-mix(in srgb, var(--c-bike) 12%, transparent); }
.schedule-event-block[data-sport="swim"] { border-color: var(--c-swim); background: color-mix(in srgb, var(--c-swim) 12%, transparent); }
```

Verify actual token names used in the project (grep for `--c-run`, `--c-bike`, etc.) and adjust if they differ.

- [x] **Step 3: Import in `styling/global.css`**

Add after the last `@import` line in the `@layer project` group:
```css
@import "./training-plans.css" layer(project);
```

- [x] **Step 4: Commit**

```bash
git add ui/components/training-plans/ScheduleEventBlock.tsx styling/training-plans.css styling/global.css
git commit -m "feat(training-plans): add ScheduleEventBlock component with token CSS"
```

---

### Task 4.2: Replace inline-styled elements in TrainingPlansScreen

**Files:**
- Modify: `ui/screens/progress/TrainingPlansScreen.tsx`

- [x] **Step 1: Replace WeekView event blocks (~line 138)**

```tsx
// Before:
<div key={i} style={eventBlockStyle(sport)}>{SPORT_TITLE[sport]}</div>

// After:
<ScheduleEventBlock key={i} sport={sport} title={SPORT_TITLE[sport]} subtitle="~55 min est." />
```

- [x] **Step 2: Replace DayView event blocks (~line 171)**

```tsx
// Before:
<div key={i} style={{ background: '...', borderRadius: '...', ... }}>
  <span style={{ fontWeight: 600, ... }}>{SPORT_TITLE[sport]}</span>
  <span className="muted" style={{ ... }}>{SPORT_LABEL[sport]} - ~55 min est.</span>
</div>

// After:
<ScheduleEventBlock key={i} sport={sport} title={SPORT_TITLE[sport]}
  subtitle={`${SPORT_LABEL[sport]} - ~55 min est.`} />
```

- [x] **Step 3: Replace day header inline-styled spans (~line 123)**

```tsx
// Before:
<span className="mono" style={{ fontSize: 9, color: 'var(--ink-faint)' }}>{DOW_SHORT[i]}</span>

// After:
<Text mono size="caption" color="faint">{DOW_SHORT[i]}</Text>
```

- [x] **Step 4: Replace grid wrapper raw divs (~line 119)**

```tsx
// Before:
<div style={gridStyle}>...</div>

// After (data-driven style is acceptable):
<Grid style={gridStyle}>...</Grid>
```

- [x] **Step 5: TypeScript check**

```bash
npx tsc --noEmit
```

- [x] **Step 6: Commit**

```bash
git add ui/screens/progress/TrainingPlansScreen.tsx
git commit -m "refactor(training-plans): replace inline-styled elements with primitives"
```

---

## Phase 5 - Remaining Screens

### Task 5.1: Fix LogScreen, NewSessionScreen, SavedRoutesScreen

**Files:**
- Modify: `ui/screens/log/LogScreen.tsx`
- Modify: `ui/screens/log/NewSessionScreen.tsx`
- Modify: `ui/screens/routes/SavedRoutesScreen.tsx`

- [x] **Step 1: LogScreen - active session button (~line 69) + text spans**

```tsx
// Before:
<button className="surface interactive" onClick={() => navigate(...)}>
<span className="detail">{activeSession.name}</span>
<span className="caption">{...}</span>
<p className="caption">No sessions found</p>

// After:
<Surface as="button" interactive onClick={() => navigate(...)}>
<Text size="detail">{activeSession.name}</Text>
<Text size="caption">{...}</Text>
<Text size="caption">No sessions found</Text>
```

- [x] **Step 2: NewSessionScreen - activity buttons (~lines 20, 57, 100)**

```tsx
// Before:
<button className={`column align-center surface card${selected === sport ? ' active' : ''}`}
  onClick={() => onSelect(sport)}>
  <span className="caption">{label}</span>
</button>

// After:
<Surface as="button" selected={selected === sport} interactive className="card"
  onClick={() => onSelect(sport)}>
  <Column align="center">
    <Text size="caption">{label}</Text>
  </Column>
</Surface>
```

Apply to all three activity button sites. Replace `<span className="caption">` labels throughout with `<Text size="caption">`.

- [x] **Step 3: SavedRoutesScreen - route card div (~line 31)**

```tsx
// Before:
<div key={route.id} className={`surface column gap-1${incoming.returnTo ? ' interactive' : ''}`}
  onClick={() => incoming.returnTo && handleSelect(route)}>

// After:
<Surface key={route.id} as={incoming.returnTo ? 'button' : 'div'}
  interactive={!!incoming.returnTo}
  onClick={() => incoming.returnTo && handleSelect(route)}>
  <Column gap={1}>
```

- [x] **Step 4: TypeScript check**

```bash
npx tsc --noEmit
```

- [x] **Step 5: Commit**

```bash
git add ui/screens/log/LogScreen.tsx ui/screens/log/NewSessionScreen.tsx ui/screens/routes/SavedRoutesScreen.tsx
git commit -m "refactor(screens): replace raw div/button elements with primitives"
```

---

## Verification

1. `npm run dev` - open each screen and visually confirm layout is unchanged
2. **Route Planner** - map controls, sidebar toggle, activity chips, pace presets, saved route cards, bottom sheet tabs all work
3. **Training Plans** - week calendar and event blocks render with correct sport colors, no inline styles
4. **Log** - active session card and empty state render correctly
5. **New Session** - activity grid renders with hover/active states
6. **Saved Routes** - route cards clickable when `returnTo` is set
7. `npx tsc --noEmit` - zero errors
8. `npm run lint` - no new boundary violations

