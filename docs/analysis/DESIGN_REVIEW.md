# Fittrack — Design Review

*Source: 16 screens captured at 414×896 (mobile) and 1440×900 (desktop), prototype mode with seeded data. PNGs in `docs/screenshots/mobile/` and `docs/screenshots/desktop/`.*

---

## TL;DR — the eight changes with the biggest impact

1. **Kill the global "Fittrack + Theme" header on mobile.** It eats ~10% of every screen, never changes, and the theme toggle belongs in Settings (where it already exists).
2. **Standardise the page header pattern.** Back button, title, primary action — same slot on every screen. Right now Back lives top-left, top-right, and dead-centre depending on the screen.
3. **Replace the Home screen.** Today it shows "Display Name / Import / Export / Plan a Route" — data-management chores. It should answer "what is the user training today and how is their week going?"
4. **Add a content `max-width` (≈ 960 px) on desktop.** Cards stretch across the full 1440 px viewport, breaking line lengths, chart readability, and visual rhythm. Saved Routes and Notifications are literal whitespace deserts.
5. **Fix the Route Planner desktop layout.** It's the only screen that's actually broken — the toolbar collapses into a vertical column on the left and the map shrinks to a corner. Looks like a regression, not a design choice.
6. **De-emphasise photos in session cards.** A letterboxed photo carousel currently dominates each session before any training data. Move photos to a small strip below the stats or behind an expand affordance.
7. **Design proper empty states.** Saved Routes, Notifications, and Home-when-empty are sparse one-liners. Each needs a visual, a one-sentence "why this is useful", and a primary CTA.
8. **Unify chart chrome.** Charts appear in 4+ different treatments (eyebrow + pill, raw axis, dense table-chart, full-bleed area). Build one `<ChartCard>` pattern and use it everywhere.

---

## Cross-cutting themes

### Header & navigation chrome is inconsistent

| Screen | Top-bar contents | Back button | Title placement |
|---|---|---|---|
| Home | Fittrack + Theme + ⚙ | — | Inline (greeting) |
| Training Log | Fittrack + Theme + ⚙ | — | Below header ("My Sessions") |
| New Session | Fittrack + Theme + ⚙ | top-left | centred below header |
| Session Detail | none (just session title) | — | inline, no header |
| Edit Session | Fittrack + Theme + ⚙ | top-left | centred below header (and "Update" button top-right) |
| Settings | Fittrack + Theme + ⚙ | **top-right** | top-left below header |
| Health Category | Fittrack + Theme + ⚙ | **centred** | below back |
| Exercise History | Fittrack + Theme + ⚙ | **centred** | below back |
| Notifications | Fittrack + Theme + ⚙ | — | "Notifications" inline |

This is six different patterns. The fix is a `<ScreenHeader title back primary>` component with three fixed slots: leading (back / nothing), centre (title), trailing (single primary action). Drop "Fittrack" and "Theme" from this bar entirely — branding belongs on the splash/launcher; theme belongs in Settings.

### Layout doesn't scale to desktop

Most screens treat desktop as "wider mobile." That breaks down in three ways:
- **Home, Notifications, Saved Routes** become whitespace deserts with content hugging the top-left.
- **Sleep charts** stretch to 1200 px — bar ticks are an inch apart, breaking visual rhythm.
- **Route Planner** is genuinely broken: the controls become a vertical strip and the map a small box top-right.

A simple `max-width: 960px; margin: 0 auto;` on the main content scaffold solves 80% of this. Route Planner needs a deliberate two-pane desktop layout (controls left rail ≈ 320 px, map fills the rest).

### Cards have wildly different paddings & radii

Side-by-side comparisons from the captures:
- Home tiles: ~24 px padding, ~16 px radius, generous spacing.
- Training-Log session cards: 16 px padding, ~12 px radius, photo bleed to edges.
- Edit Session form: no card around the form — fields float on the background.
- Settings: no cards — rows on background.
- Health Category chart cards: 16 px padding but inconsistent vertical rhythm between chart and label.

Pick one `surface` variant for "primary content container" and apply it consistently. This also matters because `feedback_css_conventions` says to compose surface + tight + stack — currently the codebase uses ad-hoc paddings instead.

### The "Theme" affordance is mis-placed and ugly

