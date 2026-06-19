import { viewStore } from '@data/projections/views';
import type { RecentRoutine, TemplateState, WorkoutTemplate } from '../domain/types';
import { getVisibleTemplates } from '../domain/reducers';
import { buildRecentRoutinesFromSessions } from '../projections';

export function getTemplates(): WorkoutTemplate[] {
  const state = viewStore.get('template_state');
  if (state) return getVisibleTemplates(state);
  return viewStore.get('template_list') ?? [];
}

export function getFavoriteTemplates(): WorkoutTemplate[] {
  return getTemplates().filter(template => template.favorite);
}

export function getTemplate(templateId: string): WorkoutTemplate | null {
  return getTemplates().find(template => template.id === templateId) ?? null;
}

export function getRecentRoutines(): RecentRoutine[] {
  const sessions = viewStore.get('sessions');
  if (sessions) return buildRecentRoutinesFromSessions(sessions.byId);
  return viewStore.get('recent_routines') ?? [];
}
