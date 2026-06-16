import { ProjectionBuilder, projectionRegistry } from '@data/projections/builders';
import type { RecentRoutine, TemplateEvent, TemplateState, WorkoutTemplate } from '../domain/types';
import { getVisibleTemplates, initialTemplateState, reduceTemplateState } from '../domain/reducers';

interface SessionSnapshot {
  id: string;
  name: string;
  primarySport: RecentRoutine['primarySport'];
  status: 'active' | 'finished';
  finishedAt: number | null;
  tags?: string[];
  segments: Array<{
    id: string;
    exerciseName: string;
    exerciseCategory: 'strength' | 'cardio' | 'mobility';
    sets: Array<{ isWarmup?: boolean }>;
    restSeconds?: number;
    notes: string;
  }>;
}

export const templateStateProjection = new ProjectionBuilder<TemplateState, TemplateEvent>(
  'template_state',
  initialTemplateState,
  {
    TemplateCreated: (state, event) => reduceTemplateState(state, event),
    TemplateRenamed: (state, event) => reduceTemplateState(state, event),
    TemplateDuplicated: (state, event) => reduceTemplateState(state, event),
    TemplateDeleted: (state, event) => reduceTemplateState(state, event),
    TemplateFavoriteChanged: (state, event) => reduceTemplateState(state, event),
    TemplateExerciseAdded: (state, event) => reduceTemplateState(state, event),
    TemplateExerciseUpdated: (state, event) => reduceTemplateState(state, event),
    TemplateExerciseRemoved: (state, event) => reduceTemplateState(state, event),
    TemplateExercisesReordered: (state, event) => reduceTemplateState(state, event),
  },
);

export const templateListProjection = new ProjectionBuilder<WorkoutTemplate[], TemplateEvent>(
  'template_list',
  [],
  {
    TemplateCreated: (_state, _event) => getVisibleTemplates(templateStateProjection.getState()),
    TemplateRenamed: (_state, _event) => getVisibleTemplates(templateStateProjection.getState()),
    TemplateDuplicated: (_state, _event) => getVisibleTemplates(templateStateProjection.getState()),
    TemplateDeleted: (_state, _event) => getVisibleTemplates(templateStateProjection.getState()),
    TemplateFavoriteChanged: (_state, _event) => getVisibleTemplates(templateStateProjection.getState()),
    TemplateExerciseAdded: (_state, _event) => getVisibleTemplates(templateStateProjection.getState()),
    TemplateExerciseUpdated: (_state, _event) => getVisibleTemplates(templateStateProjection.getState()),
    TemplateExerciseRemoved: (_state, _event) => getVisibleTemplates(templateStateProjection.getState()),
    TemplateExercisesReordered: (_state, _event) => getVisibleTemplates(templateStateProjection.getState()),
  },
);

export const favoriteTemplatesProjection = new ProjectionBuilder<WorkoutTemplate[], TemplateEvent>(
  'favorite_templates',
  [],
  {
    TemplateCreated: (_state, _event) => getVisibleTemplates(templateStateProjection.getState()).filter(t => t.favorite),
    TemplateRenamed: (_state, _event) => getVisibleTemplates(templateStateProjection.getState()).filter(t => t.favorite),
    TemplateDuplicated: (_state, _event) => getVisibleTemplates(templateStateProjection.getState()).filter(t => t.favorite),
    TemplateDeleted: (_state, _event) => getVisibleTemplates(templateStateProjection.getState()).filter(t => t.favorite),
    TemplateFavoriteChanged: (_state, _event) => getVisibleTemplates(templateStateProjection.getState()).filter(t => t.favorite),
    TemplateExerciseAdded: (_state, _event) => getVisibleTemplates(templateStateProjection.getState()).filter(t => t.favorite),
    TemplateExerciseUpdated: (_state, _event) => getVisibleTemplates(templateStateProjection.getState()).filter(t => t.favorite),
    TemplateExerciseRemoved: (_state, _event) => getVisibleTemplates(templateStateProjection.getState()).filter(t => t.favorite),
    TemplateExercisesReordered: (_state, _event) => getVisibleTemplates(templateStateProjection.getState()).filter(t => t.favorite),
  },
);

function routineFromSession(session: SessionSnapshot): RecentRoutine | null {
  if (session.status !== 'finished' || !session.finishedAt || session.segments.length === 0) return null;
  if (session.tags?.includes('template') || session.tags?.includes('planned')) return null;
  const exercises = session.segments
    .filter(segment => segment.exerciseCategory === 'strength')
    .map((segment, order) => ({
      id: String(segment.id),
      name: segment.exerciseName,
      category: segment.exerciseCategory,
      order,
      targetSets: segment.sets.filter(set => !set.isWarmup).length,
      restSeconds: segment.restSeconds,
      notes: segment.notes || undefined,
    }));
  if (exercises.length === 0) return null;
  return {
    id: `recent-${session.id}`,
    sourceSessionId: String(session.id),
    name: session.name,
    primarySport: session.primarySport,
    exercises,
    finishedAt: session.finishedAt,
  };
}

export function buildRecentRoutinesFromSessions(sessions: Record<string, SessionSnapshot>): RecentRoutine[] {
  return Object.values(sessions)
    .flatMap(session => {
      const routine = routineFromSession(session);
      return routine ? [routine] : [];
    })
    .sort((a, b) => b.finishedAt - a.finishedAt)
    .slice(0, 3);
}

export const recentRoutinesProjection = new ProjectionBuilder<RecentRoutine[], TemplateEvent>(
  'recent_routines',
  [],
  {},
);

projectionRegistry.register('template_state', templateStateProjection);
projectionRegistry.register('template_list', templateListProjection);
projectionRegistry.register('favorite_templates', favoriteTemplatesProjection);
projectionRegistry.register('recent_routines', recentRoutinesProjection);
