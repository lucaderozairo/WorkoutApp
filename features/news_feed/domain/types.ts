import type { Id, DomainEvent } from '@shared/types';

export interface Headline {
  id: Id<'Headline'>;
  title: string;
  source: string;
  url: string;
  publishedAt: number;
  isRead: boolean;
}

export interface Deal {
  id: Id<'Deal'>;
  title: string;
  brand: string;
  discountPercent: number;
  url: string;
  expiresAt: number | null;
}

export interface NewsFeedState {
  headlines: Headline[];
  deals: Deal[];
}

export type NewsFeedEvent =
  | DomainEvent<'HeadlinesFetched', HeadlinesFetchedPayload>
  | DomainEvent<'DealsFetched', DealsFetchedPayload>
  | DomainEvent<'ArticleRead', ArticleReadPayload>;

export interface HeadlinesFetchedPayload {
  headlines: Omit<Headline, 'isRead'>[];
}

export interface DealsFetchedPayload {
  deals: Deal[];
}

export interface ArticleReadPayload {
  articleId: Id<'Headline'>;
}

export interface RefreshFeed {
  type: 'RefreshFeed';
}

export interface MarkArticleRead {
  type: 'MarkArticleRead';
  articleId: Id<'Headline'>;
}

export type NewsFeedCommand = RefreshFeed | MarkArticleRead;
