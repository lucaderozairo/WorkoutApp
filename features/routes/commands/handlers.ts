import type { Result } from '@shared/types';
import { ok, err } from '@shared/types';
import type { SaveRoute, UpdateRoute, DeleteSavedRoute, RoutesEvent, SavedRoute } from '../domain/types';
import { cryptoIdGenerator } from '@core/id-generator';
import { systemClock } from '@core/clock';
import { defineCommand } from '@data/define-command';
import { viewStore } from '@data/projections/views';
import { normalizeRoute, savedRoutesProjection } from '../projections';

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
      routePath: cmd.routePath,
      routingStatus: cmd.routingStatus,
      distanceKm: cmd.distanceKm,
      elevationProfile: cmd.elevationProfile,
      elevationGainM: cmd.elevationGainM,
      elevationLossM: cmd.elevationLossM,
      surfaceSegments: cmd.surfaceSegments,
      visibility: cmd.visibility,
      routingPreference: cmd.routingPreference,
      elevation: cmd.elevation,
      surface: cmd.surface,
      dataUpdatedAt: cmd.dataUpdatedAt,
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
      ...normalizeRoute(existing),
      name: cmd.name.trim(),
      description: cmd.description?.trim() || undefined,
      profile: cmd.profile,
      waypoints: cmd.waypoints,
      routePath: cmd.routePath,
      routingStatus: cmd.routingStatus,
      distanceKm: cmd.distanceKm,
      elevationProfile: cmd.elevationProfile,
      elevationGainM: cmd.elevationGainM,
      elevationLossM: cmd.elevationLossM,
      surfaceSegments: cmd.surfaceSegments,
      visibility: cmd.visibility,
      routingPreference: cmd.routingPreference,
      elevation: cmd.elevation,
      surface: cmd.surface,
      dataUpdatedAt: cmd.dataUpdatedAt,
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
