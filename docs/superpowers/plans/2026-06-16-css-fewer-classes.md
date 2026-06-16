# CSS Cleanup: Class Reduction Through Typed Layout and Text Atoms

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce CSS class count by routing layout, typography, and interaction concerns through the atoms that already own them — leaving only domain-visual CSS in project-layer files.

**Architecture:** Feature components in `ui/components/` currently use raw `<div className="...">` for layout that `Row`, `Column`, and `Grid` atoms already express. Text styling is applied via plain CSS class strings instead of `Text` atom props. Repeated interactive-item rules exist verbatim in `controls.css` without inheriting from the base button rule. Fixing all three collapses the CSS needed by each feature component.

**Guiding principles:**
- **Layout** belongs to `Row`, `Column`, `Grid` — not custom CSS grid/flex rules on named divs
- **Typography** belongs to `Text` props (`size`, `color`, `mono`, `bold`) — not raw class strings in JSX
- **Domain visual state** belongs to scoped `data-*` selectors inside the parent component rule — not global flat classes
- **Reusable component behavior** (hover, focus, transitions) belongs in `@layer atoms`/`@layer molecules` CSS and is inherited, not repeated

**Tech Stack:** React + TypeScript, global CSS with `@layer`, existing layout atoms (`Row`, `Column`, `Grid`) in `ui/layout/`, `Text` atom in `ui/atoms/Text.tsx`, CSS nesting per `docs/reference/modern-css-reference-2026.md`.

---

## File Map

| File | Action |
|---|---|
| `styling/controls.css` | Delete button-inherited declarations from combobox/command items; slim toggle/tab/breadcrumb |
| `ui/components/home/HomeWidgetPanel.tsx` | Replace layout divs with atoms; fix weather widget nesting |
| `styling/home-widgets.css` | Delete layout rules moved to atoms; add scoped `[data-stage]` rules; audit widget-grid duplication |
| `styling/project-activity.css` | Delete `.deep-text`, `.rem-text`, `.light-text`, `.awake-text` |
| `ui/components/log/SessionListItem.tsx` | Replace `<time className="caption muted">` with `<Text as="time">` |

---

## Task 0: Scope check — verify single-use before deletion

Before touching any code, confirm the classes targeted for removal aren't used elsewhere. A class used in two places needs either a broader atom or a kept rule.

**Files:** read-only scan

- [ ] **Step 0.1: Scan for all targeted class usages**

  ```bash
  rg -n "sleep-main|sleep-stage-labels|stage-label|session-head|stat-tile-row|deep-text|rem-text|light-text|awake-text" -g "*.tsx" -g "*.ts" -g "*.css"
  ```

  Expected output: all matches in `HomeWidgetPanel.tsx` and `home-widgets.css` / `project-activity.css`. If any appear in additional files, those usages must be addressed before the related task proceeds.

- [ ] **Step 0.2: Scan for raw typography class strings that should be `Text` props**

  ```bash
  rg -n "className=\"[^\"]*\b(caption|muted|faint|bold|truncate|mono)\b" -g "*.tsx" ui/
  ```

  Scan covers all of `ui/` (not just `ui/components/`) to catch molecules like `Command.tsx`. Note every match. Each is a candidate for `<Text>` prop replacement. Matches using layout utilities (`min-w-0`, `grow`, `shrink-0`) inside the same `className` should be split: move text concerns to `Text` props, keep layout utilities on a wrapper atom.

- [ ] **Step 0.3: Check widget-grid duplication in `home-widgets.css`**

  ```bash
  rg -n "widget-grid|home-widget-grid" styling/home-widgets.css
  ```

  Record both class declarations for Task 8. Known: `.home-widget-grid` is used in `ui/screens/home/HomeScreen.tsx`; `.widget-grid` is used in `ui/components/widgets/WidgetGrid.tsx`. Task 8 will decide whether the separate names are intentional or should collapse.

---

## Task 1: Remove button-inherited declarations from interactive items in `controls.css`

`.combobox-option` and `.command-item` are `<button>` elements. The base rule in `buttons.css` (`:is(button, .button, ...)`) already provides `display: inline-flex; align-items: center; justify-content: center; gap: var(--s-2); padding: var(--s-1) var(--s-3); font-family; font-size; font-weight: 500; color: var(--ink); background: var(--surface-1); border: 1px solid var(--line-strong); border-radius: var(--s-2); cursor; hover; active; disabled`. Every one of those declarations in the current `.combobox-option`/`.command-item` blocks is completely redundant. Only true overrides need to survive. The list containers (`.combobox-list`/`.command-list`) also duplicate each other verbatim and can be merged with `:is()`.

