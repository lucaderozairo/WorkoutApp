import { viewStore } from '@data/projections/views';
import type { SavedRoute } from '../domain/types';
import type { RouteSummary } from '@shared/contracts/routes';

export function getSavedRoutes(): SavedRoute[] {
  return viewStore.get('saved_routes') ?? [];
}

export function getRouteById(id: SavedRoute['id']): SavedRoute | undefined {
  return getSavedRoutes().find(route => route.id === id);
}

export function getRouteSummary(routeId: SavedRoute['id']): RouteSummary | undefined {
  const route = getRouteById(routeId);
  if (!route) return undefined;
  return {
    id: route.id,
    name: route.name,
    profile: route.profile,
    distanceKm: route.distanceKm,
    elevationGainM: route.elevationGainM ?? 0,
    elevationLossM: route.elevationLossM ?? 0,
  };
}

export function getRoutesByVisibility(visibility: NonNullable<SavedRoute['visibility']>): SavedRoute[] {
  return getSavedRoutes().filter(route => (route.visibility ?? 'private') === visibility);
}
