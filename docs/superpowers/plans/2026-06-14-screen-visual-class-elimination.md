# Screen Visual Class Elimination Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce `screen-visual-class` lint violations from 49 → ~17 by extracting inline `RoutesScreen` sub-components to `ui/components/` and replacing obsolete CSS classes with existing layout/atom primitives.

**Architecture:** Three inline components (`RouteExplorePreview`, `RouteExploreCard`, `RouteExploreRow`) are extracted to `ui/components/routes/`. A new `CardScroller` pattern replaces the ad-hoc snap-scroll grid. Obsolete `route-planner.css` classes are deleted; the CSS that has no primitive equivalent stays.

**Tech Stack:** React 19, TypeScript, Vitest + Testing Library, CSS nesting, `@property`, container queries.

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `styling/card-scroller.css` | Snap-scroll track layout + container query + controls hide |
| Modify | `styling/global.css` | Wire `card-scroller.css` into `@layer patterns` |
| Create | `ui/patterns/CardScroller.tsx` | `forwardRef` scroll container; forwards ref to the track div |
| Create | `ui/patterns/CardScroller.test.tsx` | Render + ref-forwarding + gap-attr tests |
| Modify | `ui/patterns/index.ts` | Export `CardScroller` |
| Modify | `ui/layout/Column.tsx` | Add `aria-labelledby` prop (required for section accessibility) |
| Create | `ui/components/routes/RouteExploreCard.tsx` | Card + preview sub-components; exports `RouteDisplay` type |
| Create | `ui/components/routes/RouteExploreRow.tsx` | Section + parallax + scroll controls; exports `RouteExploreGroup` |
| Modify | `ui/screens/routes/RoutesScreen.tsx` | Remove inline components; use extracted imports; clean classNames |
| Modify | `styling/route-planner.css` | Delete 11 obsolete classes; add `@property`; fix selectors; fix 0.92fr→1fr |

---

## Task 1: `card-scroller.css` + global.css wire-up

**Files:**
- Create: `styling/card-scroller.css`
- Modify: `styling/global.css`

- [ ] **Step 1: Create `styling/card-scroller.css`**

```css
.card-scroller {
  container-type: inline-size;

  & .card-scroller-track {
    --card-scroller-card-width: min(74vw, 320px);

    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: var(--card-scroller-card-width);
    gap: var(--s-3);
    overflow-x: auto;
    overscroll-behavior-inline: contain;
    padding: var(--s-1) var(--s-1) var(--s-3);
    scroll-behavior: smooth;
    scroll-padding-inline: var(--s-1);
    scroll-snap-type: inline mandatory;
    scrollbar-color: var(--line-strong) transparent;
    scrollbar-gutter: stable;
    scrollbar-width: thin;

    &[data-gap="0"] { gap: 0; }
    &[data-gap="1"] { gap: var(--s-1); }
    &[data-gap="2"] { gap: var(--s-2); }
    &[data-gap="4"] { gap: var(--s-4); }
    &[data-gap="5"] { gap: var(--s-5); }

    @media (prefers-reduced-motion: reduce) {
      scroll-behavior: auto;
    }
  }

  @container (min-width: 720px) {
    .card-scroller-track {
      --card-scroller-card-width: minmax(300px, 0.34fr);
    }
  }
}

/* Controls sit in the caller's header row, outside <CardScroller> */
.card-scroller-controls {
  @media (max-width: 780px) {
    display: none;
  }
}
```

- [ ] **Step 2: Wire into `styling/global.css`**

In `styling/global.css`, the patterns import is:
```css
@import "./patterns.css"       layer(patterns);
```

Add the new file on the next line:
```css
@import "./patterns.css"       layer(patterns);
@import "./card-scroller.css"  layer(patterns);
```

- [ ] **Step 3: Commit**

```bash
git add styling/card-scroller.css styling/global.css
git commit -m "feat(patterns): add card-scroller CSS — snap-scroll grid with container query"
```

---

## Task 2: `CardScroller` pattern component + test + export

**Files:**
- Create: `ui/patterns/CardScroller.tsx`
- Create: `ui/patterns/CardScroller.test.tsx`
- Modify: `ui/patterns/index.ts`

- [ ] **Step 1: Write the failing tests first**

