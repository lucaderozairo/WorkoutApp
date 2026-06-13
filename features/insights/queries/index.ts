import { viewStore } from '@data/projections/views';
import type { Insight } from '../domain/types';

export function getInsights(): Insight[] {
  return viewStore.get('insights') ?? [];
}
