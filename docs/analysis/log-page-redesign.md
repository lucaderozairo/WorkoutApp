# Log Page Redesign — Workout Logging Form

## Goal
Redesign `ui/layouts/LogScreen.tsx` around a cleaner session-logging form that:
- uses the styleguide primitives (`.surface`, `.column`, `.row`, `.pill`, `.badge`, `.tabs`, `.form`) exclusively — no inline styles, spacing via `gap` on parents
- matches the recently-refreshed dashboard visual language (recharts-era card hierarchy, accent surfaces)
- exposes domain payloads the current UI silently drops (`sessionRpe`, `tags`, block `notes`, per-set `comment`, `isPR`)
- keeps category-specific inputs (strength / cardio / mobility) legible instead of packed into one 9-column grid

## Scope
In scope: `ui/layouts/LogScreen.tsx` and any new pieces it pulls in under `ui/components/log/`. Styling additions go in `styling/styleguide.css` when a new primitive is genuinely reusable; otherwise compose existing classes.

Out of scope: domain/command changes in `features/training_log/*`, the Plans sub-tab, cardio GPS import flow, rest-timer/plate-calculator logic (only their placement moves).

## Problems in current screen
1. `<form>` wraps the entire session — Enter inside any input can submit; Begin/Pause/Save are `<button>`s without `type="button"` inside the form.
2. `SetInputRow` uses a `.set-row-grid` with 8+ columns that is the same for strength and cardio; cardio gets 5 empty `<div/>` spacers.
3. Finish (`handleSave`) calls `FinishSession` with no `sessionRpe` or `tags`, even though the payload supports them and the `exerciseSummaries` pipeline needs them for progression/insights.
4. Tools (rest timer, plate calc) render inline between blocks when toggled — they shove the block list around.
5. No exercise search / recent-exercise picker; `AddExercisePanel` is a free-text input + category buttons at the bottom.
6. Block reorder / delete / notes buttons are present in markup but wired to nothing.
7. Session header tries to double as "draft workout" (name/date/time inputs visible even mid-session) — `sessionDate` / `sessionTime` state is never sent to any command.

## Inspiration: Hevy

Adopt these Hevy patterns (adapted to our styleguide + event-sourced domain):

- **Set table, not editor + history split.** Each exercise card shows one table where each row is a set — logged or planned. Columns: `SET # | PREVIOUS | KG | REPS | ✓`. The `✓` checkbox is what "logs" the set (dispatches `LogStrengthSet`); unchecked rows are editable drafts.
- **`PREVIOUS` column.** Reads the user's last performance for this exercise (from `exercise_progression` projection) and shows e.g. `100 × 5`. Tap to pre-fill the kg/reps inputs.
- **Set-type glyph replaces the number.** Warmup → `W`, dropset → `D`, failure → `F`; normal sets keep `1, 2, 3…`. Tap the glyph to cycle type (replaces our dropdown).
- **Per-exercise rest timer.** Each block stores a `restSeconds` default; checking `✓` auto-starts the dock timer with that value.
- **Full-screen exercise picker.** "Add exercise" opens an overlay with a search input, recent list, and muscle/equipment filter chips — not an inline panel at the bottom.
- **Superset grouping.** Adjacent blocks can be joined into a superset group rendered with a colored left border linking the cards; block-type `superset` drives this.
- **Minimal top chrome.** Session name inline-editable as plain text (no `<input>` border), timer as mono text, single primary `Finish` on the right. Date/time only surfaced if user taps the name.
- **Long-press / row menu on logged sets.** Opens actions: edit, mark PR, add comment, remove.
- **Auto-save feel.** No "Save" button on blocks — checking `✓` commits; unchecking reverts (follow-up: needs a `RemoveSet` command if not present).

## Target layout (pane structure)

