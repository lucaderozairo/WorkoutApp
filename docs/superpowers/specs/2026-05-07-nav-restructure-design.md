# Nav Restructure & Session Log Design

**Date:** 2026-05-07  
**Status:** Approved for implementation planning

---

## Context

The Workout tab currently opens the active workout logger (LogScreenV2). There is no quick way to browse past sessions from that tab. The Progress tab shows raw session history mixed with analytics. On mobile, the Schedule tab is a separate navigation stop. There is no notification entry point and settings is a modal with no URL.

This spec restructures the two primary tabs to give them clearer jobs, adds a notification icon, and gives settings a dedicated desktop route.

---

## Workout Tab (`/log-v2`)

### Purpose
The workout tab becomes the daily hub: start a session, see the week at a glance, and browse/filter past sessions.

### Layout (top to bottom)

#### 1. Schedule Strip (mobile only, hidden on desktop)

A horizontally-laid-out week strip anchored to the current week.

- **Header row**: Month + year label ("May 2026") left-aligned; `‹ prev` and `next ›` text links right-aligned to navigate weeks.
- **Day tiles**: 5–7 tiles (Mon–Sun), each showing abbreviated day name + date number.
  - **Today**: filled accent background (indigo), white text.
  - **Past day with a session**: tinted background (green for strength, amber for cardio); tapping navigates to `/sessions/:sessionId` for that day.
  - **Past day with a run**: shows "Run" as a text label in a muted colour (no emoji, no icon).
  - **Future / rest days**: neutral background, no indicator.
- Tapping any past session day navigates directly to the session detail screen.

#### 2. New Workout Button

Full-width primary CTA button. Opens a new session (existing behaviour).

#### 3. Filter Bar

A horizontally scrollable row of collapsed filter chips. The row does **not** span full width — chips are inline and scroll if they overflow.

**Chips:** Date · Type · Exercise

- Each chip shows a ▾ arrow when collapsed, ▴ when open.
- Tapping a chip expands a panel **below the chip row** (inline, not a drawer or modal).
- Only one panel open at a time; tapping the active chip collapses it.
- An active filter (non-default value selected) tints the chip with the accent colour.

**Date panel** — options: Last 7 days · Last 30 days · Last 3 months · All time. Single-select.

**Type panel** — options (text only, no icons): All · Strength · Run · Cycling · Swimming · Rowing. Single-select. "Strength" matches any session whose blocks are all strength category, regardless of the session name (Push Day, Pull Day, Leg Day, etc.).

**Exercise panel** — a search input. Typing filters to exercises logged in any session. Selecting one adds a chip tag; matched sessions show a confirmation badge. Clears when chip is dismissed.

#### 4. Session List

Chronological list of past sessions (newest first), filtered by active chip selections.

**Strength session card:**
- Title (bold, primary) + date (right-aligned, muted)
- Second line: `{n} exercises · {duration} min`
- No set count.
- Tapping navigates to `/sessions/:sessionId`.

**Cardio session card** (runs, cycling, etc.):
- Title + date
- Second line: distance · duration · pace (e.g. `8.2 km · 41 min · 5:00/km`)
- Visually distinguished with a warm tint (amber border/background) so cardio and strength sessions are scannable at a glance.

**Result count** shown above the list when filters are active: e.g. "3 sessions matched".

When the Exercise filter is active, each matched card shows a small badge confirming the exercise was included (e.g. "Bench Press ✓").

---

## Progress Tab (`/progress`)

### Purpose
Shows trends and progression grouped by session type, not a flat chronological dump.

### Layout

#### 1. Session Type Cards

Each unique session name the user has logged appears as a card:

- **Header row**: Session name (bold) + session count badge (e.g. "12×").
- **Sparkline**: small bar chart showing the volume trend across the last 5 sessions of that type.
  - Strength: total working volume (sets × reps × weight).
  - Cardio: distance.
- Label below sparkline: "Volume trend · last 5 sessions" or "Distance trend · last 5 runs".
- Tapping the card navigates to a filtered exercise history / detailed graph view for that session type.

Cardio types (Run, Cycling, etc.) appear as their own cards alongside strength session types. Their sparkline metric is distance.

#### 2. Detailed Graphs (existing)

Below the session type cards, the existing exercise history line graphs and PR markers remain unchanged.

---

## Notification Icon

A bell icon appears in the header adjacent to the settings icon on **both** mobile and desktop.

- **Mobile topbar**: bell icon to the left of the settings icon, both in the top-right cluster.
- **Desktop rail**: bell icon appears as an additional nav item or in the bottom icon cluster alongside settings.
- A red dot badge appears on the bell when there are unread notifications.
- Tapping the bell: for now, opens a placeholder notification panel/page (no notification data wired yet — badge and icon only as a UI scaffold).

---

## Settings — Desktop Route

On **desktop** (viewport > 780px):

- The settings icon in the rail links to `/settings` (a new route) instead of opening the modal.
- The `/settings` route renders a full-page layout of the existing SettingsModal content.
- The modal-based settings flow remains for mobile (no change to mobile behaviour).

---

## What Does Not Change

- LogScreenV2 active workout flow (starting, logging sets, finishing) — untouched.
- ExerciseHistoryScreen graphs.
- SessionDetailScreen.
- All other tabs (Home, Schedule, Nutrition, Social, Profile).
- Data model and command/projection layer.

---

## Verification

1. **Workout tab — session list**: Navigate to `/log-v2`; past sessions appear below the New Workout button in chronological order. Cardio and strength sessions both appear with correct card format (no set count).
2. **Schedule strip (mobile)**: At ≤ 780px, the strip shows the current week with the correct month header; prev/next navigates weeks; tapping a day with a session navigates to `/sessions/:id`.
3. **Filter bar**: Chips are inline and scroll; tapping "Type" opens the type panel with text-only options; "Strength" matches Push Day, Pull Day, Leg Day sessions; "Exercise" search filters the list and shows badges.
4. **Progress tab**: Session type cards appear grouped with sparklines; cardio types appear as separate cards.
5. **Notification icon**: Bell icon visible in mobile topbar and desktop rail; red dot badge present.
6. **Desktop settings route**: Navigating to `/settings` renders the settings page; rail settings icon links to `/settings`; modal settings still works on mobile.