It appears in the top bar on every screen as a labelled toggle. Themes are configured rarely — this is the wrong real estate. Move into Settings only (it's already there as a labelled slider), and remove from the global header.

### Branding & identity

The wordmark "Fittrack" with a small blue rounded-square icon is generic and doesn't appear consistently (Session Detail mobile has no brand). Either commit to it (consistent placement, a stronger mark) or remove it from in-app chrome (it's already in the browser tab). On mobile, every pixel matters — brand in-chrome buys nothing.

### Empty states need designing

| Screen | Today | Suggested |
|---|---|---|
| Notifications | `No notifications.` | Bell icon graphic + "You're all caught up" + secondary text + link to notification settings |
| Saved Routes | text-only card | Map sketch graphic + "No saved routes yet" + primary CTA "Open route planner" |
| Home (no data) | greeting + util tiles | "Welcome — let's get you set up" first-run flow OR "Quiet week so far" + log button + plan button |
| Profile stats (`—`) | dashes | A real number + dim label, or "Log your first session to start tracking" |

### Chart treatments diverge

Across the captures I see at least four chart styles:
- **Eyebrow + pill** (Health Category) — clean.
- **Inline bar with kg/reps labels** (Session Detail, Edit Session) — functional but visually noisy.
- **Compound dual-axis** (Weather) — works on desktop, cramps on mobile.
- **Raw axis, no card** (Exercise History mobile) — overlaps and unreadable at small sizes.

Now that `ui/patterns/charts/domain-charts.tsx` exists as the single home for domain charts, build one `<ChartCard eyebrow value-pill body legend?>` scaffold and adopt it everywhere. This is a high-leverage change because charts are scattered across 10+ screens.

---

## Per-screen review

### 01 — Home

![home mobile](mobile/01-home.png) ![home desktop](desktop/01-home.png)

**What's wrong**
- It's a data-management dashboard, not a fitness home. "Display Name / Import Data / Export Data / Plan a Route" are setup chores, not the user's training story.
- "No workouts logged yet this week" is shown despite seeded data existing — the home isn't surfacing past activity at all.
- Desktop wastes ~700 px of horizontal whitespace right of the four tiles.

**Suggested redesign (mobile-first)**
1. Greeting strip: keep "Saturday · 23 May / Good afternoon".
2. **Today** card: scheduled session if any → "Tap to start" CTA; otherwise "Rest day · log unplanned session".
3. **This week** strip: 7-day dots (filled = trained, dim = rest) + headline ("3 sessions · 6.4 km · 12,500 kg lifted").
4. **Recent activity** list: last 3 sessions (cards from Training Log, smaller).
5. **Quick actions** row: New Session, Plan Route, Log Sleep.

The Import/Export/Display Name tiles should move to **Settings**.

### 02 — Training Log

![log mobile](mobile/02-training-log.png) ![log desktop](desktop/02-training-log.png)

**What's wrong**
- Photo carousel dominates each card before any training data — exact opposite of useful information hierarchy.
- The "+ Add" button below the search/filter row duplicates the "+ Add" pill in the top-right.
- On desktop, photos render with letterbox bars because aspect ratio isn't constrained.
- Sport icon + name + date row uses small font but big leading; feels like wasted vertical space.

**Suggested**
- **Stats first** in the card body: Exercises / Duration / Sets are the primary read.
- Photos become a 64-px strip below stats, with a count badge ("📷 4"). Tap to expand.
- Drop the duplicate "+ Add" — keep only the top-right pill.
- On desktop, give the list a max-width and constrain photo strip aspect ratio.

### 03 — New Session

![new session mobile](mobile/03-new-session.png) ![new session desktop](desktop/03-new-session.png)

**What's wrong**
- Activity tiles ("Gym/Run/Cycle/Hike/+ More") are a nice mobile-native pattern but on desktop they stretch to occupy 800 px with vast gaps between them.
- The "New Session" primary button uses a full-width blue bar with no padding from the time field — feels disconnected from the rest of the form.
- Name field is pre-filled "Afternoon Gym" — this is good UX, keep it.

