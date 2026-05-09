# Feature Store

A read-optimized store of computed features used as model inputs and as direct query sources for the Insights feature.

## Schema
```
feature_store(
  entity_type   text,    -- "user" | "exercise" | "session"
  entity_id     text,
  feature_name  text,
  value         json,
  computed_at   timestamp,
  pipeline_ver  text,
  PRIMARY KEY (entity_type, entity_id, feature_name)
)
```

Features are recomputed by pipelines, never written by hand.
