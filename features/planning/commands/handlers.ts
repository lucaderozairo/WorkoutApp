import type { Result } from '@shared/types';
import { ok, err } from '@shared/types';
import type { PlanSession, DeletePlannedSession, SaveTemplate, DeleteSavedTemplate, PlanningEvent, PlannedSession, SavedTemplate } from '../domain/types';
import { cryptoIdGenerator } from '@core/id-generator';
import { systemClock } from '@core/clock';
import { defineCommand } from '@data/define-command';
import { viewStore } from '@data/projections/views';
import { plannedSessionsProjection, savedTemplatesProjection } from '../projections';

function applyAndStore(events: PlanningEvent[]): void {
  events.forEach(e => {
    plannedSessionsProjection.apply(e);
    savedTemplatesProjection.apply(e);
  });
  viewStore.set('planned_sessions', plannedSessionsProjection.getState());
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
      routeId: cmd.routeId,
      routeSnapshot: cmd.routeSnapshot,
      paceTarget: cmd.paceTarget,
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
    const exists = viewStore.get('saved_templates')?.some(t => t.id === cmd.templateId);
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