**Files:**
- Modify: `styling/controls.css`

- [ ] **Step 1.1: Verify the button base contract**

  Confirm that `.combobox-option` and `.command-item` are rendered as native `<button>` elements — if either were rendered as a `<div>` or `<li>`, removing the inherited declarations would break their styling.

  ```bash
  rg -n "combobox-option|command-item" -g "*.tsx" ui/
  ```

  In each matched file, verify the element is `<button type="button" ...>`. Current files to check: `ui/molecules/Combobox.tsx`, `ui/molecules/Command.tsx`. If either class is applied to a non-button element, keep the inherited declarations for that class and adjust the `:is()` rule accordingly.

- [ ] **Step 1.2: Run typecheck baseline**

  ```bash
  npx tsc --noEmit
  ```

  Expected: 0 errors (establishes a baseline before touching any TSX).

- [ ] **Step 1.3: Add a merged `:is()` rule for the list containers before `.combobox` in `controls.css`**

  Insert this block immediately before the `.combobox {` rule (around line 123):

  ```css
  /* Dropdown list containers — both are identical, merged */
  :is(.combobox .combobox-list, .command .command-list) {
    display: grid;
    gap: var(--s-1);
    margin-top: var(--s-1);
    padding: var(--s-1);
    border: 1px solid var(--line);
    border-radius: var(--r-sm);
    background: var(--surface-1);
    box-shadow: var(--shadow-2);
  }

  /* Popup list items — only true overrides on top of the :is(button,...) base rule */
  :is(.combobox .combobox-option, .command .command-item) {
    justify-content: flex-start; /* base is center */
    text-align: left;            /* base is center */
    width: 100%;
    min-height: 36px;
    background: transparent;     /* base is surface-1 */
    border-color: transparent;   /* base is line-strong */
    border-radius: var(--r-sm);  /* base is --s-2 */

    &[aria-selected="true"] {
      background: var(--surface-2);
      border-color: var(--line-strong);
    }
  }
  ```

  Everything else (flex, font, hover, active, disabled, cursor, transition) is inherited from the button base — do not repeat it.

  > **Future note:** If a third popup list item type appears, introduce a named `.popup-item` class in `controls.css` instead of extending `:is()` further. Named classes are cleaner once the pattern has three or more members.

- [ ] **Step 1.4: Replace the `.combobox` block — remove the list and option inner rules**

  Replace the full `.combobox { ... }` block with just its container declaration (the new `:is()` rules above handle everything else):

  ```css
  .combobox {
    position: relative;
    min-width: 0;
  }
  ```

- [ ] **Step 1.5: Replace the `.command` block — remove the list and item inner rules**

  Replace the full `.command { ... }` block with:

  ```css
  .command {
    position: relative;
    min-width: 0;

    & .command-empty {
      padding: var(--s-2);
    }
  }
  ```

  Note: `Command.tsx` renders `<span className="caption muted command-empty">`. The `.command-empty` padding rule stays here. The `caption muted` typography classes should be converted to `<Text size="caption" color="muted" className="command-empty">` — covered by Task 9.

- [ ] **Step 1.6: Visually verify combobox and command palette in dev server**

  ```bash
  npm run dev
  ```

  Confirm: combobox options and command palette items render identically to before (hover highlight, selected state, scale press, left-aligned text, full-width rows).

- [ ] **Step 1.7: Commit**

  ```bash
  git add styling/controls.css
  git commit -m "refactor(css): delete button-inherited declarations from combobox/command items"
  ```

---

## Task 2: Replace `.sleep-main` and `.sleep-stage-labels` divs with atoms in `HomeSleepWidget`

**Files:**
- Modify: `ui/components/home/HomeWidgetPanel.tsx`
- Modify: `styling/home-widgets.css`

