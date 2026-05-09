import type { NewsFeedEvent, Headline, Deal } from '../domain/types';
import { ProjectionBuilder } from '@data/projections/builders';
import { projectionRegistry } from '@data/projections/builders';
import {
  applyHeadlinesFetched,
  applyArticleRead,
  applyDealsFetchedHeadlines,
  applyDealsFetched,
  applyHeadlinesFetchedDeals,
  applyArticleReadDeals,
} from '../domain/reducers';

export const headlinesProjection = new ProjectionBuilder<Headline[], NewsFeedEvent>(
  'headlines',
  [],
  {
    HeadlinesFetched: applyHeadlinesFetched,
    ArticleRead: applyArticleRead,
    DealsFetched: applyDealsFetchedHeadlines,
  }
);

export const dealsProjection = new ProjectionBuilder<Deal[], NewsFeedEvent>(
  'deals',
  [],
  {
    HeadlinesFetched: applyHeadlinesFetchedDeals,
    ArticleRead: applyArticleReadDeals,
    DealsFetched: applyDealsFetched,
  }
);

projectionRegistry.register('headlines', headlinesProjection);
projectionRegistry.register('deals', dealsProjection);
