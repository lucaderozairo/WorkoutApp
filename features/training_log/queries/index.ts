import { viewStore } from '@data/projections/views';
import type { Id } from '@shared/types';
import type {
  ActivityView,
  ActivitiesState,
  ActivityHistoryItem,
  RecentExercise,
} from '../projections';

export function getActiveSession(): ActivityView | null {
  const state = viewStore.get('sessions');
  if (!state?.activeId) return null;
  return state.byId[state.activeId] ?? null;
}

export function getActivity(activityId: Id<'Activity'>): ActivityView | undefined {
  const state = viewStore.get('sessions');
  return state?.byId[activityId];
}

export function getActivityHistory(): ActivityHistoryItem[] {
  const state = viewStore.get('sessions');
  if (!state) return [];
  return Object.values(state.byId)
    .filter(a => a.status === 'finished' && a.startedAt != null)
    .map(deriveHistoryItem)
    .sort((a, b) => b.startedAt - a.startedAt);
}

function deriveHistoryItem(a: ActivityView): ActivityHistoryItem {
  const allSets = a.segments.flatMap(s => s.sets ?? []);
  const workingSets = allSets.filter(set => !set.isWarmup && (set.weightKg !== undefined || set.reps !== undefined));
  const hasCardio = a.segments.some(s => s.exerciseCategory === 'cardio');
  return {
    id: a.id,
    name: a.name,
    primarySport: a.primarySport,
    startedAt: a.startedAt!,
    finishedAt: a.finishedAt ?? a.startedAt!,
    durationSeconds: a.finishedAt && a.startedAt
      ? Math.round((a.finishedAt - a.startedAt) / 1000)
      : 0,
    totalSets: workingSets.length,
    exerciseCount: new Set(a.segments.map(s => s.exerciseName).filter(Boolean)).size,
    hasPR: allSets.some(set => set.isPR),
    category: hasCardio ? 'cardio' : 'strength',
    rpe: a.rpe,
    tags: a.tags,
    notes: a.notes || undefined,
    comments: a.comments,
    media: a.media,
  };
}

export function getRecentExercises(limit?: number): RecentExercise[] {
  const all = viewStore.get('recent_exercises') ?? [];
  return typeof limit === 'number' ? all.slice(0, limit) : all;
}

