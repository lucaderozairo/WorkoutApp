# Route Planning — Phase 1: Extract `features/routes` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move all route-domain concerns (`SavedRoute`, its events/commands/handlers/projection/queries) out of `features/planning` into a new `features/routes` feature, updating every consumer, with **zero behaviour change**.

**Architecture:** Pure event-sourced/CQRS module extraction. `features/routes` self-registers its `saved_routes` projection (side-effect import in `bootstrap.ts`, exactly like the current `@features/planning` import). `features/planning` keeps sessions + templates only. Routes persist as viewStore snapshots (`PERSISTED_KEYS`), not event-store replay, so hydration is unaffected. This is Phase 1 of a two-phase effort; the data-rich planner + Builder/Overview UI split is **Phase 2** (`2026-06-13-routes-phase-2-data-rich-planner.md`).

**Tech Stack:** TypeScript, React, Vitest, `ProjectionBuilder`/`projectionRegistry`, `defineCommand`, `viewStore`, ESLint `boundaries`. Test runner: `bun test` (vitest under the hood; `npx vitest run <path>` for single files).

**Design decisions carried into Phase 2 (not built here):** `routePath` becomes canonical on `SavedRoute`; `shared/contracts/routes.ts` is types-only with `getRouteSummary` living in `features/routes/queries`; planned sessions snapshot the route (`routeSnapshot`) so deletion never breaks the calendar; elevation (external API) + terrain (Overpass) + GPX import/export ports under `data/sources/geo/`; Builder carries only a foot/bike profile toggle (activity/pace are an Overview/session concern). `getRouteSummary`/`RouteSummary` and `getRoutesByVisibility` are **deferred to Phase 2** (no consumer exists until session-binding lands).

---

## File Structure

**New (`features/routes/`):**
- `domain/types.ts` — `SavedRoute`, `RoutesEvent`, `RoutesCommand` (+ `SaveRoute`/`UpdateRoute`/`DeleteSavedRoute`).
- `projections/index.ts` — `savedRoutesProjection` + `normalizeRoute`; registers `'saved_routes'`.
- `commands/handlers.ts` — `handleSaveRoute`/`handleUpdateRoute`/`handleDeleteSavedRoute` + local `applyAndStore`.
- `commands/handlers.test.ts` — moved verbatim from planning (the regression net).
- `queries/index.ts` — `getSavedRoutes`/`getRouteById`.
- `contract.ts`, `index.ts` — public surface.

**Modified (route symbols removed):** `features/planning/{domain/types.ts,projections/index.ts,commands/handlers.ts,queries/index.ts,contract.ts,index.ts}`.

**Modified (imports repointed to `@features/routes`):** `app/registry/bootstrap.ts`, `app/entrypoints/index.tsx`, `data/projections/views/schema.ts`, `data/mock/routes.ts`, `data/mock/seed.ts`, and `ui/screens/cardio/{useSavedRoutes,useRoutes,useRoutePlanner,useRouteDetail,RoutesScreen,RoutesScreen.test,RoutePlannerScreen,RouteEditorScreen}.{ts,tsx}`.

**Note:** UI screens stay in `ui/screens/cardio/` for Phase 1 — the folder rename is Phase 2, after imports point at `@features/routes`, so the extraction diff stays clean.

---

### Task 1: Create `features/routes` domain types

**Files:**
- Create: `features/routes/domain/types.ts`

- [ ] **Step 1: Write the domain types** (moved verbatim from `features/planning/domain/types.ts`; `RoutesEvent`/`RoutesCommand` replace the route slices of `PlanningEvent`/`PlanningCommand`)

