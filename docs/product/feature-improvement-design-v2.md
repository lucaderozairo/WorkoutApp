# Workout App Feature Improvement Design — v2
**Date:** 2026-06-09
**Status:** Active roadmap
**Supersedes:** `docs/product/feature-improvement-design.md`

---

## What Changed in v2

The original spec is a complete product backlog. This version adds:

1. **Execution phases** with a clear ordering rationale
2. **Cross-references** to existing implementation plans so work isn't duplicated
3. **Priority tiers** (P1/P2/P3) within each product section
4. **Architecture constraints** that apply to every plan derived from this spec
5. **Explicit scope gates** — features blocked on backend/platform deferred to named phases

---

## Architecture Constraints (apply to every plan)

Every implementation plan derived from this spec must obey the project's layering rules. These are enforced by ESLint in CI and are non-negotiable:

```
tokens → primitives → layouts → patterns → features → screens/pages
```

- No raw styled `<div>`/`<button>` in features — use atoms/molecules
- Feature → feature communication via `shared/contracts`, never direct imports
- UI reads projections via queries/bindings, never viewStore keys or projection internals directly
- All new handlers use the `defineCommand` + `CommandContext` pattern (see `2026-06-09-define-command-context.md`)
- All values must be token-driven (`var(--space-md)`, never `12px`)
- CSS nesting via `&` — never flat `.x:hover`

**Definition of Done (every plan):**
- `npx tsc --noEmit` → 0 errors
- `npx vitest run` → same or better pass count
- `npm run build` → success
- `npm run lint` → no new ESLint errors
- Graphify rebuild after code changes (see PowerShell command in original spec)
- Mobile (320 px) and desktop checked manually for UI changes
- Empty/loading/error states present on every new screen surface

---

## Execution Phases

### Phase 0 — Infrastructure Foundation
*Prerequisite for all feature work. No new features until complete.*

**Status:** ✅ Complete as of 2026-06-10. All 10 plans committed to master. Verified: `npx tsc --noEmit` (0 errors), `npm run lint` (0 issues), `npx vitest run` (181 passing), `npm run build` (success).

These plans already exist. Execute in order (each unblocks the next):

| Order | Plan | What it unblocks | Status |
|-------|------|-----------------|--------|
| 1 | `2026-06-09-error-taxonomy` | Clean type surface, removes dead ceremony | ✅ Done |
| 2 | `2026-06-06-event-repository` | Durable event storage for all new handlers | ✅ Done |
| 3 | `2026-06-06-c1-define-command-factory` | Typed command dispatch | ✅ Done |
| 4 | `2026-06-06-c3-typed-event-manifest` | Typed events, closes switch exhaustiveness | ✅ Done |
| 5 | `2026-06-06-c4-typed-query-stubs` | Typed projection reads in UI | ✅ Done |
| 6 | `2026-06-09-define-command-context` | Eliminates 19 applyAndStore closures | ✅ Done |
| 7 | `2026-06-03-architecture-rule-enforcement` | Lint enforcement in CI | ✅ Done |
| 8 | `2026-06-05-raw-element-elimination` | Arch compliance for atoms | ✅ Done |
| 9 | `2026-06-05-grid-first-layout-refactor` | Layout system compliance | ✅ Done |
| 10 | `2026-06-07-react-perf-fixes` | Stable render baseline | ✅ Done |

---

### Phase 1 — Core Loop Reliability
*Fix correctness and trust issues in the main session flow before adding features.*

**Status:** ✅ Complete as of 2026-06-10. All 5 plans committed to master.

Plans already exist — execute in order:

| Order | Plan | Effect | Status |
|-------|------|--------|--------|
| 1 | `2026-06-09-atomic-finish-session` | Session finish is one atomic commit, no partial state | ✅ Done |
| 2 | `2026-06-09-csv-import-via-events` | Imported data lives in event log, feeds achievements/insights | ✅ Done |
| 3 | `2026-06-09-achievement-evaluator-registry` | Extensible achievement conditions, no switch edits | ✅ Done |
| 4 | `2026-04-15-sleep-csv-import` | Sleep data flows into readiness | ✅ Done |
| 5 | `2026-05-07-nav-profile-tabs` | Profile/nav tabs reach production state | ✅ Done |

