---
name: legacy-integration-plan
overview: Integrate legacy tab functionality into the new FitTrack architecture (React+TS, CQRS/event-sourced, strict layer rules) by rewriting UI to new structure while reusing legacy algorithms/utilities where valuable. Clients tab is explicitly out of scope for now.
todos:
  - id: decide-legacy-scope
    content: Confirm migration style (rewrite UI, reuse logic) and exclude Clients tab (done).
    status: pending
  - id: audit-legacy-per-tab
    content: Extract per-tab capability list from `legacy/src/tabs/*` and associated component folders; map each to target features/commands/queries/projections.
    status: pending
  - id: fix-layer-violations
    content: Eliminate existing `ui -> data` and `features -> features/<other>` import violations before adding more migrated code.
    status: pending
  - id: migrate-foundation-utils
    content: Port durable legacy utilities (parsers, calculators, date helpers) into `core/` or feature modules with strict typing.
    status: pending
  - id: migrate-log
    content: Rebuild Log flow in `ui/layouts/LogScreen.tsx` backed by `features/training_log` + projections + commands.
    status: pending
  - id: migrate-progress-analytics
    content: Rebuild Progress + Analytics using shared queries; move series-building logic out of UI into features/core.
    status: pending
  - id: migrate-dashboard
    content: Rebuild widgets composition in Dashboard using readiness/conditions/scheduling/news_feed queries and commands.
    status: pending
  - id: migrate-profile
    content: Rebuild Profile sections with profile/readiness/progress_analysis queries and commands.
    status: pending
  - id: migrate-social
    content: Rebuild Social feed/composer against `features/social` + `features/scheduling` queries and commands.
    status: pending
  - id: verify-build-and-boundaries
    content: Run build + confirm layer boundaries (imports) after each major tab migration.
    status: pending
isProject: false
---

## Goals
- Migrate each legacy tab (Dashboard/Log/Progress/Analytics/Social/Profile) into the new repo’s **screen-per-tab** structure under `ui/layouts/`.
- Keep all new code compliant with `LAYER_RULES.md` and the aliases in `tsconfig.json`.
- **Rewrite UI** to new patterns, but **reuse legacy logic** where it’s durable: parsers (GPX/TCX), computations (1RM/standards), data-shaping helpers (grouping/filtering), and chart-series builders.
- **Do not integrate** the legacy `Clients` tab now.

## Non-negotiable constraints (from this repo)
- No UI library; custom CSS only in `styling/global.css`.
- Layer rules:
  - `ui/*` must not import `data/*`.
  - Features must not import other features.
  - UI should not import `features/*/commands/*` directly; dispatch via `ui/bindings`.

## Current state checkpoints (what we’ll correct during migration)
- `ui/bindings/index.ts` currently imports `@data/*` (violates `ui -> data`).
- `features/progress_analysis/domain/types.ts` imports `@features/training_log` (cross-feature violation).

## Migration strategy (repeatable playbook)
For each legacy capability we bring over:
- **Legacy UI → `ui/`**
  - Turn legacy tab/component into a screen (`ui/layouts/<Tab>Screen.tsx`) or a reusable pattern (`ui/patterns/...` if you decide to add that folder later).
  - Replace legacy local state/contexts with `useQuery` + `useCommand` bindings.
- **Legacy state mutations → `features/<name>/commands`**
  - Define commands and handlers for user actions (create/update/delete/reorder).
  - Emit domain events.
- **Legacy derived data → `features/<name>/queries` + projections**
  - Projections update view(s) in `data/projections/views` via feature projection functions.
  - Queries are the only read surface used by UI.
- **Legacy persistence/localStorage → `data/store` and/or `data/repositories`**
  - Replace direct localStorage usage with the event store / repositories.
- **Legacy utilities → `core/` or `shared/` depending on coupling**
  - Pure reusable computations → `core/` (if app-specific but feature-agnostic) or `shared/` (types/utils with no dependencies).
  - Feature-specific shaping stays within that feature.

## Explicit legacy-to-new mapping (from `legacy/STRUCTURE.md`)

### Legacy Contexts → new ownership (no more cross-cutting React Context state)
Legacy has multiple contexts that bundle state + persistence. In the new structure we split them as follows:

- **`WorkoutContext` (legacy)** → **feature-owned commands/events/projections**
  - **Session composition & workout logging** → `features/training_log`
    - Commands: start session, add block/exercise/set, update notes, finish/delete session, update historical session.
    - Events: session started/updated/finished/deleted, block added, set logged, note updated.
    - Projections/queries: active session view, session history list, “recent activity” slices.
  - **Cardio sessions + imports + stretching** → `features/cardio` (or keep cardio under `training_log` if you choose one unified activity feature later)
    - Commands: record/delete cardio, import GPX/TCX, record stretching.
    - Projections/queries: cardio history, per-sport summaries.
  - **Blueprints (save/load/delete)** → `features/training_log`
    - Commands: save-as-blueprint, load blueprint, delete blueprint.
    - Queries: list/search blueprints, “community” vs “saved” views.
  - **Injuries** → `features/profile` (canonical) + read access in `training_log` queries for warnings
    - Commands/events: record injury, update/resolve injury.
    - Queries: active injuries, injury→affected exercises, recommended alternatives (if you keep this behavior).
  - **Persistence (localStorage)** → `data/store` and `data/repositories` (event store + projections)

