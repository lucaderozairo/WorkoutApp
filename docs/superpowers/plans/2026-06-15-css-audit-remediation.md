# CSS Audit Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve P0–P3 findings from `docs/architecture/css-behavior-audit.md` — fix broken component visibility, eliminate layer violations, remove dead CSS, fix nesting violations, and resolve naming conflicts.

**Architecture:** Pure CSS changes where possible. One minimal TSX touch for `Alert.tsx` (broken variant rendering requires wiring a `data-tone` attribute — the CSS fix alone cannot work). Component migration (layout primitives, Text atoms) is deliberately excluded — see `docs/architecture/css-behavior-audit.md §Layout Overrides` and create a separate plan for that work.

**Tech Stack:** CSS Nesting, `@layer`, CSS custom properties. Linting: `npm run lint` (Stylelint + ESLint boundaries).

**Audit correction:** LB5 was a false positive. `StatusDot` tone classes (`status-live`, `status-online`, etc.) **do** have CSS — they are correctly nested inside `.status-dot {}` in `labels.css:117–141`. No fix needed.

---

## File Map

| File | Change type |
|------|-------------|
| `styling/tokens.css` | Add `--s-0-5`, `--s-2-5`, `--z-overlay`; fix `--color-warning` |
| `styling/feedback.css` | Add `.alert` tone variants; `.empty` moved here |
| `styling/labels.css` | Fix `&.accent .dot` nesting; remove `.empty`; remove redundant `.label` rule |
| `styling/overlays.css` | Move `.exercise-suggestions` out; nest `@starting-style`; fix `.filter-panel` duplicate; add z-index to `.bottom-sheet`; fix `.body` gap |
| `styling/session.css` | Receive `.exercise-suggestions`; remove `-webkit-overflow-scrolling`; remove fallback values; add `.trend-item` |
| `styling/data-display.css` | Remove `.trend-item` |
| `styling/layout.css` | Remove `.widget-grid`, `.widget-cell`, `.widget-add-tile`; remove `-webkit-overflow-scrolling` |
| `styling/home-widgets.css` | Receive `.widget-grid` family (fixed); nest internals inside `.home-widget` |
| `styling/surface.css` | Remove dead 360px media block |
| `styling/buttons.css` | Remove redundant `.custom-file-upload` rule; remove `input[type="submit"] flex` |
| `styling/forms.css` | Scope bare `form { }` rule; remove `.choice-title` redundant rule |
| `styling/map.css` | Remove `width/height:100%` from `.route-map-canvas` |
| `styling/training-plans.css` | Remove `.dashed`; change `oklab` → `srgb` |
| `styling/patterns.css` | Remove dead `.settings-section` container declaration |
| `styling/containers.css` | Fix `.full-screen { width: 100dvw }` → `width: 100%` |
| `styling/controls.css` | Nest combobox/command family rules |
| `styling/card-scroller.css` | Nest `.card-scroller-controls` inside `.card-scroller` |
| `styling/metric.css` | Remove `.icon-box` alias |
| `styling/global.css` | Fix `nav.css` layer import; rename to `app-shell.css` |
| `styling/nav.css` | Rename to `app-shell.css` |
| `styling/typography.css` | Scope bare `table { }` rule |
| `styling/reset.css` | Scope or remove bare `main { }` rule |
| `ui/molecules/Alert.tsx` | Add `.alert` class + `data-tone` attribute to Surface output |

---

## Task 1: Add missing tokens; fix `--color-warning`

**Files:** `styling/tokens.css`

- [ ] **Add the three missing tokens and fix the warning alias**

  In `tokens.css`, inside the first `:root { }` block (after `--s-8: 64px`), add:

  ```css
  --s-0-5: 2px;
  --s-2-5: 10px;
  ```

  In the z-index `:root` block (after `--z-fixed: 4`), add:

  ```css
  --z-overlay: 5;   /* widget-context-menu; above --z-fixed. Only for non-Popover overlays. */
  ```

  In the backward-compat aliases block, change:

  ```css
  /* was: */
  --color-warning: var(--bad);

  /* change to: */
  --color-warning: var(--warn);
  ```

- [ ] **Verify no caller expected the old red value**

  ```bash
  grep -r "color-warning" --include="*.ts" --include="*.tsx" --include="*.css" .
  ```

  Expected: only `tokens.css` itself and any direct `var(--color-warning)` calls. Audit each call site — "warning" semantically means yellow; any caller expecting red should switch to `var(--bad)` or `var(--color-error)` directly.