Create `ui/patterns/CardScroller.test.tsx`:

```tsx
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CardScroller } from './CardScroller';

describe('CardScroller', () => {
  it('renders children inside the track', () => {
    render(
      <CardScroller>
        <div>Card 1</div>
        <div>Card 2</div>
      </CardScroller>,
    );
    expect(screen.getByText('Card 1')).toBeInTheDocument();
    expect(screen.getByText('Card 2')).toBeInTheDocument();
  });

  it('forwards ref to the scroll track element', () => {
    const ref = createRef<HTMLDivElement>();
    render(<CardScroller ref={ref}><div>Card</div></CardScroller>);
    expect(ref.current).not.toBeNull();
    expect(ref.current?.classList.contains('card-scroller-track')).toBe(true);
  });

  it('sets data-gap when gap differs from default 3', () => {
    const { container } = render(
      <CardScroller gap={1}><div>Card</div></CardScroller>,
    );
    expect(container.querySelector('.card-scroller-track')?.getAttribute('data-gap')).toBe('1');
  });

  it('omits data-gap when gap is the default (3)', () => {
    const { container } = render(
      <CardScroller><div>Card</div></CardScroller>,
    );
    expect(container.querySelector('.card-scroller-track')?.getAttribute('data-gap')).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```
npm test -- --reporter=verbose CardScroller
```

Expected: 4 failures — `CardScroller` is not defined.

- [ ] **Step 3: Implement `ui/patterns/CardScroller.tsx`**

```tsx
import { forwardRef, type ReactNode } from 'react';
import { type Gap } from '@ui/layout/_classes';

export const CardScroller = forwardRef<HTMLDivElement, {
  gap?: Gap;
  children: ReactNode;
}>(function CardScroller({ gap = 3, children }, ref) {
  return (
    <div className="card-scroller">
      <div
        ref={ref}
        className="card-scroller-track"
        data-gap={gap !== 3 ? gap : undefined}
      >
        {children}
      </div>
    </div>
  );
});
```

- [ ] **Step 4: Run tests — all 4 should pass**

```
npm test -- --reporter=verbose CardScroller
```

Expected: PASS ×4

- [ ] **Step 5: Export from `ui/patterns/index.ts`**

Append to the existing exports in `ui/patterns/index.ts`:

```ts
export { CardScroller } from './CardScroller';
```

- [ ] **Step 6: Commit**

```bash
git add ui/patterns/CardScroller.tsx ui/patterns/CardScroller.test.tsx ui/patterns/index.ts
git commit -m "feat(patterns): add CardScroller — snap-scroll pattern with forwardRef track"
```

---

## Task 3: Add `aria-labelledby` to `Column`

`RouteExploreRow` renders a `<section>` with `aria-labelledby` pointing to its heading. `Column`'s current props don't include `aria-labelledby`, so this small addition is needed.

**Files:**
- Modify: `ui/layout/Column.tsx`

- [ ] **Step 1: Add the prop**

In `ui/layout/Column.tsx`, the interface currently ends at `onClick`. Add `aria-labelledby` alongside `aria-describedby`:

```tsx
interface ColumnProps {
  gap?: Gap;
  align?: Align;
  justify?: Justify;
  as?: ElementType;
  className?: string;
  'aria-describedby'?: string;
  'aria-labelledby'?: string;
  children: ReactNode;
  onClick?: () => void;
}

