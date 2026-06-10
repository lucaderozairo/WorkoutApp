import type { Result, Id } from '@shared/types';
import { ok } from '@shared/types';
import type { RefreshFeed, MarkArticleRead, NewsFeedEvent } from '../domain/types';
import { cryptoIdGenerator } from '@core/id-generator';
import { systemClock } from '@core/clock';
import { defineCommand } from '@data/define-command';
import { viewStore } from '@data/projections/views';
import { headlinesProjection, dealsProjection } from '../projections';
import { fetchNews } from '@data/sources/remote/news';

function applyAndStore(events: NewsFeedEvent[]): void {
  events.forEach(e => {
    headlinesProjection.apply(e);
    dealsProjection.apply(e);
  });
  viewStore.set('headlines', headlinesProjection.getState());
  viewStore.set('deals', dealsProjection.getState());
}

export const handleRefreshFeed = defineCommand<RefreshFeed, Result<void, string>>({
  execute: async (_cmd) => {
    const { headlines, deals } = await fetchNews();

    const headlinesEvent: NewsFeedEvent = {
      type: 'HeadlinesFetched',
      aggregateId: cryptoIdGenerator.next(),
      aggregateType: 'NewsFeed',
      timestamp: systemClock.now(),
      version: 1,
      payload: { headlines },
    };

    const dealsEvent: NewsFeedEvent = {
      type: 'DealsFetched',
      aggregateId: cryptoIdGenerator.next(),
      aggregateType: 'NewsFeed',
      timestamp: systemClock.now(),
      version: 1,
      payload: { deals },
    };

    const events = [headlinesEvent, dealsEvent];
    applyAndStore(events);
    return { events, result: ok(undefined) };
  },
});

export const handleMarkArticleRead = defineCommand<MarkArticleRead, Result<void, string>>({
  execute: async (cmd) => {
    const event: NewsFeedEvent = {
      type: 'ArticleRead',
      aggregateId: cmd.articleId as unknown as Id,
      aggregateType: 'Headline',
      timestamp: systemClock.now(),
      version: 1,
      payload: { articleId: cmd.articleId },
    };

    applyAndStore([event]);
    return { events: [event], result: ok(undefined) };
  },
});