- [ ] **Remove the hardcoded fallback in `project-activity.css`**

  ```css
  /* was: */
  .dot.pain { width: var(--s-2-5, 10px); }

  /* change to: */
  .dot.pain { width: var(--s-2-5); }
  ```

- [ ] **Remove the sub-token calc in `home-widgets.css`**

  ```css
  /* was: */
  .sleep-stages { gap: calc(var(--s-1) / 2); }

  /* change to: */
  .sleep-stages { gap: var(--s-0-5); }
  ```

- [ ] **Run lint**

  ```bash
  npm run lint
  ```

  Expected: no new errors.

- [ ] **Commit**

  ```bash
  git add styling/tokens.css styling/project-activity.css styling/home-widgets.css
  git commit -m "fix(tokens): add --s-0-5, --s-2-5, --z-overlay; fix --color-warning alias to warn not bad"
  ```

---

## Task 2: Fix `--color-warning` / `.warning` naming in `utilities.css`

**Files:** `styling/utilities.css`

The `.warning` utility class sets `--status-color: var(--bad)` (red). Now that `--color-warning` points to yellow (`--warn`), this standalone `.warning` class is an independent collision — `.badge.tinted.warning` in project-activity means yellow, but `.warning` utility means red. Resolve by renaming the utility.

- [ ] **Rename `.warning` to `.error-tint` in `utilities.css`**

  ```css
  /* was: */
  .warning { --status-color: var(--bad); }

  /* change to: */
  .error-tint { --status-color: var(--bad); }
  ```

- [ ] **Find all callers of the `.warning` utility class**

  ```bash
  grep -r "className.*warning\|class.*warning" --include="*.tsx" --include="*.ts" .
  ```

  Update any TSX that passes `className="warning"` to use `className="error-tint"` instead. (Alert.tsx uses this — it will be replaced by the proper data-tone approach in Task 3.)

- [ ] **Commit**

  ```bash
  git add styling/utilities.css
  git commit -m "fix(utilities): rename .warning utility to .error-tint to end warning=red/yellow collision"
  ```

---

## Task 3: Fix Alert component — add `.alert` class and `data-tone` variants

**Files:** `ui/molecules/Alert.tsx`, `styling/feedback.css`

Alert has two bugs: (1) it never adds `.alert` to the Surface so `feedback.css` styles are dead; (2) warn/error variants look identical because `.warning` class set `--status-color` which nothing consumed.

- [ ] **Update `Alert.tsx` to emit `.alert` + `data-tone`**

  ```tsx
  // Replace the EXTRA_CLASS and className logic entirely:

  export function Alert({ variant, title, message, dismissible = false, onDismiss, action, className }: AlertProps) {
    return (
      <Surface
        variant={SURFACE_VARIANT[variant]}
        className={['alert', className].filter(Boolean).join(' ') || undefined}
        data-tone={variant}
        role="alert"
      >
        <Row align="center">
          <Column className="min-w-0">
            {title && <strong>{title}</strong>}
            <span className="caption">{message}</span>
          </Column>
          {action}
          {dismissible && onDismiss && (
            <Button variant="ghost" size="icon" onClick={onDismiss} aria-label="Dismiss">×</Button>
          )}
        </Row>
      </Surface>
    );
  }
  ```

  Remove the now-unused `EXTRA_CLASS` constant and `extra` variable.

- [ ] **Add tone-specific CSS to `feedback.css`**

  After the existing `.alert { }` block, add:

  ```css
  .alert {
    &[data-tone="info"]    { border: 1px solid var(--accent); background: var(--accent-soft); }
    &[data-tone="success"] {
      border: 1px solid color-mix(in srgb, var(--ok) 40%, transparent);
      background: color-mix(in srgb, var(--ok) 8%, var(--surface-1));
    }
    &[data-tone="warn"] {
      border: 1px solid color-mix(in srgb, var(--warn) 40%, transparent);
      background: color-mix(in srgb, var(--warn) 8%, var(--surface-1));
    }
    &[data-tone="error"] {
      border: 1px solid color-mix(in srgb, var(--bad) 40%, transparent);
      background: color-mix(in srgb, var(--bad) 8%, var(--surface-1));
    }
  }
  ```

  Note: the `.alert` base block should exist from before. If it doesn't yet have a base rule, add one:

  ```css
  .alert {
    padding: var(--s-3) var(--s-4);
    border-radius: var(--r-md);
    /* tone-specific overrides below */
    &[data-tone="info"]    { ... }
    ...
  }
  ```

- [ ] **Visual check:** Render all four Alert variants in the app. Confirm info is blue-tinted, success green-tinted, warn yellow-tinted, error red-tinted. Previously all four looked identical.

