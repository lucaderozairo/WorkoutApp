# View State

Local UI state that does not belong in the event log.

## What goes here
- Selected tab within a screen
- Open/closed state of dropdowns
- Form draft values before submit
- Hover and focus states
- Modal stack (which modal is open and with what params)
- Sport/exercise selection within a session

## What does NOT go here
- Anything that should sync across devices (→ event-source it)
- Anything queryable from history (→ projection)
- Anything a feature needs to react to (→ event)

## Storage
View state is in-memory by default. A small subset is persisted to local storage so screens restore on app restart (active tab, last selected sport, scroll offsets).
