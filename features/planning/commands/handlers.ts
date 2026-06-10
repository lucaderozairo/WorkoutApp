import type { Result } from '@shared/types';
import { ok, err } from '@shared/types';
import type { PlanSession, DeletePlannedSession, SaveRoute, DeleteSavedRoute, SaveTemplate, DeleteSavedTemplate, PlanningEvent, PlannedSession, SavedRoute, SavedTemplate } from '../domain/types';
import { cryptoIdGenerator } from '@core/id-generator';
import { systemClock } from '@core/clock';
import { defineCommand } from '@data/define-command';
import { viewStore } from '@data/projections/views';
import { plannedSessionsProjection, savedRoutesProjection, savedTemplatesProjection } from '../projections';

function applyAndStore(events: PlanningEvent[]): void {
  events.forEach(e => {
    plannedSessionsProjection.apply(e);
    savedRoutesProjection.apply(e);
    savedTemplatesProjection.apply(e);
  });
  viewStore.set('planned_sessions', plannedSessionsProjection.getState());
  viewStore.set('saved_routes', savedRoutesProjection.getState());
  viewStore.set('saved_templates', savedTemplatesProjection.getState());
}

export const handlePlanSession = defineCommand<PlanSession, Result<void, string>>({
  execute: async (cmd) => {
    if (!cmd.name.trim()) return { events: [], result: err('Session name is required') };
    if (!cmd.scheduledAt) return { events: [], result: err('Scheduled date is required') };

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

    applyAndStore([event]);
    return { events: [event], result: ok(undefined) };
  },
});

export const handleSaveRoute = defineCommand<SaveRoute, Result<void, string>>({
  execute: async (cmd) => {
    if (!cmd.name.trim()) return { events: [], result: err('Route name is required') };
    if (cmd.waypoints.length < 2) return { events: [], result: err('Need at least 2 waypoints') };

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

    applyAndStore([event]);
    return { events: [event], result: ok(undefined) };
  },
});

export const handleDeleteSavedRoute = defineCommand<DeleteSavedRoute, Result<void, string>>({
  execute: async (cmd) => {
    const exists = viewStore.get<SavedRoute[]>('saved_routes')?.some(r => r.id === cmd.routeId);
    if (!exists) return { events: [], result: err('Saved route not found') };

    const event: PlanningEvent = {
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

export const handleSaveTemplate = defineCommand<SaveTemplate, Result<void, string>>({
  execute: async (cmd) => {
    if (!cmd.name.trim()) return { events: [], result: err('Template name is required') };
    if (cmd.exercises.length === 0) return { events: [], result: err('Template must have at least one exercise') };

    const template: SavedTemplate = {
      id: cryptoIdGenerator.next<'SavedTemplate'>(),
      name: cmd.name.trim(),
      primarySport: cmd.primarySport,
      exercises: cmd.exercises,
      createdAt: systemClock.now(),
    };

    const event: PlanningEvent = {
      type: 'TemplateSaved',
      aggregateId: template.id,
      aggregateType: 'SavedTemplate',
      timestamp: systemClock.now(),
      version: 1,
      payload: template,
    };

    applyAndStore([event]);
    return { events: [event], result: ok(undefined) };
  },
});

export const handleDeleteSavedTemplate = defineCommand<DeleteSavedTemplate, Result<void, string>>({
  execute: async (cmd) => {
    const exists = viewStore.get<SavedTemplate[]>('saved_templates')?.some(t => t.id === cmd.templateId);
    if (!exists) return { events: [], result: err('Saved template not found') };

    const event: PlanningEvent = {
      type: 'TemplateDeleted',
      aggregateId: cmd.templateId,
      aggregateType: 'SavedTemplate',
      timestamp: systemClock.now(),
      version: 1,
      payload: { templateId: cmd.templateId },
    };

    applyAndStore([event]);
    return { events: [event], result: ok(undefined) };
  },
});

export const handleDeletePlannedSession = defineCommand<DeletePlannedSession, Result<void, string>>({
  execute: async (cmd) => {
    const exists = plannedSessionsProjection.getState().some(p => p.id === cmd.planId);
    if (!exists) return { events: [], result: err('Planned session not found') };

    const event: PlanningEvent = {
      type: 'PlannedSessionDeleted',
      aggregateId: cmd.planId,
      aggregateType: 'PlannedSession',
      timestamp: systemClock.now(),
      version: 1,
      payload: { planId: cmd.planId },
    };

    applyAndStore([event]);
    return { events: [event], result: ok(undefined) };
  },
});