```
┌─ Tabs (Strength | Plans) ──────────────────────────────────────┐
│                                                                 │
│ ┌─ SessionHeader (surface, sticky on scroll) ────────────────┐ │
│ │ [Name input]  [Date]  [Time]  ·  Timer  ·  [Begin/Pause]   │ │
│ │                             [Finish]  [Discard]            │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─ BlockList (column gap-4) ──────────────────────────────────┐│
│ │  BlockCard · exercise name, block-type pill, rounds stepper ││
│ │    ├─ LoggedSets (read-only rows: set#, load, flags)        ││
│ │    ├─ SetEditor (category-specific, see below)              ││
│ │    └─ Block notes (collapsible textarea)                    ││
│ │  BlockCard …                                                ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│ ┌─ AddExercise (surface dashed) ──────────────────────────────┐│
│ │ Search/pick from history · free-text fallback · category    ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│ ToolDock (floating, bottom-right): 🕒 Timer · 🏋 Plates · 📂 GPS│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Finish → FinishSessionModal (surface, overlay):
  Session RPE (1–10 chip strip) · Tags (chip multi-select) · Session notes
  → dispatches FinishSession with full payload
```

## Navigation mode: Carousel (one block per view)

Instead of a vertical list of `BlockCard`s, the session body becomes a horizontal pager where **each exercise is its own full-width page**. The currently-focused exercise owns the viewport; everything else collapses to a minimap.

### Why
- Logging attention is always on one exercise at a time — the list view forces scroll + re-find after every set.
- Larger, less-cramped `SetTable`: we reclaim the horizontal space that was padding between stacked cards.
- Natural phone-first pattern (swipe between exercises); still works on desktop with arrows + keyboard.

### Persistent chrome around the carousel
```
┌─ SessionHeader ─────────────────────────────────────┐
├─ ExerciseRail (chip strip, scrollable, sticky) ─────┤   ← overview / jump
│ [Squat ✓] [Bench ●] [Row ○] [Curl ○] [+]            │
├─ Page viewport (one BlockCard, full width) ─────────┤
│                                                      │
│    ◀   Back Squat  (2 of 5)              ▶          │
│    ──────────────────────────────                   │
│       SetTable …                                     │
│                                                      │
├─ PageDots · swipe hint ─────────────────────────────┤
└─ ToolDock (floating) ───────────────────────────────┘
```

### Rail (top minimap)
- Horizontal `.row` of small chips, one per block, scrolls horizontally if overflow.
- Chip states: `✓` all sets complete (green), `●` in progress (primary), `○` untouched (muted). Current chip has `.primary` outline.
- Tap a chip → jump carousel to that page.
- Trailing `+` chip → opens exercise picker overlay.

### Page (the focused BlockCard)
- Renders exactly the same `SetTable` + header + notes from the non-carousel design, but with more room (no neighboring cards competing).
- Top of page shows `◀ prev name`, centered `exercise name + (i of n)`, `next name ▶`. Clicking prev/next slides the pager.
- Keyboard: `←` / `→` to change page, `Space` to check the next unchecked set, `Esc` to close tool popovers.
- Swipe threshold: ~25% of viewport width or velocity-based fling.

### Superset handling
- When two or more blocks share `blockType: 'superset'` and are adjacent, they render as a **single page** with two stacked `SetTable`s and a shared rest-timer chip. The rail chips for those blocks render as a grouped pill `[Bench • Row]`.

### Completion / auto-advance
- When the last unchecked `✓` on a page is checked, show a subtle "next" affordance (toast + arrow pulse). Auto-advance is **opt-in** (profile setting) so users who like to review before moving on aren't jumped away.
- Finish-session CTA only activates when every page shows ✓ on its rail chip (soft-gate; can still Finish early).

### "Overview" page (optional v2)
- Extra trailing page showing a compact list view of all blocks — reorder, remove, add. Rail gets a `🗂` chip at the end for it. Lets power users fall back to list-mode thinking without leaving the screen.

