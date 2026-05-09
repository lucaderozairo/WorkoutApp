import { viewStore } from '@data/projections/views';
import type { CoachingInsight } from '../domain/types';

export function addInsight(insight: CoachingInsight): void {
  const current = viewStore.get<CoachingInsight[]>('active_insights') ?? [];
  const isDuplicate = current.some(i => i.title === insight.title && !i.dismissed);
  if (isDuplicate) return;

  viewStore.set('active_insights', [insight, ...current]);

  const history = viewStore.get<CoachingInsight[]>('insight_history') ?? [];
  viewStore.set('insight_history', [insight, ...history]);
}

export function dismissInsight(insightId: string): void {
  const current = viewStore.get<CoachingInsight[]>('active_insights') ?? [];
  viewStore.set(
    'active_insights',
    current.filter(i => i.id !== insightId),
  );

  const history = viewStore.get<CoachingInsight[]>('insight_history') ?? [];
  viewStore.set(
    'insight_history',
    history.map(i => i.id === insightId ? { ...i, dismissed: true } : i),
  );
}
