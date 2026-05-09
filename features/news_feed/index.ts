export type {
  Headline,
  Deal,
  NewsFeedState,
  NewsFeedEvent,
  NewsFeedCommand,
  RefreshFeed,
  MarkArticleRead,
} from './domain/types';

export { headlinesProjection, dealsProjection } from './projections';
export { getHeadlines, getDeals, getUnreadCount } from './queries';
export { handleRefreshFeed, handleMarkArticleRead } from './commands/handlers';
