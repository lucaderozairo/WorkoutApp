# Sync Worker

Background loop that drives `data/sync`. Runs continuously when sync mode is hybrid or live; on-demand when offline-only.

## Responsibilities
1. Drain `data/sync/outbox` → push to remote
2. Pull from remote → write to `data/sync/inbox`
3. Apply inbox events through normal event-store path
4. Update `data/sync/vector_clock`
5. Resolve conflicts via `data/sync/conflict`

## Cadence
- Foreground: every 30s
- Background (mobile): respects OS background-task limits
- Manual: triggered by user pull-to-refresh