---

### Phase 2 — Trust & Data Integrity
*New plans needed. Trust is the highest-priority product requirement.*

**Problem:** The app shows precise numbers backed by no real data. Fix this before shipping analytics or coaching.

#### 2A: Readiness no-data state (P1 — specific bug to fix)

**Plan:** `2026-06-10-readiness-no-data-state`

Fix `useHomeScreen` — it falls back to `82` when `today_readiness` has no entry.

Required behavior:
- No entry → empty/no-data state with CTA to log
- Manual entry → label `manual`
- Wearable entry → label with source (e.g. `Garmin`, `HealthKit`)
- Mixed → show factor breakdown with per-factor source labels

Scope: `features/readiness/`, `ui/screens/home/useHomeScreen.ts`, home readiness widget.

#### 2B: Data provenance model (P2 — incremental, attach as you go)

**Plan:** `2026-06-10-data-provenance-model`

Add `DataProvenance` shape to `shared/contracts/provenance.ts`:

```ts
export type DataSourceKind = 'manual' | 'imported' | 'synced' | 'estimated' | 'mock';

export interface DataProvenance {
  source: DataSourceKind;
  provider?: 'garmin' | 'strava' | 'healthkit' | 'file' | 'app';
  confidence?: 'high' | 'medium' | 'low';
  importedAt?: number;
}
```

**Rule:** new plans in Phase 3+ attach `DataProvenance` to every data type they touch. No big-bang pass needed.

#### 2C: Route elevation/surface data integrity (P2)

Route planner must not render elevation or surface data it cannot back with real data.

**Plan:** `2026-06-10-route-data-provenance` (blocked on 2B)

Scope: `PlannedRouteMetrics` model, route planner stats panel, calorie estimate.

Required:
- Elevation: `real | estimated | unavailable` — label visible in stats panel
- Surface: `from_osm | estimated | unavailable`
- Calories: `estimated` always labeled
- Until real DEM/OSM data integration: hide elevation gain, show placeholder with `unavailable` state

---

### Phase 3 — Home as Daily Command Center
*Depends on Phase 2 (trust). No point showing numbers that aren't trustworthy.*

Plans already exist that partially cover this:
- `2026-04-14-core-feedback-loop` covers readiness → coaching → home loop

**New plans needed:**

#### 3A: Home screen module prioritization (P1)

**New plan:** `2026-06-10-home-module-priority`

Re-order default home layout:
1. Readiness score or no-data state (gated: Phase 2A complete)
2. Sleep summary + debt
3. Next planned workout
4. Last workout summary
5. Weekly volume/load (simple — one bar, not full chart)
6. Top coaching insight (if any)

Remove or demote: import/export actions, settings shortcuts, debug widgets.

Empty states required for every module. Empty states explain the next action; they do not imply data exists.

#### 3B: Widget personalization (P2)

**Plan:** `2026-06-10-widget-personalization`

Defer full drag-resize grid until Phase 3A is stable. First pass: add/remove only.

Goal-based defaults (strength / endurance / weight-loss / general / recovery) reorder widget list; they do not hide existing data.

---

### Phase 4 — Strength Training & Templates
*Depends on Phase 1 (atomic session finish). Template edits should go through event store.*

Plans partially exist:
- `2026-04-14-training-plans` — existing plan for training plan management

**New plans needed:**

#### 4A: Template management (P1)

**New plan:** `2026-06-XX-template-management`

Actions on saved templates:
- Rename, duplicate, delete, favorite (P1)
- Reorder exercises within template (P1)
- Edit template without starting a session (P1)
- Start from recent routine — suggest last 3 unplanned sessions as one-tap templates (P1)