export function Column({
  gap,
  align,
  justify,
  as: Tag = 'div',
  className,
  'aria-describedby': ariaDescribedBy,
  'aria-labelledby': ariaLabelledBy,
  children,
  onClick,
}: ColumnProps) {
  const classes = layoutClasses({ base: 'column', gap, defaultGap: 4, align, justify, className });
  return (
    <Tag
      className={classes}
      aria-describedby={ariaDescribedBy}
      aria-labelledby={ariaLabelledBy}
      onClick={onClick}
    >
      {children}
    </Tag>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add ui/layout/Column.tsx
git commit -m "feat(layout): add aria-labelledby prop to Column"
```

---

## Task 4: Extract `RouteExploreCard`

Moves the card, preview, and their helpers out of `RoutesScreen`. Replaces CSS wrapper classes with primitives.

**Files:**
- Create: `ui/components/routes/RouteExploreCard.tsx`

- [ ] **Step 1: Create `ui/components/routes/RouteExploreCard.tsx`**

```tsx
import { forwardRef, type CSSProperties } from 'react';
import { Bike, Footprints } from 'lucide-react';
import { Button } from '@ui/molecules';
import { Text } from '@ui/atoms';
import { Column, Row } from '@ui/layout';
import { RoutePreview as RoutePreviewGraphic } from './RoutePreview';
import type { SavedRoute } from '@features/routes';

export type RouteDisplay = SavedRoute & {
  photoUrl?: string;
  trailPhotoUrl?: string;
};

function profileIcon(profile: SavedRoute['profile']) {
  return profile === 'bike' ? <Bike size={16} /> : <Footprints size={16} />;
}

function routeDate(route: RouteDisplay) {
  return new Date(route.updatedAt ?? route.createdAt).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function RouteExplorePreview({ route }: { route: RouteDisplay }) {
  const photo = route.photoUrl ?? route.trailPhotoUrl;
  if (photo) {
    return <img className="route-explore-photo" src={photo} alt="" loading="lazy" />;
  }
  return <RoutePreviewGraphic route={route} />;
}

export const RouteExploreCard = forwardRef<HTMLButtonElement, {
  route: RouteDisplay;
  parallax: number;
  featured?: boolean;
  onRoute: (route: SavedRoute) => void;
}>(function RouteExploreCard({ route, parallax, featured = false, onRoute }, ref) {
  const style = { '--route-parallax-x': `${parallax}%` } as CSSProperties;

  return (
    <Button
      ref={ref}
      type="button"
      variant="ghost"
      className="route-explore-card"
      data-featured={featured || undefined}
      // eslint-disable-next-line no-restricted-syntax -- Scroll position drives one tokenized parallax transform value.
      style={style}
      onClick={() => onRoute(route)}
    >
      <span className="route-explore-media">
        <RouteExplorePreview route={route} />
      </span>
      <Column gap={2} className="pad-sm">
        <Row gap={2} align="center">
          <Row align="center" justify="center" className="route-card-icon" aria-hidden>
            {profileIcon(route.profile)}
          </Row>
          <Text size="caption" color="muted">
            {route.profile === 'bike' ? 'Bike' : 'Foot'}
          </Text>
        </Row>
        <Text bold truncate>{route.name}</Text>
        {route.description ? (
          <Text size="caption" className="clamp-2">{route.description}</Text>
        ) : null}
        <Row justify="between" gap={2}>
          <Text size="caption" mono>{route.distanceKm.toFixed(1)} km</Text>
          <Text size="caption" color="muted">{routeDate(route)}</Text>
        </Row>
      </Column>
    </Button>
  );
});
```

**What changed from the original:**
- `route-explore-body` → `<Column gap={2} className="pad-sm">` (`pad-sm` is on SCREEN_CLASS_ALLOW and already exists in `utilities.css`)
- `route-explore-kicker` → `<Row gap={2} align="center">`
- `route-card-icon` span → `<Row align="center" justify="center" className="route-card-icon">` (keeps visual CSS in `route-planner.css`, changes `display:inline-grid` → `display:flex`)
- `route-explore-title` → `<Text bold truncate>` (removes contradictory `text-wrap:balance` + `white-space:nowrap`; `truncate` class handles nowrap+ellipsis)
- `route-explore-description` → `<Text size="caption" className="clamp-2">` (`clamp-2` already exists in `utilities.css`)
- `route-explore-meta` → `<Row justify="between" gap={2}>` with two `<Text>` children
- `route-explore-photo`/`route-explore-media` class names kept — these have parallax CSS with no primitive

- [ ] **Step 2: Commit**

```bash
git add ui/components/routes/RouteExploreCard.tsx
git commit -m "feat(routes): extract RouteExploreCard to ui/components; replace wrapper classes with primitives"
```

---

## Task 5: Extract `RouteExploreRow`

Moves the section + parallax logic out of `RoutesScreen`. Uses `CardScroller` for the track.

**Files:**
- Create: `ui/components/routes/RouteExploreRow.tsx`

- [ ] **Step 1: Create `ui/components/routes/RouteExploreRow.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@ui/molecules';
import { Column, Row, Cluster } from '@ui/layout';
import { CardScroller } from '@ui/patterns';
import { RouteExploreCard, type RouteDisplay } from './RouteExploreCard';
import type { SavedRoute } from '@features/routes';

export interface RouteExploreGroup {
  id: string;
  title: string;
  subtitle: string;
  routes: RouteDisplay[];
  featured?: boolean;
}

export function RouteExploreRow({
  group,
  onRoute,
}: {
  group: RouteExploreGroup;
  onRoute: (route: SavedRoute) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const frameRef = useRef<number | undefined>(undefined);
  const [parallax, setParallax] = useState<number[]>([]);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return undefined;

    const measure = () => {
      const scrollerRect = scroller.getBoundingClientRect();
      const next = cardRefs.current.map(card => {
        if (!card) return 0;
        const cardRect = card.getBoundingClientRect();
        const center = cardRect.left + cardRect.width / 2;
        const fraction = (center - scrollerRect.left) / Math.max(scrollerRect.width, 1);
        return Math.round((Math.min(1, Math.max(0, fraction)) - 0.5) * -28);
      });
      setParallax(next);
    };

    const schedule = () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(measure);
    };

    measure();
    scroller.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);

    return () => {
      scroller.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [group.routes]);

  const scrollCards = (direction: -1 | 1) => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    scroller.scrollBy({
      left: direction * scroller.clientWidth * 0.78,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  };

  return (
    <Column
      gap={3}
      as="section"
      aria-labelledby={`route-explore-${group.id}`}
    >
      <Row justify="between" align="end" gap={2}>
        <Column gap={1}>
          <h3 id={`route-explore-${group.id}`}>{group.title}</h3>
          <span className="caption muted">{group.subtitle}</span>
        </Column>
        {group.routes.length > 1 ? (
          <Cluster gap={1} className="card-scroller-controls">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => scrollCards(-1)}
              aria-label={`Scroll ${group.title} left`}
            >
              <ChevronLeft size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => scrollCards(1)}
              aria-label={`Scroll ${group.title} right`}
            >
              <ChevronRight size={14} />
            </Button>
          </Cluster>
        ) : null}
      </Row>
      <CardScroller ref={scrollRef}>
        {group.routes.map((route, index) => (
          <RouteExploreCard
            key={`${group.id}-${route.id}`}
            route={route}
            featured={group.featured}
            parallax={parallax[index] ?? 0}
            onRoute={onRoute}
            ref={(node: HTMLButtonElement | null) => { cardRefs.current[index] = node; }}
          />
        ))}
      </CardScroller>
    </Column>
  );
}
```

**What changed from the original:**
- `route-explore-row` (`display:grid; gap:s-3`) → `<Column gap={3} as="section" aria-labelledby=...>`
- `route-explore-row-header` (`padding-inline: s-1`) → removed (intentional padding was an artefact)
- `route-explore-heading` → plain `<h3 id={...}>` styled by `typography.css h3` rule (`font-weight:600; font-size:var(--t-md); line-height:1.3`)
- Subtitle → `<span className="caption muted">` (both `caption` and `muted` are on SCREEN_CLASS_ALLOW — and this is `ui/components/` anyway so the check doesn't apply)
- `route-explore-controls` → `<Cluster gap={1} className="card-scroller-controls">` (class from `card-scroller.css`, hides at ≤780px)
- `route-explore-track` div → `<CardScroller ref={scrollRef}>`

- [ ] **Step 2: Commit**

```bash
git add ui/components/routes/RouteExploreRow.tsx
git commit -m "feat(routes): extract RouteExploreRow; use CardScroller + Column primitives"
```

---

## Task 6: Update `RoutesScreen`

Swap inline components for the new imports; clean up now-unused classNames.

**Files:**
- Modify: `ui/screens/routes/RoutesScreen.tsx`

- [ ] **Step 1: Replace the entire file**

The new file removes all inline sub-components and their helpers. `routeExploreGroups` and `routePhoto` stay here (they're data-grouping logic, not UI). `profileIcon`, `routeDate`, `RouteDisplay`, `RouteExploreGroup` move to the component files.

```tsx
import { useMemo } from 'react';
import { Bike, Footprints, Map, Plus } from 'lucide-react';
import { Button, ScreenHeader } from '@ui/molecules';
import { Surface } from '@ui/atoms';
import { Column, Grid, Row, Cluster } from '@ui/layout';
import { EmptyState, SearchBar } from '@ui/patterns';
import { RouteExploreRow, type RouteExploreGroup } from '@ui/components/routes/RouteExploreRow';
import { type RouteDisplay } from '@ui/components/routes/RouteExploreCard';
import type { SavedRoute } from '@features/routes';
import { useRoutes, type RouteDistanceFilter, type RouteProfileFilter } from './useRoutes';

const PROFILE_FILTERS: Array<{ id: RouteProfileFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'foot', label: 'Foot' },
  { id: 'bike', label: 'Bike' },
];