- [ ] **Step 2.1: Replace `.sleep-main` div with `<Row>` in `HomeSleepWidget`**

  Current (`HomeWidgetPanel.tsx` around line 77):
  ```tsx
  <div className="sleep-main">
    <Column gap={1} className="min-w-0">
      <Text size="eyebrow" id="hw-sleep-title">Sleep</Text>
      <Metric value={sleepDuration(session)} size="lg" mono />
      <Text mono size="caption" color="muted">{sleepTimings(session)}</Text>
    </Column>
    <Column gap={1} align="center">
      <div
        className="score-circle"
        data-tone="sleep"
        aria-label={`Sleep score ${session.score}`}
      >
        {session.score}
      </div>
      <Text size="caption" color="faint">score</Text>
    </Column>
  </div>
  ```

  Replace with:
  ```tsx
  <Row align="start" gap={3}>
    <Column gap={1} className="grow min-w-0">
      <Text size="eyebrow" id="hw-sleep-title">Sleep</Text>
      <Metric value={sleepDuration(session)} size="lg" mono />
      <Text mono size="caption" color="muted">{sleepTimings(session)}</Text>
    </Column>
    <Column gap={1} align="center" className="shrink-0">
      <div
        className="score-circle"
        data-tone="sleep"
        aria-label={`Sleep score ${session.score}`}
      >
        {session.score}
      </div>
      <Text size="caption" color="faint">score</Text>
    </Column>
  </Row>
  ```

  (`.grow` = `flex: 1; min-width: 0; min-height: 0` — already defined in `utilities.css`. `.shrink-0` = `flex-shrink: 0`.)

- [ ] **Step 2.2: Replace `.sleep-stage-labels` and `.stage-label` divs with atoms**

  Current (around line 97):
  ```tsx
  <div className="sleep-stage-labels">
    <div className="stage-label">
      <Text as="strong" mono className="deep-text">{fmtMins(stages.deep)}</Text>
      <Text size="caption" color="faint">Deep</Text>
    </div>
    <div className="stage-label">
      <Text as="strong" mono className="rem-text">{fmtMins(stages.rem)}</Text>
      <Text size="caption" color="faint">REM</Text>
    </div>
    <div className="stage-label">
      <Text as="strong" mono className="light-text">{fmtMins(stages.light)}</Text>
      <Text size="caption" color="faint">Light</Text>
    </div>
    <div className="stage-label">
      <Text as="strong" mono className="awake-text">{fmtMins(stages.awake)}</Text>
      <Text size="caption" color="faint">Awake</Text>
    </div>
  </div>
  ```

  Replace with (note: `data-stage` replaces the color classes — Task 3 adds the CSS for them):
  ```tsx
  <Grid cols={4} gap={2}>
    <Column gap={1} align="center" className="text-center">
      <Text as="strong" size="detail" mono data-stage="deep">{fmtMins(stages.deep)}</Text>
      <Text size="caption" color="faint">Deep</Text>
    </Column>
    <Column gap={1} align="center" className="text-center">
      <Text as="strong" size="detail" mono data-stage="rem">{fmtMins(stages.rem)}</Text>
      <Text size="caption" color="faint">REM</Text>
    </Column>
    <Column gap={1} align="center" className="text-center">
      <Text as="strong" size="detail" mono data-stage="light">{fmtMins(stages.light)}</Text>
      <Text size="caption" color="faint">Light</Text>
    </Column>
    <Column gap={1} align="center" className="text-center">
      <Text as="strong" size="detail" mono data-stage="awake">{fmtMins(stages.awake)}</Text>
      <Text size="caption" color="faint">Awake</Text>
    </Column>
  </Grid>
  ```

  (`Grid` needs to be imported from `@ui/layout` — add to existing import line.)

- [ ] **Step 2.3: Delete `.sleep-main`, `.sleep-stage-labels`, `.stage-label` CSS from `home-widgets.css`**

  Remove these blocks from inside `.home-widget { ... }`:

  ```css
  /* DELETE — replaced by Row atom */
  & .sleep-main {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--s-3);
    align-items: start;
  }

  /* DELETE — replaced by Grid cols={4} atom */
  & .sleep-stage-labels {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--s-2);
  }

  /* DELETE — replaced by Column align="center" atom */
  & .stage-label {
    display: grid;
    gap: var(--s-1);
    min-width: 0;
    text-align: center;

    strong { font-size: var(--t-sm); font-weight: 700; }
  }
  ```

- [ ] **Step 2.4: Run typecheck**

  ```bash
  npx tsc --noEmit
  ```

  Expected: 0 errors. Fix any `Grid` import issue if flagged.

- [ ] **Step 2.5: Verify sleep widget in dev server**

  ```bash
  npm run dev
  ```

  Navigate to the home screen. Sleep widget should show the same 2-column header (sleep duration left, score right) and the same 4-column stage breakdown below.