**Suggested**
- Constrain the form to ~480 px max-width on desktop, centred.
- Make the activity picker a 5-column horizontal scroll on mobile (it nearly is), and a centred 5-tile row on desktop with fixed tile width.
- Replace the bottom "New Session" button with a sticky footer pattern (avoid full-width primary buttons mid-page — they read as section dividers).

### 04 — Session Detail

![detail mobile](mobile/04-session-detail.png) ![detail desktop](desktop/04-session-detail.png)

**What's wrong**
- This is the only screen without the global Fittrack header — meaning navigation chrome is inconsistent.
- "Done" button (blue, primary) in the top-right is confusing — the session is already done; this looks like "Save" but for a read-only view.
- Photo carousel takes ~30% of the viewport above the actual training data.
- The set table below the bar chart duplicates the chart's labels (80 kg × 5 appears as both a chart label and a row entry).

**Suggested**
- Adopt the standard `<ScreenHeader>`. "Done" → "Close" (X icon).
- Photos collapsed by default, expandable. Default focus on the stats card (Date/Duration/Start/End) then exercise list.
- Drop either the bar chart labels OR the table — pick one truthful place for set data. The bar chart with hover-on-bar values is the more scannable option for past sessions.

### 05 — Finish Session

![finish mobile](mobile/05-finish-session.png) ![finish desktop](desktop/05-finish-session.png)

**Note:** The `/summary` route currently renders the Edit Session UI. Either the route is mis-wired or FinishSessionScreen still mirrors edit chrome.

**What's wrong**
- A "Finish session" screen should celebrate the work and capture summary metadata (RPE, mood, notes). Right now it's the edit form.
- Tags/RPE/Notes/Photos are all present but bunched at the bottom of the same form — too much for a single dense screen.

**Suggested redesign**
1. Hero stat row at top: Duration, Sets, PR count (with a confetti chip if PRs ≥ 1).
2. RPE wheel (1–10) as a single big input, not 10 small chips.
3. Tags chiplet row.
4. Notes textarea (free-form).
5. Photos strip with "+ Add photo" tile.
6. Sticky "Save & finish" footer (primary) + "Save draft" (secondary).

### 06 — Edit Session

![edit mobile](mobile/06-edit-session.png) ![edit desktop](desktop/06-edit-session.png)

**Note:** This route appears to render the LogScreen / live workout entry view, not the EditSessionScreen form. The chrome ("Lower B / Done / start/end times / Squat bar chart with editable kg+reps") matches a live workout interface, not a metadata edit.

**What's wrong (taking it as the in-workout log view)**
- Set rows have separate inputs for kg and reps but no stepper buttons — typing decimals on a phone is awkward.
- The bar chart sits above the inputs and re-renders every keystroke; this might feel laggy in production.
- WU/S1/S2/S3 row labels are nice but the right-side ⋮ overflow menu on every row is visual noise.

**Suggested**
- Numeric stepper widget (− 80 kg + / − 5 reps +). Hide the keyboard entirely if possible.
- Collapse bar chart by default during entry; show after the user taps "Done" on the exercise.
- Move per-row ⋮ menu to long-press or a single global "Edit set" mode toggle.

### 07 — Social

![social mobile](mobile/07-social.png) ![social desktop](desktop/07-social.png)

**What's wrong**
- The post composer takes ~270 px of vertical space (avatar + input + giant blue "Post" button) before the first feed item. That's 30% of mobile viewport for a feature most users use rarely.
- Like/comment counts at the card bottom use tiny outlines that blur together; the heart-vs-outline-heart state is the only differentiation between "I liked this" and "I haven't".
- Desktop wastes the right gutter — could host event suggestions or a "who to follow" rail.

**Suggested**
- Composer collapsed by default: just `[avatar] Share something… [📷]`. Tap to expand.
- Card actions: solid icons with counts to the right ("♥ 14 · 💬 0 · ⤴"), bigger touch targets.
- Desktop: two-column layout — feed centred at ~640 px, right rail for Events/Groups quick links.

### 08 — Messages

![messages mobile](mobile/08-messages.png) ![messages desktop](desktop/08-messages.png)

**What's wrong**
- "Upcoming Calls" as a top-of-screen section is a strong product claim — video calls between users aren't typical for a fitness app. If it's a planned feature, the placement is right; if it's speculative, it dilutes the screen.
- The avatar block, name, message preview, and timestamp all use similar visual weights — hard to scan unread vs. read.
- Desktop layout is enormous whitespace right of the message list.

