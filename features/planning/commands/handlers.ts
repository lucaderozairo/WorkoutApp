import type { Result } from '@shared/types';
import { ok, err } from '@shared/types';
import type { PlanSession, DeletePlannedSession, SaveRoute, DeleteSavedRoute, PlanningEvent, PlannedSession, SavedRoute } from '../domain/types';
import { cryptoIdGenerator } from '@core/id-generator';
import { systemClock } from '@core/clock';
import { inMemoryEventStore } from '@data/store';
import { viewStore } from '@data/projections/views';
import { plannedSessionsProjection, savedRoutesProjection } from '../projections';

function applyAndStore(events: PlanningEvent[]): void {
  events.forEach(e => {
    plannedSessionsProjection.apply(e);
    savedRoutesProjection.apply(e);
  });
  viewStore.set('planned_sessions', plannedSessionsProjection.getState());
  viewStore.set('saved_routes', savedRoutesProjection.getState());
}

export async function handlePlanSession(cmd: PlanSession): Promise<Result<void, string>> {
  if (!cmd.name.trim()) return err('Session name is required');
  if (!cmd.scheduledAt) return err('Scheduled date is required');

  const plan: PlannedSession = {
    id: cryptoIdGenerator.next<'PlannedSession'>(),
    type: cmd.planType,
    name: cmd.name.trim(),
    scheduledAt: cmd.scheduledAt,
    notes: cmd.notes,
    exercises: cmd.exercises,
    routeWaypoints: cmd.routeWaypoints,
    distanceKm: cmd.distanceKm,
    paceSecPerKm: cmd.paceSecPerKm,
    distanceMarkers: cmd.distanceMarkers,
    poolLengthM: cmd.poolLengthM,
    targetDistanceM: cmd.targetDistanceM,
    paceSecPer100m: cmd.paceSecPer100m,
  };

  const event: PlanningEvent = {
    type: 'SessionPlanned',
    aggregateId: cmd.userId,
    aggregateType: 'User',
    timestamp: systemClock.now(),
    version: 1,
    payload: plan,
  };

  await inMemoryEventStore.append(event);
  applyAndStore([event]);
  return ok(undefined);
}

export async function handleSaveRoute(cmd: SaveRoute): Promise<Result<void, string>> {
  if (!cmd.name.trim()) return err('Route name is required');
  if (cmd.waypoints.length < 2) return err('Need at least 2 waypoints');

  const route: SavedRoute = {
    id: cryptoIdGenerator.next<'SavedRoute'>(),
    name: cmd.name.trim(),
    profile: cmd.profile,
    waypoints: cmd.waypoints,
    distanceKm: cmd.distanceKm,
    createdAt: systemClock.now(),
  };

  const event: PlanningEvent = {
    type: 'RouteSaved',
    aggregateId: route.id,
    aggregateType: 'SavedRoute',
    timestamp: systemClock.now(),
    version: 1,
    payload: route,
  };

  await inMemoryEventStore.append(event);
  applyAndStore([event]);
  return ok(undefined);
}

export async function handleDeleteSavedRoute(cmd: DeleteSavedRoute): Promise<Result<void, string>> {
  const exists = viewStore.get<SavedRoute[]>('saved_routes')?.some(r => r.id === cmd.routeId);
  if (!exists) return err('Saved route not found');

  const event: PlanningEvent = {
    type: 'RouteDeleted',
    aggregateId: cmd.routeId,
    aggregateType: 'SavedRoute',
    timestamp: systemClock.now(),
    version: 1,
    payload: { routeId: cmd.routeId },
  };

  await inMemoryEventStore.append(event);
  applyAndStore([event]);
  return ok(undefined);
}

export async function handleDeletePlannedSession(cmd: DeletePlannedSession): Promise<Result<void, string>> {
  const exists = plannedSessionsProjection.getState().some(p => p.id === cmd.planId);
  if (!exists) return err('Planned session not found');

  const event: PlanningEvent = {
    type: 'PlannedSessionDeleted',
    aggregateId: cmd.planId,
    aggregateType: 'PlannedSession',
    timestamp: systemClock.now(),
    version: 1,
    payload: { planId: cmd.planId },
  };

  await inMemoryEventStore.append(event);
  applyAndStore([event]);
  return ok(undefined);
}