- [ ] **Step 2.6: Commit**

  ```bash
  git add ui/components/home/HomeWidgetPanel.tsx styling/home-widgets.css
  git commit -m "refactor(home): replace sleep-main/stage-labels layout divs with Row/Grid atoms"
  ```

---

## Task 3: Replace `.session-head` and `.stat-tile-row` divs in `HomeSessionCard`

**Files:**
- Modify: `ui/components/home/HomeWidgetPanel.tsx`
- Modify: `styling/home-widgets.css`

- [ ] **Step 3.1: Replace `.session-head` div with `<Row>` in `HomeSessionCard`**

  Current (around line 275):
  ```tsx
  <div className="session-head">
    <IconFrame size="lg" sport={sport as ...}>
      <Cloud size={20} aria-hidden="true" />
    </IconFrame>
    <Column gap={0} className="min-w-0">
      <Text size="detail" bold truncate>{session.name}</Text>
      <Text size="caption" color="muted">{day}</Text>
    </Column>
    <CaretRight size={18} className="faint" aria-hidden="true" weight="bold" />
  </div>
  ```

  Replace with:
  ```tsx
  <Row align="center" gap={3}>
    <IconFrame size="lg" sport={sport as ...}>
      <Cloud size={20} aria-hidden="true" />
    </IconFrame>
    <Column gap={0} className="grow min-w-0">
      <Text size="detail" bold truncate>{session.name}</Text>
      <Text size="caption" color="muted">{day}</Text>
    </Column>
    <CaretRight size={18} className="faint" aria-hidden="true" weight="bold" />
  </Row>
  ```

  (`.grow min-w-0` makes the Column take remaining space, matching the `minmax(0, 1fr)` grid column it replaced.)

- [ ] **Step 3.2: Replace `.stat-tile-row` div with `<Grid>` and fix `.q-tile` children**

  Current (around line 285):
  ```tsx
  <div className="stat-tile-row">
    <Surface variant="flat" pad="xs" className="q-tile column gap-1">
      <Text as="strong" mono truncate>{fmtSecs(session.durationSeconds)}</Text>
      <Text color="faint" truncate>Duration</Text>
    </Surface>
    <Surface variant="flat" pad="xs" className="q-tile column gap-1">
      <Text as="strong" mono truncate>{session.totalSets} sets</Text>
      <Text color="faint" truncate>Volume</Text>
    </Surface>
    <Surface variant="flat" pad="xs" className="q-tile column gap-1">
      <Text as="strong" mono truncate>{session.exerciseCount} ex</Text>
      <Text color="faint" truncate>Exercises</Text>
    </Surface>
  </div>
  ```

  Replace with (`.q-tile` stays on Surface as a container-query hook; `column gap-1` moves inside as `<Column>`):
  ```tsx
  <Grid cols={3} gap={2}>
    <Surface variant="flat" pad="xs" className="q-tile">
      <Column gap={1}>
        <Text as="strong" size="detail" mono truncate>{fmtSecs(session.durationSeconds)}</Text>
        <Text size="caption" color="faint" truncate>Duration</Text>
      </Column>
    </Surface>
    <Surface variant="flat" pad="xs" className="q-tile">
      <Column gap={1}>
        <Text as="strong" size="detail" mono truncate>{session.totalSets} sets</Text>
        <Text size="caption" color="faint" truncate>Volume</Text>
      </Column>
    </Surface>
    <Surface variant="flat" pad="xs" className="q-tile">
      <Column gap={1}>
        <Text as="strong" size="detail" mono truncate>{session.exerciseCount} ex</Text>
        <Text size="caption" color="faint" truncate>Exercises</Text>
      </Column>
    </Surface>
  </Grid>
  ```

  Note: `Text color="faint"` renders as `.faint` class (see `Text.tsx` — `faint` maps to `'faint'`). Verify `TextColor` union includes `'faint'` — it currently reads `'default' | 'muted' | 'faint' | 'positive' | 'negative'` ✓.

- [ ] **Step 3.3: Delete `.session-head` and `.stat-tile-row` CSS from `home-widgets.css`**

  Remove these blocks from inside `.home-widget { ... }`:

  ```css
  /* DELETE — replaced by Row align="center" gap={3} atom */
  & .session-head {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--s-3);
  }

  /* DELETE — replaced by Grid cols={3} gap={2} atom */
  & .stat-tile-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--s-2);
  }
  ```

