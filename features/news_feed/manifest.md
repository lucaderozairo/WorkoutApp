# Feature: news_feed

Fitness headlines and product/supplement deals. Read-only feed.

## Commands
`RefreshFeed`, `MarkArticleRead`

## Events
`HeadlinesFetched`, `DealsFetched`, `ArticleRead`

## Projections
`headlines`, `deals`, `unread_count`

## Queries
`getHeadlines`, `getDeals`, `getUnreadCount`

## Dependencies
- `core/events`, `core/computation`, `shared/contracts`
- Reads from `data/repositories` and `data/projections/views`
- No direct UI imports
