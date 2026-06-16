# Baseline — captured before Phase 1

## Tests
- Command: `bun run test` (vitest run).
- Pre-change state: **7 test files, 53 tests passing**, duration ~3.2s.
- Regression target: zero failures after each phase.

## Styleguide primitives (styling/styleguide.css)

**Present and reusable**:
- Surfaces: `.surface`, `.surface.row`, `.surface.grid`, `.surface.compact`, `.surface.stat`, `.surface.accent`, `.surface.interactive`
- Layout: `.row`, `.column`, `.row.center`, `.column.center`, `.row.space-between`, `.column.space-between`, `.row.compact`, `.column.compact`, align variants
- Buttons: `.primary`, `.secondary`, `.warning`, `button.ghost`, `button.icon`
- Pills: `.pill`, `.pill.primary`, `.pill.lift`, `.pill.run`, `.pill.cycle`, `.pill.swim`, `.pill.row_`, sleep pills
- Badges: `.badge`, `.badge.green`, `.badge.amber`, `.badge.coral`, `.badge.blue`
- Typography: `h1/h2/h3`, `.detail`, `.caption`
- Tabs: `.tabs`, `.tab`, `.tab.active`
- Modal: `.modal-overlay`, `.modal-overlay .surface`
- Grid helpers: `.auto-grid`, `.auto-columns`, `.grid.week`
- Map helpers: `.map-card`, `.map-200`, `.map-400`

**Missing / referenced by current LogScreen but undefined** (these render unstyled today):
- `.value` — used for numeric displays
- `.form` — used on the session form wrapper
- `.surface.dashed` — used on AddExercisePanel
- `.set-row-grid`, `.set-num-dot`, `.set-input-wrapper`, `.set-input-suffix` — set-row grid system
- `.set-miss-btn`, `.set-rpe-btn`, `.set-comment-btn`, `.set-remove-btn`, `.set-type-strip` — set-row buttons
- `.plate-*`, `.collar`, `.sleeve` — plate calculator
- `.expandable` — block expand animation
- `.tabs .tab` *(present)*, but `.tab` as a standalone button is not
- `.gap-0` — layout helper

**Implication for Phase 2 UI work**: the redesign's `SetTable` replaces `.set-row-grid` entirely, so we don't need to back-fill those. We *do* need to add `.value` and possibly `.surface.dashed` (or drop them in favor of existing primitives). Style gap to close as we build: numeric display class, tool dock popover container, reorder-mode highlight.

## Current LogScreen behavior notes
- `handleFinishSession` drops `sessionRpe` and `tags` — UI never collects them. ✅ confirmed in `handleSave`.
- `sessionDate` / `sessionTime` local state on the form is never sent anywhere. ✅ dead state.
- No `status === 'active'` guards in any handler — post-finish editability is unblocked at the handler layer. Only `handleFinishSession` checks `session.id === cmd.sessionId` (correct: prevents double-finish).
- `DeleteSession` uses status-guard via projection (not via handler code — projection derives state from events).
- `SetInputRow` and `BlockCard` are defined inline in `LogScreen.tsx` — extraction to `ui/components/log/` is pure refactor.
- `registerTrainingPlanProjections()` + `registerAdherencePolicy()` are called at module load (line 25–26). Keep that behavior intact when rewriting `LogScreen`.
- GPS import uses `ImportModal` from `@ui/components/ImportModal` — not in scope for redesign but needs to remain wired into `ToolDock`.

## Command surface (pre-change)
From `features/training_log/commands/handlers.ts`:
- StartSession, AddBlock, LogStrengthSet, LogCardioSet, FinishSession, DeleteSession, UpdateBlockNote, ChangeSetType, LogRPE, ToggleSetFailed, SetBlockType, SetBlockRounds

Validations: `weightKg >= 0`, `reps >= 1`, `distance >= 0`, `duration >= 1s`, `rpe in 1..10`, `rounds >= 1`, non-empty session and exercise names.

## Projections registered
- `active_session` (from `activeSessionProjection`)
- `session_history` (from `sessionHistoryProjection`)

Needed to add: `editing_session` (for `/log/:sessionId` route).

## Manifest claims vs reality
`features/training_log/manifest.md` lists these commands: `LogSet`, `UpdateSession`, `DeleteSession`, `CopyToLog`, `SaveAsBlueprint`, `StartSessionFromBlueprint`. **None of these actually exist in `handlers.ts`** — the manifest is out of date. Flag for update at the end of Phase 1.
