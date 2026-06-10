import { viewStore } from '@data/projections/views';
import type { Post } from '../domain/types';

export function getSocialFeed(): Post[] {
  return viewStore.get('social_feed') ?? [];
}