**Suggested**
- Unread messages: bold name + bold preview + accent dot to the left.
- Read messages: dimmed.
- Combine "Upcoming Calls" into the message row when a call is scheduled with that person (camera icon next to the row).
- Desktop: split-view — list on the left (~320 px), open conversation on the right. Standard messaging app pattern.

### 09 — Profile

![profile mobile](mobile/09-profile.png) ![profile desktop](desktop/09-profile.png)

**What's wrong**
- Stats row shows "Workouts —" and "Lifts —" even though Training Log has 12+ seeded sessions. The projection isn't wired to this view.
- The card layout for Profile-header has lots of whitespace and a tiny "Active" pill that's hard to read at a glance.
- "Health" tab is selected and shows a perfect category grid (this is great!), but tapping a card reveals there's no "what's my current value" hint on the tile itself.

**Suggested**
- Show real numbers in stats row (or "Log your first session to start tracking" if empty).
- Category tiles: show last-recorded value at the bottom (e.g. "Sleep — 7.9 h" right under the title).
- Add a "Streaks / Records" callout strip above the category grid (current streak, total sessions, this-year volume).

### 10 — Health Category (Sleep)

![health mobile](mobile/10-health-category.png) ![health desktop](desktop/10-health-category.png)

**What's wrong**
- Charts are clean but bare — no context. "7.9 h" pill doesn't say if that's good/bad. "81/100" same.
- On desktop the charts span 1200 px, making bars far apart and breaking visual rhythm.
- Nothing below the two charts — no recent entries list, no insights, no link to log a new entry.

**Suggested**
- Pill should include trend arrow vs. prior period: "7.9 h ↑ 4% vs last week".
- Add a target reference line (goal 8 h).
- Below charts: "Recent entries" list (last 5–7 nights) and a primary "+ Log sleep" button.
- Desktop: constrain charts to ~720 px, two-column grid for additional widgets (e.g. weekly heatmap, stage breakdown).

### 11 — Settings

![settings mobile](mobile/11-settings.png) ![settings desktop](desktop/11-settings.png)

**What's wrong**
- Back button is top-right — conflicts with the top-left positioning on New Session and Edit Session. Pick one.
- Theme is the *only* Appearance option — that's fine for now, but the section header for a single switch feels heavy.
- Data section: three actions (Export JSON / Export CSV / Import / Clear All) sit on the same baseline with no grouping — Export and Import are quasi-related and Clear All is destructive.
- On desktop the whole screen is naked rows; it badly needs a max-width card or grouped sections.

**Suggested**
- Normalise back button to top-left across the app.
- Group: **Appearance** (theme, units), **Sync** (cloud backup if relevant), **Data** (Export / Import), **Danger Zone** (Clear All — red button, confirm modal).
- Move the Theme toggle from the global header here; that's the only place users need it.
- On desktop, set max-width ~720 px and align everything to a left column.

### 12 — Exercise History (Bench Press)

![exercise mobile](mobile/12-exercise-history.png) ![exercise desktop](desktop/12-exercise-history.png)

**What's wrong**
- **Mobile is unreadable**: the chart x-axis labels overlap, dates in the table are cramped, and the table columns push off-screen.
- Desktop is excellent — this is what the screen wants to look like.
- No headline metric above the chart (current 1RM? PR? Last 4-week trend?).

**Suggested**
- Mobile: simplify the chart to a single line + sparse ticks (every 4 weeks). Drop axis title. Show date on hover/tap, not on every point.
- Add a stat strip: `Current best: 113.8 kg · PR: 113.8 kg (24 Mar) · 4-wk: ↑ 6 kg`.
- Mobile table: collapse to a single column per row ("24 Mar · 95×5 / 97.5×5 / 100×2 · 1RM 113.8"). Or make it horizontally scrollable with a clear affordance.

### 13 — Weather

![weather mobile](mobile/13-weather.png) ![weather desktop](desktop/13-weather.png)

