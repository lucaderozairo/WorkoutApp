# Architecture Decisions

Open decisions called out in the integration discussion. Update this file as each is resolved.

## D1 — Cardio: one feature or many?
**Status:** decided — single feature with sport discriminator
**Why:** sports share most of the shape (session, distance, time, route). Sport-specific fields (river level, elevation profile) live as optional payload fields and feature-specific projections. Split only if invariants diverge enough that the discriminator becomes a maintenance burden.

## D2 — Dashboard widget order and visibility
**Status:** open
**Options:**
  - (a) Hardcoded order, no customization (ship now, defer)
  - (b) `features/dashboard_layout/` with `WidgetReordered`, `WidgetHidden` events
  - (c) Pure view state, persisted locally only
**Recommendation:** (a) for v1, plan (b) once core tabs are stable.

## D3 — News & Conditions: full event-sourcing or read-through cache?
**Status:** decided — read-through cache
**Why:** we don't own this data. Full event-sourcing adds no value; refresh events are enough. Treat the upstream as a source and project the latest snapshot.

## D4 — View state vs. event-sourced state line
**Status:** decided
**Rule:** if losing it on restart is fine and no other client cares, it's view state. Otherwise it's an event. Modal open/close → view state. "User joined event X" → event.

## D5 — Annotations
**Status:** decided — event-sourced under `progress_analysis`
**Why:** users expect them to sync across devices and survive reinstalls.

## D6 — Insights compute location
**Status:** decided — `core/analytics/pipelines` (computation) + `features/insights/projections` (surfacing)
**Why:** compute is generic and reusable; surfacing is feature-specific.