const DISTANCE_FILTERS: Array<{ id: RouteDistanceFilter; label: string }> = [
  { id: 'all', label: 'Any distance' },
  { id: 'short', label: '<5 km' },
  { id: 'medium', label: '5-20 km' },
  { id: 'long', label: '>20 km' },
];

function routePhoto(route: RouteDisplay) {
  return route.photoUrl ?? route.trailPhotoUrl;
}

function routeExploreGroups(routes: RouteDisplay[]): RouteExploreGroup[] {
  const foot = routes.filter(route => route.profile === 'foot');
  const bike = routes.filter(route => route.profile === 'bike');
  const long = routes.filter(route => route.distanceKm >= 10);

  return [
    {
      id: 'all',
      title: 'Explore routes',
      subtitle: `${routes.length} saved ${routes.length === 1 ? 'route' : 'routes'}`,
      routes,
      featured: true,
    },
    foot.length > 0
      ? { id: 'foot', title: 'Foot routes', subtitle: 'Runs, walks, and hikes', routes: foot }
      : null,
    bike.length > 0
      ? { id: 'bike', title: 'Bike routes', subtitle: 'Road and cycling plans', routes: bike }
      : null,
    long.length > 0
      ? { id: 'long', title: 'Longer efforts', subtitle: 'Routes at 10 km and above', routes: long }
      : null,
  ].filter((group): group is RouteExploreGroup => !!group && group.routes.length > 0);
}

