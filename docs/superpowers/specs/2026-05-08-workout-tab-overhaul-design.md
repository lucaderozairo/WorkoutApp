# Workout Tab Overhaul — Design Spec
_2026-05-08_

## Context

The Workout tab needs a coherent end-to-end flow for logging and reviewing sessions. Currently: no persistent storage (sessions lost on refresh), no calendar views, a broken exercise filter, an empty-surface rendering bug, no in-place edit of completed sessions, and the "add session" entry point is a large always-visible card. This spec redesigns the tab for a GitHub Pages–compatible prototype backed by localStorage.

---

## 1. Add Activity Entry Point

**Trigger:** `＋ Add` button in the Workout tab header (top-right). Tapping toggles an inline picker section that slides in below the header; button label changes to `✕ Close`.

**Inline picker contents:**
- **3 sport chips** — defaults to Gym / Run / Cycle on first use. Each time a session is logged, that sport moves to the front; the 3 most-recently-used sports occupy the chips. The sport that falls off the 3 becomes reachable only via Other.
- **Other button** — opens a full-screen activity grid (see below).
- **Route row** — appears only when an outdoor sport is selected (Run, Cycle, Hike, Ski, Row, Surf, Kayak, Snowboard, Climb). Tapping opens the existing `RouteMap` component from `PlanWizard`. Route is optional.
- **Start Now** / **Plan** buttons:
  - Gym → Start Now launches the existing `WorkoutView` + `ExercisePicker` active session flow. Plan opens `StepGym` from `PlanWizard`.
  - Outdoor → Start Now creates a `CardioSession` with optional route pre-loaded. Plan opens `StepCardio`.

**Other — full activity grid** (`ActivityPickerOverlay`):
- Back button returns to inline picker.
- Search bar filters the grid in real time.
- Grid grouped by category: Recent (highlighted, up to 3) · Outdoor · Water · Gym & Fitness.
- Tapping an activity selects it, closes the overlay, and updates the inline picker with that sport selected.

**Sports & categories:**

| Category | Sports |
|----------|--------|
| Outdoor | Hike, Ski, Snowboard, Climb |
| Water | Swim, Row, Surf, Kayak |
| Gym & Fitness | Yoga, Boxing, Stretch, HIIT |
| (inline defaults) | Gym, Run, Cycle |

---

## 2. Upcoming Plans

`UpcomingPlans` strip sits between the inline picker and the session list. Planned sessions are read from and written to localStorage (key: `wapp_plans`). This fixes the current bug where plans disappear on page refresh. No changes to the existing `PlannedSession` data shape or `UpcomingPlans` component UI.

---

## 3. Session Storage (localStorage)

All session data persists to localStorage automatically. No user action required.

| Key | Contents |
|-----|----------|
| `wapp_sessions` | `TrainingSession[]` (gym) |
| `wapp_cardio` | `CardioSession[]` |
| `wapp_plans` | `PlannedSession[]` |
| `wapp_recent_sports` | `string[]` — ordered list of recently used sport keys |

On app init, state is hydrated from these keys. On session finish / plan create / plan delete, the relevant key is updated. No migration logic needed for prototype.

---

## 4. Session List & Filter Bar

Located below the `UpcomingPlans` strip. Contains:

### View toggle
Three tabs: **List · Month · Week**

### Type filter chips (all views)
Scrollable: All · Gym · Run · Cycle · Hike · Swim · Row · Ski · (others as sessions are logged). Applies across List, Month, and Week views — dots in the calendar grids reflect the active type filter.

### Time range sub-row (List view only)
All time · Past 7 days · Past 30 days

### Sort (List view only)
Dropdown: Newest first (default) · Oldest first

### Year headers (List view)
Sessions grouped by year with a sticky `"2026"` label between groups.

### Edit & Share buttons
Each session list item shows **✏️** (edit) and **↗️** (share/export) always visible — no long-press or swipe needed.

---

## 5. Calendar Views

