import type { Result } from '@shared/types';
import { ok, err } from '@shared/types';
import type { PlanSession, DeletePlannedSession, PlanningEvent, PlannedSession } from '../domain/types';
import { cryptoIdGenerator } from '@core/id-generator';
import { systemClock } from '@core/clock';
import { inMemoryEventStore } from '@data/store';
import { viewStore } from '@data/projections/views';
import { plannedSessionsProjection } from '../projections';

function applyAndStore(events: PlanningEvent[]): void {
  events.forEach(e => plannedSessionsProjection.apply(e));
  viewStore.set('planned_sessions', plannedSessionsProjection.getState());
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