export function RoutesScreen() {
  const {
    incoming,
    savedRoutes,
    filteredRoutes,
    search,
    setSearch,
    profileFilter,
    setProfileFilter,
    distanceFilter,
    setDistanceFilter,
    handleCreate,
    handleRoute,
  } = useRoutes();

  const isPicking = !!incoming.returnTo;
  const isFiltered = search.trim() || profileFilter !== 'all' || distanceFilter !== 'all';
  const exploreGroups = useMemo(
    () => routeExploreGroups(filteredRoutes as RouteDisplay[]),
    [filteredRoutes],
  );

  return (
    <Grid gap={4} data-page="routes">
      <ScreenHeader
        title={isPicking ? 'Choose Route' : 'Routes'}
        primary={
          <Button variant="primary" size="sm" onClick={handleCreate}>
            <Plus size={14} /> New route
          </Button>
        }
      />

      <Surface>
        <Column gap={3}>
          <SearchBar
            value={search}
            onChange={setSearch}
            onClear={() => setSearch('')}
            placeholder="Search routes"
          />
          <Row gap={2} align="center" className="wrap">
            <Cluster className="gap-1">
              {PROFILE_FILTERS.map(filter => (
                <Button
                  key={filter.id}
                  variant="ghost"
                  size="sm"
                  active={profileFilter === filter.id}
                  onClick={() => setProfileFilter(filter.id)}>
                  {filter.id === 'bike' ? <Bike size={14} /> : filter.id === 'foot' ? <Footprints size={14} /> : <Map size={14} />}
                  {filter.label}
                </Button>
              ))}
            </Cluster>
            <Cluster className="gap-1">
              {DISTANCE_FILTERS.map(filter => (
                <Button
                  key={filter.id}
                  variant="ghost"
                  size="sm"
                  active={distanceFilter === filter.id}
                  onClick={() => setDistanceFilter(filter.id)}>
                  {filter.label}
                </Button>
              ))}
            </Cluster>
          </Row>
        </Column>
      </Surface>

      {savedRoutes.length === 0 ? (
        <EmptyState
          icon="Map"
          title="No routes yet"
          message="Create a route to reuse it in future sessions."
          action={<Button variant="primary" onClick={handleCreate}>Create first route</Button>}
        />
      ) : filteredRoutes.length === 0 ? (
        <EmptyState
          icon="Search"
          title="No matching routes"
          message="Adjust the search or filters."
          action={isFiltered
            ? <Button variant="secondary" onClick={() => { setSearch(''); setProfileFilter('all'); setDistanceFilter('all'); }}>Clear filters</Button>
            : undefined}
        />
      ) : (
        <Column gap={4}>
          {exploreGroups.map(group => (
            <RouteExploreRow key={group.id} group={group} onRoute={handleRoute} />
          ))}
        </Column>
      )}
    </Grid>
  );
}
```

**What changed:**
- `className="routes-screen"` → `data-page="routes"` (CSS selector update in Task 7)
- `<Surface variant="flat" className="routes-filter-panel">` → `<Surface>` (default already has `border:1px solid var(--line)`)
- `<Column gap={4} className="route-explore">` → `<Column gap={4}>` (container query now lives in `card-scroller.css`)
- Removed: all three inline components + their helpers
- `routePhoto` is now a module-level function (used in `routeExploreGroups`)

- [ ] **Step 2: Run type check**

```
npx tsc --noEmit
```

Expected: 0 errors. If you see errors about `routePhoto` being unused, check that `routeExploreGroups` still uses it via `routes: filteredRoutes` — `routePhoto` is referenced inside `routeExploreGroups` for the `all` group when `featured: true`. Actually `routePhoto` is a helper function used in `RouteExploreCard`'s preview — in the refactored code `routePhoto` is only used if it's called from within `routeExploreGroups`. Check the logic: `routeExploreGroups` doesn't call `routePhoto` directly. If TypeScript complains about `routePhoto` being unused, remove it (the preview logic is now inside `RouteExploreCard`/`RouteExplorePreview`).

- [ ] **Step 3: Run the lint check to see progress**

```
node scripts/check-ui-atomic.mjs
```

Expected: `RoutesScreen.tsx` violations drop from 17 to 0. Total violations: ~32.

- [ ] **Step 4: Commit**

```bash
git add ui/screens/routes/RoutesScreen.tsx
git commit -m "refactor(routes): remove inline sub-components from RoutesScreen; use extracted components"
```

---

## Task 7: Update `route-planner.css`

Delete 11 obsolete CSS classes, update selectors, add `@property`, fix `0.92fr → 1fr`, nest reduced-motion rules.

**Files:**
- Modify: `styling/route-planner.css`

This task has many independent edits to the same file. Apply them top-to-bottom.

- [ ] **Step 1: Add `@property` for hardware-accelerated parallax**

At the very top of `styling/route-planner.css`, before `.route-planner-rail-layer`, add:

```css
@property --route-parallax-x {
  syntax: '<percentage>';
  inherits: false;
  initial-value: 0%;
}