- [ ] **Step 3.4: Run typecheck**

  ```bash
  npx tsc --noEmit
  ```

  Expected: 0 errors.

- [ ] **Step 3.5: Verify session card in dev server**

  Navigate to the home screen. Last session card should show: icon / title+day / chevron on one row; 3 stat tiles (Duration, Volume, Exercises) on the next row — identical to before.

- [ ] **Step 3.6: Commit**

  ```bash
  git add ui/components/home/HomeWidgetPanel.tsx styling/home-widgets.css
  git commit -m "refactor(home): replace session-head/stat-tile-row layout divs with Row/Grid atoms"
  ```

  > **Note — `Surface className="grid"` in `HomeSessionCard`:** The root `<Surface pad="sm" className="grid">` uses a raw layout class on a styled component. This works, but it is the same pattern this plan is removing elsewhere. If the parent surface ever needs to become a `Column` or if `Surface` gains a `layout` prop, this should be revisited. Not in scope now; flag if a future task targets `Surface` layout props.

---

## Task 4: Scope sleep stage text colors inside `home-widgets.css`; delete flat classes

The four standalone classes `.deep-text`, `.rem-text`, `.light-text`, `.awake-text` in `project-activity.css` are used only inside `HomeWidgetPanel.tsx`. Task 2 already replaced them with `data-stage` attributes. Now wire up the CSS.

**Files:**
- Modify: `styling/home-widgets.css`
- Modify: `styling/project-activity.css`

- [ ] **Step 4.1: Add `[data-stage]` rules inside `.home-widget` in `home-widgets.css`**

  Append inside `.home-widget { ... }` (after the existing `& .status-word { ... }` block):

  ```css
  /* Sleep stage text colors — scoped to avoid leaking into other contexts */
  & [data-stage="deep"]  { color: var(--color-sleep-deep-text); }
  & [data-stage="rem"]   { color: var(--color-sleep-rem-text); }
  & [data-stage="light"] { color: var(--color-sleep-light-text); }
  & [data-stage="awake"] { color: var(--color-sleep-awake-text); }
  ```

- [ ] **Step 4.2: Delete the four standalone classes from `project-activity.css`**

  Remove these 4 lines (currently at the bottom of the sleep stage section, around line 83):

  ```css
  /* DELETE */
  .deep-text  { color: var(--color-sleep-deep-text); }
  .rem-text   { color: var(--color-sleep-rem-text); }
  .light-text { color: var(--color-sleep-light-text); }
  .awake-text { color: var(--color-sleep-awake-text); }
  ```

- [ ] **Step 4.3: Confirm no remaining usages of the old class names**

  ```bash
  rg -n "deep-text|rem-text|light-text|awake-text" -g "*.tsx" -g "*.ts" -g "*.css"
  ```

  Expected: 0 results. If any remain, remove them.

- [ ] **Step 4.4: Verify sleep widget in dev server**

  Sleep stage labels (Deep / REM / Light / Awake) should still render in their respective colors.

- [ ] **Step 4.5: Commit**

  ```bash
  git add styling/home-widgets.css styling/project-activity.css
  git commit -m "refactor(css): scope sleep stage text colors inside .home-widget; remove flat classes"
  ```

---

## Task 5: Replace raw text class usage in `SessionListItem.tsx` with `Text` atom

`StrengthSessionItem` and `CardioSessionItem` use `<time className="caption muted">` — applying raw CSS class strings that duplicate what the `Text` atom already handles as typed props.

**Files:**
- Modify: `ui/components/log/SessionListItem.tsx`

- [ ] **Step 5.1: Update `StrengthSessionItem` (first `<time>` element, around line 63)**

  Current:
  ```tsx
  <time className="caption muted" dateTime={new Date(session.startedAt).toISOString()}>
    {formatRelativeTime(session.startedAt)} · {formatTime(session.startedAt)}
  </time>
  ```

  Replace:
  ```tsx
  <Text as="time" size="caption" color="muted" dateTime={new Date(session.startedAt).toISOString()}>
    {formatRelativeTime(session.startedAt)} · {formatTime(session.startedAt)}
  </Text>
  ```

- [ ] **Step 5.2: Update `CardioSessionItem` (second `<time>` element, around line 133)**

  Current:
  ```tsx
  <time className="caption muted" dateTime={new Date(session.startedAt).toISOString()}>
    {formatRelativeTime(session.startedAt)} · {formatTime(session.startedAt)}
  </time>
  ```

  Replace:
  ```tsx
  <Text as="time" size="caption" color="muted" dateTime={new Date(session.startedAt).toISOString()}>
    {formatRelativeTime(session.startedAt)} · {formatTime(session.startedAt)}
  </Text>
  ```

  Confirm `Text` is already imported from `@ui/atoms` — it is (line 7 of the file).

