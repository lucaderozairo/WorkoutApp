# Widget Patterns

Composed reusable widgets. Each binds to a feature query and renders the result.

## Dashboard widgets
- `SleepWidget` — binds to `readiness.getLastNightSleep` + `getSleepHistory(7)`
- `ConditionsWidget` — binds to `conditions.getCurrentConditions` + `getSuitability(*)`
- `ScheduleWidget` — binds to `scheduling.getScheduleForDay(today)`
- `RecentActivityWidget` — binds to `training_log.getRecentLiftSessions` + `cardio.getRecentCardioSessions` (merged + sorted)
- `NewsAndDealsWidget` — binds to `news_feed.getHeadlines` + `getDeals`

## Shared widgets
- `MiniCalendar` — date picker, no data binding
- `StatsStrip` — generic metric row, no data binding
- `SportSelector` — drives sport selection state in `view_state`

Widgets dispatch user actions via the binding layer; they never call commands directly.
