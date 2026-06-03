// Public contract for the news_feed feature.

// Domain events this feature publishes.
export type { NewsFeedEvent } from './domain/types';

// Commands this feature accepts.
export type { NewsFeedCommand, RefreshFeed, MarkArticleRead } from './domain/types';

// Domain types consumed by data sources and screens.
export type { Headline, Deal } from './domain/types';
