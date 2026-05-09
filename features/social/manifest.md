# Feature: social

Community events, sharing, friends.

## Commands
`ShareSession`, `CreateEvent`, `PostComment`

## Events
`SessionShared`, `EventCreated`, `CommentPosted`

## Projections
`shared_sessions`, `event_directory`, `friend_activity`

## Queries
`getEventDirectory`, `getFriendActivity`, `getSharedSession(id)`

## Dependencies
- `core/events`, `core/computation`, `shared/contracts`
- Reads from `data/repositories` and `data/projections/views`
- No direct UI imports