### Month view
- Arrow buttons navigate prev/next month.
- 7-column grid (Mon–Sun). Days with sessions show a dot indicator.
- Type filter chip still applies (dots only appear for matching session types).
- Tapping a day shows that day's sessions in a panel below the grid.
- Panel has a **← Back** button to deselect and return to the grid.

### Week view
- Arrow buttons navigate prev/next week.
- Header: `Mon 4 May – Sun 10 May · 2026`
- 7-day strip with day number + dot indicator.
- Default selection: today.
- Tapping a day shows that day's sessions below with a **← Back** button.
- Days in the future are dimmed.

---

## 6. Bug Fixes

### Empty surface — no sets graph
**File:** `ui/layouts/LogScreen.tsx` ~line 812

The `<div className="surface">` wrapper renders even when `<MiniChart>` returns null (no logged sets). Fix: hoist the null check so the wrapper div is not rendered when `MiniChart` would return null.

```tsx
// Before
<div className="surface">
  <MiniChart sets={sets} />
</div>

// After
{sets?.some(s => s.w !== '—') && (
  <div className="surface">
    <MiniChart sets={sets} />
  </div>
)}
```

### Exercise filter — empty options
**File:** `ui/layouts/LogScreen.tsx` lines 1673–1677

`allExerciseNames` is derived from `exercisesBySession` which only covers the active session. Fix: derive from the full `sessionHistory` (all completed `TrainingSession` blocks), merged with `allExerciseNames` from active session if present.

---

## 7. Post-Activity Edit Modal (`SessionEditModal`)

Triggered by the ✏️ button on any session list item. New component at `ui/components/log/SessionEditModal.tsx`.

**Fields for gym sessions:**
- Title (text input, inline edit)
- Date & time picker
- Notes (textarea)
- Per-block set editor — weight / reps / done flag per set row
- Comments — append timestamped text comments (stored as `comments: { text: string, createdAt: number }[]` on the session)
- Media — `<input type="file" accept="image/*">`, stored as base64 strings in `media: string[]` on the session object. Max 5 images. Displayed as a small horizontal gallery in session detail.

**Fields for cardio sessions:**
- Title
- Date & time
- Distance (km)
- Duration (h:mm:ss)
- Notes
- Comments
- Media (same as above)

**Save** updates the session in localStorage and closes the modal. **Cancel** discards changes.

---

## 8. Export / Share

The ↗️ button on each list item opens the existing share/export flow from `FinishSessionModal` (JSON download + CSV download). No new export logic — just wire the existing `exportSessionEnvelope()` and `exportSessionCsv()` utilities to the list item button.

---

## Verification

1. **Add Activity flow:** Tap `＋ Add` → inline picker appears. Select Run → route row appears. Tap Other → overlay opens with search + categories. Select Hike → chips update, Hike now selected in inline picker.
2. **Recents persistence:** Log a Swim session. Refresh page. Tap `＋ Add` → Swim appears in the 3 chips.
3. **Plans persistence:** Create a planned session. Refresh page. `UpcomingPlans` strip still shows it.
4. **Session list:** Complete a gym session and a run. Both appear in list, newest first. Year header visible. Type filter correctly hides/shows each.
5. **Calendar — month:** Navigate to previous month. Dots visible on days with sessions. Tap a day with a session → panel appears with that session and a Back button.
6. **Calendar — week:** Tap a day with no session → panel shows empty state, not a blank surface.
7. **Empty surface fix:** Open a gym session with no logged sets. No blank box appears where the chart would be.
8. **Exercise filter:** Open filter bar, search for "Squat". Options drawn from full session history, not just active session.
9. **Edit modal:** Tap ✏️ on a past gym session. Edit title and add a comment. Save. Reopen — changes persisted.
10. **Media:** Attach an image in edit modal. Session detail shows it in the gallery. Refresh page — image still present.
11. **Export:** Tap ↗️ on any session → JSON download triggers.
