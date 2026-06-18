import { beforeEach, describe, expect, it } from 'vitest';
import { viewStore } from '@data/projections/views';
import type { Id } from '@shared/types';
import type { RoutesEvent, SavedRoute } from '../domain/types';
import { normalizeRoute, savedRoutesProjection } from '../projections';
import { getRouteById, getRouteSummary, getRoutesByVisibility } from '../queries';
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
    const routes = viewStore.get('saved_routes') ?? [];
    expect(routes[0]).toEqual(expect.objectContaining({
      id: routeId,
      name: 'Morning Loop',
      description: 'Low traffic warm-up loop',
      routePath: [[51.5, -0.1], [51.51, -0.11]],
      routingStatus: 'straight_line',
      visibility: 'private',
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
    expect(savedRoutesProjection.getState()).toEqual([normalizeRoute(updated), second]);
  });

  it('gets a route by id from the view store', () => {
    const route = makeRoute(routeId, 'Queryable');
    resetRoutes([route]);

    expect(getRouteById(routeId)).toBe(route);
    expect(getRouteById('missing-route' as Id<'SavedRoute'>)).toBeUndefined();
  });

  it('normalizes old saved route payloads with rich defaults', () => {
    const route = normalizeRoute(makeRoute(routeId, 'Old Payload'));
    expect(route.routePath).toEqual(route.waypoints);
    expect(route.routingStatus).toBe('straight_line');
    expect(route.elevationGainM).toBe(0);
    expect(route.elevationLossM).toBe(0);
    expect(route.visibility).toBe('private');
    expect(route.routingPreference).toBe('balanced');
  });

  it('queries summaries and visibility buckets', () => {
    const privateRoute = normalizeRoute(makeRoute(routeId, 'Private'));
    const feedRoute = normalizeRoute({ ...makeRoute(otherRouteId, 'Feed'), visibility: 'feed' });
    resetRoutes([privateRoute, feedRoute]);

    expect(getRouteSummary(routeId)).toEqual({
      id: routeId,
      name: 'Private',
      profile: 'foot',
      distanceKm: 2.4,
      elevationGainM: 0,
      elevationLossM: 0,
    });
    expect(getRoutesByVisibility('feed')).toEqual([feedRoute]);
  });
});
