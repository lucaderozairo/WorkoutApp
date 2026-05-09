import type { PlanningEvent, PlannedSession } from '../domain/types';
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