- [ ] **Commit**

  ```bash
  git add ui/molecules/Alert.tsx styling/feedback.css
  git commit -m "fix(alert): wire .alert class and data-tone; add per-variant border/bg in CSS"
  ```

---

## Task 4: Fix `nav.css` layer import and rename to `app-shell.css`

**Files:** `styling/global.css`, `styling/nav.css` → `styling/app-shell.css`

`nav.css` is imported as `layer(atoms)` but contains the entire app shell layout — it must be `layer(layout)`.

- [ ] **Rename the file**

  ```bash
  mv styling/nav.css styling/app-shell.css
  ```

- [ ] **Update the import in `global.css`**

  ```css
  /* was: */
  @import "./nav.css" layer(atoms);

  /* change to: */
  @import "./app-shell.css" layer(layout);
  ```

- [ ] **Run lint and build**

  ```bash
  npm run lint && npm run build
  ```

  Expected: no errors. Verify the app shell still renders correctly (header, sidebar, content area).

- [ ] **Commit**

  ```bash
  git add styling/global.css styling/app-shell.css
  git commit -m "fix(css): rename nav.css → app-shell.css; move from layer(atoms) to layer(layout)"
  ```

---

## Task 5: Move domain classes out of `layout.css`

**Files:** `styling/layout.css`, `styling/home-widgets.css`

`.widget-grid`, `.widget-cell`, `.widget-add-tile` are domain vocabulary in the layout layer. `.widget-add-tile` also references 4 undefined tokens.

- [ ] **Remove the three classes from `layout.css`**

  Delete this entire block from `layout.css`:

  ```css
  /* ── Widget grid ── */
  .widget-grid { ... }
  .widget-cell { ... }
  .widget-add-tile { ... }
  ```

- [ ] **Add them to `home-widgets.css` with fixed tokens**

  At the bottom of `home-widgets.css`, add:

  ```css
  /* ── Widget grid (moved from layout — domain vocab belongs in project layer) ── */
  .widget-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--s-2);
  }

  .widget-cell {
    min-width: 0;
  }

  .widget-add-tile {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--s-2);
    padding: var(--s-3);
    border: 1px dashed var(--line-strong);
    border-radius: var(--r-md);
    color: var(--ink-muted);
    background: var(--surface-1);
    cursor: pointer;

    &:hover { background: var(--surface-2); }
  }
  ```

  Note: the original `layout.css` version referenced undefined tokens (`--border-subtle`, `--radius-md`, `--text-muted`, `--surface-raised`). The version above uses real tokens. Visually cross-check the widget add tile in the app and adjust if needed.

- [ ] **Remove `-webkit-overflow-scrolling: touch` from `layout.css`**

  Find and remove:
  ```css
  -webkit-overflow-scrolling: touch;
  ```
  from `.column.scroll { }`. This deprecated property has no effect in iOS 13+.

- [ ] **Run lint**

  ```bash
  npm run lint
  ```

- [ ] **Commit**

  ```bash
  git add styling/layout.css styling/home-widgets.css
  git commit -m "fix(css): move widget-grid/cell/add-tile from layout to project layer; fix undefined tokens"
  ```

---

## Task 6: Move domain classes from molecules layer to project layer

**Files:** `styling/overlays.css`, `styling/data-display.css`, `styling/labels.css`, `styling/session.css`, `styling/feedback.css`

Three classes are in the wrong layer: `.exercise-suggestions` (fitness term) in `overlays.css`, `.trend-item` (health concept) in `data-display.css`, `.empty` (feedback pattern) in `labels.css`.

- [ ] **Move `.exercise-suggestions` from `overlays.css` to `session.css`**

  Delete from `overlays.css`:
  ```css
  .exercise-suggestions {
    min-width: 220px;
    max-width: min(320px, calc(100vw - var(--s-4)));
  }
  ```

  Add to the bottom of `session.css`:
  ```css
  /* ── Exercise suggestion popover — domain popover sizing ── */
  .exercise-suggestions {
    min-width: 220px;
    max-width: min(320px, calc(100vw - var(--s-4)));
  }
  ```

- [ ] **Move `.trend-item` from `data-display.css` to `session.css`**

  Delete from `data-display.css` the entire `.trend-item` block.

  Add to the bottom of `session.css`:
  ```css
  /* ── Trend item — health metric list row ── */
  .trend-item {
    padding: var(--s-3) var(--s-5);
    border-bottom: 1px solid var(--line);
    min-width: 0;

    &:last-child { border-bottom: none; }

    & .trend-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  }
  ```

  Verify the existing properties from the original — add any that were in `data-display.css` but not shown here.