- [ ] **Step 5.3: Run typecheck**

  ```bash
  npx tsc --noEmit
  ```

  Expected: 0 errors. `Text` accepts `dateTime` via the `AllHTMLAttributes<HTMLElement>` spread.

- [ ] **Step 5.4: Verify in dev server**

  Session list items should display relative timestamps identically (same size, same muted color).

- [ ] **Step 5.5: Commit**

  ```bash
  git add ui/components/log/SessionListItem.tsx
  git commit -m "refactor(log): replace raw <time className> with Text atom in session list items"
  ```

---

## Task 6: Slim `.toggle`, `.breadcrumb-button`, and `.tab` by removing button-inherited declarations

Same root cause as Task 1: all three are `<button>` elements. `buttons.css` already provides `display: inline-flex; align-items: center; justify-content: center; gap; padding; font-family; font-size; font-weight; color; background; border; cursor; hover; active; disabled`. The current rules in `controls.css` repeat the inherited set verbatim.

**Files:**
- Modify: `styling/controls.css`

- [ ] **Step 6.1: Verify the button base contract for toggle/tab/breadcrumb**

  ```bash
  rg -n "className=\"(toggle|tab|breadcrumb-button)" -g "*.tsx" ui/
  ```

  In each matched file, confirm the element rendering these classes is a `<button>`. Current expectation: `Toggle.tsx` → `<button>`, `Tabs.tsx` → `<button>`, `Breadcrumb.tsx` → `<button>`. If any class is applied to a non-button element, keep the inherited declarations for that class only.

- [ ] **Step 6.3: Replace the `.toggle, .breadcrumb-button` block**

  Current block (lines 66–100) re-declares ~12 inherited properties. Replace with only the true overrides:

  ```css
  .toggle,
  .breadcrumb-button {
    min-height: 40px;
    background: transparent;     /* override button base surface-1 */
    border-color: transparent;   /* override button base line-strong */
    border-radius: var(--r-sm);  /* override button base --s-2 */
    transition:
      background-color var(--duration-short) var(--ease),
      border-color var(--duration-short) var(--ease),
      color var(--duration-short) var(--ease), /* button base doesn't include color */
      transform var(--duration-short) var(--ease);

    &:disabled { color: var(--ink-faint); } /* button base only sets cursor; add color */
  }
  ```

  The `.toggle` block immediately after stays (min-height override + active state), but remove `min-height: 32px` from the combined rule since `.toggle` alone sets it:

  ```css
  .toggle {
    min-height: 32px;

    &.active,
    &[aria-pressed="true"] {
      color: var(--ink);
      background: var(--surface-2);
      border-color: var(--line-strong);
    }
  }
  ```

- [ ] **Step 6.4: Replace the `.tab` block**

  Current block (lines 261–298) re-declares ~10 inherited properties. Replace with true overrides only:

  ```css
  .tab {
    border-radius: 0;                        /* override button base --s-2 */
    border: none;                            /* override button base 1px solid */
    border-bottom: 2px solid transparent;
    box-shadow: none;
    padding: var(--s-2);                     /* override button base --s-1 --s-3 */
    color: var(--ink-muted);                 /* override button base --ink */
    min-height: 40px;
    transition:
      background-color 0.12s var(--ease),
      color 0.12s var(--ease),
      border-color 0.12s var(--ease);

    &:first-child { border-top-left-radius: var(--r-sm); }
    &:last-child  { border-top-right-radius: var(--r-sm); }

    &.active {
      color: var(--ink);
      border-bottom-color: var(--accent);
      /* background: var(--surface-1) removed — identical to button base, no override needed */
    }

    &:hover:not(.active) { background: var(--surface-2); }
  }
  ```

- [ ] **Step 6.5: Verify in dev server**

  ```bash
  npm run dev
  ```

  Check: toggle buttons (pressed/unpressed state), breadcrumb buttons (muted color, hover), tabs (active underline, inactive muted color, hover). All should render identically.

- [ ] **Step 6.6: Commit**

  ```bash
  git add styling/controls.css
  git commit -m "refactor(css): delete button-inherited declarations from toggle/tab/breadcrumb"
  ```