```ts
import type { Id, DomainEvent } from '@shared/types';

export interface SavedRoute {
  id: Id<'SavedRoute'>;
  name: string;
  description?: string;
  profile: 'foot' | 'bike';
  waypoints: [number, number][];
  distanceKm: number;
  createdAt: number;
  updatedAt: number;
}

export type RoutesEvent =
  | DomainEvent<'RouteSaved', SavedRoute>
  | DomainEvent<'RouteUpdated', SavedRoute>
  | DomainEvent<'RouteDeleted', { routeId: Id<'SavedRoute'> }>;

export interface SaveRoute {
  type: 'SaveRoute';
  routeId?: Id<'SavedRoute'>;
  name: string;
  description?: string;
  profile: 'foot' | 'bike';
  waypoints: [number, number][];
  distanceKm: number;
}

export interface UpdateRoute {
  type: 'UpdateRoute';
  routeId: Id<'SavedRoute'>;
  name: string;
  description?: string;
  profile: 'foot' | 'bike';
  waypoints: [number, number][];
  distanceKm: number;
}

export interface DeleteSavedRoute {
  type: 'DeleteSavedRoute';
  routeId: Id<'SavedRoute'>;
}

export type RoutesCommand = SaveRoute | UpdateRoute | DeleteSavedRoute;
```

- [ ] **Step 2: Type-check the new file compiles**

Run: `npx tsc --noEmit`
Expected: PASS for this file (other files still reference the old planning location — that is fixed in later tasks; if pre-existing unrelated errors appear, note and continue).

- [ ] **Step 3: Commit**

```bash
git add features/routes/domain/types.ts
git commit -m "feat(routes): add features/routes domain types (moved from planning)"
```

---

### Task 2: Create `features/routes` projection

**Files:**
- Create: `features/routes/projections/index.ts`

- [ ] **Step 1: Write the projection** (moved verbatim from `features/planning/projections/index.ts`, retyped to `RoutesEvent`)

```ts
import type { RoutesEvent, SavedRoute } from '../domain/types';
import { ProjectionBuilder, projectionRegistry } from '@data/projections/builders';

export function normalizeRoute(route: SavedRoute): SavedRoute {
  return {
    ...route,
    updatedAt: route.updatedAt ?? route.createdAt,
  };
}

export const savedRoutesProjection = new ProjectionBuilder<SavedRoute[], RoutesEvent>(
  'saved_routes',
  [],
  {
    RouteSaved: (state, event) => {
      if (event.type !== 'RouteSaved') return state;
      return [normalizeRoute(event.payload), ...state];
    },
    RouteUpdated: (state, event) => {
      if (event.type !== 'RouteUpdated') return state;
      const route = normalizeRoute(event.payload);
      return state.map(r => r.id === route.id ? route : r);
    },
    RouteDeleted: (state, event) => {
      if (event.type !== 'RouteDeleted') return state;
      return state.filter(r => r.id !== event.payload.routeId);
    },
  },
);

projectionRegistry.register('saved_routes', savedRoutesProjection);
```

- [ ] **Step 2: Commit**

```bash
git add features/routes/projections/index.ts
git commit -m "feat(routes): add saved_routes projection (moved from planning)"
```

---

### Task 3: Create `features/routes` command handlers + move their test

