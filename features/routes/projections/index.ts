import type { RoutesEvent, SavedRoute } from '../domain/types';
import { ProjectionBuilder, projectionRegistry } from '@data/projections/builders';

export function normalizeRoute(route: SavedRoute): SavedRoute {
  const routePath = route.routePath && route.routePath.length >= 2
    ? route.routePath
    : route.waypoints;
  const elevationProfile = route.elevationProfile ?? [];
  const elevationGainM = Number.isFinite(route.elevationGainM) ? route.elevationGainM ?? 0 : 0;
  const elevationLossM = Number.isFinite(route.elevationLossM) ? route.elevationLossM ?? 0 : 0;

  return {
    ...route,
    routePath,
    routingStatus: route.routingStatus ?? 'straight_line',
    elevationProfile,
    elevationGainM,
    elevationLossM,
    surfaceSegments: route.surfaceSegments ?? [],
    visibility: route.visibility ?? 'private',
    routingPreference: route.routingPreference ?? 'balanced',
    elevation: route.elevation ?? { source: 'unavailable', provider: 'app', confidence: 'low' },
    surface: route.surface ?? { source: 'unavailable', provider: 'app', confidence: 'low' },
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
