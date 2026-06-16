# Grid-First Layout Refactor

**Status:** Deferred — unblock after `2026-06-05-raw-element-elimination.md` is merged.

**Goal:** Eliminate every `className="grow"` and `className="shrink-0"` in the UI by restructuring parent containers to use CSS Grid tracks (`fr`, `auto`, `minmax`), so children never self-declare flex sizing.

---

## Why `grow`/`shrink` props are wrong

`flex: 1` and `flex-shrink: 0` are *responses* to a parent's flex model, not properties a child should own. When a child declares `grow`, it is tightly coupled to the assumption that its parent is a flex container and that it should consume remaining space. This breaks if the parent ever becomes a grid, or if a new sibling is inserted between them.

The correct fix is to always let the **parent** declare the layout tracks:

```css
/* Parent owns the sizing — children are just content */
.side { display: grid; grid-template-columns: auto 1fr; }
```

This principle is the same as CSS Grid named areas: the container is the layout authority, children are passive.

---

## Scope

Audit every `className="grow"` and `className="shrink-0"` occurrence across:
- `ui/screens/`
- `ui/components/`
- `ui/molecules/`
- `ui/layout/`

For each one, restructure the **parent** container to use a `Grid` variant or `grid-template-columns` / `grid-template-rows` so the child no longer needs to self-size. Then remove the `className`.

---

## Key Sites (from raw-element-elimination migration)

| Location | Current | Fix |
|----------|---------|-----|
| `RoutePlannerScreen` sidebar `.side` | children: `shrink-0` rail + `grow` content | parent: `grid-template-columns: auto 1fr` |
| `RoutePlannerScreen` bottom sheet body | children: `shrink-0` tabs + `grow` scroll area | parent: `grid-template-rows: auto 1fr` |
| `RoutePlannerScreen` elevation panel | children: `shrink-0` panel + `grow` mini-chart + chart | parent: `grid-template-columns: auto 1fr auto` |
| Any `<Column className="grow">` inside `<Row>` | child flex-grows | parent Row → `<Grid style={{ gridTemplateColumns: '...' }}>` |

---

## Approach Per Site

1. Identify the flex parent containing the `grow`/`shrink-0` child
2. Replace the parent with `<Grid>` (preferred) or add `style={{ gridTemplateColumns/Rows: '...' }}` to the existing `Row`/`Column`
3. Remove `className="grow"` / `className="shrink-0"` from the child
4. If a `Grid` variant already covers the pattern (e.g. `variant="columns"`), prefer that over an inline style
5. Verify visually — grid sizing is pixel-equivalent to the flex sizing it replaces

---

## Success Criteria

```bash
# Should return zero matches outside of layout utility files:
grep -r 'className="grow"' ui/
grep -r 'className="shrink-0"' ui/
```

No `grow` / `shrink-0` classNames remain on any element in screens or components.
