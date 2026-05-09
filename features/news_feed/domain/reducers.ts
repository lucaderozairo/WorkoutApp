import type { Id } from '@shared/types';
import type { NewsFeedEvent, Headline, Deal, HeadlinesFetchedPayload, DealsFetchedPayload, ArticleReadPayload } from './types';

export function applyHeadlinesFetched(_state: Headline[], event: NewsFeedEvent): Headline[] {
  if (event.type !== 'HeadlinesFetched') return _state;
  const p = event.payload as HeadlinesFetchedPayload;
  return p.headlines.map(h => ({ ...h, isRead: false } as Headline));
}

export function applyArticleRead(state: Headline[], event: NewsFeedEvent): Headline[] {
  if (event.type !== 'ArticleRead') return state;
  const p = event.payload as ArticleReadPayload;
  return state.map(h => h.id === p.articleId ? { ...h, isRead: true } : h);
}

export function applyDealsFetchedHeadlines(state: Headline[]): Headline[] {
  return state;
}

export function applyDealsFetched(_state: Deal[], event: NewsFeedEvent): Deal[] {
  if (event.type !== 'DealsFetched') return _state;
  const p = event.payload as DealsFetchedPayload;
  return p.deals;
}

export function applyHeadlinesFetchedDeals(state: Deal[]): Deal[] {
  return state;
}

export function applyArticleReadDeals(state: Deal[]): Deal[] {
  return state;
}