- [ ] **Move `.empty` from `labels.css` to `feedback.css`**

  Delete from `labels.css`:
  ```css
  .empty {
    text-align: center;
    & h3 { margin: 0; }
    & p { max-width: 48ch; margin: 0; text-wrap: pretty; }
  }
  ```

  Add to `feedback.css` (after the `.loading-state` block):
  ```css
  /* ── Empty state ── */
  .empty {
    text-align: center;
    & h3 { margin: 0; }
    & p { max-width: 48ch; margin: 0; text-wrap: pretty; }
  }
  ```

- [ ] **Run lint, verify visually**

  ```bash
  npm run lint
  ```

  Check: exercise suggestion popover still positions correctly; trend items still border correctly; empty states still center.

- [ ] **Commit**

  ```bash
  git add styling/overlays.css styling/data-display.css styling/labels.css styling/session.css styling/feedback.css
  git commit -m "fix(css): move exercise-suggestions, trend-item, empty to correct project/feedback layers"
  ```

---

## Task 7: Remove dead CSS — batch cleanup

**Files:** `styling/surface.css`, `styling/buttons.css`, `styling/forms.css`, `styling/labels.css`, `styling/map.css`, `styling/training-plans.css`, `styling/patterns.css`, `styling/session.css`

All removals in this task are safe deletes — no visual or behavioral change intended.

- [ ] **`surface.css` — remove dead 360px media block**

  Delete the entire block:
  ```css
  @media (max-width: 360px) {
    padding: var(--s-3);
    gap: var(--s-2);
  }
  ```
  from inside `.surface { }`. The padding resets to its own default; `gap` on `display: block` has no effect.

- [ ] **`buttons.css` — remove two redundant rules**

  Line 93: Delete:
  ```css
  .custom-file-upload { background: var(--surface-1); color: var(--ink); }
  ```
  (Duplicates the base `:is()` selector defaults.)

  Line 97: Delete:
  ```css
  input[type="submit"] { flex: 1 1 0; }
  ```
  (Context-specific layout rule in the wrong layer.)

- [ ] **`forms.css` — remove redundant `.choice-title` rule**

  Delete:
  ```css
  .choice-title { color: var(--ink); }
  ```
  (Default ink color — no change.)

- [ ] **`labels.css` — remove redundant `.label` rule**

  Delete:
  ```css
  .label {
    color: var(--ink);
  }
  ```
  (Default ink color — no change.)

- [ ] **`map.css` — remove redundant size properties from `.route-map-canvas`**

  ```css
  /* was: */
  .route-map-canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  /* change to: */
  .route-map-canvas {
    position: absolute;
    inset: 0;
  }
  ```
  (`inset: 0` already covers full-size with `position: absolute`.)

- [ ] **`training-plans.css` — remove `.dashed` (shadowed by utilities layer)**

  Delete:
  ```css
  .dashed { border-style: dashed; }
  ```
  The utilities layer version wins in the cascade; this project-layer copy is dead.

- [ ] **`patterns.css` — remove dead container declaration**

  Delete from `.settings-section { }`:
  ```css
  container: settings-section / inline-size;
  ```
  No `@container settings-section { }` rules exist anywhere. If container queries are added later, re-add the declaration at that time.

- [ ] **`session.css` — remove deprecated vendor prefix and redundant fallback**

  From `.exercise-rail { }`, delete:
  ```css
  -webkit-overflow-scrolling: touch;
  ```

  From `.bottom-banner { }`, change:
  ```css
  /* was: */
  left: var(--s-2, 12px);
  right: var(--s-2, 12px);

  /* change to: */
  left: var(--s-2);
  right: var(--s-2);
  ```

- [ ] **Run lint**

  ```bash
  npm run lint
  ```

- [ ] **Commit**

  ```bash
  git add styling/surface.css styling/buttons.css styling/forms.css styling/labels.css styling/map.css styling/training-plans.css styling/patterns.css styling/session.css
  git commit -m "chore(css): remove dead/redundant rules — vendor prefix, junk media block, default-value restatements"
  ```

---

## Task 8: Scope bare element rules

**Files:** `styling/forms.css`, `styling/reset.css`, `styling/typography.css`

Bare element rules (`form`, `main`, `table`) apply globally and override component intent.

- [ ] **`forms.css` — scope bare `form { }` rule**

  ```css
  /* was: */
  form {
    padding: var(--s-2);
    border-radius: var(--r-xs);
  }

  /* change to — opt-in class for forms that need padding: */
  .form-padded {
    padding: var(--s-2);
    border-radius: var(--r-xs);
  }
  ```

  Grep for `<form` in TSX and add `className="form-padded"` to any form element that currently relies on this padding:

  ```bash
  grep -r "<form" --include="*.tsx" .
  ```

