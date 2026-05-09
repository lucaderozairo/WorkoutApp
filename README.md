# Fitness App — Architectural Scaffold

This repository is the documentation-first scaffold for a fitness tracking application with the following tabs: **Dashboard**, **Log**, **Progress**, **Analytics**, **Social**, **Profile**.

The architecture is event-sourced with CQRS. Every layer has a single responsibility and depends only downward.

## Layer overview

| Layer | Responsibility | May depend on |
|---|---|---|
| `app/` | Composition, routing, lifecycle | everything below |
| `ui/` | Presentation, view state, bindings | `features`, `core`, `shared`, `styling` |
| `features/` | Business logic, commands, events, projections | `core`, `data`, `shared` |
| `data/` | Persistence, sync, event store, sources | `core`, `shared` |
| `core/` | Framework primitives, no UI, no features | `shared` |
| `shared/` | Types, utils, contracts | nothing |
| `plugins/` | Optional hot-pluggable modules | feature contracts |
| `styling/` | Design tokens, themes | nothing |
| `config/` | Environment + flags | nothing |

## Tab → feature map

- **Dashboard** — composition only. Reads from `readiness`, `conditions`, `scheduling`, `training_log`, `cardio`, `news_feed`.
- **Log** — `training_log`, `cardio`.
- **Progress** — `progress_analysis`, `insights`, `training_log`, `cardio`.
- **Analytics** — `progress_analysis`, `insights`. Same queries as Progress, different layout.
- **Social** — `social`, `scheduling`.
- **Profile** — `profile`, `readiness`.

See `app/navigation/router.md` for the route table.
