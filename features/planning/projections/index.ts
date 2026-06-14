import type { PlanningEvent, PlannedSession, SavedTemplate } from '../domain/types';
import { ProjectionBuilder, projectionRegistry } from '@data/projections/builders';

export const plannedSessionsProjection = new ProjectionBuilder<PlannedSession[], PlanningEvent>(
  'planned_sessions',
  [],
  {
    SessionPlanned: (state, event) => {
      return [...state, event.payload].sort((a, b) => a.scheduledAt - b.scheduledAt);
    },
    PlannedSessionDeleted: (state, event) => {
      return state.filter(p => p.id !== event.payload.planId);
    },
  },
);

projectionRegistry.register('planned_sessions', plannedSessionsProjection);

export const savedTemplatesProjection = new ProjectionBuilder<SavedTemplate[], PlanningEvent>(
  'saved_templates',
  [],
  {
    TemplateSaved: (state, event) => {
      if (event.type !== 'TemplateSaved') return state;
      return [event.payload, ...state];
    },
    TemplateDeleted: (state, event) => {
      if (event.type !== 'TemplateDeleted') return state;
      return state.filter(t => t.id !== event.payload.templateId);
    },
  },
);

projectionRegistry.register('saved_templates', savedTemplatesProjection);
