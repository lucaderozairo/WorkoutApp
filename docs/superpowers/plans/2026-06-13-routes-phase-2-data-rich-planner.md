# Route Planning — Phase 2: Data-Rich Planner (Builder/Overview + elevation, terrain, GPX, session targets)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. **Prerequisite:** Phase 1 (`2026-06-13-routes-phase-1-feature-extraction.md`) is merged — `features/routes` exists and all consumers import from it. The task list below is a **staged outline**; expand each task into bite-sized TDD steps against the post-extraction tree before executing (file shapes shift once Phase 1 lands).

**Goal:** Turn the extracted `features/routes` into an AllTrails/Strava-grade planner: a focused **Builder** and a rich **Overview**, with real elevation + terrain data, GPX import/export, route previews, and planned sessions that bind to a route with full-route or per-segment pace targets.

**Architecture:** New `data/sources/geo/` infrastructure ports (routing/elevation/terrain/GPX), all debounced + cached like the existing OSRM client. `RouteMap` becomes a controlled canvas; `useRouteBuilder` owns the canonical `routedPath`. The resolved `routePath` — not the sparse waypoints — is the route everything operates on. Session↔route binding goes through a types-only `shared/contracts/routes.ts` seam; planned sessions snapshot the route so deletion never breaks the calendar.

**Tech Stack:** TypeScript, React, Leaflet, Vitest, `ProjectionBuilder`/`defineCommand`/`viewStore`, `ui/patterns/charts`, external elevation API, Overpass API, OSRM.

**Scope:** Planning only. Real-time/live execution (live GPS tracking, "ahead of pace" notifications) is a future spec — leave a clean `PaceTarget` seam, do not build it. Popularity/heatmap routing is out of scope (attaches at the `RoutingPreference` seam).

---

## File Structure

**Infrastructure — `data/sources/geo/`:**
- `routing.ts` — `routePath({ waypoints, profile, preference }): Promise<RoutedPath>` where `RoutedPath { path: LatLng[]; distanceKm; status: 'routed' | 'straight_line' }`. Extracts OSRM fetch/debounce/fallback out of `RouteMap`. `preference` maps to best-available OSRM options; `prefer_cycleways` honoured only where the backend profile supports it, else unchanged `bike` behaviour.
- `elevation.ts` — `ElevationSource.sample(path: LatLng[]): Promise<ElevationSample[]>`. External API; cache keyed by rounded coords; ~400ms debounce; failure → `[]` + `unavailable` provenance.
- `terrain.ts` — `TerrainSource.surfaceForPath(path): Promise<SurfaceSegment[]>` via Overpass; cached.
- `gpx.ts` — GPX **export** (`SavedRoute` → `.gpx` string). Import reuses existing `parseGpx` in `data/sources/files/gps.ts`.
- `staticTile.ts` — fetch + cache a static map-tile image for a bounding box (shared with the route preview); degrades to no-tile.

**Feature domain — `features/routes/domain/`:**
- `elevation.ts` — pure: `ElevationSample[]` → gain/loss + per-segment grade.
- `surface.ts` — pure: `SurfaceSegment[]` → surface-mix summary (replaces the *estimate* in `useRoutePlanner`).
- `gpxModel.ts` — pure: parsed GPS data → route draft (track vs route, in-file elevation, multiple segments, timestamps). XML parsing stays in `data/`; interpretation lives here.
- `preview.ts` — pure: `routeToSvgPoints(path, { width, height, padding }): string`, projecting `routePath` via existing `toXY` in `shared/geo`. No DOM.

**Feature domain — `features/planning/domain/`:**
- `paceTargets.ts` — pure: `estimateTargetDuration(routeDistanceKm, paceTarget)`, `validatePaceTarget(routeDistanceKm, paceTarget)`.

**Contracts — `shared/contracts/`:**
- `routes.ts` — **types only**: `RouteSummary { id; name; profile; distanceKm; elevationGainM; elevationLossM }`. Re-export from `index.ts`. No `viewStore` access.

**UI — rename `ui/screens/cardio/` → `ui/screens/routes/` (LAST, after imports point at `@features/routes`):**
- `RouteBuilderScreen.tsx` (from `RoutePlannerScreen.tsx`, trimmed), `RouteOverviewScreen.tsx` (absorbs `RouteDetailScreen`), `RoutesScreen.tsx` (kept), `useRouteBuilder.ts` + `useRouteOverview.ts` (split from `useRoutePlanner.ts`).
- New components in `ui/components/<domain>`: `ElevationProfile` (on `ui/patterns/charts`), `RoutePreview` (SVG over static tile), overlay toggles. `RouteMap` reused as canvas-only.

