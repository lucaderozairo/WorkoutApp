# Migration Plan: current → architecture_suggested.md
## Phase 1 — System Layer & Error Handling
- Create `core/errors/ErrorBoundaryRoot.tsx`, `core/errors/DomainErrorBoundary.tsx`
- Create domain boundaries: `WorkoutBoundary`, `SocialBoundary`, `MessagesBoundary`, `HealthBoundary`, `AnalyticsBoundary` at `ui/components/errors/`
- Convert `core/errors/domain_errors.md` + `infra_errors.md` → real TS error classes
- Create UX error components: `LoadingStates`, `EmptyStates`, `RetryActions`, `OfflineIndicators` at `ui/components/ux/`
- Create `core/telemetry/TelemetryLogger.ts`
- Restructure `app/registry/App.tsx`: wrap `<DataLayer>` + `<SyncEngine>` in `<SystemLayer>`, add `<ErrorBoundaryRoot>`, `<TelemetryLogger>`
- Add validation: `features/*/validation/` (WorkoutInputValidation, NutritionInputValidation, etc.)
- Add sync error handling: `ConflictResolver`, `RetryQueue`, `OfflineBuffer` at `data/sync/`
## Phase 2 — Desktop Navigation
- Refactor `ui/layouts/TabNavigation.tsx`: `<LeftNavBar>` + `<RightContent({TopBar, RouteOutlet})>`
- Remove `<RightContextPanel>`. Move `<TopBar>` inside `<RightContent>`.
- CSS updates in `styling/`
## Phase 3 — Workout Tab
- Split `<WorkoutViews>` → `<WorkoutNavigationLayer>` (wrapping `<DateNavigator>`) + `<WorkoutFilterLayer>` (`ActiveDateFilter`, `SessionTypeFilter`, `ExerciseFilter`)
- Simplify `<SessionView>` header (remove granular sub-components)
## Phase 4 — Health Unification
- **Delete** `features/nutrition/`, `ui/layouts/NutritionScreen.tsx`, `/nutrition` route, `Utensils` nav item
- Create `features/profile/domain/health/` with: `BodyMetrics`, `SleepTracking`, `InjuryTracking`, `NutritionTracking` (Macro, Calorie, Hydration, Caffeine, Supplement)
- Add `features/profile/domain/health/integrations/` (AppleHealthKit, Garmin, Whoop)
- Remove `NutritionTab` from Profile tabs — keep Overview, SharedSessions, Health
- Fold `/analytics` into Progress (update docs only; no separate layout exists)
## Phase 5 — Settings & Notifications Separation
- Remove `NotificationSettings` from `<Settings>` → Settings is now `<ThemeSettings> + <UnitSettings> + <DataManagement>`
- Create `features/notifications/` with `NotificationCenter`, `NotificationPreferences`, `NotificationRulesEngine`
- Wire into `<GlobalSystem>` and route table
## Phase 6 — Cleanup & Docs
- Schedule tab: remove `CalendarHeader` from tree
- Progress tab: remove `DrilldownPanel` from tree
- Update `app/registry/App.tsx` to new shell structure
- Update `TABS.md`, `router.md`, `README.md`, `LAYER_RULES.md`, `DECISIONS.md`
## Dependencies
P1–P5 parallel; P6 depends on all. Start with P1 (highest risk).