---

## Task 7: Fix `HomeWeatherWidget` atom nesting

The current markup has an indentation anomaly — a `<Column>` wraps everything but the `<Row>` that holds the actual content, creating an unnecessary extra layer. Flatten to plain atom composition.

**Files:**
- Modify: `ui/components/home/HomeWidgetPanel.tsx`

- [ ] **Step 7.1: Fix the weather widget nesting**

  Current (lines 199–234, abridged):
  ```tsx
  <Surface pad="sm" className="home-widget full" ...>
    <Column gap={2} className="min-w-0">
      <Text size="eyebrow" id="hw-weather-title">Weather</Text>
      <Row align="center" justify="between" gap={3}>
        ...content...
      </Row>
    </Column>
  </Surface>
  ```

  Replace with:
  ```tsx
  <Surface pad="sm" className="home-widget full" aria-labelledby="hw-weather-title">
    <Text size="eyebrow" id="hw-weather-title">Weather</Text>
    <Row align="center" justify="between" gap={3}>
      <Row align="center" gap={3} className="min-w-0">
        <IconFrame size="xl" tone="accent">
          <Cloud size={22} aria-hidden="true" />
        </IconFrame>
        <Column gap={0} className="min-w-0">
          <Row align="baseline" gap={1}>
            <Metric value={18} size="md" />
            <Text size="detail" color="muted">°C</Text>
          </Row>
          <Text size="detail" color="muted">Partly cloudy</Text>
        </Column>
      </Row>
      <Row gap={3} aria-label="Weather details">
        <Column gap={1} align="center">
          <Text size="caption" color="muted" mono>12 km/h</Text>
          <Text size="caption" color="faint">Wind</Text>
        </Column>
        <Column gap={1} align="center">
          <Text size="caption" color="muted" mono>65%</Text>
          <Text size="caption" color="faint">Hum.</Text>
        </Column>
        <Column gap={1} align="center">
          <Text size="caption" color="muted" mono>UV 3</Text>
          <Text size="caption" color="faint">UV</Text>
        </Column>
      </Row>
    </Row>
  </Surface>
  ```

  The widget header (`Text size="eyebrow"`) sits as a direct child of `Surface`, matching every other widget in this file. The outer `Column` and the duplicate `min-w-0` are removed.

- [ ] **Step 7.2: Run typecheck**

  ```bash
  npx tsc --noEmit
  ```

  Expected: 0 errors.

- [ ] **Step 7.3: Verify weather widget in dev server**

  Weather widget should display: eyebrow label, then a row with temperature/conditions on the left and wind/humidity/UV stats on the right — identical to before, just cleaner markup.

- [ ] **Step 7.4: Commit**

  ```bash
  git add ui/components/home/HomeWidgetPanel.tsx
  git commit -m "refactor(home): flatten weather widget atom nesting"
  ```

---

## Task 8: Resolve `.widget-grid` / `.home-widget-grid` duplication in `home-widgets.css`

Known from Task 0: `.home-widget-grid` is used in `ui/screens/home/HomeScreen.tsx`; `.widget-grid` is used in `ui/components/widgets/WidgetGrid.tsx`. Their CSS declarations appear identical. Decide: if the separate names are intentional, keep both with an explanatory comment. If not, collapse to one — prefer `.widget-grid` (generic, matches the reusable component name).

**Files:**
- Modify or no-op: `styling/home-widgets.css`
- Possibly modify: `ui/screens/home/HomeScreen.tsx`

- [ ] **Step 8.1: Compare the two rule declarations in `home-widgets.css`**

  Read both blocks. If the CSS is byte-for-byte identical and neither has responsive overrides the other lacks, they are redundant — proceed to Step 8.2. If they differ in any meaningful way, add a comment to each explaining the distinction and skip to the no-op commit.

- [ ] **Step 8.2 (if redundant): Rename usages of `.home-widget-grid` to `.widget-grid` in `HomeScreen.tsx`**

  ```bash
  rg -n "home-widget-grid" -g "*.tsx"
  ```

  In each matched file, replace `className="home-widget-grid"` with `className="widget-grid"`.

- [ ] **Step 8.3 (if redundant): Delete the `.home-widget-grid` rule from `home-widgets.css`**

  Confirm no remaining references:

  ```bash
  rg -n "home-widget-grid" -g "*.tsx" -g "*.css"
  ```

  Expected: 0 results. Then delete the rule.