**Styling:** extend `styling/route-planner.css`; surface/grade colours token-driven in `@layer project`. Add elevation-profile, overlay-toggle, and route-preview classes.

---

## Extended domain model

`SavedRoute` gains (all with `normalizeRoute` upcaster defaults so old routes still render):
- `routePath: LatLng[]` (default `waypoints`), `routingStatus: 'routed' | 'straight_line'` (default `'straight_line'`).
- `elevationProfile: ElevationSample[]` (default `[]`), `elevationGainM` / `elevationLossM` (default `0`).
- `surfaceSegments: SurfaceSegment[]` (default `[]`).
- `visibility: 'private' | 'feed'` (default `'private'`), `routingPreference: 'balanced' | 'prefer_cycleways' | 'shortest'` (default `'balanced'`).
- Freshness via reused `DataProvenance` from `shared/contracts/provenance.ts` (its `DataSourceKind` already covers `estimated`/`unavailable`/`synced`/…): `elevation: DataProvenance`, `surface: DataProvenance`, `dataUpdatedAt?`.

New value types: `ElevationSample { distanceKm; elevationM; grade }`, `SurfaceSegment { fromKm; toKm; surface }`.

`PlannedSession` (in `features/planning`) keeps existing fields, adds: `routeId?: Id<'SavedRoute'>`, `routeSnapshot?: RouteSummary` (captured at plan time — survives route deletion), `paceTarget?: PaceTarget` where `PaceTarget = { kind: 'full'; paceSecPerKm } | { kind: 'segments'; segments: { fromKm; toKm; paceSecPerKm }[] }`.

`features/routes/queries` adds `getRouteSummary(routeId): RouteSummary | undefined` and `getRoutesByVisibility`.

---

## Task outline (expand to bite-sized TDD before executing)

1. **`data/sources/geo/routing.ts`** — extract OSRM from `RouteMap`; `routePath()` returns `RoutedPath`; `RouteMap` receives `routePath` as a prop (controlled canvas). Tests: routed vs straight-line fallback, preference mapping. *Highest leverage — do first.*
2. **`SavedRoute` model + `normalizeRoute` upcaster** — add new fields with defaults; unit-test old-payload → all defaults (no NaN, `routePath` falls back to `waypoints`).
3. **`data/sources/geo/elevation.ts` + `features/routes/domain/elevation.ts`** — port (mocked in tests) + pure gain/loss/grade aggregation.
4. **`data/sources/geo/terrain.ts` + `features/routes/domain/surface.ts`** — Overpass port + pure surface-mix summary.
5. **`features/routes/domain/preview.ts` + `RoutePreview` + `data/sources/geo/staticTile.ts`** — pure `routeToSvgPoints` (test projection/normalization), dumb SVG-over-static-tile component with SVG-only glyph fallback.
6. **`data/sources/geo/gpx.ts` + `features/routes/domain/gpxModel.ts`** — export + import interpretation; test import→model→export round-trip.
7. **`shared/contracts/routes.ts` (types-only) + `features/planning` binding** — `RouteSummary`, `PlannedSession.routeId`/`routeSnapshot`/`paceTarget`, `handlePlanSession` accepts them; `features/planning/domain/paceTargets.ts` pure helpers. Test: route-deletion keeps the planned session via snapshot.
8. **`useRouteBuilder.ts`** — split from `useRoutePlanner`; owns `routedPath` state (single source of truth), foot/bike profile toggle + routing-preference (no activity selector), live distance + elevation-gain readout (debounced `ElevationSource` after each routing resolve).
9. **`RouteBuilderScreen.tsx`** — trimmed plotting screen; Save dialog gains visibility + units; primary CTA "Review" → Overview.
10. **`useRouteOverview.ts` + `RouteOverviewScreen.tsx` + `ElevationProfile`** — overlays (distance markers, grade/surface colouring over `routePath`), interactive elevation profile (hover ↔ map marker), stats band, segment breakdown, Plan-a-session panel (activity + full/per-segment pace targets + schedule), Export GPX, Edit → Builder.
11. **Rename `ui/screens/cardio/` → `ui/screens/routes/`** — last; update imports + `PlanRouteWidget` nav target + tests.

---

## Error handling