**What's wrong**
- "Run conditions: Good — mild temp, low wind" is the most actionable info on the screen but lives *below* UV/Wind/Rain/Visibility — backwards hierarchy.
- The four condition pills (Moderate / SW / Low / Clear) are coloured semantically (green/blue/orange/green) — nice, but the colour mapping isn't legend'd.
- 7-day forecast chart uses red bars for high temp and blue for low — not obvious; needs labels or a clearer key.

**Suggested**
- Promote Run Conditions to the top of the screen: big card with a green "Good" badge and the rationale right next to it.
- UV/Wind/Rain/Visibility row collapses below. Maybe add a "Recommended gear" line: "Light layer, no rain jacket needed."
- Forecast chart legend: change "High / Low — Rain" pills to coloured swatches inline with the labels.

### 14 — Route Planner

![route planner mobile](mobile/14-route-planner.png) ![route planner desktop](desktop/14-route-planner.png)

**What's wrong**
- **Desktop is broken.** The toolbar collapses into a vertical column on the left and the map shrinks to a small rectangle in the top-right. This looks like a missed responsive media query.
- Mobile is okay but the activity-picker (Run/Hike/Ride/Walk) at the bottom is in primary blue which competes with the "Save route" CTA.
- "Save route" is the only path to save — but with no waypoints the button is enabled. Should be disabled until at least 2 points.

**Suggested**
- Desktop: two-pane layout. Left pane ~320 px with all controls. Right pane ≥ 70% of viewport for the map.
- Activity picker: neutral until selected, accent only on the chosen sport.
- Disable Save until route has waypoints + a name. Add "Discard" secondary action.

### 15 — Saved Routes

![saved mobile](mobile/15-saved-routes.png) ![saved desktop](desktop/15-saved-routes.png)

**What's wrong**
- Empty state is a single grey card with text only — no visual, no CTA.
- Desktop especially: a 1440-px canvas with one little card at the top.
- The back button placement is centred-top, which conflicts with other screens.

**Suggested**
- Centred empty-state with a map illustration, two lines of text, and a primary "Open route planner" button.
- Same `<ScreenHeader>` pattern as everywhere else.
- When routes exist, show a 2-column grid (mobile) or 3-column grid (desktop) of tiles with a thumbnail preview, distance, and profile icon (already designed per memory of previous work).

### 16 — Notifications

![notifications mobile](mobile/16-notifications.png) ![notifications desktop](desktop/16-notifications.png)

**What's wrong**
- The classic "tab with one line of empty text in the corner" anti-pattern.
- No way to navigate to notification settings from this screen.

**Suggested**
- Empty state: bell illustration, "You're all caught up" headline, "We'll notify you when something needs your attention" subtext, link "Manage notification settings →".
- When notifications exist: group by day, with read/unread state. Icons by type (training reminder, social, system).
- Add an "Mark all read" affordance in the header trailing slot when there are unread items.

---

## Suggested roadmap

If you only have time for one sprint's worth of fixes, here's the order I'd attack:

### Tier 1 — Low effort, high payoff
1. Build a `<ScreenHeader title back primary>` component and adopt across all screens.
2. Remove the Theme toggle from the global header; keep it only in Settings.
3. Add `max-width: 960px; margin-inline: auto;` to the main content wrapper.
4. Fix Route Planner desktop layout (this is a bug, not a redesign).
5. Build a real empty-state component (illustration + headline + subtext + CTA) and apply to Saved Routes, Notifications, Home-when-empty.

### Tier 2 — Medium effort, structural payoff
6. Redesign the Home screen as a real dashboard. Move Import/Export/Display Name to Settings.
7. Build the unified `<ChartCard>` scaffold and migrate all charts.
8. Fix Profile stat-row to read real data; add last-value hint to category tiles.
9. De-emphasise photos in Training Log session cards.
10. Promote Run Conditions to the top of the Weather screen.

### Tier 3 — Bigger redesigns
11. Rework the Finish Session screen as a celebration / RPE / notes summary screen.
12. Mobile-only redesign of Exercise History (it works at desktop already).
13. Decide what the Messages screen *is* (calls feature? messaging primary?) and design accordingly.
14. Two-pane desktop layouts for Messages and Social feed.

---

*Artifacts: `mobile/` and `desktop/` subfolders contain the full set. The capture script lives at `scripts/screenshot-screens.mjs` — delete or keep as you prefer.*