**Files:**
- Create: `features/routes/commands/handlers.ts`
- Create: `features/routes/queries/index.ts` (needed by the test's `getRouteById` import)
- Create: `features/routes/commands/handlers.test.ts` (moved from `features/planning/commands/handlers.test.ts`)
- Delete: `features/planning/commands/handlers.test.ts`

- [ ] **Step 1: Write the queries file** (moved verbatim from `features/planning/queries/index.ts`, route functions only)

```ts
import { viewStore } from '@data/projections/views';
import type { SavedRoute } from '../domain/types';

export function getSavedRoutes(): SavedRoute[] {
  return viewStore.get('saved_routes') ?? [];
}

export function getRouteById(id: SavedRoute['id']): SavedRoute | undefined {
  return getSavedRoutes().find(route => route.id === id);
}
```

- [ ] **Step 2: Write the command handlers** (moved verbatim from planning; local `applyAndStore` now touches only `savedRoutesProjection`)

```ts
import type { Result } from '@shared/types';
import { ok, err } from '@shared/types';
import type { SaveRoute, UpdateRoute, DeleteSavedRoute, RoutesEvent, SavedRoute } from '../domain/types';
import { cryptoIdGenerator } from '@core/id-generator';
import { systemClock } from '@core/clock';
import { defineCommand } from '@data/define-command';
import { viewStore } from '@data/projections/views';
import { savedRoutesProjection } from '../projections';

function applyAndStore(events: RoutesEvent[]): void {
  events.forEach(e => savedRoutesProjection.apply(e));
  viewStore.set('saved_routes', savedRoutesProjection.getState());
}

export const handleSaveRoute = defineCommand<SaveRoute, Result<{ routeId: SavedRoute['id'] }, string>>({
  execute: async (cmd) => {
    if (!cmd.name.trim()) return { events: [], result: err('Route name is required') };
    if (cmd.waypoints.length < 2) return { events: [], result: err('Need at least 2 waypoints') };
    const now = systemClock.now();

    const route: SavedRoute = {
      id: cmd.routeId ?? cryptoIdGenerator.next<'SavedRoute'>(),
      name: cmd.name.trim(),
      description: cmd.description?.trim() || undefined,
      profile: cmd.profile,
      waypoints: cmd.waypoints,
      distanceKm: cmd.distanceKm,
      createdAt: now,
      updatedAt: now,
    };

    const event: RoutesEvent = {
      type: 'RouteSaved',
      aggregateId: route.id,
      aggregateType: 'SavedRoute',
      timestamp: systemClock.now(),
      version: 1,
      payload: route,
    };

    applyAndStore([event]);
    return { events: [event], result: ok({ routeId: route.id }) };
  },
});

export const handleUpdateRoute = defineCommand<UpdateRoute, Result<void, string>>({
  execute: async (cmd) => {
    if (!cmd.name.trim()) return { events: [], result: err('Route name is required') };
    if (cmd.waypoints.length < 2) return { events: [], result: err('Need at least 2 waypoints') };

    const existing = viewStore.get<SavedRoute[]>('saved_routes')?.find(r => r.id === cmd.routeId);
    if (!existing) return { events: [], result: err('Saved route not found') };

    const route: SavedRoute = {
      ...existing,
      name: cmd.name.trim(),
      description: cmd.description?.trim() || undefined,
      profile: cmd.profile,
      waypoints: cmd.waypoints,
      distanceKm: cmd.distanceKm,
      createdAt: existing.createdAt,
      updatedAt: systemClock.now(),
    };

    const event: RoutesEvent = {
      type: 'RouteUpdated',
      aggregateId: route.id,
      aggregateType: 'SavedRoute',
      timestamp: systemClock.now(),
      version: 1,
      payload: route,
    };

    applyAndStore([event]);
    return { events: [event], result: ok(undefined) };
  },
});

export const handleDeleteSavedRoute = defineCommand<DeleteSavedRoute, Result<void, string>>({
  execute: async (cmd) => {
    const exists = viewStore.get<SavedRoute[]>('saved_routes')?.some(r => r.id === cmd.routeId);
    if (!exists) return { events: [], result: err('Saved route not found') };

    const event: RoutesEvent = {
      type: 'RouteDeleted',
      aggregateId: cmd.routeId,
      aggregateType: 'SavedRoute',
      timestamp: systemClock.now(),
      version: 1,
      payload: { routeId: cmd.routeId },
    };

    applyAndStore([event]);
    return { events: [event], result: ok(undefined) };
  },
});
```

- [ ] **Step 3: Move the test file** — create `features/routes/commands/handlers.test.ts` with the content below (the existing planning route test; imports now resolve within `features/routes`; `PlanningEvent` → `RoutesEvent`; describe labels updated), then delete the old file.

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { viewStore } from '@data/projections/views';
import type { Id } from '@shared/types';
import type { RoutesEvent, SavedRoute } from '../domain/types';
import { savedRoutesProjection } from '../projections';
import { getRouteById } from '../queries';
import { handleSaveRoute, handleUpdateRoute } from './handlers';

const routeId = 'route-test-1' as Id<'SavedRoute'>;
const otherRouteId = 'route-test-2' as Id<'SavedRoute'>;

function resetRoutes(routes: SavedRoute[] = []) {
  savedRoutesProjection.setState(routes);
  viewStore.set('saved_routes', routes);
}

function makeRoute(id: Id<'SavedRoute'>, name: string): SavedRoute {
  return {
    id,
    name,
    profile: 'foot',
    waypoints: [[51.5, -0.1], [51.51, -0.11]],
    distanceKm: 2.4,
    createdAt: 1000,
    updatedAt: 1000,
  };
}

describe('routes commands', () => {
  beforeEach(() => resetRoutes());

  it('saves a route with a caller-provided id, description, and updatedAt', async () => {
    const result = await handleSaveRoute({
      type: 'SaveRoute',
      routeId,
      name: 'Morning Loop',
      description: 'Low traffic warm-up loop',
      profile: 'foot',
      waypoints: [[51.5, -0.1], [51.51, -0.11]],
      distanceKm: 4.8,
    });

    expect(result.ok).toBe(true);
    expect(result.value?.routeId).toBe(routeId);
    const routes = viewStore.get<SavedRoute[]>('saved_routes') ?? [];
    expect(routes[0]).toEqual(expect.objectContaining({
      id: routeId,
      name: 'Morning Loop',
      description: 'Low traffic warm-up loop',
      updatedAt: expect.any(Number),
    }));
    expect(routes[0].updatedAt).toBe(routes[0].createdAt);
  });

  it('updates route fields while preserving createdAt', async () => {
    const original = makeRoute(routeId, 'Old Name');
    resetRoutes([original]);
    const beforeUpdate = Date.now();

    const result = await handleUpdateRoute({
      type: 'UpdateRoute',
      routeId,
      name: 'Tempo Loop',
      description: 'Threshold route',
      profile: 'bike',
      waypoints: [[51.5, -0.1], [51.52, -0.12], [51.53, -0.13]],
      distanceKm: 12.2,
    });

    expect(result.ok).toBe(true);
    const updated = getRouteById(routeId);
    expect(updated).toEqual(expect.objectContaining({
      id: routeId,
      name: 'Tempo Loop',
      description: 'Threshold route',
      profile: 'bike',
      distanceKm: 12.2,
      createdAt: original.createdAt,
    }));
    expect(updated?.updatedAt).toBeGreaterThanOrEqual(beforeUpdate);
  });
});

describe('saved routes projection and queries', () => {
  beforeEach(() => resetRoutes());

  it('replaces only the matching route on RouteUpdated', () => {
    const first = makeRoute(routeId, 'First');
    const second = makeRoute(otherRouteId, 'Second');
    const updated = { ...first, name: 'Updated First', updatedAt: 2000 };
    savedRoutesProjection.setState([first, second]);

    const event: RoutesEvent = {
      type: 'RouteUpdated',
      aggregateId: routeId,
      aggregateType: 'SavedRoute',
      timestamp: 2000,
      version: 1,
      payload: updated,
    };

    savedRoutesProjection.apply(event);
    expect(savedRoutesProjection.getState()).toEqual([updated, second]);
  });

  it('gets a route by id from the view store', () => {
    const route = makeRoute(routeId, 'Queryable');
    resetRoutes([route]);

    expect(getRouteById(routeId)).toBe(route);
    expect(getRouteById('missing-route' as Id<'SavedRoute'>)).toBeUndefined();
  });
});
```

```bash
git rm features/planning/commands/handlers.test.ts
```

- [ ] **Step 4: Run the moved test — verify it passes from its new home**

Run: `npx vitest run features/routes/commands/handlers.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add features/routes/commands/handlers.ts features/routes/queries/index.ts features/routes/commands/handlers.test.ts
git commit -m "feat(routes): move route command handlers + queries + tests from planning"
```

---

### Task 4: Public surface — `contract.ts`, `index.ts`, and bootstrap registration

**Files:**
- Create: `features/routes/contract.ts`
- Create: `features/routes/index.ts`
- Modify: `app/registry/bootstrap.ts:25` (add side-effect import)

- [ ] **Step 1: Write `features/routes/contract.ts`**

```ts
// Public contract for the routes feature.
export type { RoutesEvent } from './domain/types';
export type {
  RoutesCommand,
  SaveRoute,
  UpdateRoute,
  DeleteSavedRoute,
} from './domain/types';
export type { SavedRoute } from './domain/types';
```

- [ ] **Step 2: Write `features/routes/index.ts`**

```ts
export type {
  SavedRoute,
  RoutesEvent,
  RoutesCommand,
  SaveRoute,
  UpdateRoute,
  DeleteSavedRoute,
} from './domain/types';

export { savedRoutesProjection, normalizeRoute } from './projections';

export { getSavedRoutes, getRouteById } from './queries';

export { handleSaveRoute, handleUpdateRoute, handleDeleteSavedRoute } from './commands/handlers';
```

- [ ] **Step 3: Register the feature at bootstrap** — in `app/registry/bootstrap.ts`, add the side-effect import directly after the planning import (line 25), so the `saved_routes` projection self-registers exactly as before:

```ts
import '@features/planning';
import '@features/routes';
```

- [ ] **Step 4: Commit**

```bash
git add features/routes/contract.ts features/routes/index.ts app/registry/bootstrap.ts
git commit -m "feat(routes): expose contract/index and register at bootstrap"
```

---

### Task 5: Remove route symbols from `features/planning`

**Files:**
- Modify: `features/planning/domain/types.ts`
- Modify: `features/planning/projections/index.ts`
- Modify: `features/planning/commands/handlers.ts`
- Modify: `features/planning/queries/index.ts`
- Modify: `features/planning/contract.ts`
- Modify: `features/planning/index.ts`

- [ ] **Step 1: `domain/types.ts`** — delete the `SavedRoute` interface, the three route arms of `PlanningEvent`, the `SaveRoute`/`UpdateRoute`/`DeleteSavedRoute` interfaces, and their entries in `PlanningCommand`. Resulting unions:

```ts
export type PlanningEvent =
  | DomainEvent<'SessionPlanned', PlannedSession>
  | DomainEvent<'PlannedSessionDeleted', { planId: Id<'PlannedSession'> }>
  | DomainEvent<'TemplateSaved', SavedTemplate>
  | DomainEvent<'TemplateDeleted', { templateId: Id<'SavedTemplate'> }>;
```

```ts
export type PlanningCommand =
  | PlanSession
  | DeletePlannedSession
  | SaveTemplate
  | DeleteSavedTemplate;
```

- [ ] **Step 2: `projections/index.ts`** — delete `normalizeRoute`, `savedRoutesProjection`, and its `projectionRegistry.register('saved_routes', …)` call. Remove `SavedRoute` from the import on line 1. Keep `plannedSessionsProjection` and `savedTemplatesProjection`.

- [ ] **Step 3: `commands/handlers.ts`** — delete `handleSaveRoute`, `handleUpdateRoute`, `handleDeleteSavedRoute`. Remove `savedRoutesProjection` from the projections import and `SaveRoute, UpdateRoute, DeleteSavedRoute, SavedRoute` from the types import. Update `applyAndStore` to drop the routes projection:

```ts
function applyAndStore(events: PlanningEvent[]): void {
  events.forEach(e => {
    plannedSessionsProjection.apply(e);
    savedTemplatesProjection.apply(e);
  });
  viewStore.set('planned_sessions', plannedSessionsProjection.getState());
  viewStore.set('saved_templates', savedTemplatesProjection.getState());
}
```

- [ ] **Step 4: `queries/index.ts`** — delete `getSavedRoutes` and `getRouteById`; remove `SavedRoute` from the type import. Keep `getPlannedSessions`/`getUpcomingPlans`:

```ts
import { viewStore } from '@data/projections/views';
import type { PlannedSession } from '../domain/types';

export function getPlannedSessions(): PlannedSession[] {
  return viewStore.get('planned_sessions') ?? [];
}

export function getUpcomingPlans(nowMs = Date.now()): PlannedSession[] {
  return getPlannedSessions().filter(p => p.scheduledAt >= nowMs);
}
```

- [ ] **Step 5: `contract.ts`** — remove `SaveRoute, UpdateRoute, DeleteSavedRoute` from the commands export and `SavedRoute` from the domain-types export. Leave `PlanningEvent`, `PlanningCommand`, `PlanType`, `PlannedExercise`, `DistanceMarker`, `PlannedSession`, `TemplateExercise`, `SavedTemplate`.

- [ ] **Step 6: `index.ts`** — from the type export block remove `SavedRoute, SaveRoute, UpdateRoute, DeleteSavedRoute`. From the projection export remove `savedRoutesProjection`. From the queries export remove `getSavedRoutes, getRouteById`. From the handlers export remove `handleSaveRoute, handleUpdateRoute, handleDeleteSavedRoute`. Keep everything else (incl. `formatPace, parsePace, buildMarkers`).

- [ ] **Step 7: Verify planning's own suite still passes**

Run: `npx vitest run features/planning`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add features/planning
git commit -m "refactor(planning): remove route domain (moved to features/routes)"
```

---

### Task 6: Repoint infrastructure + mock consumers to `@features/routes`

**Files:**
- Modify: `data/projections/views/schema.ts:95-100`
- Modify: `app/entrypoints/index.tsx:22-23`
- Modify: `data/mock/routes.ts:1`
- Modify: `data/mock/seed.ts:20`

- [ ] **Step 1: `schema.ts`** — split the planning import so `SavedRoute` comes from routes:

```ts
// ── planning ──────────────────────────────────────────────────────────-───
import type {
  PlannedSession,
  SavedTemplate,
} from '@features/planning/contract';

// ── routes ────────────────────────────────────────────────────────────-───
import type { SavedRoute } from '@features/routes/contract';
```

- [ ] **Step 2: `app/entrypoints/index.tsx`** — split the value + type imports (lines 22–23). The later `viewStore.get<SavedRoute[]>('saved_routes')` / `savedRoutesProjection.setState(...)` need no change:

```ts
import { savedTemplatesProjection } from '@features/planning';
import type { SavedTemplate } from '@features/planning';
import { savedRoutesProjection } from '@features/routes';
import type { SavedRoute } from '@features/routes';
```

- [ ] **Step 3: `data/mock/routes.ts:1`**

```ts
import type { SavedRoute } from '@features/routes';
```

- [ ] **Step 4: `data/mock/seed.ts:20`**

```ts
import type { SavedRoute } from '@features/routes';
```

- [ ] **Step 5: Commit**

```bash
git add data/projections/views/schema.ts app/entrypoints/index.tsx data/mock/routes.ts data/mock/seed.ts
git commit -m "refactor: repoint infra + mock route imports to @features/routes"
```

---

### Task 7: Repoint the cardio UI consumers to `@features/routes`

**Files (edit import lines only — no logic changes):**
- `ui/screens/cardio/useSavedRoutes.ts:4-5`, `useRoutes.ts:4`, `useRoutePlanner.ts:4-5`, `useRouteDetail.ts:4-5`, `RoutesScreen.tsx:8`, `RoutesScreen.test.tsx:7`, `RoutePlannerScreen.tsx:51`, `RouteEditorScreen.tsx:2`.

- [ ] **Step 1: `useSavedRoutes.ts`** (lines 4–5)

```ts
import type { SavedRoute } from '@features/routes';
import { handleDeleteSavedRoute } from '@features/routes';
```

- [ ] **Step 2: `useRoutes.ts:4`**

```ts
import type { SavedRoute } from '@features/routes';
```

- [ ] **Step 3: `useRoutePlanner.ts`** (lines 4–5) — `handleSaveRoute`/`handleUpdateRoute` from routes; `formatPace`/`parsePace` stay in planning; `SavedRoute` type from routes:

```ts
import { formatPace, parsePace } from '@features/planning';
import { handleSaveRoute, handleUpdateRoute } from '@features/routes';
import type { SavedRoute } from '@features/routes/contract';
```

- [ ] **Step 4: `useRouteDetail.ts`** (lines 4–5)

```ts
import type { SavedRoute } from '@features/routes';
import { handleDeleteSavedRoute } from '@features/routes';
```

- [ ] **Step 5: `RoutesScreen.tsx:8`**

```ts
import type { SavedRoute } from '@features/routes';
```

- [ ] **Step 6: `RoutesScreen.test.tsx:7`**

```ts
import type { SavedRoute } from '@features/routes';
```

- [ ] **Step 7: `RoutePlannerScreen.tsx:51`**

```ts
import type { SavedRoute } from "@features/routes/contract";
```

- [ ] **Step 8: `RouteEditorScreen.tsx:2`**

```ts
import type { SavedRoute } from '@features/routes';
```

- [ ] **Step 9: Run the cardio screen test**

Run: `npx vitest run ui/screens/cardio/RoutesScreen.test.tsx`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add ui/screens/cardio
git commit -m "refactor(cardio-ui): repoint route imports to @features/routes"
```

---

### Task 8: Full verification — behaviour unchanged

**Files:** none (verification only).

- [ ] **Step 1: Type-check the whole project**

Run: `npx tsc --noEmit`
Expected: PASS, no new errors. If any file still imports a route symbol from `@features/planning`, fix and re-run. Search:
`grep -rn "from '@features/planning'" --include=*.ts --include=*.tsx | xargs grep -l "SavedRoute\|SaveRoute\|getSavedRoutes\|getRouteById\|handleSaveRoute\|handleUpdateRoute\|handleDeleteSavedRoute\|savedRoutesProjection"`

- [ ] **Step 2: Run the full test suite**

Run: `bun test`
Expected: PASS — same pass count as before, plus the relocated route tests in `features/routes`.

- [ ] **Step 3: Lint + boundaries**

Run: `npx eslint .`
Expected: PASS. `features/routes` must not import another feature directly; consumers reference it via barrel/contract, matching `features/planning`'s boundary profile.

- [ ] **Step 4: Smoke-run the app (manual, recommended)**

Open the routes screens; confirm the 5 seeded routes render, save/update/delete works, and a reload re-hydrates `saved_routes` — identical to pre-refactor.

- [ ] **Step 5: Rebuild the knowledge graph**

Run: `python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"`

- [ ] **Step 6: Final commit (if graph output changed)**

```bash
git add -A
git commit -m "chore(routes): rebuild knowledge graph after extraction"
```

---

## Self-Review

- **Spec coverage:** new feature files (T1–T4), planning slimming (T5), consumer repointing (T6–T7), green tests/lint/types (T8). `getRoutesByVisibility`, `getRouteSummary`/`RouteSummary`, all data-rich/UI work are Phase 2.
- **Placeholders:** none — every code step shows the full file or exact replacement block; every command lists expected output.
- **Type consistency:** `RoutesEvent`/`RoutesCommand` used identically across T1–T4; `savedRoutesProjection`, `normalizeRoute`, the three handlers, and `getSavedRoutes`/`getRouteById` keep their original names so consumers only change the import path.
