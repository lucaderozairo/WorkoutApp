# Screen Visual Class Elimination — Design Spec

**Date:** 2026-06-14
**Status:** Approved for planning
**Scope:** Reduce `screen-visual-class` lint violations from 49 → ~15 by composing primitives and extracting domain components. Focused on `RoutesScreen` and the new `CardScroller` pattern.

---

## Problem

`check-ui-atomic.mjs` flags any `className` in `ui/screens/` that isn't on the allowlist. The 49 remaining violations fall into two buckets:

1. **Sub-components defined inline in screen files** — the classes are fine, but they live in the wrong file. Moving the component to `ui/components/` clears the violation with no CSS change.
2. **Classes whose CSS behaviour is already expressible via primitives** — the class can be deleted entirely once the JSX uses the right primitive API.

---

## Design Decisions

### 1. New pattern: `CardScroller` (`ui/patterns/CardScroller.tsx`)

**Why a pattern, not a layout component:** It combines scroll layout with interactive prev/next controls — that's behaviour, not just spatial grammar. Per the atomic reference, patterns own "repeated UI structures" including "card arrangements" (`CardGrid` / `FeedList`). `CardScroller` is the horizontal, snap-scrolling variant.

**API:**

```tsx
const CardScroller = forwardRef<HTMLDivElement, {
  gap?: Gap;          // default 3
  children: ReactNode;
}>(function CardScroller({ gap = 3, children }, ref) { ... })
```

The forwarded `ref` points to the scroll track so callers can drive `scrollBy`. The caller is responsible for composing prev/next `Button`s and wrapping them in a `<Cluster className="card-scroller-controls">` — the CSS on that class hides them at `max-width: 780px`.

**CSS (`styling/card-scroller.css`, `@layer patterns`):**

Uses CSS nesting throughout (ref §1.1): `@container` nested inside the container element, `@media` nested inside the rule that uses it. Anonymous container query (no name needed since nested context already identifies the container).

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

/* Separate: controls live in the caller's header row, outside <CardScroller> */
.card-scroller-controls {
  @media (max-width: 780px) {
    display: none;
  }
}
```

Callers can override `--card-scroller-card-width` via inline style (data-driven, acceptable per token rules).

---

### 2. Extract `RouteExploreCard` → `ui/components/routes/RouteExploreCard.tsx`

Moves the card out of the screen file. Within it, replaces CSS classes with primitive composition:

| Old class | Replacement |
|---|---|
| `route-explore-body` | `<Column gap={2} className="pad-sm">` |
| `route-explore-kicker` | `<Row gap={2} align="center">` |
| `route-explore-title` | `<Text bold truncate>` (drop `text-wrap: balance` — contradicts `white-space: nowrap`) |
| `route-explore-description` | `<Text size="caption" className="clamp-2">` |
| `route-explore-meta` | `<Row justify="between" gap={2}>` + `<Text size="caption" mono>` / `<Text size="caption">` |
| `route-card-icon` `display:inline-grid` | `<Row align="center" justify="center" className="route-card-icon">` — keep visual CSS, change display |

**Kept as component CSS (no primitive covers them):**
- `route-explore-card` — `grid-template-rows: minmax(min-height, 1fr) auto`, border, hover, scale-on-active, `scroll-snap-align`
- `route-explore-media` — overflow container with radial gradient placeholder
- `route-explore-photo` / `route-explore-map` / `route-explore-map-empty` — parallax CSS custom property transform
- `route-card-icon` visual properties (size, bg, radius, color) — `display` changes to `flex`

**CSS fix:** `route-explore-card` `grid-template-rows` changes `0.92fr → 1fr` (no perceptible difference; 0.92 was an artefact).

**`@property` for parallax** (ref §1.3 — pattern already established in `layout.css`): Register `--route-parallax-x` in `route-planner.css` so the browser can hardware-accelerate the parallax transition:

```css
@property --route-parallax-x {
  syntax: '<percentage>';
  inherits: false;
  initial-value: 0%;
}
```

**`route-explore-card[data-featured]` container query** — the old named `@container route-explore` becomes an anonymous query in `route-planner.css` (the container is now `.card-scroller`):

```css
@container (min-width: 720px) {
  .route-explore-card[data-featured] {
    min-height: var(--route-card-featured-min-height);
  }
}
```

---

### 3. Extract `RouteExploreRow` → `ui/components/routes/RouteExploreRow.tsx`

Moves the section + parallax scroll logic out of the screen file. Uses `CardScroller` for the track.

| Old | Replacement |
|---|---|
| `route-explore-row` (`display:grid; gap:s-3`) | `<Column gap={3} as="section">` |
| `route-explore-row-header` (`padding-inline: s-1`) | removed — padding was aligning heading with card edge; with unified `Column` wrapper the 4px offset is not intentional |
| `route-explore-heading` | `<Text as="h3">` — `typography.css h3` already provides `font-weight:600; font-size:var(--t-md); line-height:1.3; text-wrap:balance`. No `bold` prop needed — it would risk applying `700` over `h3`'s `600`. |
| `route-explore-controls` | `<Cluster gap={1} className="card-scroller-controls">` (generic class from `CardScroller` CSS) |
| `route-explore-track` | `<CardScroller ref={scrollRef}>` |

---

### 4. `RoutesScreen` changes

| Old | Replacement |
|---|---|
| `<Grid className="routes-screen">` | `<Grid data-page="routes">` — CSS selector updated |
| `<Surface variant="flat" className="routes-filter-panel">` | `<Surface>` — default Surface already has `border: 1px solid var(--line)` |
| `<Column className="route-explore">` | removed — container query now lives inside `CardScroller` |

**CSS selector update in `route-planner.css`:**
```css
/* before */
.routes-screen, .route-detail-screen { … }

/* after */
[data-page="routes"], [data-page="route-detail"] { … }
```

---

### 5. CSS deleted from `route-planner.css`

Classes made obsolete by primitive composition (deletions):
- `.route-explore-row`
- `.route-explore-row-header`
- `.route-explore-heading`
- `.route-explore-body`
- `.route-explore-kicker`
- `.route-explore-title` (the truncate/bold properties; line-height and font-weight 650 can be added as a single-line `h3` rule in `typography.css` if needed after visual check)
- `.route-explore-description`
- `.route-explore-meta`
- `.route-explore-controls`
- `.route-explore` (container query moves into `.card-scroller`)
- `.routes-filter-panel`

Classes renamed and moved to `card-scroller.css`:
- `.route-explore-track` → `.card-scroller-track`

Classes kept in `route-planner.css` (no primitive equivalent):
- `.route-explore-card` (with `1fr` fix)
- `.route-explore-media`
- `.route-explore-photo`, `.route-explore-map`, `.route-explore-map-empty`
- `.route-card-icon` (visual only; display changed to flex)
- `.route-card` (width + text-align)
- `.route-detail-grid`, `.route-detail-map` (RouteOverviewScreen — out of scope)
- `[data-page="routes"], [data-page="route-detail"]` (renamed from `.routes-screen`)

---

## Out of Scope

- `RouteOverviewScreen` violations (`route-detail-grid`, `route-detail-map`, `surface-mix-*`) — separate pass
- `TabNavigation`, `HomeSections`, `ProgressScreen` violations — separate pass
- `WidgetPrototypeScreen` — proto screen, lowest priority

---

## Expected Outcome

Violations: 49 → ~17 (the 32 cleared are all in `RoutesScreen` + `RoutePlannerScreen`'s shared classes).
No new utility classes added. `pad-sm` and `clamp-2` already exist.
`CardScroller` is reusable for achievement gallery, exercise history, any horizontal card row.