```

This registers the custom property with a type, enabling the browser to hardware-accelerate `transition: transform` driven by `--route-parallax-x`.

- [ ] **Step 2: Update token-scope selector**

Find:
```css
.route-planner-screen,
.routes-screen,
.route-detail-screen {
  --route-planner-location-input-width: var(--panel-width);
```

Replace with:
```css
.route-planner-screen,
[data-page="routes"],
[data-page="route-detail"] {
  --route-planner-location-input-width: var(--panel-width);
```

- [ ] **Step 3: Update max-width selector**

Find:
```css
.routes-screen,
.route-detail-screen {
  max-width: 1120px;
  width: 100%;
  margin-inline: auto;
}
```

Replace with:
```css
[data-page="routes"],
[data-page="route-detail"] {
  max-width: 1120px;
  width: 100%;
  margin-inline: auto;
}
```

- [ ] **Step 4: Delete `.routes-filter-panel`**

Find and delete this entire block:
```css
.routes-filter-panel {
  border: 1px solid var(--line);
}
```

- [ ] **Step 5: Fix `.route-card-icon` display**

Find:
```css
.route-card-icon {
  display: inline-grid;
  place-items: center;
  width: var(--s-6);
  height: var(--s-6);
  border-radius: var(--r-sm);
  background: var(--surface-2);
  color: var(--ink-muted);
  flex: 0 0 auto;
}
```

Replace with:
```css
.route-card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--s-6);
  height: var(--s-6);
  border-radius: var(--r-sm);
  background: var(--surface-2);
  color: var(--ink-muted);
  flex: 0 0 auto;
}
```

- [ ] **Step 6: Delete `.route-explore` container-name block**

Find and delete:
```css
.route-explore {
  container-type: inline-size;
  container-name: route-explore;
}
```

- [ ] **Step 7: Delete `.route-explore-row` and `.route-explore-row-header`**

Find and delete both blocks:
```css
.route-explore-row {
  display: grid;
  gap: var(--s-3);
}