- [ ] **`reset.css` — remove bare `main { padding }` rule**

  The app shell uses `.content`, not `<main>`. Delete:
  ```css
  main { padding: var(--s-3); }
  ```

  If any screen renders a semantic `<main>` and needs padding, it should use the `.content` class or a utility class explicitly.

- [ ] **`typography.css` — scope bare `table { text-align: left }`**

  ```css
  /* was: */
  table { text-align: left; }

  /* change to: */
  .table-default { text-align: left; }
  ```

  Grep for table usage and add `className="table-default"` as needed:

  ```bash
  grep -r "<table" --include="*.tsx" .
  ```

  `splits-table` in `session.css` already has its own alignment rules so it won't be affected by removing the global rule.

- [ ] **Run lint + visual check**

  ```bash
  npm run lint
  ```

  Check forms still render correctly; splits table alignment unchanged.

- [ ] **Commit**

  ```bash
  git add styling/forms.css styling/reset.css styling/typography.css
  git commit -m "fix(css): scope bare form/main/table element rules to opt-in classes"
  ```

---

## Task 9: Fix CSS nesting violations

**Files:** `styling/labels.css`, `styling/overlays.css`, `styling/card-scroller.css`

### labels.css

- [ ] **Nest `&.accent .dot` inside `&.accent`**

  ```css
  /* was: */
  .badge {
    &.accent { background: var(--accent); color: var(--accent-ink); }
    &.accent .dot { --dot-color: var(--accent-ink); }
  }

  /* change to: */
  .badge {
    &.accent {
      background: var(--accent);
      color: var(--accent-ink);
      & .dot { --dot-color: var(--accent-ink); }
    }
  }
  ```

### overlays.css

- [ ] **Nest `@starting-style` for modal inside `.modal { }`**

  ```css
  /* was: separate top-level block */
  @starting-style {
    .modal:popover-open { opacity: 0; transform: translateY(12px); }
  }

  /* change to: nested inside .modal { } */
  .modal {
    /* ... existing rules ... */
    @starting-style {
      &:popover-open { opacity: 0; transform: translateY(12px); }
    }
  }
  ```

- [ ] **Nest `@starting-style` for drawer inside `.drawer { }`**

  ```css
  /* was: */
  @starting-style {
    .drawer.drawer-right:popover-open { opacity: 0; transform: translateX(12px); }
    .drawer.drawer-left:popover-open  { opacity: 0; transform: translateX(-12px); }
  }

  /* change to: nested inside .drawer { } */
  .drawer {
    /* ... existing rules ... */
    @starting-style {
      &.drawer-right:popover-open { opacity: 0; transform: translateX(12px); }
      &.drawer-left:popover-open  { opacity: 0; transform: translateX(-12px); }
    }
  }
  ```

- [ ] **Consolidate the `.filter-panel` duplicate**

  `overlays.css` currently has:
  - `.dropdown { &.filter-panel { right: 0; left: auto; max-height: ...; } }` — scoped modifier
  - `.filter-panel { min-width: 280px; }` — flat orphan below

  The standalone `.filter-panel` is used as a standalone popover (not inside `.dropdown`). Add a comment to make this explicit and merge the `min-width` into the standalone form:

  ```css
  /* Standalone filter-panel popover — not inside .dropdown */
  .filter-panel {
    min-width: 280px;
  }

  .dropdown {
    min-width: 280px;
    &.filter-panel {
      right: 0;
      left: auto;
      max-height: calc(100dvh - 160px);
      overflow-y: auto;
    }
    &.actions {
      top: 100%;
      right: 0;
      min-width: 120px;
      & button { text-align: left; }
    }
  }
  ```

### card-scroller.css

- [ ] **Nest `.card-scroller-controls` inside `.card-scroller`**

  ```css
  /* was: flat sibling */
  .card-scroller-controls {
    @media (max-width: 780px) { display: none; }
  }

  /* change to: nested inside .card-scroller */
  .card-scroller {
    /* existing content */

    & .card-scroller-controls {
      @media (max-width: 780px) { display: none; }
    }
  }
  ```

- [ ] **Run lint + visual check**

  ```bash
  npm run lint
  ```

  Verify: modal/drawer entry animations still work; filter panel popover still renders at correct width; card scroller controls still hide on mobile.

- [ ] **Commit**

  ```bash
  git add styling/labels.css styling/overlays.css styling/card-scroller.css
  git commit -m "fix(css): nest badge .accent .dot, @starting-style blocks, card-scroller-controls"
  ```