- [ ] **Step 8.4: Commit**

  ```bash
  git add styling/home-widgets.css ui/screens/home/HomeScreen.tsx
  git commit -m "refactor(css): collapse home-widget-grid into widget-grid"
  ```

  If the classes were intentionally distinct, commit only the explanatory comments:

  ```bash
  git add styling/home-widgets.css
  git commit -m "docs(css): document why widget-grid and home-widget-grid are kept separate"
  ```

---

## Task 9: Scan and replace raw typography class strings with `Text` props

Task 0 Step 0.2 identified candidates. This task acts on them.

**Files:**
- Modify: any files identified in Step 0.2 across all of `ui/` (includes `ui/molecules/`, `ui/components/`, etc.)
- No CSS changes — this is purely JSX

- [ ] **Step 9.1: For each match from Step 0.2, apply the replacement pattern**

  Pattern — before:
  ```tsx
  <span className="caption muted">...</span>
  <p className="detail faint truncate">...</p>
  <strong className="mono bold">...</strong>
  ```

  After:
  ```tsx
  <Text as="span" size="caption" color="muted">...</Text>
  <Text as="p" size="detail" color="faint" truncate>...</Text>
  <Text as="strong" mono bold>...</Text>
  ```

  **Do not** replace layout utilities (`min-w-0`, `grow`, `shrink-0`, `column`, `row`, `gap-N`). If a `className` mixes typography and layout utilities, move the typography concern to `Text` props and keep the layout utilities on a wrapping atom or the `className` prop of the atom.

- [ ] **Step 9.2: Run typecheck**

  ```bash
  npx tsc --noEmit
  ```

  Expected: 0 errors. `Text` `as` prop accepts all HTML element strings; `dateTime`, `htmlFor`, etc. pass through via the attribute spread.

- [ ] **Step 9.3: Verify in dev server**

  Review each changed component. Text should appear visually identical — same size, weight, color.

- [ ] **Step 9.4: Commit**

  ```bash
  git add ui/components/
  git commit -m "refactor(ui): replace raw typography className strings with Text atom props"
  ```

---

## Self-Review

**Spec coverage check:**
- ✅ Scope-check first: Task 0 confirms single-use before any deletion
- ✅ Principles made explicit: layout→atoms, typography→Text, domain state→data-*, behavior→atoms/molecules CSS
- ✅ Fewer classes: Tasks 2, 3, 4 remove ~10 named CSS layout classes
- ✅ Less BEM-style: `.sleep-main`, `.sleep-stage-labels`, `.stage-label`, `.session-head`, `.stat-tile-row` all eliminated
- ✅ CSS names don't describe their function: remaining classes in home-widgets.css are domain-semantic
- ✅ `ui/components/` now uses atomic components for layout: Row, Grid, Column handle what raw divs did
- ✅ Less font/color overrides: `data-stage` is scoped; `Text` props handle size/color
- ✅ CSS nesting: all new/moved rules use nested `& [data-stage]` syntax inside `.home-widget`
- ✅ Button inheritance: Tasks 1 and 6 delete all declarations already covered by the `buttons.css` base rule across combobox, command, toggle, tab, breadcrumb
- ✅ named-class evolution path noted for `:is()` popup items
- ✅ Surface className="grid" flagged for future review without scope-creeping this plan
- ✅ HomeWeatherWidget atom nesting fixed (Task 7)
- ✅ widget-grid duplication audited (Task 8)
- ✅ Raw typography class scan generalized and actioned (Task 9)

**Placeholder scan:** No TBDs. All code blocks are complete.

**Type consistency:**
- `Grid` imported from `@ui/layout` in both Task 2 and Task 3
- `Text` `size="detail"` maps to `'detail'` in `TextSize` union ✓
- `Text` `color="faint"` maps to `'faint'` in `TextColor` union ✓
- `Row align="start"` — `Align` type from `_classes.ts` includes `'start'` ✓
- `Column align="center"` — same `Align` type ✓

---

## Post-implementation: rebuild knowledge graph

After all tasks are complete, rebuild the Graphify knowledge graph so architecture queries reflect the new file state.

- [ ] **Rebuild graph**

  ```powershell
  $env:PYTHONIOENCODING='utf-8'; $env:PYTHONUTF8='1'; python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"
  ```

- [ ] **Run build verification**

  ```bash
  npm run build
  npx tsc --noEmit
  ```

  Expected: clean build, 0 type errors.
