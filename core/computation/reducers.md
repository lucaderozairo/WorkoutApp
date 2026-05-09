# Reducers

Pure functions of the form `(state, event) → state`. Used by:
- Projection builders to derive views
- Aggregate repositories to rehydrate state from events
- Replay engine to rebuild any state from the log

## Rules
- No I/O, no clock, no random
- No mutation; return new state
- Total: must handle every event type the projection consumes
- Forward-compatible: unknown event versions return state unchanged with a warning
