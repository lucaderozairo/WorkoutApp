import { viewStore } from '@data/projections/views';
import type { Headline, Deal } from '../domain/types';

export function getHeadlines(): Headline[] {
  return viewStore.get<Headline[]>('headlines') ?? [];
}

export function getDeals(): Deal[] {
  return viewStore.get<Deal[]>('deals') ?? [];
}

export function getUnreadCount(): number {
  return getHeadlines().filter(h => !h.isRead).length;
}