Out of scope for first pass: template suggestions from training history.

#### 4B: In-session tools (P1)

**New plan:** `2026-06-XX-in-session-tools`

- Previous performance inline for each exercise (last session's sets/weight)
- Auto-rest timer start after logging a set (reuse existing rest timer, add auto-start toggle)
- Plate calculator accessible from set row (modal, no routing change)
- Progressive overload suggestion inline on exercise row (simple rule: +2.5 kg if all sets completed at target reps last session)

Out of scope for first pass: warmup set suggestions, RPE trend warnings, failure-pattern detection.

#### 4C: Exercise library foundation (P2)

**New plan:** `2026-06-XX-exercise-library`

Add `ExerciseLibraryEntry` shape in `shared/contracts/exercises.ts`. First-pass scope: id, name, aliases, primaryMuscles, movementPattern. Power exercise picker search and progress grouping across aliases.

Out of scope for first pass: mediaUrl, form guidance, substitution engine.

#### 4D: Progression and PRs (P2)

Build on existing 1RM/PR/plateau foundations:
- PR history view by exercise (linked from exercise history row)
- Estimated 1RM trend chart
- Volume trend by exercise

New plans needed for each. Existing plan `2026-04-14-analytics-depth` covers parts of this.

---

### Phase 5 — Progress & Analytics
*Depends on Phase 1 (import data in event store) and Phase 4 (more strength data).*

Plans already exist:
- `2026-04-14-analytics-depth`
- `2026-04-21-progress-tab-charts`

**Additional new plans needed:**

#### 5A: Re-enable progress navigation (P1)

**New plan:** `2026-06-XX-progress-nav`

Re-enable the progress tab in `app/registry/App.tsx`. Add deep links:
- Exercise row → exercise history
- Home training load widget → training load chart
- Session list → plan adherence view

#### 5B: Training load model (P2)

**New plan:** `2026-06-XX-training-load`

```ts
interface TrainingLoadPoint {
  date: string;
  acuteLoad: number;   // 7-day EWMA
  chronicLoad: number; // 28-day EWMA
  form: number;        // chronic - acute
  rampRate: number;    // week-over-week %
}
```

Surface in home widget (collapsed view) and progress screen (full chart).
Warn when ramp rate > 10% week-over-week.

#### 5C: Coaching insights (P3)

Depends on training load and readiness being trusted. Coaching remains a read-model consumer — it reads projections from readiness, training_log, nutrition and emits `InsightGenerated` events. Other features must not depend on coaching.

Rule-based only. No ML. Examples:
- Squat volume plateau (3 sessions same/less volume)
- 7-day load rising faster than 28-day base
- Sleep below personal baseline after hardest session of week

---

### Phase 6 — Cardio & Route
*Depends on Phase 2C (data integrity). Large scope — split into sub-plans.*

Plans already exist:
- `2026-04-14-gps-import` — covers GPX import

**New plans needed, in order:**

#### 6A: Route planner UX reorganization (P1)

**New plan:** `2026-06-XX-route-planner-ux`

Reorganize rail/panels around 5 workflow stages: **Plan → Edit → Inspect → Navigate/Export → Library**

On desktop: each rail item = one workflow stage.
On mobile: bottom sheet with same 5 stages.

This is a layout/UX plan. Do not add new data features in the same plan.

#### 6B: Route data model with provenance (P1 — after 2C)

**New plan:** `2026-06-XX-route-data-model`

Add `PlannedRouteMetrics` with `dataStatus` per field (from Phase 2C design). Update stats panel to show status labels inline, not in footnotes.

#### 6C: Route library (P2)

**New plan:** `2026-06-XX-route-library`

Filter saved routes by activity, distance, surface, tags, last used. Mark favorites. Duplicate + version route. Show data completeness before reuse.

#### 6D: Advanced route editing (P3)

Replot section, split, combine, reverse, out-and-back, loop, detour, simplify. All tools in an explicit "edit mode" — not visible in normal plan/inspect flow.

#### 6E: Native GPS recording (P3 — platform-gated)

Run/ride/walk/hike live recording. Requires platform permission design (iOS + Android/PWA). Block this until platform strategy is decided. Do not add a placeholder screen.

#### 6F: Device and service sync (Out of scope for now)

Strava/Garmin/Wahoo/HealthKit sync requires identity, privacy, and integration design decisions. Defer to a separate product decision.

---

### Phase 7 — Health & Recovery
*Depends on Phase 2A (readiness trust fix).*

Plans already exist:
- `2026-04-14-recovery-body-tracking`
- `2026-04-14-habits-system`

**New plans needed:**

#### 7A: Readiness factor breakdown (P1 — after 2A)

**New plan:** `2026-06-XX-readiness-factor-breakdown`

Show per-factor contributions in readiness view: sleep duration, sleep quality, HRV (when available), RHR (when available), soreness, mood, energy, recent training load. Each factor has a source label (see Phase 2B provenance model).

#### 7B: Sleep visualization (P2)

- Sleep stage visualization (if import provides stages)
- Sleep debt indicator
- Bedtime consistency score
- Recovery trend (7-day)
- Train / Maintain / Rest recommendation (rule-based, explainable)

#### 7C: Behavior journal (P3)

Daily log: alcohol, caffeine, late meal, stress, travel, illness, medication. Data feeds correlation insights only once ≥30 days of entries exist.

#### 7D: HealthKit integration (Platform-gated)

Read sleep/HRV/RHR/steps/workouts. Write completed sessions. Requires iOS platform design and permission UX. Block until platform strategy decided.

---

### Phase 8 — Planning & Scheduling
*Depends on Phase 4 (templates) and Phase 5 (training load).*

Plans already exist:
- `2026-05-07-activity-planning`
- `2026-05-07-planned-session-ux`

**Additional new plans needed:**

#### 8A: Recurring planned sessions (P2)

**New plan:** `2026-06-XX-recurring-sessions`

Repeat options: daily, weekly (specific days), every N days. Skip with reason. Drag/reschedule in week view.

#### 8B: Plan adherence tracking (P2)

**New plan:** `2026-06-XX-plan-adherence`

Track: completed / skipped / missed planned sessions. Current adherence rate. Weekly adherence. Plan streak. Expose in home widget and progress screen.

#### 8C: Adaptive training suggestions (P3)

Suggestions only — never silent plan mutations. Triggered by: readiness drop below baseline, missed 2+ sessions, plateau detection, injury flag. Each suggestion is an `InsightGenerated` event from the coaching domain.

---

### Phase 9 — Nutrition
*Low dependency on other phases. Can run in parallel with Phase 7/8.*

Plans already exist:
- Nutrition domain already has event-sourced structure

**New plans needed:**

#### 9A: Nutrition import improvements (P1)

**New plan:** `2026-06-XX-nutrition-import-review`

CSV import review screen: row-level validation, edit-before-save, duplicate detection, unsupported-field warnings. After `2026-06-09-csv-import-via-events` pattern is established — use same event-store routing.

#### 9B: Daily nutrition dashboard modules (P2)

Calories, protein, carbs, fat, hydration visible from home. User-configurable targets (macros, hydration, protein per bodyweight).

#### 9C: Training correlations (P3)

Under-fueled hard sessions, low protein during strength block, poor hydration on high-sweat days, caffeine timing vs sleep. Depends on Phase 5C (coaching insights) being wired.

#### 9D: Food database / barcode (Out of scope — standalone product decision)

---

### Phase 10 — Notifications
*Can run in parallel with Phase 7/8. Low risk, isolated domain.*

**New plan needed:** `2026-06-XX-notifications-event-sourced`

Route notifications through the event store:
- `NotificationCreated`, `NotificationRead`, `AllNotificationsRead`, `NotificationPreferenceUpdated`
- Preferences: PRs, plan reminders, rest timer, streaks, readiness drops, sleep debt, route weather, nutrition, weekly digest
- Deep link from every notification to the relevant screen

---

### Phase 11 — Social & Sharing
*Backend-gated. Do not add placeholders that imply the feature works.*

Before any social plan starts, the following must be decided:
- Identity model (user accounts, auth)
- Privacy model (what is visible to whom by default)
- Moderation policy
- Anti-cheat rules for leaderboards

First-pass social (no backend required):
- Shareable session summary image card (export only, no backend)
- Shareable route snapshot (export only)
- PR card export

Full social (requires backend — defer):
Friends, clubs, comments, reactions, challenges, leaderboards.

---

### Phase 12 — Athlete Mode Extensions
*Depends on Phase 3 (home personalization) and Phase 4 (strength tools) being stable.*

#### 12A: Training focus preference (P2)

```ts
type TrainingFocus =
  | 'strength' | 'cardio' | 'hybrid' | 'general_fitness'
  | 'bodybuilding' | 'powerlifting' | 'olympic_lifting'
  | 'running' | 'cycling' | 'triathlon' | 'mobility_rehab';
```

Stored in profile preferences. Changes widget defaults, coaching insight priority, progress chart defaults, notification defaults, empty-state CTAs, navigation emphasis. Does not hide data.

**New plan:** `2026-06-XX-training-focus-preference`

#### 12B: Sport-specific tools (P3 — one plan per sport)

Each sport extension is its own plan:
- Strength-first: program builder with blocks/mesocycles, progression models, plate math, Wilks/DOTS
- Powerlifting: meet calendar, attempt planner, fatigue tracking per lift
- Bodybuilding: weekly set targets by muscle, muscle heatmap, photo progress
- Running: race goal, pace plan, shoe mileage
- Cycling: FTP tracking, power curve, normalized power
- Triathlon: discipline distribution, brick workouts, race-distance templates
- Cardio-first: structured workout builder, HR/pace/power zones, threshold tests
- Mobility/rehab: routine builder, pain scale trends, ROM notes

Each is independent and can be implemented in any order after 12A.

---

## Revised Product Principles

**From original spec, kept:**
- Trust first — no metric that looks precise without real data
- Explainable over impressive — coaching insights must link to underlying data
- Deepen existing architecture, never bypass it
- Suggestions before mutations — adaptive training recommends, never silently changes

**Added in v2:**
- Phase-gate discipline — do not start Phase N+1 features until Phase N's trust/infra foundations are solid
- One domain per plan — plans that span multiple features are banned unless they are migration scaffolding
- Backend-gated features stay gated — no UI surface that implies a backend feature works when it doesn't
- Data provenance is additive — attach `DataProvenance` to new data, not to all existing data in a single pass

---

## Open Questions

1. **Platform strategy** — iOS native app, PWA, or Electron? Determines when HealthKit, GPS recording, offline maps, and device sync plans can be written.
2. **Identity** — What is the identity model? Required before social, sharing links, or cloud sync.
3. **Elevation data source** — DEM API choice (OpenTopoData, Mapbox Terrain, etc.) needed before route data integrity plan can be completed.
4. **Coaching rules authorship** — Who writes and maintains the rule set? Determines scope of Phase 5C.

---

## Out of Scope (confirmed)

| Feature | Reason |
|---|---|
| Replacing event-sourced architecture | Deepen, never bypass |
| AI-generated coaching without deterministic rules | Rule-based explainable insights first |
| Backend social infrastructure | Identity/privacy/moderation decisions required first |
| Real-time wearable sync | Platform-specific integration design required first |
| One universal scoring formula | Readiness/load must remain explainable per user |
| GPS native recording | Platform strategy required first |
| Food database / barcode | Standalone product decision |
| Implementing this spec in one pass | Split into plans per product area, per phase |