---

## Task 10: Fix nesting in `controls.css` — combobox/command families

**Files:** `styling/controls.css`

`.combobox-list`, `.combobox-option`, `.command-list`, `.command-item`, `.command-empty` are flat siblings. They only make sense inside `.combobox` and `.command` respectively.

- [ ] **Refactor combobox family into `.combobox { }`**

  The shared base for `.combobox-option` (display, align, gap, min-height, font, cursor, transitions) moves into `.combobox`. Extract what's unique to combobox-option vs toggle:

  ```css
  .combobox {
    position: relative;
    min-width: 0;

    & .combobox-list {
      display: grid;
      gap: var(--s-1);
      margin-top: var(--s-1);
      padding: var(--s-1);
      border: 1px solid var(--line);
      border-radius: var(--r-sm);
      background: var(--surface-1);
      box-shadow: var(--shadow-2);
    }

    & .combobox-option {
      display: inline-flex;
      align-items: center;
      justify-content: flex-start;
      gap: var(--s-2);
      width: 100%;
      min-height: 36px;
      padding: var(--s-1) var(--s-3);
      font-family: var(--font-ui);
      font-size: var(--t-sm);
      font-weight: 500;
      color: var(--ink);
      background: transparent;
      border: 1px solid transparent;
      border-radius: var(--r-sm);
      text-align: left;
      cursor: pointer;
      transition:
        background-color var(--duration-short) var(--ease),
        border-color var(--duration-short) var(--ease);

      &:not(:disabled):hover  { background: var(--surface-2); }
      &:active                { transform: scale(0.98); }
      &[aria-selected="true"] { background: var(--surface-2); border-color: var(--line-strong); }
    }
  }
  ```

- [ ] **Refactor command family into `.command { }`**

  ```css
  .command {
    position: relative;
    min-width: 0;

    & .command-list {
      display: grid;
      gap: var(--s-1);
      margin-top: var(--s-1);
      padding: var(--s-1);
      border: 1px solid var(--line);
      border-radius: var(--r-sm);
      background: var(--surface-1);
      box-shadow: var(--shadow-2);
    }

    & .command-item {
      display: inline-flex;
      align-items: center;
      justify-content: flex-start;
      gap: var(--s-2);
      width: 100%;
      min-height: 36px;
      padding: var(--s-1) var(--s-3);
      font-family: var(--font-ui);
      font-size: var(--t-sm);
      font-weight: 500;
      color: var(--ink);
      background: transparent;
      border: 1px solid transparent;
      border-radius: var(--r-sm);
      text-align: left;
      cursor: pointer;
      transition:
        background-color var(--duration-short) var(--ease),
        border-color var(--duration-short) var(--ease);

      &:not(:disabled):hover  { background: var(--surface-2); }
      &:active                { transform: scale(0.98); }
      &[aria-selected="true"] { background: var(--surface-2); border-color: var(--line-strong); }
    }

    & .command-empty { padding: var(--s-2); }
  }
  ```

- [ ] **Remove the old flat rules from `controls.css`**

  After adding the nested versions above, delete the original flat `.combobox, .command { }`, `.combobox-list, .command-list { }`, `.combobox-option, .command-item { }`, and `.command-empty { }` blocks. Also remove `.combobox-option, .command-item` from the shared `.toggle, .combobox-option, .command-item, .breadcrumb-button` base selector — the base is now redundant for those two since their styles are inside the parent rule.

  The shared base selector becomes:
  ```css
  .toggle,
  .breadcrumb-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--s-2);
    min-height: 40px;
    padding: var(--s-1) var(--s-3);
    font-family: var(--font-ui);
    font-size: var(--t-sm);
    font-weight: 500;
    color: var(--ink);
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--r-sm);
    cursor: pointer;
    transition:
      background-color var(--duration-short) var(--ease),
      border-color var(--duration-short) var(--ease),
      color var(--duration-short) var(--ease),
      transform var(--duration-short) var(--ease);

    &:disabled { cursor: default; color: var(--ink-faint); }
    &:not(:disabled):hover { background: var(--surface-2); }
    &:active { transform: scale(0.98); }
  }
  ```

- [ ] **Verify combobox and command palette visually**

  Open a screen with a combobox and a command palette. Verify: options hover correctly, selected state renders, list has correct border and shadow.

- [ ] **Run lint**

  ```bash
  npm run lint
  ```

- [ ] **Commit**

  ```bash
  git add styling/controls.css
  git commit -m "refactor(css): nest combobox and command family rules inside parent blocks"
  ```

---

## Task 11: Fix nesting in `home-widgets.css`