Routing / elevation / terrain / static-tile failures degrade gracefully and never block save: straight-line fallback (`routingStatus: 'straight_line'`), `unavailable` provenance + "elevation unavailable" copy, neutral surface colouring, SVG-only preview glyph. Cache + retry. GPX import validates and rejects malformed files clearly; snapping is best-effort.

## Testing

Pure unit tests: elevation aggregation (gain/loss/grade), surface-mix summary, `estimateTargetDuration`/`validatePaceTarget`, GPX import→model→export round-trip, `routeToSvgPoints` projection, `normalizeRoute` upcaster. Ports (`routing`, `ElevationSource`, `TerrainSource`, `staticTile`) mocked in screen/hook tests. Command + projection tests for `features/routes` extensions and `planning` session↔route binding incl. route-deletion-keeps-snapshot. Update screen tests for new paths; ESLint `boundaries` + Stylelint stay green.

## Verification

1. `bun test`, `npx eslint .`, `npx stylelint "**/*.css"` all green.
2. **Old-route compatibility:** load existing seeded/persisted routes (original `RouteSaved` fields only) → `normalizeRoute` backfills all new fields, Overview renders without blank stats/crashes/NaN.
3. Rebuild graph: `python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"`.
4. Manual: build a route → live elevation gain updates while plotting → Save with visibility → Review shows elevation profile + surface overlay + stats over `routePath` → plan a session with a per-segment pace target → delete the route and confirm the planned session still renders from `routeSnapshot` → export GPX and re-import to confirm round-trip → confirm route-preview SVG renders over a static tile in list cards and falls back to a glyph when tiles are unavailable.

## Design prompt (for the UI phase)

> Design two screens for a workout route planner, AllTrails/Strava-grade, fully token-driven (no hardcoded values, CSS `@layer`, nesting, zero inline styles). **Builder:** a calm, map-dominant plotting canvas — search bar with a green start pin, tappable/draggable waypoints, a compact floating tool cluster (mode, undo/redo, base layer, distance markers), a foot/bike profile toggle and a routing-preference toggle (no activity/pace controls — those are a session concern in Overview), and a slim persistent readout showing live distance and elevation gain as the line is drawn. A single confident "Review" CTA. **Overview:** a review surface — map with toggleable overlays (distance markers, route line coloured by grade or surface), a prominent interactive elevation profile that scrubs a marker along the map, a stats band (distance, ascent/descent, est. moving time, surface mix, grade), a segment breakdown, and a "Plan a session" panel for an activity and full-route or per-segment pace targets plus a schedule date, with a GPX export action. Easy toggle back to editing. Cohesive, quiet, data-dense but legible.

## Implementation status (2026-06-14)

Tasks 1–7 and 10 are implemented and green (`vitest` 280 pass, `tsc`, `eslint`, route-planner `stylelint` all clean). Notable: `useRouteOverview`/`RouteOverviewScreen` are now real (interactive `ElevationProfile` with hover↔map marker via `RouteMap.highlightPoint`, real surface mix from terrain, segment breakdown, Plan-a-session pace-target panel wiring `handlePlanSession` with `routeId`/`routeSnapshot`/`paceTarget`). Terrain sampling (`sampleRouteSurface`) wired into the builder hook. A unit bug in `gpxModel` (km/m confusion when `totalDistance` was 0) was found by the new round-trip test and fixed.

**Deferred (not done — need live browser iteration / external deps):**
- **(b) Builder screen visual redesign (Task 9):** the builder still renders the existing `RoutePlannerScreen`. It is functionally complete (terrain + elevation sampling, save → navigates to the Overview "Review" surface), but not the from-scratch "calm, map-dominant" redesign with the slim live readout and single Review CTA. Best done with `/run` browser iteration.
- **(c) GPX import in the Builder (Task 6):** `gpsTrackToRouteDraft` is domain-tested but not yet wired to an import button/file picker in the builder UI. Export is wired.
- **Static map tile behind `RoutePreview` (Task 5):** `staticTile.ts` remains a graceful no-tile stub (needs an external tile API/key); previews render SVG-over-grid today.
- **Route line coloured by grade/surface overlay on the Overview map:** distance-marker overlay + elevation hover→map sync are done; per-segment line recolouring is not.

## Out of scope (future specs)

- Live execution: real-time GPS tracking, "ahead of target pace" notifications, live session screen (consumes the same `PaceTarget`).
- Popularity/heatmap routing (Strava's data moat) — attaches at the `RoutingPreference` seam in `data/sources/geo/routing.ts`.