- **`SocialContext` (legacy)** → split across `features/social` and `features/scheduling`
  - Posts/likes/comments/composer validation → `features/social`
  - Events/joined-events → `features/scheduling`
  - “Pending workout share” becomes **a routed modal state** owned by UI; the selected session is read via queries.

- **`ThemeContext` (legacy)** → **UI view state** + tokens
  - Theme choice is view-state (persisted locally if desired) surfaced as `data-theme="..."` on the root element.
  - No feature owns theme; it must not leak into `features/*` or `data/*`.

### Legacy “Global Modals” → route-addressable UI + owning feature commands
Legacy global modals should become **addressable routes** under their parent screen (per `TABS.md`), with the data/side-effects owned by features:

- **SettingsModal** (appearance, data mgmt, dev tools)
  - Route: `/profile/settings` (or `/settings` if you prefer truly global)
  - Commands/events:
    - Theme/unit preference → `features/profile` (unit) + UI view-state (theme)
    - Data export/import, demo load, clear data → `data/store` commands behind a UI “admin” panel (keep UI calling a feature-level command wrapper; avoid `ui -> data`).

- **Share modals** (session/workout/run share)
  - Routes:
    - `/log/share/session/:id`
    - `/log/share/workout/:id`
    - `/progress/share/run/:id` (or `/progress/share/activity/:type/:id`)
  - Owner: `features/social` command (e.g. `ShareSession`) that accepts an activity snapshot (read via queries).

- **Progress detail sheets** (edit session, full workout, session popup, run modal)
  - Routes:
    - `/progress/session/:id`
    - `/progress/session/:id/edit`
    - `/progress/workout/:id`
    - `/progress/run/:id`
  - Owner: edits/deletes/copies are `features/training_log` / `features/cardio` commands; UI route state only controls what is open.

## Tab-by-tab integration map

### Dashboard (legacy: `legacy/src/tabs/DashboardTab.jsx`, widgets under `legacy/src/components/widgets/`)
- **Target UI**: `ui/layouts/DashboardScreen.tsx`
- **Primary features involved** (already scaffolded in this repo per `README.md`/`TABS.md`):
  - `features/readiness` (SleepWidget/Readiness)
  - `features/conditions` (ConditionsWidget)
  - `features/scheduling` (ScheduleWidget + appointments + joined events)
  - `features/training_log` + `features/cardio` (RecentActivityWidget)
  - `features/news_feed` (NewsAndDealsWidget)
- **Legacy-to-new mapping**
  - Appointment CRUD + reorder (legacy is local component state) becomes **event-sourced** in `features/scheduling`.
  - “Day detail sheet” and modal state becomes UI view-state (per `TABS.md` notes), but its data comes from queries.
- **Deliverable**: Dashboard renders the new widgets using only feature queries + bindings; no `data/*` imports.

#### Dashboard legacy feature checklist (from `STRUCTURE.md`)
- SleepWidget: readiness + 7-day history
- ConditionsWidget: suitability + details
- ScheduleWidget: merged events + appointments + reorder + day drill-down
- RecentActivityWidget: flatten/dedupe latest activities (must be projection/query, not UI)
- NewsAndDealsWidget: headline/deal tabbing + detail view
- DayDetailSheet: daily schedule + activity drill-down + appointment CRUD
- EventDetailModal: join/leave event
- AppointmentModal: add/edit appointment

### Log (legacy: `legacy/src/tabs/LogTab.jsx`, `legacy/src/components/log/*`, plus blueprint browser)
- **Target UI**: `ui/layouts/LogScreen.tsx`
- **Feature ownership**
  - `features/training_log`: workout session composition, blocks, sets, save/schedule, delete/update.
  - `features/cardio`: cardio & stretching logging (if you keep it separate) or fold stretching under a dedicated feature later.
- **Key migrations**
  - Replace ad-hoc ID generation (`useRef(Date.now())`) with `core/id-generator.ts`.
  - Move workout structure manipulation (add/move/remove) into command handlers so UI remains thin.
  - BlueprintBrowser likely becomes part of `features/training_log` (commands: save/load/delete blueprint; queries: list/search).

#### Log legacy feature checklist (from `STRUCTURE.md`)
- Workout composition: exercises + blocks (superset/circuit/EMOM/AMRAP) + notes
- Tools: rest timer, plate calc, 1RM calc (calculations should move to `core/computation`)
- Injury warnings: banner reads from `features/profile` query
- Add cardio/stretching: dispatch to `features/cardio` commands
- BlueprintBrowser: saved + community browsing, search/filter, load, delete, import exercises