.route-explore-row-header {
  padding-inline: var(--s-1);
}
```

- [ ] **Step 8: Delete `.route-explore-heading` and `.route-explore-controls`**

Find and delete both blocks:
```css
.route-explore-heading {
  margin: 0;
  color: var(--ink);
  font-size: var(--t-md);
  font-weight: 650;
  line-height: 1.2;
  text-wrap: balance;
}

.route-explore-controls {
  @media (max-width: 780px) {
    display: none;
  }
}
```

- [ ] **Step 9: Delete `.route-explore-track` and replace `@container route-explore` block**

Find the full `.route-explore-track` block and the `@container route-explore` block:

```css
.route-explore-track {
  --route-card-width: min(74vw, 320px);

  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: var(--route-card-width);
  gap: var(--s-3);
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  padding: var(--s-1) var(--s-1) var(--s-3);
  scroll-behavior: smooth;
  scroll-padding-inline: var(--s-1);
  scroll-snap-type: inline mandatory;
  scrollbar-color: var(--line-strong) transparent;
  scrollbar-gutter: stable;
  scrollbar-width: thin;
}

@container route-explore (min-width: 720px) {
  .route-explore-track {
    --route-card-width: minmax(300px, 0.34fr);
  }

  .route-explore-card[data-featured] {
    min-height: var(--route-card-featured-min-height);
  }
}
```

Replace with only the featured-card container query (track CSS is now in `card-scroller.css`; the container is `.card-scroller`):

```css
@container (min-width: 720px) {
  .route-explore-card[data-featured] {
    min-height: var(--route-card-featured-min-height);
  }
}
```

- [ ] **Step 10: Fix `.route-explore-card` — remove stale custom property, fix fr value**

Find:
```css
.route-explore-card {
  --route-parallax-x: 0%;

  appearance: none;
  display: grid;
  grid-template-rows: minmax(var(--route-card-media-min), 0.92fr) auto;
```

Replace with (remove `--route-parallax-x: 0%` since `@property` sets the initial-value; fix `0.92fr → 1fr`):
```css
.route-explore-card {
  appearance: none;
  display: grid;
  grid-template-rows: minmax(var(--route-card-media-min), 1fr) auto;
```

- [ ] **Step 11: Delete `.route-explore-body`, `.route-explore-kicker`, `.route-explore-title`, `.route-explore-description`, `.route-explore-meta`**

Find and delete these five blocks:

```css
.route-explore-body {
  display: grid;
  gap: var(--s-2);
  padding: var(--s-3);
}

.route-explore-kicker {
  display: inline-flex;
  align-items: center;
  gap: var(--s-2);
  color: var(--ink-muted);
  font-size: var(--t-xs);
}

.route-explore-title {
  overflow: hidden;
  color: var(--ink);
  font-size: var(--t-md);
  font-weight: 650;
  line-height: 1.2;
  text-overflow: ellipsis;
  text-wrap: balance;
  white-space: nowrap;
}

.route-explore-description {
  display: -webkit-box;
  overflow: hidden;
  color: var(--ink-muted);
  font-size: var(--t-xs);
  line-height: 1.35;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.route-explore-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-2);
  color: var(--ink-muted);
  font-size: var(--t-xs);

  & .mono {
    color: var(--ink);
  }
}
```

- [ ] **Step 12: Nest reduced-motion rules and delete flat `@media` block at bottom**

Find the `.route-explore-photo, .route-explore-map` rule:
```css
.route-explore-photo,
.route-explore-map {
  width: 112%;
  height: 100%;
  margin-inline-start: -6%;
  transform: translateX(var(--route-parallax-x));
  transition: transform var(--duration-short) linear;
  will-change: transform;
}
```

Replace with (add nested reduced-motion):
```css
.route-explore-photo,
.route-explore-map {
  width: 112%;
  height: 100%;
  margin-inline-start: -6%;
  transform: translateX(var(--route-parallax-x));
  transition: transform var(--duration-short) linear;
  will-change: transform;

  @media (prefers-reduced-motion: reduce) {
    transform: none;
    transition: none;
    will-change: auto;
  }
}
```

Find the `.route-explore-map-empty` rule:
```css
.route-explore-map-empty {
  display: grid;
  width: 100%;
  height: 100%;
  min-height: inherit;
  place-items: center;
  color: var(--ink-muted);
  transform: translateX(var(--route-parallax-x));
  transition: transform var(--duration-short) linear;
}
```

Replace with (add nested reduced-motion):
```css
.route-explore-map-empty {
  display: grid;
  width: 100%;
  height: 100%;
  min-height: inherit;
  place-items: center;
  color: var(--ink-muted);
  transform: translateX(var(--route-parallax-x));
  transition: transform var(--duration-short) linear;

  @media (prefers-reduced-motion: reduce) {
    transform: none;
    transition: none;
    will-change: auto;
  }
}
```

Now find and delete the entire flat `@media (prefers-reduced-motion: reduce)` block at the bottom of the file (it's now redundant — track moved to card-scroller.css, photo/map rules nested above):
```css
@media (prefers-reduced-motion: reduce) {
  .route-explore-track {
    scroll-behavior: auto;
  }

  .route-explore-photo,
  .route-explore-map,
  .route-explore-map-empty {
    transform: none;
    transition: none;
    will-change: auto;
  }
}
```

- [ ] **Step 13: Run CSS lint**

```
npm run lint:css
```

Expected: 0 errors. If you see "unknown property" on `@property`, update the `stylelint-config` to allow it — but this should pass since `@property` is standard.

- [ ] **Step 14: Commit**

```bash
git add styling/route-planner.css
git commit -m "refactor(css): remove 11 obsolete route-explore classes; add @property; fix selectors"
```

---

## Task 8: Verify + type-check + full test run

- [ ] **Step 1: Type-check the whole project**

```
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 2: Run the UI atomic lint**

```
node scripts/check-ui-atomic.mjs
```

Expected output: violations for `RoutesScreen.tsx` are gone. Total should be ~17 (down from 49). Remaining violations will be in: `RouteOverviewScreen`, `RoutePlannerScreen`, `TabNavigation`, `HomeSections`, `ProgressScreen`, `TrainingPlansScreen`, `WidgetPrototypeScreen`, `SavedRoutesScreen`, `ExerciseHistoryScreen`.

- [ ] **Step 3: Run the full test suite**

```
npm test
```

Expected: all tests pass including the new `CardScroller` tests.

- [ ] **Step 4: Final commit if anything was adjusted**

```bash
git add -p
git commit -m "chore: post-refactor cleanup after screen-visual-class elimination pass"
```

---

## Self-review notes

| Spec requirement | Covered in |
|---|---|
| `CardScroller` pattern with forwardRef + gap prop | Task 2 |
| `card-scroller.css` with container query + nested CSS | Task 1 |
| Export from `ui/patterns/index.ts` | Task 2 |
| `RouteExploreCard` extracted with primitive replacements | Task 4 |
| `RouteDisplay` type exported | Task 4 |
| `RouteExploreRow` extracted; uses `CardScroller` | Task 5 |
| Plain `<h3>` (not `<Text as="h3">`) for heading — `id` prop needed | Task 5 |
| `<Column as="section" aria-labelledby>` | Tasks 3 + 5 |
| `RoutesScreen` → `data-page="routes"` | Task 6 |
| `<Surface>` (default, no flat+class fight) | Task 6 |
| `@property --route-parallax-x` | Task 7 |
| `0.92fr → 1fr` fix | Task 7 |
| 11 CSS classes deleted | Task 7 |
| Reduced-motion nested inside owning rules | Task 7 |
| Violations 49 → ~17 verified | Task 8 |
