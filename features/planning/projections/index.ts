import type { PlanningEvent, PlannedSession, SavedRoute } from '../domain/types';
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

export const savedRoutesProjection = new ProjectionBuilder<SavedRoute[], PlanningEvent>(
  'saved_routes',
  [],
  {
    RouteSaved: (state, event) => {
      if (event.type !== 'RouteSaved') return state;
      return [event.payload, ...state];
    },
    RouteDeleted: (state, event) => {
      if (event.type !== 'RouteDeleted') return state;
      return state.filter(r => r.id !== event.payload.routeId);
    },
  },
);

projectionRegistry.register('saved_routes', savedRoutesProjection);