**Files:** `styling/home-widgets.css`

Seven flat rules only make sense inside `.home-widget`. Nest them to enforce the relationship and prevent accidental global scope leakage.

- [ ] **Verify each class isn't used outside a `.home-widget` wrapper in JSX**

  ```bash
  grep -r "sleep-main\|sleep-stage-labels\|stage-label\|score-circle\|status-word\|session-head\|stat-tile-row" --include="*.tsx" .
  ```

  Each should appear only inside a widget component. If any appear standalone in a screen, they'll need to remain flat or the nesting scope needs adjusting.

- [ ] **Nest flat internals inside `.home-widget { }`**

  Move the following blocks inside `.home-widget { }` as descendant rules:

  ```css
  .home-widget {
    display: grid;
    gap: var(--s-3);
    min-height: 100px;

    &.full    { grid-column: 1 / -1; }
    &.compact { min-height: 116px; }
    &.centered { justify-items: center; text-align: center; }

    .bar.multi { height: 22px; border-radius: var(--r-sm); }

    /* ── Nested internals (previously flat) ── */

    & .sleep-main {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: var(--s-3);
      align-items: start;
    }

    & .sleep-stage-labels {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--s-2);
    }

    & .stage-label {
      display: grid;
      gap: var(--s-1);
      min-width: 0;
      text-align: center;

      strong { font-size: var(--t-sm); font-weight: 700; }
    }

    & .score-circle {
      --score-color: var(--accent);
      width: 56px;
      height: 56px;
      border-radius: var(--r-pill);
      display: grid;
      place-items: center;
      font-family: var(--font-mono);
      font-variant-numeric: tabular-nums;
      font-weight: 700;
      font-size: var(--t-lg);
      border: 2px solid color-mix(in srgb, var(--score-color) 40%, transparent);
      background: color-mix(in srgb, var(--score-color) 12%, var(--surface-1));
      color: var(--score-color);

      &[data-tone="sleep"] { --score-color: var(--color-sleep-rem); }
      &[data-tone="ok"]    { --score-color: var(--ok); }
      &[data-tone="warn"]  { --score-color: var(--warn); }
      &[data-tone="bad"]   { --score-color: var(--bad); }
    }

    & .status-word {
      font-size: var(--t-xs);
      font-weight: 700;

      &[data-tone="ok"]   { color: var(--ok); }
      &[data-tone="warn"] { color: var(--warn); }
      &[data-tone="bad"]  { color: var(--bad); }
    }

    & .session-head {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      align-items: center;
      gap: var(--s-3);
    }

    & .stat-tile-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--s-2);
    }
  }
  ```

  Delete the seven previously-flat rule blocks that are now nested.

- [ ] **Run lint + visual check**

  ```bash
  npm run lint
  ```

  Open the home screen. Verify all widgets render identically: sleep widget, readiness, session card, stat tiles.

- [ ] **Commit**

  ```bash
  git add styling/home-widgets.css
  git commit -m "refactor(css): nest home-widget internals inside .home-widget to enforce scope"
  ```

---

## Task 12: Fix remaining correctness bugs

**Files:** `styling/containers.css`, `styling/overlays.css`, `styling/training-plans.css`, `styling/metric.css`

- [ ] **`containers.css` — fix `.full-screen` horizontal scrollbar**

  ```css
  /* was: */
  .full-screen {
    width: 100dvw;
    height: 100dvh;
    position: absolute;
  }

  /* change to: */
  .full-screen {
    position: absolute;
    inset: 0;
  }
  ```

  `inset: 0` with `position: absolute` is equivalent to `top:0; right:0; bottom:0; left:0` — filling the containing block without the scrollbar issue of `100dvw`.

- [ ] **`overlays.css` — add `display: flex; flex-direction: column` to `.bottom-sheet .body`**

  `.body` inside `.bottom-sheet` sets `gap` but has no flex context, so `gap` is silently dead.

  ```css
  & .body {
    display: flex;
    flex-direction: column;
    gap: var(--s-3);
    padding: 0 var(--s-4) var(--s-4);
  }
  ```

- [ ] **`overlays.css` — add z-index to `.bottom-sheet`**

  ```css
  .bottom-sheet {
    /* add: */
    z-index: var(--z-fixed);
    /* ...existing rules... */
  }
  ```

- [ ] **`training-plans.css` — standardize color-mix color space**

  Find all `color-mix(in oklab, ...)` and change to `color-mix(in srgb, ...)`. This file is the only one using `oklab`.

  ```bash
  grep -n "oklab" styling/training-plans.css
  ```

  Replace each `oklab` with `srgb`. Visually verify day-circle tints look correct.