### Desktop vs mobile (locked)
- **Mobile → carousel.** Session logging is assumed to happen on the phone app. Swipe is primary; rail chips scroll horizontally under the thumb; page dots at bottom. One exercise fills the viewport.
- **Desktop → list.** Wider screens get the full vertical list of `BlockCard`s (the Hevy-style layout from earlier in this plan). Extra width is spent on a more readable `SetTable`, not on whitespace around one card.
- **Breakpoint:** switch at `768px` (matches `styleguide.css` responsive tokens; confirm against `styling/responsive.md` during implementation).
- Same `BlockCard` / `SetTable` components render in both — only the outer container (`CarouselPager` vs `BlockList`) differs. Rail is mobile-only; desktop already shows everything.

### Implementation notes
- Use CSS `scroll-snap-type: x mandatory` + `scroll-snap-align: center` on child pages for native-feel paging without a carousel library.
- Track active index via `IntersectionObserver` (or `scrollend` event) so the rail chip highlights stay in sync with swipe.
- Keep block data flat in `session.blocks`; carousel is purely presentational — commands still dispatch per-block as today.

### Reordering (locked: explicit toggle, no accidental drag)
- Default: block order is **fixed**. No drag handles visible, no long-press-to-drag.
- A `Reorder` toggle button lives in the session header menu (⋯). Tapping it enters **reorder mode**:
  - Rail chips grow drag handles (≡) on each side.
  - Page content dims; the only interaction available is "move block left/right" via on-chip arrow buttons **or** drag.
  - On desktop list view: each `BlockCard` gets ▲ / ▼ buttons in its header (no drag).
  - Exit reorder mode with a prominent `Done` button — returns to normal logging.
- Rationale: prevents accidental reorder during sweaty / one-handed logging while keeping the capability one tap away. Needs a new `ReorderBlocks` command in `features/training_log`.

### Locked decisions (confirmed with user)
1. Auto-advance on set completion → **off by default**, profile toggle.
2. Rest timer → **session-global in ToolDock**; current page only supplies default duration.
3. Rail → **mandatory on mobile**, page dots secondary. Desktop doesn't use either (list view).
4. Desktop defaults to list, mobile to carousel. No user toggle.
5. Reordering is behind an explicit toggle; no always-on drag.

### Open tradeoff
- **Superset authoring** — grouping adjacent blocks into one page means reordering must keep grouped blocks contiguous. In reorder mode, a superset group moves as a unit; breaking a superset happens via the block's ⋯ menu (`Leave superset`), not via reordering.

## Component breakdown

### `SessionHeader`
- Pre-start mode: name input + date + time + `Begin` primary button.
- Active mode: read-only name/date, live timer pill, `Pause`/`Resume`, `Finish`, `Discard`. All `<button type="button">`.
- Not wrapped in a `<form>`. Each card inside the page is its own `<section className="surface">`.

### `BlockCard`
- Header: exercise name (h3) with ⋯ menu, "Add note" link, rest-timer chip (tap to change seconds), superset indicator bar on the left when grouped.
- Body is a single `SetTable` — no separate "editor" vs "history" split.
- Footer: `+ Add set` button.

### `SetTable` (Hevy-style, category-branched)
Shared grid: `[SET#] [PREVIOUS] [input-1] [input-2] [✓]`.
- **Strength columns**: `SET | PREV (e.g. 100 × 5) | KG | REPS | ✓`.
- **Cardio columns**: `SET | PREV | KM | MIN | ✓`.
- **Mobility columns**: `SET | PREV | REPS or SEC | — | ✓`.
- Unchecked row = editable draft (inputs focusable, tap `PREV` to autofill).
- Checked row = logged (inputs become read-only text, background tints green, dispatches command).
- `SET#` cell shows `W / D / F / N` glyph for non-normal types; tap to cycle.
- Long-press row → action menu: edit, toggle PR, comment, remove.

### `AddExercisePanel`
- Search input backed by `getRecentLiftSessions` / a new `recent_exercises` projection (TODO: query exists in `projections/` or add client-side dedupe for v1).
- Result rows (last-used date, category icon). Fallback: "Create `<query>`" chip with category selector.

