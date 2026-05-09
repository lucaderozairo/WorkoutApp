# Metrics

In-process counters, gauges, histograms exported to a metrics sink.

## Standard metrics
- `event_published_total{type}` (counter)
- `command_duration_seconds{name}` (histogram)
- `projection_lag_seconds{name}` (gauge)
- `sync_outbox_depth` (gauge)
- `ui_render_time_seconds{screen}` (histogram)
