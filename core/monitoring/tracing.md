# Tracing

Distributed tracing across the event chain. Each user intent gets a `correlation_id` that follows it through commands, events, projections, and side effects.

Spans:
- `command:<name>`
- `event:<type>`
- `projection:<name>`
- `query:<name>`
- `ui:<screen>:render`

Exported to OpenTelemetry-compatible backends.