- [ ] **`metric.css` — remove `.icon-box` alias**

  First check no TSX uses `.icon-box`:
  ```bash
  grep -r "icon-box" --include="*.tsx" .
  ```

  If the result is empty, delete from `metric.css`:
  ```css
  /* was: */
  .icon-box, .icon-frame { ... }

  /* change to: */
  .icon-frame { ... }
  ```

  If any TSX uses `icon-box`, update those files to use `icon-frame` first.

- [ ] **Run lint + visual check**

  ```bash
  npm run lint
  ```

  Verify: bottom-sheet animation and body content spacing; full-screen map fills correctly; day-circle colors; icon frames.

- [ ] **Commit**

  ```bash
  git add styling/containers.css styling/overlays.css styling/training-plans.css styling/metric.css
  git commit -m "fix(css): full-screen dvw→inset; bottom-sheet z-index and body flex; oklab→srgb; remove icon-box alias"
  ```

---

## Task 13: Remove backward-compat token aliases

**Files:** `styling/tokens.css`, `styling/utilities.css`

- [ ] **Audit usage of `--spacing-*` and `--border-radius-*` aliases**

  ```bash
  grep -r "spacing-\|border-radius-" --include="*.tsx" --include="*.ts" --include="*.css" .
  ```

  If no files outside `tokens.css` reference these aliases, delete them from `tokens.css`:

  ```css
  /* delete the entire "Backward-compat aliases" spacing block: */
  --spacing-1: var(--s-1);
  --spacing-2: var(--s-2);
  /* ... etc */

  /* delete the border-radius aliases: */
  --border-radius-0: 0;
  --border-radius-1: var(--r-xs);
  /* ... etc */
  ```

- [ ] **Remove `.radius-0` through `.radius-3` from `utilities.css`**

  First check usage:
  ```bash
  grep -r "radius-0\|radius-1\|radius-2\|radius-3\b" --include="*.tsx" --include="*.ts" .
  ```

  If no TSX uses them, delete the four legacy utilities. The modern `.r-xs`, `.r-sm`, `.r-md`, `.r-pill` equivalents exist.

- [ ] **Run lint**

  ```bash
  npm run lint
  ```

- [ ] **Commit**

  ```bash
  git add styling/tokens.css styling/utilities.css
  git commit -m "chore(css): remove backward-compat token aliases and legacy radius utilities"
  ```

---

## Task 14: Add `--s-2-5` removal and `--s-0-5` to `project-activity.css` (follow-up from Task 1)

This task is already complete if Task 1 was done in full. Verify:

- [ ] **Confirm `--s-2-5` is now used without fallback**

  ```bash
  grep -n "s-2-5" styling/project-activity.css
  ```

  Expected: `var(--s-2-5)` with no fallback value.

- [ ] **Confirm `--s-0-5` is used in home-widgets.css**

  ```bash
  grep -n "s-0-5" styling/home-widgets.css
  ```

  Expected: `gap: var(--s-0-5)` in `.sleep-stages`.

If either is still showing the old value, apply the fixes from Task 1 now.

---

## Verification Checklist

After all tasks are complete:

- [ ] `npm run lint` — zero errors
- [ ] `npm run build` — zero TypeScript errors
- [ ] Home screen: all 6 widget types render correctly
- [ ] Training log / session screen: exercise rail, splits table, event cards
- [ ] Alert component: render all 4 variants (info blue, success green, warn yellow, error red)
- [ ] Combobox and command palette: options hover, select, keyboard nav
- [ ] Bottom sheet: opens, closes, body content is vertically stacked
- [ ] Card scroller: hides prev/next controls on mobile
- [ ] Map screen: route map fills container, no horizontal scrollbar
- [ ] Dark mode: toggle theme, verify all above still correct

---

## Out of Scope (Separate Plan)

The following items from the audit are intentionally excluded from this plan and should be addressed in a separate component-migration plan:

- Replace CSS-only layouts (`.sleep-stage-labels`, `.stat-tile-row`, `.stage-label`) with `<Grid>`/`<Column>` layout components in JSX
- Replace `<strong>` + CSS typography with `<Text bold size="detail">` atoms in JSX
- Replace `.splits-table td:first-child` CSS typography with `<Text>` atoms
- Replace `.route-card-icon` CSS with `.icon-frame` atom composition in JSX
- Fix `<Chip>` element type from `<span>` → `<button>` for keyboard accessibility
- Migrate `.active` class usages to `aria-pressed`/`aria-selected`/`aria-current`
- Expand `Text` atom size vocabulary to cover `--t-lg` / `--t-2xs` gaps
