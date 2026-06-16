# Plan: Route Data Provenance
**Date:** 2026-06-10
**Phase:** 2C
**Priority:** P2
**Status:** Blocked on Phase 2B (DataProvenance contract)

## Problem

Route planner stats panel displays numbers that are fabricated:

| Displayed value | Source | Line |
|-----------------|--------|------|
| Elevation gain `+{gain} m` | `Math.round(displayKm * 8)` | `RoutePlannerScreen.tsx:158` |
| Elevation loss | `Math.round(displayKm * 3)` | `RoutePlannerScreen.tsx:159` |
| Elevation profile chart | `Math.sin` formula | `useRoutePlanner.ts:192–197` |
| Surface mix (paved/gravel/trail) | `estimateSurfaceMix` — hardcoded % by activity type | `useRoutePlanner.ts:104` |

These render as precise metrics. Athletes make decisions from them. They are wrong.

## Goal

- Every stats field has a visible `DataSourceKind` label: `estimated`, `unavailable`, or `real`
- Until a real DEM/OSM integration exists: hide elevation gain/loss numbers, show
  `unavailable` placeholder; hide elevation profile chart
- Surface mix labeled `estimated` with visible indicator
- No raw formula output presented as measurement

## Scope

- `ui/screens/cardio/RoutePlannerScreen.tsx` — stats panel rendering
- `ui/screens/cardio/useRoutePlanner.ts` — `gain`, `loss`, `elevD`, `elevPoints`, `surfaceMix` return shape
- `shared/contracts/provenance.ts` — consumed (not created here — see Phase 2B)

Out of scope: DEM API integration (open question, see `docs/product/feature-improvement-design-v2.md`
open question 3), OSM surface lookup, native GPS recording (platform-gated).

No new feature domain (`features/route_planner/`) is created in this plan. Route
planner is currently a UI screen — this plan only adds data-status labels to what
it already shows.

---

## Implementation

### Step 1 — Add `RouteDataStatus` to `useRoutePlanner.ts` return

Introduce a `RouteDataStatus` object alongside existing stats:

```ts
export type RouteFieldStatus = 'real' | 'estimated' | 'unavailable';

export interface RouteDataStatus {
  elevationGain: RouteFieldStatus;
  elevationProfile: RouteFieldStatus;
  surfaceMix: RouteFieldStatus;
}
```

Return from `useRoutePlanner`:

```ts
const routeDataStatus: RouteDataStatus = {
  elevationGain: 'unavailable',    // no DEM — formula removed
  elevationProfile: 'unavailable', // no DEM — chart hidden
  surfaceMix: 'estimated',         // activity-type heuristic
};
```

Remove `gain`, `loss`, `elevD`, `elevPoints` from the return value.
`surfaceMix` is kept but paired with its status label.

**Do not** call the formula and then label it `estimated` — that's still a lie.
The formula output has no relationship to actual terrain. It must be suppressed.

### Step 2 — Update `RoutePlannerScreen.tsx` stats rendering

**Elevation gain/loss (header subtitle):**

Replace `+${gain} m` in the panel header subtitle with nothing when
`routeDataStatus.elevationGain === 'unavailable'`. Show distance only:

```
Before: "5.2 km · +42 m"
After:  "5.2 km"
```

**StatsPanel — elevation section:**

When `elevationGain === 'unavailable'`:
- Hide gain/loss numbers entirely
- Render a `Text size="caption" color="muted"` line:
  `"Elevation data unavailable — no terrain source connected"`
- Do not render elevation profile chart

When `elevationGain === 'real'` (future — DEM integrated):
- Render numbers as-is, no label needed (real is the default expectation)

**StatsPanel — surface mix section:**

When `surfaceMix === 'estimated'`:
- Render surface percentages as today
- Add `Badge variant="ghost" size="xs"` with text `"est."` inline after the heading
- Tooltip / title attribute: `"Estimated from activity type — not from map data"`

**Elevation profile toolbar toggle:**

When `elevationProfile === 'unavailable'`:
- Hide the `Toggle elevation profile` button entirely (do not render a disabled state)
- A disabled button implies the feature exists but is broken; unavailability is not a bug

### Step 3 — Remove dead formula code

Delete from `RoutePlannerScreen.tsx`:
```ts
const gain = displayKm > 0 ? Math.round(displayKm * 8) : 0;
const loss = displayKm > 0 ? Math.round(displayKm * 3) : 0;
```

Delete from `useRoutePlanner.ts` return:
- `elevD`
- `elevPoints`

Keep `elevationPts` calculation and related imports only if needed elsewhere;
otherwise delete.

---

## Acceptance Criteria

- `npx tsc --noEmit` → 0 errors
- `npx vitest run` → same pass count
- `npm run lint` → no new errors
- Manual: route with waypoints → no elevation gain number visible in header or stats panel
- Manual: surface mix section shows `est.` badge
- Manual: elevation profile button is not visible (not disabled — absent)
- No `Math.round(displayKm * 8)` or equivalent formula producing fake gain values

## Definition of Done

All acceptance criteria pass. Stats panel shows no metric it cannot back with
real data.

## Future: when DEM integration is added

Update `routeDataStatus.elevationGain` and `elevationProfile` to `'real'` and
restore chart rendering. The status-driven rendering path in the StatsPanel
already handles the `'real'` case by showing numbers with no qualification.