### `FinishSessionModal`
- **Summary line** (duration, set count, PR count).
- **Compact exercise review list** — one row per block: `🏋 Back Squat · 3 sets · top 110×5 · 1 PR`. Scrollable if session was long. Tap a row → closes modal, scrolls/pages to that block so the user can edit before finishing. No separate edit mode needed — this is the same screen.
- RPE strip (1–10 chips, single-select, optional).
- Tag multi-select (chips) + free-text add.
- Session notes textarea (persisted via `UpdateSessionNote` before finish).
- `Save & Finish` dispatches `FinishSession` — **no confirmation step**; the modal itself is the confirmation.
- Finished sessions reopened from "recent sessions" use the same log screen with header label `Editing · <name>` and no Finish button; edits persist live.

### `SessionHeader` — additional state: SCHEDULED

Sessions pre-populated by `features/scheduling` / `features/training_plans` appear in PRE-START as a fourth state: `SCHEDULED`. Header shows:
- Session name (already set from the plan, inline-renamable)
- Scheduled date/time (editable via `UpdateSessionStartTime`)
- Pre-populated block list rendered in the body (from the plan's template)
- Primary CTA reads `▶ Start scheduled session` instead of `▶ Begin`

Starting a scheduled session dispatches `StartSession` with the existing name + `UpdateSessionStartTime` if the user changed the time.

### Finished-session editing route

Reopening a completed session uses a new route `/log/:sessionId` backed by an `editing_session` query (read-only projection keyed by session id). Header reads `Editing · <name>`, no Finish/Pause, Close button returns to recent-sessions list. Active-session projection stays dedicated to the in-progress session.

### `BlockCard` — notes affordance
Every block surfaces a `📝 Add a note` link in its header. Tapping opens an inline collapsible textarea that dispatches `UpdateBlockNote` on blur. Notes render as a `.caption` line under the exercise name when present. Applies in list view, carousel view, and the post-finish edit view.

### `ToolDock`
- Fixed-position floating chip strip: bottom-right (desktop), bottom-center above nav (mobile). Portaled so the pager's `overflow: hidden` doesn't clip it.
- Tools: Rest Timer, Plate Calculator, GPS Import. Only one popover open at a time; tapping the active chip closes it.
- **Rest timer is session-global.** Auto-starts on `✓` using the active block's `restSeconds` (from `SetBlockRest`). Popover peeks for 2s then collapses to the chip; chip shows live remaining (`🕒 0:47`) while running.
- Locked behavior: timer **keeps running** while the session is paused (rest time ≠ session time). Timer state is **not persisted** across reloads. **Single active timer** — no parallel timers for supersets in v1.
- Popover dismissal: tap outside, tap active chip, or Escape. Timer keeps counting regardless.
- Accessibility: `aria-label="Session tools"` toolbar, `aria-expanded` / `aria-controls` on each chip, focus trap into popover, live region announces auto-started timers.

## State / data flow
- Session state continues to come from `useQuery<ActiveSessionView>('active_session')`.
- Local UI state (modal open, tool popover open, set-editor draft values) lives inside each component; no new global store.
- `FinishSessionModal` owns draft `sessionRpe` / `tags` / `notes`; on submit it chains: (if notes) `UpdateSessionNote` → `FinishSession({ sessionRpe, tags })`.
- Add search recent-exercises by reading `viewStore.get('recent_lift_sessions')` and flattening blocks; if that view isn't client-side-available, add a `recent_exercises` projection read-only query as a follow-up ticket.

## Open questions (ask before implementing)
1. Mobility sets — do they flow through `LogStrengthSet` with just `reps`, or does `features/stretching` own them? Current `ExerciseCategory` includes `mobility` but there's no `LogMobilitySet` command.
2. Block reorder / remove — any existing command for it? If not, should this redesign stub the buttons or drop them?
3. Session draft date/time — is the intent to back-date a session (log yesterday's workout)? If yes, `StartSession` needs a `startedAt` override; if no, remove those inputs in pre-start mode.
4. Tag preset list — pull from user history, hard-code, or profile-level setting?

## Implementation order
1. **Extract** current inline components into `ui/components/log/` files (`SessionHeader`, `BlockCard`, `SetEditor`, `AddExercisePanel`, `ToolDock`, `FinishSessionModal`) without behavior change — baseline for diffing.
2. **Replace** `<form>` wrapper with plain `<section>`s; add `type="button"` to all buttons.
3. **Split** `SetEditor` by category; delete empty-div grid padding.
4. **Build** `FinishSessionModal`; wire `sessionRpe` / `tags` through `handleFinishSession`.
5. **Move** Rest Timer + Plate Calc + GPS Import into `ToolDock` popovers.
6. **Replace** `AddExercisePanel` free-text with recent-exercise search.
7. **Style pass**: audit for inline styles (should be zero), replace any leftover margins with parent `gap`, ensure `.compact` only on inner `.column`/`.row` (never on `.surface` itself).
8. **Responsive pass**: mobile collapses ToolDock to bottom sheet, BlockCard header wraps, SessionHeader becomes two rows.

## Domain prerequisites (blocks UI work)

The redesign depends on new commands in `features/training_log`. Detailed specs live in `plans/todo/training-log-commands.md`. Summary:

| Command | Purpose | UI trigger |
|---|---|---|
| `ReorderBlocks` | Reorder exercises within a session | Reorder toggle mode |
| `RemoveSet` | Remove a logged set (reverts `✓`) | Uncheck → confirm press + 5s undo toast |
| `UpdateSet` | Edit a logged set's values in place | Row menu → Edit / tap logged value |
| `SetBlockRest` | Persist per-exercise default rest seconds | Rest-timer chip on BlockCard |
| `UpdateSetComment` | Attach comment to a set (field exists, command missing) | Row long-press → Comment |
| `AddToSuperset` / `LeaveSuperset` | Group/ungroup adjacent blocks as a superset | Block ⋯ menu |
| `SwapBlockExercise` | Replace exercise on a block, preserve sets | Block ⋯ → Swap exercise |
| `CreateExercise` | User-added exercise in catalog | Picker → Create "…" |
| `RenameSession` | Inline rename via header | Tap session name |
| `UpdateSessionStartTime` | Edit started-at timestamp | Tap date/time in header |

Locked SetRow behavior (per discussion):
- **Edit in place** dispatches `UpdateSet`.
- **PR stays reducer-auto-detected** (no user-facing toggle).
- **Delete is explicit, two-step.** Unchecking a logged `✓` does *not* remove the set — it returns the row to `editing` state. Removal requires tapping an explicit `Delete` button (row menu or row trailing icon). First press shows a warning (`Delete set? Tap again to confirm`); second press within 3s triggers:
  1. **Optimistic hide**: row disappears from the table, `.compact` spacer left to prevent layout jump.
  2. **Undo toast** appears (5s): `Set removed · Undo`.
  3. If `Undo` tapped → row restored, no command dispatched.
  4. If 5s elapses (or user navigates away) → `RemoveSet` dispatched.
- The warning state self-clears after 3s without a confirmation press.

UI work should not start until these land in `features/training_log/domain/types.ts` and `features/training_log/commands/handlers.ts` with event-sourced reducers.

## Acceptance
- Zero `style="…"` attributes in the new code.
- `FinishSession` payload includes `sessionRpe` and `tags` whenever the user filled them.
- Strength set editor has no empty spacer cells; cardio editor has no weight/reps fields.
- Every button in the rendered tree either dispatches a command or has a wired local-state handler (no dead markup).
- Tools never push block content when opened.
- All spacing driven by `gap` on `.column` / `.row`; no margin utilities added.
