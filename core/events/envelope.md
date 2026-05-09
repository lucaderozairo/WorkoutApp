# Event Envelope

Every event in the system is wrapped in a standard envelope.

```
{
  id:             UUID,         // unique event id
  type:           string,       // e.g. "training_log.SetLogged"
  version:        number,       // schema version of `payload`
  aggregate_id:   string,       // entity this event mutates
  aggregate_type: string,       // e.g. "exercise_session"
  ts:             ISO8601,      // wall-clock time of emission
  actor:          { type, id }, // user | system | plugin
  causation_id:   UUID?,        // event that caused this one
  correlation_id: UUID,         // groups events from one user intent
  payload:        object        // event-specific data
}
```

## Rules
- Envelopes are immutable once written
- `correlation_id` is propagated through any reactive chain
- `causation_id` lets us reconstruct cause/effect graphs
- `version` enables schema evolution; replays handle old versions via upcasting
