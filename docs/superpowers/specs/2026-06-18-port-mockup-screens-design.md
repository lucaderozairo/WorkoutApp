# Port mockup screens: Workout, Social, Profile

## Context

`docs/prototypes/home-port-mockup.html` is a high-fidelity, self-contained HTML
mockup of the Home tab: semantic markup, `@layer tokens, base, project` CSS
with design tokens (no inline styles, no hardcoded values), and realistic
sample content for a fictional user, Alex. It replaces the earlier raw
Figma-export wireframe (`docs/prototypes/mockup.html`, fixed for rendering
bugs in frame 1 and frame 6 separately) as the fidelity bar for new prototype
screens.

This spec covers porting the three remaining primary tabs — Workout, Social,
Profile — to the same fidelity and architecture, using
`docs/prototypes/figma template/*.png` as layout reference. Secondary/nested
screens (active workout session, session review/detail, settings) are
explicitly out of scope and deferred until after these three land.

## Goals

- Three new self-contained files: `workout-port-mockup.html`,
  `social-port-mockup.html`, `profile-port-mockup.html` in `docs/prototypes/`.
- Same architecture as `home-port-mockup.html`: `@layer tokens, base, project`,
  CSS custom properties for all values, CSS nesting (`&`), semantic class
  names, zero inline `style=`.
- Continue Alex's storyline with consistent invented sample data across all
  screens.
- No bottom nav bar, no cross-file linking — each file stands alone, matching
  `home-port-mockup.html`'s current scope (header + content only).

## Non-goals

- Active workout/session-in-progress screen
- Session review/detail screen
- Settings screen
- Wiring these prototypes into the real app (`ui/`, `features/`) — these are
  static design references only, not production components.

## Screen designs

### Workout (`workout-port-mockup.html`)

- Primary CTA: "Start Workout" button (full width, accent fill).
- Quick-action row: 3 tiles — Templates, History, Routes (icon + label,
  reusing the `.surface` + `.icon-box` pattern).
- "Upcoming Session" card: Alex's next planned session (e.g. "5 km Tempo
  Run", tomorrow 07:30) with Start / Reschedule buttons.
- "Last Sessions" list: extends the pattern already in `home-port-mockup.html`
  (icon-box, title, date, chevron, stat-tile-row) to 4-5 entries with varied
  session types (strength, run, etc.).

### Social (`social-port-mockup.html`)

- 3-way pill tabs: Feed / Groups / Events, JS-switched (same pattern as the
  existing 2-way `.tabs`/`.split-tabs-panel`, extended to a third option).
- **Feed panel**: "Share a workout" button, then 2-3 post cards (avatar,
  friend name, timestamp, text, like/comment row). Sample: Jamie finishing a
  10 km run, Priya hitting a bench-press PR.
- **Groups panel**: "Find a group" button + grid of group cards (icon, name,
  member count). Sample: Riverside Runners, Iron & Grit Lifting, Sunrise Yoga
  Collective.
- **Events panel**: "Browse events" button + list of event rows (icon, name,
  date, chevron). Sample: Saturday Parkrun, 5-a-side Football, Hill Sprint
  Session.

### Profile (`profile-port-mockup.html`)

- Header: avatar, "Alex Morgan", join date/handle, Edit button.
- "Health Data": 2-column grid (CSS grid, `repeat(2, minmax(0, 1fr))`) of 8
  metric pills (icon + label) — Steps, Heart Rate, Weight, Sleep, Calories,
  VO2 Max, Body Fat, Hydration.
- "Activity History": CSS-grid heatmap (weeks × days) using accent-opacity
  steps for intensity, built with a real grid instead of ~150 hand-placed
  divs (as in the original Figma export).

## Architecture notes

- Each file duplicates the token/base CSS block from `home-port-mockup.html`
  rather than extracting a shared stylesheet — matches the existing
  single-file prototype convention in `docs/prototypes/` (each file is meant
  to be opened standalone).
- New component classes (`.pill-tabs`, `.feed-post`, `.group-card`,
  `.heatmap`, `.heatmap-cell`, etc.) follow the same naming and nesting
  conventions as `home-port-mockup.html`'s existing classes (`.home-widget`,
  `.event-row`, `.check-row`, etc.).
- All spacing/color/radius/typography values come from the existing
  `--s-*`, `--surface-*`, `--ink-*`, `--r-*`, `--t-*` tokens already defined
  in `home-port-mockup.html`; no new raw values unless a genuinely new token
  is needed (e.g. heatmap intensity steps via `color-mix()` or opacity, same
  technique already used for `--color-sleep-rem` etc.).

## Already done (this session)

- Fixed frame 1 (Home) in `docs/prototypes/mockup.html`: widget card rows
  were collapsing to zero height because they combined `flex: 1 1 0` with
  `overflow: hidden` inside a parent with no definite height (the flex-basis
  auto-minimum-size rule zeroes out in that combination).
- Fixed frame 6 (Profile) in `docs/prototypes/mockup.html`: the "Health
  Data" grid was forced into a single column because `width: calc(50% - 5px)`
  combined with `padding: 10px` under default `content-box` sizing made each
  item wider than half the row (fixed with `box-sizing: border-box`); the
  "Activity History" heatmap bars were invisible because the container used
  `flex-direction: column` while children relied on `align-self: stretch`
  for height, collapsing every bar to 0px (fixed by switching the container
  to a wrapped row and giving each cell an explicit height).