### Progress + Analytics (legacy: `legacy/src/tabs/ProgressTab.jsx`, `legacy/src/tabs/AnalyticsTab.jsx`, many `legacy/src/components/progress/*`)
- **Target UI**: `ui/layouts/ProgressScreen.tsx` and `ui/layouts/AnalyticsScreen.tsx`
- **Feature ownership**
  - `features/progress_analysis`: PRs, annotations, analysis-specific events, derived series.
  - `features/insights`: compute/surfacing split (per `DECISIONS.md` D6).
  - `features/training_log` + `features/cardio`: historical session sources.
- **Key migrations**
  - Keep Progress “feed vs analyse” as UI view-state (per `TABS.md`).
  - Migrate `useDateRange`, `useProgressData`, `useAnalyseSeries` logic into:
    - feature queries (data selection)
    - core computation helpers (date windows, bucketing) where reusable.
  - Ensure Analytics is not a wrapper that passes flags (per `TABS.md`); it should consume the same queries with different layout.

#### Progress/Analytics legacy feature checklist (from `STRUCTURE.md`)
- Feed mode: filter pills, grouped-by-date items, detail drill-down
- Analyse lift: scatter/percent modes, multi-exercise compare, sessions list
- Analyse cardio: metric picker, monthly progression chart, compare modes
- Date range selector + offsets (move date-window logic out of UI)
- Session editing/deleting/copy-to-log/save-as-blueprint flows
- Run details: splits/map/elevation/route playback (route parsing logic in `core`/`features/cardio`, rendering in UI)
- Annotations + insights chips: annotations are events in `features/progress_analysis`; insights compute split per `DECISIONS.md` D6

### Social (legacy: `legacy/src/tabs/SocialTab.jsx`, `legacy/src/components/social/*`)
- **Target UI**: `ui/layouts/SocialScreen.tsx`
- **Feature ownership**
  - `features/social`: posts, likes, comments, groups (if kept), composer validation.
  - `features/scheduling`: events/joined events.
- **Key migrations**
  - Replace seed constants (`ALL_POSTS`, `ALL_EVENTS`) with projections + repositories (even if local-only at first).
  - Composer “import session” flow should read sessions via queries (training_log/cardio) and emit a social command.

#### Social legacy feature checklist (from `STRUCTURE.md`)
- Feed: create/edit/delete post, like, comment
- Composer: import session(s) and auto-generate caption (caption generation logic belongs in `features/social`)
- Groups: group detail, recommended groups join toggle (keep as view-state until you decide to event-source it)
- Events: list + join/leave via `features/scheduling`
- Challenges: leaderboard view (initially projection-backed static data is fine; avoid UI-owned pseudo-db)

### Profile (legacy: `legacy/src/tabs/ProfileTab.jsx`, `legacy/src/components/profile/*`)
- **Target UI**: `ui/layouts/ProfileScreen.tsx`
- **Feature ownership**
  - `features/profile`: profile fields, unit preferences.
  - `features/readiness`: sleep views.
  - `features/progress_analysis`: PRs + annotations.
  - Achievements/goals: decide whether they live in `profile` or a dedicated feature later; start in `profile` unless the domain grows.

#### Profile legacy feature checklist (from `STRUCTURE.md`)
- Overview: profile header, stats summary, achievements
- Health: injuries CRUD + alternatives, health indicators (wearable metrics), bodyweight log, sleep section
- Nutrition: nutrition/supplement log
- PRs & goals: PR computation + tiers, goals progress
- History: activity feed drill-down

## Definition of done (per tab migration)
For each tab we migrate, we consider it “integrated” when:
- UI uses only `@ui/*`, `@features/*` (queries/types), `@shared/*`, `@core/*`, `@styling/*` imports (no `@data/*`).
- All mutations happen through `useCommand` bindings calling feature command handlers.
- All reads happen through feature queries returning view models (no UI-side flattening/sorting beyond trivial presentation).
- Legacy-only behavior is either (a) explicitly postponed, or (b) mapped to an owning feature with a command/query pair.

## Sequencing (safe incremental integration)
1) **Fix architecture violations first** so new work doesn’t build on bad edges.
   - Remove `ui -> data` dependency in `ui/bindings/index.ts` by routing reads through feature queries.
   - Remove cross-feature import in `features/progress_analysis/domain/types.ts` by moving shared types to `shared/types` (or duplicating a tiny enum temporarily) and/or event-based linking.
2) **Migrate foundation utilities** from legacy into the correct layer.
   - GPX/TCX parser, 1RM calculators, date helpers, achievement computations: place in `core/` or feature modules.
3) **Log tab first** (it produces most domain events, unblocks everything else).
4) **Progress/Analytics next** (consume log/cardio projections; migrate series builders).
5) **Dashboard** (pure composition once queries exist).
6) **Profile** (consumes readiness + progress_analysis).
7) **Social** (depends on scheduling join-events + share flows).

## Verification gates (per milestone)
- `npm run build` (ensures `tsc` strict + Vite build).
- Quick manual check per screen: load each route and confirm no runtime errors.
- Lightweight import audit: no `@data/*` imports from `ui/*`; no `@features/<other>` imports inside `features/*`.

## Output artifacts
- Keep `.code-review-graph/GRAPH.md` up to date as we migrate so reviewers can spot boundary regressions quickly.
