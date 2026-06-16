# Log Page Redesign — Execution Plan

Single source of truth for *how* and *in what order* the redesign ships. Reads from:
- `plans/todo/log-page-redesign.md` — the design spec (what we're building).
- `plans/todo/training-log-commands.md` — domain additions (what the backend needs).

This file is the checklist. Work top-to-bottom. Do not skip phases — later phases assume prior acceptance tests pass.

---

## Conventions

- Every code change lands with tests in the same commit.
- Commit messages: `training_log: add RemoveSet command`, `ui/log: extract SetRow component`, etc.
- No inline `style=""` attributes. Spacing is driven by `gap` on parent `.column` / `.row`. `.compact` only on inner elements.
- Run `python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"` after any code file change so the knowledge graph stays current.
- Run the type-check + vitest suites at every phase gate. A phase isn't done until both are green.

---

## Phase 0 — Baseline

Goal: freeze the current state so we have a clean diff surface.

- [ ] Read current `ui/layouts/LogScreen.tsx` end-to-end and note any undocumented behaviors.
- [ ] Run existing test suites (`bun test` or `vitest run`); record current pass count.
- [ ] Create a snapshot of `LogScreen.tsx` output (optional screenshot if UI is running) for visual-diff later.
- [ ] Confirm `styling/styleguide.css` has the classes we plan to reuse: `.surface`, `.surface.accent`, `.surface.dashed`, `.column`, `.row`, `.pill`, `.pill.primary`, `.badge`, `.value`, `.caption`, `.tabs`, `.set-row-grid`. Flag any missing before Phase 2.

**Acceptance**: zero test regressions introduced; list of missing styleguide primitives documented.

---

## Phase 1 — Domain (critical path, blocks all UI)

Goal: all new commands land in `features/training_log/`, existing ones lose their "active only" guard. Reducer + replay tests pass.

Order matters — later commands depend on schema changes from earlier ones.

### 1.1 Schema extensions
- [ ] Add `restSeconds?: number` to `Block` in `domain/types.ts`.
- [ ] Add `supersetGroupId?: Id<'SupersetGroup'>` to `Block`; add the ID brand to `shared/types.ts`.
- [ ] Verify existing projections still type-check (new fields are optional, should be additive).

**Deferred** (blocked on future exercise-catalog plan): `Exercise` type extension, `Muscle`/`Equipment` unions, `source` discriminator, `CreateExercise` command, `SwapBlockExercise` command.

### 1.2 Drop "active only" guards (post-finish editability)
- [ ] Audit every handler in `commands/handlers.ts` for `status === 'active'` checks.
- [ ] Remove the guard wherever it exists; confirm `SessionFinished` still blocks re-finishing.
- [ ] Add a replay test: apply `SessionFinished` then `LogStrengthSet`; confirm the set lands and session stays `finished`.

### 1.3 Commands (build in this order; each ships with tests)
- [ ] `SetBlockRest` — clamp `[0, 600]`, emit `BlockRestSet`.
- [ ] `RemoveSet` — hard-remove + renumber + PR recompute.
- [ ] `UpdateSet` — optional fields, merge, re-run PR detection.
- [ ] `UpdateSetComment` — writes to `StrengthSet.comment`.
- [ ] `RenameSession` — trim, reject empty.
- [ ] `UpdateSessionStartTime` — reject `startedAt > finishedAt` when finished.
- [ ] `ReorderBlocks` — full permutation, superset-contiguity validation.
- [ ] `AddToSuperset` / `LeaveSuperset` — contiguity enforcement, auto-ungroup on orphan.

Deferred to catalog plan: `CreateExercise`, `SwapBlockExercise`.

For each: command+event types, reducer branch, handler export in `index.ts`, `TrainingLogCommand` / `TrainingLogEvent` union extension, vitest cases (happy path, rejection, event replay parity).

### 1.4 Queries / projections
- [ ] Add `editing_session` query — read-only view of a historical session by id. Used by `/log/:sessionId` route.
- [ ] Confirm `exercise_progression` recomputes correctly on `SetRemoved` / `SetUpdated` replay (test: log → replay → remove → replay, compare to direct command path).
- [ ] Add `recent_exercises` projection: derives distinct exercises from `BlockAdded` events, keyed by normalized `exerciseName` + `exerciseCategory`. Tracks last-used timestamp + session count. Powers picker Frequent/Recent sections.

### 1.5 Phase gate
- [ ] All new commands exported from `features/training_log/index.ts`.
- [ ] Full vitest suite green.
- [ ] Event replay tests green — no existing stream breaks.
- [ ] No UI code touched yet.

---

## Phase 2 — UI primitives (shared, build bottom-up)

Goal: every leaf component the layouts need, with local state + command dispatch wired. Nothing rendered into `LogScreen.tsx` yet; build in isolation under `ui/components/log/`.

Create the folder structure from the redesign plan:
```
ui/components/log/
├── hooks/
├── tools/
└── (components)
```

### 2.1 Hooks
- [ ] `hooks/useSessionTimer.ts` — lift-and-shift from `LogScreen.tsx`. Preserve pause/resume API.
- [ ] `hooks/useLastPerformance.ts` — reads `exercise_progression`, returns `{ weightKg, reps } | null` for an exerciseId. Memoize per exerciseId.
- [ ] `hooks/useActiveBlockIndex.ts` — IntersectionObserver for the carousel pager; returns current index + `scrollTo(i)`.
- [ ] `hooks/useConfirmPress.ts` — wraps a button in the 2-press confirmation pattern (first press sets warning state, auto-clears after 3s).
- [ ] `hooks/useUndoToast.ts` — exposes `enqueue({ message, onExpire, onUndo })` backed by the global UndoToast slot.

### 2.2 SetRow + supporting primitives
- [ ] `SetTypeGlyph.tsx` — cell that renders `1/2/…` or `W/D/F/G/E/A`; tap cycles via `ChangeSetType`.
- [ ] `SetRow.tsx` — the state machine from the design plan (empty / typing / logged / editing / confirm-delete / hidden). Owns local draft values. Dispatches `LogStrengthSet` / `UpdateSet` / `RemoveSet` at the right transitions.
- [ ] Unit tests: state transitions, validation guards (✓ disabled until both fields parse > 0), undo-toast flush on unmount.

### 2.3 SetTable
- [ ] `SetTable.tsx` — grid layout with category-aware columns. Renders logged `SetRow`s + one trailing draft `SetRow`.
- [ ] `AddSetButton.tsx` — appends a new draft row.
- [ ] Cardio variant: same state machine, distance/duration inputs.

### 2.4 BlockCard
- [ ] `BlockCard.tsx` — header (name, ⋯ menu, rest chip, superset left-bar when grouped), body (`SetTable`), footer (`AddSetButton`), collapsible block notes (dispatches `UpdateBlockNote` on blur).
- [ ] Block ⋯ menu items: Rename/Swap exercise, Add/Leave superset, Set rest default, Delete block.

### 2.5 Exercise picker
- [ ] `ExercisePickerModal.tsx` — search + filter bar + tri-section list (Frequent / Recent / All) + multi-select footer + inline "Create new" sub-form.
- [ ] `PickerFilterBar.tsx` — muscle / equipment / category chips; mobile collapses to a bottom-sheet.
- [ ] Debounced search (~100ms). A–Z jump rail on desktop.
- [ ] On commit: fires one `AddBlock` per selected exercise in tap order; `+ Create` dispatches `CreateExercise` then adds.

### 2.6 Modals + toast
- [ ] `FinishSessionModal.tsx` — summary line, compact review list (tap row → close + scroll/page to block), RPE strip, tags chips, notes textarea. Dispatches `UpdateSessionNote` then `FinishSession`. No confirm step.
- [ ] `UndoToast.tsx` — global slot, stacks pending deletes, flushes on navigate away.

### 2.7 Session header
- [ ] `SessionHeader.tsx` — four states: PRE-START, SCHEDULED, ACTIVE, PAUSED, FINISHED (editing). Inline rename (dispatches `RenameSession`), editable date/time (dispatches `UpdateSessionStartTime`).
- [ ] Sticky positioning; mobile two-row collapse.
- [ ] ⋯ menu per state.

### 2.8 Tool dock
- [ ] `ToolDock.tsx` — portaled, fixed-position chip strip. Manages `openTool` + timer state.
- [ ] `tools/RestTimerPopover.tsx` — auto-starts from `onSetLogged` callback using block's `restSeconds`. Keeps running when session paused. 2-second peek then collapse.
- [ ] `tools/PlateCalcPopover.tsx` — lift existing logic.
- [ ] `tools/GpsImportButton.tsx` — opens existing `ImportModal`.

### 2.9 Reorder mode
- [ ] `ReorderToggle.tsx` — context provider exposing `isReordering` + `toggle()`. Used by `ExerciseRail` and `BlockList` to swap into reorder UI.
- [ ] Reorder UI on desktop: ▲/▼ per `BlockCard`. On mobile: per-chip ≡ handles in `ExerciseRail`.
- [ ] Done button dispatches `ReorderBlocks` with the final `blockIds[]`.

### 2.10 Phase gate
- [ ] All components exported from `ui/components/log/index.ts`.
- [ ] Every component has its own test file covering local state transitions and command-dispatch paths.
- [ ] No cross-imports from `LogScreen.tsx` yet — components standalone.

---

## Phase 3 — Layout orchestration

Goal: wire the primitives into mobile carousel and desktop list; replace `LogScreen.tsx` contents.

### 3.1 Layout wrappers
- [ ] `BlockList.tsx` — vertical stack of `BlockCard`s with `gap-4`, trailing `AddBlockButton`.
- [ ] `CarouselPager.tsx` — CSS `scroll-snap-type: x mandatory` container; takes children + activeIndex. Uses `useActiveBlockIndex`.
- [ ] `ExerciseRail.tsx` — horizontal chip strip above pager. Chip states: ○ / ● / ✓. Tap → pager jumps. Grouped chip for supersets.
- [ ] `PageDots.tsx` — bottom indicator on mobile carousel.

### 3.2 Route wiring
- [ ] Register `/log/:sessionId` in `app/navigation/router.md` (or wherever routes live in `app/navigation`). Backed by `editing_session` query.
- [ ] `LogScreen` reads route params; mode = `new | active | editing`.
- [ ] "Recent sessions" list → tap session → navigates to `/log/:sessionId`.

### 3.3 LogScreen rewrite
- [ ] Shrink `ui/layouts/LogScreen.tsx` to an orchestrator (~40 lines):
  - reads `active_session` or `editing_session` based on route
  - picks `BlockList` vs `CarouselPager` via `useMediaQuery('(max-width: 767px)')`
  - mounts `SessionHeader`, content wrapper, `ToolDock`, modals (picker, finish, undo toast) at the root
- [ ] Delete all the inline components now extracted to `ui/components/log/`.

### 3.4 Scheduled sessions wiring
- [ ] Query `features/scheduling` for a scheduled session matching "today" (or the selected route).
- [ ] If present and no active session exists, mount SessionHeader in SCHEDULED state with pre-populated blocks from the plan template.
- [ ] `▶ Start scheduled session` dispatches `StartSession` + optional `UpdateSessionStartTime`.

### 3.5 Phase gate
- [ ] Manual QA on mobile viewport (≤ 767px) and desktop (≥ 1024px).
- [ ] All interactions from the design plan tested in a browser.
- [ ] No dead markup; every rendered button either dispatches or handles local state.

---

## Phase 4 — Polish

### 4.1 Style audit
- [ ] Grep for `style=` in `ui/components/log/` and `ui/layouts/LogScreen.tsx` — must be zero hits.
- [ ] Grep for `margin` / `margin-top` / etc. added in this changeset — replace with parent `gap`.
- [ ] Confirm `.compact` usage only on inner elements, never on `.surface` directly.

### 4.2 Responsive audit
- [ ] Mobile: SessionHeader collapses to 2 rows; ToolDock sits above nav bar; ExercisePickerModal is full-screen.
- [ ] Desktop: list renders; ToolDock pinned bottom-right; picker is a centered modal.
- [ ] Swipe threshold tuned on the pager (test with trackpad + touch).

### 4.3 Keyboard + a11y
- [ ] `←/→` change carousel page; `Space` checks the next unchecked set; `Esc` closes popovers/modals; `/` focuses picker search.
- [ ] Tab order linear through each `BlockCard`.
- [ ] `aria-expanded` / `aria-controls` on ToolDock chips.
- [ ] Live region announces auto-started rest timers and delete-undo toasts.

### 4.4 Finish cleanup
- [ ] Remove `useState<LogMode>('strength')` + `showCalc` / `showTimer` / etc. from the old `LogScreen.tsx` — they moved to ToolDock.
- [ ] Remove legacy `.set-row-grid` usage once `SetTable` replaces it everywhere (confirm no other consumers).
- [ ] Graph rebuild: run the graphify code rebuild after cleanup so the KG reflects the new module boundaries.

### 4.5 Phase gate
- [ ] Full test suite green.
- [ ] Browser manual test: create session from scratch, log sets with ✓, edit a logged set, delete one with undo, finish with RPE+tags, reopen finished session and edit, scheduled session start, reorder mode, superset add/leave, swap exercise.
- [ ] Move both plan files (`log-page-redesign.md`, `training-log-commands.md`, this file) from `plans/todo/` to `plans/completed/`.

---

## Acceptance (global)

- Zero `style=""` attributes in new code.
- `FinishSession` payload always carries `sessionRpe` / `tags` when the user set them.
- No empty spacer divs in set tables.
- Every rendered button either dispatches a command or has a local-state handler.
- Finished sessions editable via `/log/:sessionId`; active-session projection unchanged by reopening.
- `/log/:sessionId` route works standalone (direct URL entry hits the editing view).
- Tool popovers never push block content when opened.
- All spacing driven by `gap`; no margin utilities added.
- All new commands covered by reducer + replay tests; existing event streams replay unchanged.
- Rest timer survives session pause; doesn't persist across reload.

---

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Post-finish editability breaks replay invariants in unrelated features (progression, insights) | Replay-parity tests at Phase 1.2; run the full suite before moving on |
| Carousel scroll-snap flakiness on Safari / iOS | Tested early in Phase 3.1 on real device; fallback to buttons-only navigation if fling is unreliable |
| Undo-toast flush on navigation loses edits | `useUndoToast` registers a `beforeunload` + route-change hook that flushes pending commands synchronously |
| Scheduled-session wiring couples `training_log` to `scheduling` / `training_plans` | Keep the coupling in `LogScreen` orchestrator; shared components take pre-populated blocks as props, no feature import |
| `ReorderBlocks` with superset contiguity invariant rejects valid-looking UI states | UI disables the drop zone that would break contiguity; handler rejection is defense in depth, not primary UX |

---

## Open questions still to resolve

Carry into implementation; decide before the phase that needs them.

1. `RemoveSet` hard vs soft remove — currently hard. Confirm once insights/analytics are audited.
2. Cross-category `SwapBlockExercise` — currently rejected. Revisit if users report needing it.
3. Exercise-catalog source of truth — if the app doesn't ship with a global catalog yet, Phase 1.1 needs a seed data step (flag during 1.1).

---

## Phase summary

| Phase | Scope | Gate |
|---|---|---|
| 0 | Baseline capture | Tests recorded, primitives audited |
| 1 | Domain commands | Replay + unit tests green; no UI work |
| 2 | UI primitives | Components standalone, tested; not mounted |
| 3 | Layouts + routing | LogScreen rewritten; manual QA |
| 4 | Polish | Style/a11y audits; plans moved to completed |
