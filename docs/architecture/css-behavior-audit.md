# CSS Behavior Audit

**Date:** 2026-06-15  
**Scope:** All 30 CSS files in `styling/`  
**Method:** Read every rule, cross-reference against TSX components, identify junk/dead/misplaced CSS

---

## Layer Architecture

CSS layers declared in `global.css`:
```
reset → tokens → base → layout → atoms → molecules → patterns → project → utilities → overrides
```

Each file is imported via `@import "./x.css" layer(...)`.

---

## File-by-File Analysis

---

### `tokens.css` → `@layer tokens`

**Behavior:** Defines all design tokens. Two static `:root` blocks (theme-agnostic constants and `light-dark()` semantic values), z-index scale, shadow aliases, and per-theme `[data-theme]` overrides. High-contrast overrides via `@media (prefers-contrast: more)` and `[data-contrast="high"]`.

**Issues:**

| # | Severity | Finding |
|---|----------|---------|
| T1 | High | `--color-warning: var(--bad)` aliases "warning" → red (`--bad`), but `--warn` (yellow) is the semantic warning color. All callers that reference `--color-warning` expecting yellow will get red. |
| T2 | High | No `--z-overlay` defined. Z-index scale stops at `--z-fixed: 4`. Several callers in `overlays.css` and `utilities.css` use `var(--z-overlay)` which will resolve to empty → `z-index: 0`. |
| T3 | Medium | Backward-compat aliases `--spacing-1…8` and `--border-radius-0…3` add ~20 lines of token bloat. Should audit if any TSX/CSS still references them before deleting. |
| T4 | Low | No `--s-2-5` (10px, between `--s-2` and `--s-3`). `project-activity.css` uses `var(--s-2-5, 10px)` with a hardcoded fallback. Either add the token or switch to a compose of two tokens. |
| T5 | Low | `--box-shadow-md` is defined in the default `:root` block but is NOT in the `light-dark()` block. It gets per-theme overrides in `[data-theme]` blocks, so it's effectively correct — but it doesn't follow the `--shadow-1/2` alias pattern established by `--box-shadow-sm/lg`. Minor inconsistency. |

---

### `reset.css` → `@layer reset`

**Behavior:** Box-sizing inheritance, `html/body/#root` base typography, `*:focus-visible` ring (outline + offset), selection highlight, SVG `fill: currentColor`, reduced-motion kill-switch for transitions/animations, `body` theme-transition, `[hidden]` display.

**Issues:**

| # | Severity | Finding |
|---|----------|---------|
| R1 | Medium | `main { padding: var(--s-3); }` is a bare element rule in reset. The app shell uses `.content` not `<main>`, so this likely never fires — but it will conflict with any `<main>` element in semantic markup and override `.fill-screen` padding-none intent. |
| R2 | Low | `*:focus-visible { border-radius: 2px; }` hardcodes 2px rather than a token (`--r-xs: 4px` would be closer). Minor. |

---

### `typography.css` → `@layer base`

**Behavior:** Geist font-face import, `h1–h6` size/weight/line-height, `.display/.brand/.eyebrow` display utilities, text semantic utilities (`.bold`, `.positive`, `.negative`, `.muted`, `.faint`, `.mono`, `.uppercase`), links (`a { color: var(--ink); }`, `a.active { color: var(--accent); }`), legacy `.detail` and `.caption` size classes.

**Issues:**

| # | Severity | Finding |
|---|----------|---------|
| TY1 | Medium | `table { text-align: left; }` is a bare element rule. Any component that needs right-aligned or centered table content must override this globally. Should scope it to a utility class instead. |
| TY2 | Low | `.display` sets font-family, font-weight, letter-spacing, line-height but **no `font-size`**. The `Text` atom supplies size via props, but `.display` used as a standalone class produces no visual change in size. Intentional? If so, comment it. |
| TY3 | Low | `.detail` and `.caption` marked as legacy but still referenced in `Alert.tsx` (`.caption` class on the message span). Cannot delete until Alert.tsx is updated. |

---

### `layout.css` → `@layer layout`

**Behavior:** `@property` registrations for grid custom properties (animatable). `.grid` container with column/row/auto-fill/gap variants. `.grid-item` span helpers. `.layered` / `.layer` stacking container with 18 `.layer-pin-*` position classes. `.row/.column` flex primitives with gap, align, wrap, scroll, and divide variants. `.cluster` for wrapped flex content. **Also defines `.widget-grid`, `.widget-cell`, `.widget-add-tile`.**

**Issues:**

| # | Severity | Finding |
|---|----------|---------|
| L1 | **Critical** | `.widget-grid`, `.widget-cell`, `.widget-add-tile` are **domain vocabulary** (widgets) in `@layer layout`. Per CLAUDE.md, domain vocabulary must live in `@layer project`. These must move to `home-widgets.css`. |
| L2 | High | `.widget-add-tile` references `--border-subtle`, `--radius-md`, `--text-muted`, `--surface-raised` — **none of these tokens exist in `tokens.css`**. They resolve to empty, making `.widget-add-tile` visually broken in production. |
| L3 | Low | `.column.scroll { overflow-y: auto; -webkit-overflow-scrolling: touch; }` — the `-webkit-overflow-scrolling` vendor prefix is deprecated and has no effect in modern Safari (removed in iOS 13+). Dead rule. |

---

### `surface.css` → `@layer atoms`

**Behavior:** `.surface` base (padding `--s-3`, radius `--r-md`, background `--surface-1`, box-shadow). Padding modifiers: `.pad-sm`, `.pad-xs`, `.pad-none`. Visual modifiers: `.plain` (transparent border+shadow), `.flat` (no shadow), `.accent` (accent-soft bg), `.ghost` (transparent bg+border), `.inset` (surface-2 bg, dashed border), `.pinned` (fixed to viewport bottom via `position: sticky`). Interactive state: `.interactive` (hover color-mix + lift), `.selected` (accent-soft highlight). Compact density: `.compact` reduces gap.

**Issues:**

| # | Severity | Finding |
|---|----------|---------|
| S1 | Medium | `@media (max-width: 360px)` sets `padding: var(--s-3)` — identical to the default padding. This rule does nothing. It also sets `gap: var(--s-2)` but `.surface` is `display: block`, so `gap` has no effect on block layout. **Junk rule.** |
| S2 | Low | `.pinned` variant uses `position: sticky; bottom: 0; z-index: var(--z-controls)`. This works inside a scrollable container but behaves unexpectedly if the surface is not inside a scroll container. Behavior is undocumented. |
| S3 | Info | `.ghost` is transparent background+border, `.plain` is transparent border+shadow only. The distinction is subtle and not documented. Ghost is used by the buttons layer (buttons inherit surface?), plain is used for flat card contexts. Consider a comment. |

---

### `buttons.css` → `@layer atoms`

**Behavior:** Long `:is(button, .button, .choice-card, input[type="button"], ...)` base for all interactive controls. Sets display, gap, padding, font, color, background, border, radius, cursor, transition. Hover: lighter background. Active: scale(0.98). Variants: `.primary` (accent bg, no border), `.secondary` (surface-1), `.ghost` (transparent), `.destructive` (red tint). Sizes: `.sm`, `.lg`, `.icon`, `.fab`, `.block`. `.active` state class. `[data-variant="dashed"]` border.

**Issues:**

| # | Severity | Finding |
|---|----------|---------|
| B1 | Medium | `.custom-file-upload { background: var(--surface-1); color: var(--ink); }` at line 93 is **fully redundant** — these are already the defaults set in the `:is()` base selector at lines 11-12. |
| B2 | Medium | `input[type="submit"] { flex: 1 1 0; }` at line 97 forces submit buttons to flex-grow. This only makes sense inside a flex container and is otherwise a no-op. Context-specific rule in the wrong layer — belongs in a form pattern. |
| B3 | Low | `.icon { border-radius: var(--s-2); }` uses a spacing token (`--s-2: 8px`) for border-radius instead of a radius token (`--r-sm: 8px`). Both resolve to 8px, but the intent is radius semantics. |
| B4 | Low | `.choice-card` in the base `:is()` selector means choice cards get all button defaults (including `border: 1px solid var(--line-strong)`), then `forms.css` overrides most of these. This creates a cascade chain that's hard to trace. Better to exclude `.choice-card` from the button base. |
| B5 | Low | `.active` class at base level (`background: var(--surface-2)`) conflicts with `.ghost.active` variant (`background: var(--accent)`). The ghost `.active` specificity wins via nesting, but the base `.active` runs first on non-ghost buttons. The specificity is correct but the ordering is non-obvious. |

---

### `forms.css` → `@layer atoms`

**Behavior:** Base input/textarea/select styles. `.field` container (column flex). `.field-label` typography. `.field-hint` muted caption. `.field-row` for side-by-side fields. `.field-label-row` for label+action row. `.radio-group`. `.radio-option` with `:has(input:checked)` for selected state and `:has(input:disabled)` for disabled state. `.choice-card` and its internals (`.choice-card-inner`, `.choice-copy`, `.choice-title`).

**Issues:**

| # | Severity | Finding |
|---|----------|---------|
| F1 | High | `form { padding: var(--s-2); border-radius: var(--r-xs); }` is a bare element rule that applies padding to **every `<form>` element** including invisible wrappers. This will break any form that expects to fill its container without padding. Should be a class. |
| F2 | Low | `.choice-title { color: var(--ink); }` sets ink color, which is the default. **Redundant rule.** |
| F3 | Low | `.field-label-row` sets `width: 100%` and `justify-content: space-between`. The class name is very generic and doesn't signal its two-column-label intent. No TSX component named `FieldLabelRow` exists — likely composed inline. |

---

### `labels.css` → `@layer atoms`

**Behavior:** `.badge` (pill label with optional `.tinted` tone variants: `.ok`, `.warn`, `.bad`), `.chip` (interactive filter pill), `.tag` (colored dot via `::before` pseudo), `.label` (text label base), `.dot` (colored circle indicator with pulse animation on `.active`), `.dot.stretch` (elongated dot), `.status-dot` (animated wrapper with tone-class → `--dot-color`). **Also defines `.empty`.**

**Issues:**

| # | Severity | Finding |
|---|----------|---------|
| LB1 | High | `.empty { text-align: center; }` is **misplaced**. Empty state is a feedback/pattern concept, not a label atom. It belongs in `feedback.css` or `patterns.css`. |
| LB2 | Medium | `.label { color: var(--ink); }` is the default ink color. **Redundant rule** — adds no visual change. |
| LB3 | Medium | `.chip { cursor: pointer; }` but `Chip.tsx` renders as a `<span>` element, not a `<button>`. A span with `cursor: pointer` has no keyboard affordance. The chip should be a `<button>` or `<label>` for accessibility. |
| LB4 | Low | `.chip.source` modifier has no documentation. No TSX component found that uses `chip source`. Likely a legacy class. Candidate for removal. |
| LB5 | Low | The `.status-dot` tone classes (`status-live`, `status-online`, etc.) set `--dot-color` via the atoms layer, but no CSS file in the `project` layer maps these semantic tones to actual activity-state colors. `StatusDot.tsx` produces class names like `status-live` but there are no matching CSS rules. The tones are silent — the dot will render with its default `--dot-color` value. |

---

### `controls.css` → `@layer molecules`

**Behavior:** Shared base for `.toggle, .combobox-option, .command-item, .breadcrumb-button`. `.switch` (toggle pill with thumb). `.tabs` + `.tab` + `.tab-indicator` (sliding indicator, `@starting-style`). `.toggle-group` wrapper. `.combobox` + `.combobox-list`. `.command` (command palette). `.breadcrumb`. `.search-input` (removes webkit cancel button). `.numeric-stepper`. `.page-control` + `.page-control-dot`. `.pagination`. `.color-picker`.

**Issues:**

| # | Severity | Finding |
|---|----------|---------|
| C1 | Medium | `.numeric-stepper .field { min-width: 72px; }` — `72px` is a magic number not derived from any token. Should be `var(--s-6)` (32px) × 2 + padding, or simply documented. |
| C2 | Medium | `.color-picker-input { width: 44px; min-width: 44px; min-height: 40px; }` — hardcoded dimensions not using spacing tokens. |
| C3 | Low | `.pagination { width: 100%; }` sets full width unconditionally. If pagination is used inside a flex row with `width: auto` siblings, this forces it to stretch. No TSX component verified to need this. |
| C4 | Low | `.search-input::-webkit-search-cancel-button { appearance: none; }` hides the webkit clear button but has no Firefox/non-webkit equivalent. Firefox doesn't have this button by default, so no issue — but it's undocumented. |

---

### `nav.css` → **WRONG LAYER: imported as `@layer atoms`**

**Behavior:** This file is the **entire app shell layout**: `.layout` (grid: nav sidebar + content), `.header` (top bar), `.content` (scrollable main area), `.menu` (sidebar nav with logo, items, badge), `.navbar` (mobile bottom bar), `.appbar` (mobile top bar), `.footer`. Responsive split: `.layout.app` vs `.layout.web`. Mobile drawer behavior via `:has(.navbar.open)`.

**Issues:**

| # | Severity | Finding |
|---|----------|---------|
| N1 | **Critical** | `nav.css` is imported as `layer(atoms)` in `global.css`, but contains full app shell layout. It must be `layer(layout)`. As atoms, it overrides layout-layer components it shouldn't interact with. |
| N2 | **Critical** | File name "nav.css" is misleading — this is the app shell. It should be renamed to `app-shell.css`. |
| N3 | Medium | `.menu .button.ghost` scopes ghost button styling within the sidebar. This is a context-based override which is acceptable, but it's undocumented and will silently affect any ghost button placed in the menu area. |

---

### `overlays.css` → `@layer molecules`

**Behavior:** Native Popover API overlays: `.modal`, `.drawer`, `.action-sheet` all use `popover` attribute + `:popover-open` state + `@starting-style` for entry animations. CSS Anchor Positioning for `.menu-popover` (with 14 `position-area` fallback variants). `.dropdown` and `.filter-panel` popover variants. `.bottom-sheet` (position:fixed). `.widget-context-menu`. `.exercise-suggestions` (search suggestion list for exercise picker).

**Issues:**

| # | Severity | Finding |
|---|----------|---------|
| O1 | **Critical** | `.widget-context-menu { z-index: var(--z-overlay); }` — `--z-overlay` is **undefined** in `tokens.css`. Resolves to `z-index: 0`, collapsing the context menu behind other content. |
| O2 | High | `.exercise-suggestions` is domain vocabulary (fitness term) in `@layer molecules`. This belongs in `session.css` (`@layer project`). **Layer violation.** |
| O3 | Medium | `.bottom-sheet` uses `position: fixed` but has **no `z-index`** set. It relies on stacking order. Unlike `.modal`/`.drawer` which use the Popover API top layer, bottom-sheet could be occluded by other `position: fixed` elements. |
| O4 | Low | 14 `position-area` variants on `.menu-popover` cover all compass directions. The actual app probably uses 2-3 of these. The rest are speculative — progressive enhancement is good, but the fallback chain adds complexity for little real benefit. |

---

### `feedback.css` → `@layer molecules`

**Behavior:** `.alert` (padded surface with border — wraps a `Surface` in TSX). `.toast-stack` (fixed position bottom-right container). `.toast` (individual notification with `@starting-style` entry, auto-dismiss via `animation-fill-mode: forwards`). `.loading-state` + `.loading-state-mark`.

**Issues:**

| # | Severity | Finding |
|---|----------|---------|
| FB1 | High | `Alert.tsx` applies `.warning` class from `utilities.css` (`--status-color: var(--bad)`) on the surface when variant is `warn` or `error`. But nothing in `surface.css` or `feedback.css` consumes `--status-color` on a surface. The `warn` and `error` Alert variants are **visually identical** to the default surface — the `.warning` class does nothing visible. Alert has no visual differentiation by severity. |
| FB2 | Medium | `.alert` has no tone/variant CSS. `Alert.tsx` has `AlertVariant = 'info' | 'success' | 'warn' | 'error'` but the CSS doesn't distinguish them (see FB1). |
| FB3 | Medium | `.empty` belongs here (or in `patterns.css`) but is in `labels.css` instead. See LB1. |

---

### `data-display.css` → `@layer molecules`

**Behavior:** `.chart-container` (relative positioned box with fixed height). `.chart-ylabel` (vertical text via `writing-mode: vertical-rl` + `rotate(180deg)`). `.trend-item` (padded list row with bottom border, truncated text, last-child no-border).

**Issues:**

| # | Severity | Finding |
|---|----------|---------|
| DD1 | High | `.trend-item` is a domain-specific pattern (health trend list item with icon + label + value) in `@layer molecules`. Domain vocabulary belongs in `@layer project`. **Layer violation.** |
| DD2 | Low | `.trend-item { padding: var(--s-3) var(--s-5); }` — `--s-5` is 24px horizontal padding, which is quite large for an inline list item. No component audit cross-reference confirms this is intentional. |

---

### `metric.css` → `@layer molecules`

**Behavior:** `.metric` (large number display, `--t-4xl`). `.unit` (inline unit suffix). `.data-value` (medium number display with `.data-value-date` and `.data-value-time` size variants). `.icon-box` and `.icon-frame` (both same selector — icon container). `.bar` + `.fill` (progress bar). `@property --ring-fill` (animatable percentage). `.progress-ring` (SVG ring with animated stroke-dashoffset).

**Issues:**

| # | Severity | Finding |
|---|----------|---------|
| M1 | Medium | `.icon-box, .icon-frame { ... }` — two names for the same component. `IconFrame.tsx` is the canonical name. `.icon-box` is an alias that creates confusion. Remove `.icon-box` references (check TSX usage first). |
| M2 | Low | `DataValue` only has CSS variants for `date` and `time`. No CSS for `distance`, `pace`, `weight`, `reps`, or other DataValue formats. The component likely handles these via number formatting only — but verify no visual variants are missing. |

---

### `avatar.css` → `@layer molecules`

**Behavior:** `.avatar` with `--size` custom property (default 45px), gradient background, pill border-radius, centered initials. Size variants: `.sm` (28px), `.lg` (56px), `.xl` (80px). Sport/status overrides live in `project-activity.css`.

**Issues:** None. File is clean and correctly scoped.

---

### `list.css` → `@layer molecules`

**Behavior:** `.vr` (1px flex divider). `.list-item` (padded row, adjacent-sibling border). `.list-divider` / `.list-divider-sm` (semantic `<hr>` with token border). `.check-row` (toggle list item with animated `.check-icon` and `.check-label`, `aria-checked` state). CSS-only expandable pattern: hidden `.exp-toggle` checkbox, `.exp-trigger` label, `.expandable` content shown via `:has()`. Chevron rotation on expanded.

**Issues:**

| # | Severity | Finding |
|---|----------|---------|
| LS1 | Medium | `.surface:has(> .exp-toggle)` and `.surface:has(> .exp-toggle:checked)` require `.exp-toggle` to be a **direct child** of `.surface`. Any DOM wrapper between surface and the checkbox breaks the expandable pattern silently. Consider using a class on the surface instead of the `:has(> child)` selector. |
| LS2 | Low | `.check-row [aria-checked="true"] .check-label { color: var(--ink-muted); }` dims the label when checked. This creates a counter-intuitive UX — checking something makes it greyed out (done/completed feel). Could be intentional for "completed workout set" semantics, but worth documenting. |

---

### `media.css` → `@layer molecules`

**Behavior:** `.carousel` (transform-based `--carousel-x` custom property, `overflow: hidden`, `--media-md` height). `.slide-caption` (absolute positioned overlay with gradient). `.photo-thumb` (fixed-height thumbnail with `object-fit: contain`).

**Issues:**

| # | Severity | Finding |
|---|----------|---------|
| MD1 | High | `.carousel button { background: color-mix(in srgb, black, transparent 52%); }` — uses raw `black` keyword, not a token. Should use `color-mix(in srgb, var(--ink) 80%, transparent)` or a dedicated overlay token. |
| MD2 | Low | `.photo-thumb > img { object-fit: contain; }` — `contain` preserves aspect ratio with letterboxing. Gallery thumbnails typically use `cover`. Possibly intentional for route photo previews that shouldn't be cropped. Undocumented. |

---

### `screen-header.css` → `@layer molecules`

**Behavior:** `.screen-header` (flex row, baseline align, gap, bottom border). `.header-slot` (min-width 40px for back button area).

**Issues:** None. File is clean and minimal.

---

### `patterns.css` → `@layer patterns`

**Behavior:** `.split-tabs-mobile` / `.split-tabs-split` (responsive tab layout). `.filter-bar` (horizontal pill filter row with container query). `.data-table-panel` (full-height scrollable panel). `.settings-section` (container + flex column). `.list-detail-layout` (two-column detail layout, collapses at 780px). `.toolbar-cluster` (compact toolbar row). `.table-of-contents` + `.toc-link` (hierarchical TOC with level-based indent via `--toc-level`). `.tree` (indented tree nav).

**Issues:**

| # | Severity | Finding |
|---|----------|---------|
| P1 | Medium | `.settings-section { container: settings-section / inline-size; }` declares a container query context but there are **no `@container settings-section { }` rules** anywhere in the codebase. Dead container declaration. |
| P2 | Low | `.list-detail-layout @media (max-width: 780px) { --grid-cols: 1fr; }` uses a media query to change a grid custom property. A container query would be more composable and consistent with other patterns. |

---

### `card-scroller.css` → `@layer patterns`

**Behavior:** `.card-scroller` (container query, `overflow-x: auto`, scroll snap, hidden scrollbar, overscroll-behavior). `.card-scroller-track` (grid auto-flow, snap alignment, `--card-scroller-card-width` responsive via container query at 720px). `.card-scroller-controls` (prev/next buttons, hidden on mobile via media query).

**Issues:**

| # | Severity | Finding |
|---|----------|---------|
| CS1 | Low | `--card-scroller-card-width: minmax(300px, 0.34fr)` at ≥720px container — `0.34fr` is a magic number. A comment explaining this fraction (approximately 3 cards visible) would help. |
| CS2 | Low | `.card-scroller-controls` uses `@media (max-width: 780px) { display: none; }` instead of a `@container` query. Inconsistent with the rest of the component that already has a container context. |

---

### `project-activity.css` → `@layer project`

**Behavior:** Domain-to-token color mapping for `.avatar`, `.badge`, `.dot`, `.icon-frame`, `.bar` per sport/sleep/rarity/pain. Badge `.tinted` variants for `.good/.warning/.poor` (domain aliases for status tones). `@keyframes sibling-shimmer` with `sibling-index()` for staggered skeleton loading.

**Issues:**

| # | Severity | Finding |
|---|----------|---------|
| PA1 | High | `.dot.pain { width: var(--s-2-5, 10px); }` — `--s-2-5` is undefined. Falls back to `10px` hardcoded. Either add `--s-2-5: 10px` to tokens or use `calc(var(--s-2) + var(--s-1) / 2)`. |
| PA2 | Medium | `.badge.tinted.warning` maps to `var(--warn)` (yellow), but `tokens.css` has `--color-warning: var(--bad)` (red). **`warning` means yellow here and red in tokens.** This is an active naming conflict that will cause bugs if components reference both. Canonical status vocabulary should be `ok/warn/bad` only; all `good/warning/poor` and `success/warning/error` aliases should map unambiguously. |
| PA3 | Low | `@keyframes sibling-shimmer` uses `sibling-index()` which is experimental (CSS Working Group proposal, not yet in any browser). The fallback `nth-child` animation is present but not documented as the primary path. |

---

### `session.css` → `@layer project`

**Behavior:** `.exercise-rail` (sticky horizontal exercise filter, horizontal scroll). `.splits-table` (grid for split-time data). `.event-card` (training event card with sport color). `.block` (exercise block with expand/collapse). `.bottom-banner` (fixed bottom CTA bar). `.session-header-top` (gradient status header). `.set-number` (circular set counter).

**Issues:**

| # | Severity | Finding |
|---|----------|---------|
| SE1 | High | `.exercise-rail { -webkit-overflow-scrolling: touch; }` — this property was deprecated and removed in iOS 13 (2019). It has zero effect in all modern browsers. **Dead rule.** |
| SE2 | Low | `var(--s-2, 12px)` used in `.bottom-banner { left/right }` — the fallback `12px` exactly matches `--s-2`. Redundant fallback. |

---

### `calendar.css` → `@layer project`

**Behavior:** `.cal .day` (button grid cell, circular hover, today highlight via `[data-today]`, selected state via `aria-selected`).

**Issues:** None. Clean and minimal.

---

### `home-widgets.css` → `@layer project`

**Behavior:** `.home-widget-grid` (2-col grid). `.home-widget` (card shell with full/compact/centered modifiers). Sleep widget internals: `.sleep-main`, `.sleep-stage-labels`, `.stage-label`. `.score-circle` with `--score-color` custom property and tone data-attributes. `.status-word` (tone-colored label). `.streak-icon`. `.session-head` (3-col grid). `.stat-tile-row` (3-col grid). `.sleep-stages` bar segments. `.readiness-ring` (SVG ring using `--ring-stroke` / `--ring-dash`). `.macro-segment` proportional flex fills. `.week-dot` (extends `.dot` atom).

**Issues:**

| # | Severity | Finding |
|---|----------|---------|
| HW1 | High | `.readiness-ring-progress` uses `var(--ring-stroke)` and `var(--ring-dash)` which are **not in `tokens.css`**. These are set as inline styles by the component (JSX), making them an exception to the no-inline-style rule. This should be documented — add a comment explaining that these values come from the component. |
| HW2 | Medium | `.home-widget-grid` (here) vs `.widget-grid` (in `layout.css`) — near-duplicate definitions. Both define a 2-column widget grid. `.widget-grid` should be deleted from `layout.css` (it has the undefined token bugs, L2) and `.home-widget-grid` should be the single canonical implementation. |
| HW3 | Low | `.stat-tile-row { grid-template-columns: repeat(3, 1fr); }` — hardcoded 3 columns. Not responsive. `.auto-fill` or a container query would be more flexible. |
| HW4 | Low | `calc(var(--s-1) / 2)` (2px) in `.sleep-stages` is a sub-token gap value. Adding `--s-0-5: 2px` to tokens would eliminate this calculation. |

---

### `route-planner.css` → `@layer project`

**Behavior:** Screen layout (two-panel: `.route-explore-side` + map). Side panel: `.route-side-rail` (sticky filters), `.activity-chips`. Surface mix bar: `.surface-mix-bar` + `.surface-mix-segment` + `.surface-mix-swatch` with sport/surface data-attribute color mapping. Elevation profile (canvas). Route cards: `.route-card-image` (parallax via `--route-parallax-x`), `.route-card-icon`. Empty state for map. `@property --route-parallax-x`.

**Issues:**

| # | Severity | Finding |
|---|----------|---------|
| RP1 | Medium | `.route-card-icon { width: var(--s-6); height: var(--s-6); border-radius: var(--r-sm); ... }` duplicates what `.icon-frame` already provides at the same dimensions. Should use `.icon-frame` atom instead. **Duplicate implementation.** |
| RP2 | Medium | `.route-explore-map-empty` duplicates the `transform` + `@media (prefers-reduced-motion)` rules from `.route-explore-photo`. Extract a shared class or use `:is()` grouping. **DRY violation.** |
| RP3 | Low | `width: 112%; margin-inline-start: -6%` for the parallax bleed is a magic number. A comment explaining the overflow intent would help future maintainers. |
| RP4 | Low | `[data-mobile-header] .ghost { color: var(--accent-ink); }` silently overrides all ghost button text color inside any element with `data-mobile-header`. If a non-icon ghost button is added to that area, it inherits white text without a visual cue that this override exists. |

---

### `training-plans.css` → `@layer project`

**Behavior:** `.day-circle` (circular day badge with `color-mix(in oklab, ...)` tints). `.time-slot-grid` (hourly schedule grid). `.dashed` (dashed border). `.schedule-event-block` (sport-colored schedule block).

**Issues:**

| # | Severity | Finding |
|---|----------|---------|
| TP1 | **Critical** | `.dashed { border-style: dashed; }` is also defined in `utilities.css` (utilities layer, which comes after project in the cascade). The utilities layer version **wins and shadows this project-layer rule**, making this rule dead code. Remove it from `training-plans.css`. |
| TP2 | High | `color-mix(in oklab, ...)` — all other CSS files use `color-mix(in srgb, ...)`. Using `oklab` produces perceptually different color mixing. **Inconsistency.** Standardize on one color space. |

---

### `utilities.css` → `@layer utilities`

**Behavior:** Radius helpers (`.r-0` through `.r-pill`). Shadow helpers. Status tint helpers (`.ok-tint`, `.warn-tint`, `.bad-tint`, `.warning`). Layout helpers (`.fill`, `.shrink-0`, `.spacer`, `.absolute`, `.relative`, `.overflow-hidden`, `.full-width`, `.min-w-0`). Position offset helpers (`.top`, `.right`, `.bottom`, `.left` each applying `var(--s-2)` offset). Text helpers (`.text-start`, `.text-center`, `.text-end`, `.lh-1`, `.text-9`, `.clamp-2`, `.clamp-3`). Emoji sizes. `.chevron` (animated rotation). Responsive visibility (`.hide-mobile`, `.show-mobile`, `@media print`). `.dashed`. `@keyframes spin` + `.spinner`. `@keyframes shimmer` + `.sk` (skeleton).

**Issues:**

| # | Severity | Finding |
|---|----------|---------|
| U1 | High | `.interactive { &:hover { background: var(--surface-2); box-shadow: var(--box-shadow-lg); } }` — different hover behavior from `.surface.interactive` which uses `color-mix(in srgb, var(--ink) 8%, transparent)` as overlay. Two classes named "interactive" with different semantics. The `.interactive` utility class lifts (box-shadow) while the surface variant tints. This will produce inconsistent interactions across the app. |
| U2 | Medium | `.warning { --status-color: var(--bad); }` maps "warning" to `--bad` (red). But `project-activity.css` uses `.badge.tinted.warning` to mean yellow (`--warn`). Same class name, different color meanings. **Name collision**. |
| U3 | Medium | `.dashed { border-style: dashed; }` — duplicate of the rule in `training-plans.css`. The utilities layer version is the canonical one (higher cascade priority); the project-layer version is dead. |
| U4 | Low | `.top/.right/.bottom/.left` apply `var(--s-2)` offset in that direction. They require a parent with `position: relative` and the element itself to have `position: absolute/fixed/sticky`. If used without these prerequisites, the rules silently do nothing. |
| U5 | Low | `.text-9 { font-size: var(--t-2xs); }` — `--t-2xs` is 9px. The utility is named `text-9` (for 9px). This violates the token-driven naming convention — should be `.t-2xs` to match the token name. |
| U6 | Low | `.radius-0` through `.radius-3` reference backward-compat tokens (`--border-radius-0` etc.). These utilities are themselves legacy. The modern equivalents (`.r-xs`, `.r-sm`, `.r-md`, `.r-pill`) exist. |

---

### `map.css` → `@layer overrides`

**Behavior:** Leaflet library overrides (`!important`): marker pane, tiles, controls, attribution. `.route-map-canvas` (absolute fill). `.waypoint-badge` (route marker). `.route-anchor` (anchor link). `.map-root` (container). `.route-explore-map` scoped Leaflet overrides.

**Issues:**

| # | Severity | Finding |
|---|----------|---------|
| MA1 | Low | `.route-map-canvas { position: absolute; inset: 0; width: 100%; height: 100%; }` — `inset: 0` with `position: absolute` already makes the element fill its container. `width: 100%; height: 100%` are **redundant** alongside `inset: 0`. |

---

### `containers.css` → `@layer layout`

**Behavior:** Container query opt-ins: `.q-tile` (container: tile), `.q-row` (container: row), `.q-card` (container: card) — each with `container-type: inline-size`. Container queries: `.q-tile @container tile (min-width: 200px)` changes mono font-size. `.full-screen` (viewport fill). `.content:has(.fill-screen)` (removes padding from content area when a fill-screen child exists).

**Issues:**

| # | Severity | Finding |
|---|----------|---------|
| CT1 | Medium | `.full-screen { width: 100dvw; height: 100dvh; position: absolute; }` — `100dvw` includes the scrollbar width on Windows/Linux, causing a horizontal scrollbar. Use `width: 100%` or `inset: 0` instead. |
| CT2 | Low | `.q-tile`, `.q-row`, `.q-card` are generic utility-style container contexts but `q-tile` maps specifically to `StatTile` (patterns layer). A more abstract name or moving the tile container opt-in to `patterns.css` would be cleaner. |

---

## Cross-Cutting Issues Summary

### 1. Undefined Tokens (CSS variables that are referenced but not defined)

| Token | File | Fallback | Fix |
|-------|------|----------|-----|
| `--z-overlay` | `overlays.css` | none → `z-index: 0` | Add `--z-overlay: 100` to tokens.css, or use Popover API (top layer, no z-index needed) |
| `--border-subtle`, `--radius-md`, `--text-muted`, `--surface-raised` | `layout.css` (widget-add-tile) | none → empty | Add tokens or fix with existing token names |
| `--s-2-5` | `project-activity.css` | `10px` | Add `--s-2-5: 10px` to tokens.css |
| `--ring-stroke`, `--ring-dash` | `home-widgets.css` | none | Set via inline style in component (document this exception) |

### 2. Layer Violations (domain vocab or wrong-layer imports)

| Issue | File | Current Layer | Correct Layer |
|-------|------|--------------|---------------|
| `nav.css` imported as `layer(atoms)` | `global.css` | atoms | layout |
| `.widget-grid`, `.widget-cell`, `.widget-add-tile` | `layout.css` | layout | project |
| `.exercise-suggestions` | `overlays.css` | molecules | project |
| `.trend-item` | `data-display.css` | molecules | project |
| `.empty` | `labels.css` | atoms | molecules/patterns |

### 3. Dead / Junk Rules

| Rule | File | Reason |
|------|------|--------|
| `@media(max-width:360px) { gap on block }` | `surface.css` | `gap` on `display:block` has no effect |
| `@media(max-width:360px) { padding same as default }` | `surface.css` | Sets padding to same value as default |
| `-webkit-overflow-scrolling: touch` | `session.css`, `layout.css` | Removed in iOS 13, 2019 |
| `.custom-file-upload` bottom rule | `buttons.css` | Identical to base defaults |
| `.choice-title { color: var(--ink); }` | `forms.css` | Default color, no change |
| `.label { color: var(--ink); }` | `labels.css` | Default color, no change |
| `inset:0` + `width/height:100%` | `map.css` | Redundant with `inset:0` |
| `var(--s-2, 12px)` fallback | `session.css` | Fallback = token value, always defined |
| `.dashed` in `training-plans.css` | `training-plans.css` | Shadowed by utilities layer |
| `.settings-section container` declaration | `patterns.css` | No `@container settings-section` rules exist |

### 4. Behavioral Mismatches (CSS doesn't reflect component behavior)

| Component | File | Mismatch |
|-----------|------|---------|
| `Alert` (warn/error variants) | `feedback.css` | `.warning` class sets `--status-color` but nothing in surface.css uses it → warn/error alerts look identical to default |
| `StatusDot` (all tones) | `labels.css` | `.status-live`, `.status-online`, etc. have no CSS rules mapping tones to colors |
| `Chip` (interactivity) | `labels.css` | `cursor: pointer` on `<span>` without keyboard affordance |
| Expandable pattern | `list.css` | `.surface:has(> .exp-toggle)` breaks if exp-toggle is not a direct child |

### 5. Duplicate Rules

| Rule | Locations | Resolution |
|------|-----------|------------|
| `.dashed { border-style: dashed; }` | `utilities.css` + `training-plans.css` | Remove from `training-plans.css` |
| Widget grid layout | `layout.css (.widget-grid)` + `home-widgets.css (.home-widget-grid)` | Remove from `layout.css`, use `.home-widget-grid` |
| Route card icon | `route-planner.css (.route-card-icon)` vs `metric.css (.icon-frame)` | Use `.icon-frame` atom |
| `.icon-box` / `.icon-frame` | `metric.css` | Remove `.icon-box`, canonicalize to `.icon-frame` |
| `.interactive` hover behavior | `utilities.css` + `surface.css` | Document or unify hover semantics |

### 6. Naming Conflicts / Inconsistencies

| Conflict | Files | Impact |
|----------|-------|--------|
| `warning` = red in `tokens.css` (`--color-warning: var(--bad)`) but yellow in `project-activity.css` (`.badge.tinted.warning: var(--warn)`) and yellow intended by semantic name | tokens + project-activity + utilities | Wrong color renders for any code using `--color-warning` expecting yellow |
| `color-mix(in oklab, ...)` vs `color-mix(in srgb, ...)` | `training-plans.css` vs all others | Perceptually different color mixing in training plan tints |
| `.interactive` utility (lifts on hover) vs `.surface.interactive` (tints on hover) | `utilities.css` vs `surface.css` | Inconsistent interaction feel across app |

### 7. Bare Element Rules (should be scoped to classes)

| Rule | File | Risk |
|------|------|------|
| `form { padding; border-radius }` | `forms.css` | Applies padding to every `<form>` in the app |
| `main { padding }` | `reset.css` | Conflicts with fill-screen layout |
| `table { text-align: left }` | `typography.css` | Can't right-align table cells without override |

### 8. Deprecated / Legacy

| Item | File | Status |
|------|------|--------|
| `-webkit-overflow-scrolling: touch` | `session.css`, `layout.css` | Removed iOS 13+ |
| `--spacing-*` backward-compat aliases | `tokens.css` | Remove after confirming no TSX references |
| `--border-radius-*` backward-compat aliases | `tokens.css` | Remove after confirming no TSX references |
| `.radius-0…3` utilities | `utilities.css` | Legacy; modern `.r-xs…pill` exist |
| `.detail`, `.caption` classes | `typography.css` | Marked legacy; `.caption` still used in Alert.tsx |

---

---

## Naming Conventions: BEM vs Project System

The project deliberately avoids BEM (`block__element--modifier`). The intended system is:

- Standalone semantic class per component (`.badge`, `.card-scroller`)
- Modifier classes nested inside the parent rule (`.sm`, `.compact`, `.active`)
- Variants via `data-*` attributes (`data-tone`, `data-sport`, `data-stage`, `data-snap`)

### Inconsistency: Modifier approach is split

Some modifiers use data-attributes, others use bare classes. No rule governs which to use:

| Uses `data-*` | Uses plain class |
|---------------|-----------------|
| `[data-tone="ok"]` on `.score-circle`, `.status-word` | `.ok`, `.warn`, `.bad` on `.badge` |
| `[data-stage="deep"]` on `.sleep-stage-seg` | `.active` on `.chip`, `.tab`, `.toggle`, `.badge`, `.ghost` button |
| `[data-snap="peek/mid/full"]` on `.bottom-sheet` | `.sm`, `.lg`, `.compact`, `.full` everywhere |
| `[data-sport="run"]` on `.avatar`, `.dot`, `.icon-frame` | `.primary`, `.secondary`, `.ghost`, `.destructive` on buttons |

**Consequence:** A `.active` class fires in 6+ different component contexts (`button`, `.chip`, `.tab`, `.toggle`, `.ghost`, `.badge.accent`) with slightly different behavior in each. There's no way to know from the class alone what "active" means. `[data-active]` or `aria-pressed`/`aria-current` would be self-documenting.

### `.active` semantic collision

| Context | What `.active` does |
|---------|---------------------|
| `button` base | background `--surface-2`, border `--line-strong` |
| `.ghost.active` | background `--accent`, color `--accent-ink`, border `--accent` |
| `.chip.active` | background `--surface-2`, border `--line-strong` |
| `.tab.active` | border-bottom `--accent`, color `--ink` |
| `.toggle.active` | background `--surface-2`, border `--line-strong` |
| `.badge.active` | outline 1.5px solid `currentColor` |

**Fix:** Use `aria-pressed`, `aria-selected`, `aria-current`, or a `[data-active]` attribute so the state is semantically unambiguous. The CSS selects on the attribute — same specificity, self-documenting, accessible.

### Implicit namespace prefixes

The project uses a flat prefix convention for "element" classes:

```
.card-scroller          ← block
.card-scroller-track    ← element (but a flat orphan rule)
.card-scroller-controls ← element (flat orphan)
```

These feel like BEM without the `__` separator. They're not scoped by CSS — `.card-scroller-track` fires anywhere in the DOM regardless of whether it's inside `.card-scroller`. Where the element class is genuinely internal (never used standalone), it should be nested (`& .card-scroller-controls { }`) rather than flat.

---

## CSS Nesting Violations

The project rule (from conventions): all related styles nest inside their parent via `&`; never write a flat `.x:hover` or `.parent .child {}` outside the parent block.

### Confirmed violations

**`labels.css` — double-nesting gap**

```css
/* current */
.badge {
  &.accent { background: var(--accent); color: var(--accent-ink); }
  &.accent .dot { --dot-color: var(--accent-ink); }  /* ← flat sibling, not nested inside &.accent */
}

/* correct */
.badge {
  &.accent {
    background: var(--accent);
    color: var(--accent-ink);
    & .dot { --dot-color: var(--accent-ink); }
  }
}
```

**`overlays.css` — `@starting-style` blocks are flat outside their rules**

```css
/* current — two separate blocks */
.modal { &:popover-open { opacity: 1; transform: translateY(0); } }
@starting-style { .modal:popover-open { opacity: 0; transform: translateY(12px); } }

/* correct — entry animation co-located */
.modal {
  &:popover-open { opacity: 1; transform: translateY(0); }
  @starting-style { &:popover-open { opacity: 0; transform: translateY(12px); } }
}
```

Same issue for `.drawer.drawer-right:popover-open` and `.drawer.drawer-left:popover-open` starting styles.

**`overlays.css` — `.filter-panel` flat duplicate**

```css
.dropdown {
  &.filter-panel { right: 0; left: auto; max-height: ...; }  /* scoped */
}
.filter-panel { min-width: 280px; }  /* flat orphan at line 156 */
```

`.filter-panel` has CSS both inside `.dropdown.filter-panel` and as a standalone flat rule. Either consolidate into one block or make the standalone rule explicit that it applies to filter-panel used as a standalone popover.

**`card-scroller.css` — `.card-scroller-controls` flat**

```css
/* current */
.card-scroller { ... }  /* track is nested inside ✓ */
.card-scroller-controls {  /* flat orphan */
  @media (max-width: 780px) { display: none; }
}

/* correct */
.card-scroller {
  & .card-scroller-track { ... }
  & .card-scroller-controls {
    @media (max-width: 780px) { display: none; }
  }
}
```

**`controls.css` — combobox/command family rules are flat siblings**

`.combobox-list`, `.combobox-option`, `.command-list`, `.command-item`, `.command-empty` are standalone flat rules. They share base styles via compound selectors but are not nested inside `.combobox {}` and `.command {}`. Since these classes only make sense in context, nest them:

```css
.combobox {
  position: relative;
  min-width: 0;

  & .combobox-list { ... }
  & .combobox-option {
    justify-content: flex-start;
    ...
    &[aria-selected="true"] { ... }
  }
}

.command {
  position: relative;
  min-width: 0;

  & .command-list { ... }
  & .command-item { ... }
  & .command-empty { padding: var(--s-2); }
}
```

The shared base for `.toggle, .combobox-option, .command-item, .breadcrumb-button` at the top of the file becomes the base only for `.toggle` after this refactor; the others inherit from their parent context.

**`home-widgets.css` — flat rules that are conceptually inside `.home-widget`**

`.sleep-main`, `.sleep-stage-labels`, `.stage-label`, `.score-circle`, `.status-word`, `.session-head`, `.stat-tile-row` are all flat rules. They are used only inside home widget cards and have no meaning outside them. Nesting them inside `.home-widget` would enforce the relationship:

```css
.home-widget {
  ...
  & .sleep-main { ... }
  & .sleep-stage-labels { ... }
  & .stage-label { ... }
  & .score-circle { ... }
  & .status-word { ... }
  & .session-head { ... }
  & .stat-tile-row { ... }
}
```

Note: this requires verifying in JSX that these classes don't appear outside `.home-widget` wrappers.

---

## Layout Overrides: CSS vs Layout Primitives

The CLAUDE.md rule: "Every visual element originates from a primitive. No raw styled `<div>` in features."  
The corollary for CSS: if a project-layer CSS class just sets `display: flex/grid` + gap + alignment, the JSX should use `<Row>`, `<Column>`, or `<Grid>` instead — letting the CSS class own only the domain-specific properties (min-height, domain colors, etc.).

### CSS-defined layouts that could be layout components

**`home-widgets.css`**

| CSS class | Layout rule | Equivalent layout component |
|-----------|-------------|---------------------------|
| `.sleep-stage-labels` | `display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--s-2)` | `<Grid cols={4} gap="sm">` |
| `.stat-tile-row` | `display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--s-2)` | `<Grid cols={3} gap="sm">` |
| `.stage-label` | `display: grid; gap: var(--s-1); min-width: 0; text-align: center` | `<Column gap="xs" align="center" className="min-w-0">` |
| `.home-widget-grid` | `display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--s-2)` | `<Grid cols={2} gap="sm">` (but `.full { grid-column: 1/-1 }` needs CSS) |
| `.sleep-main` | `display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: var(--s-3); align-items: start` | `<Grid className="sleep-main">` (custom col def needs CSS) |
| `.session-head` | `display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: var(--s-3)` | `<Row align="center" gap="md">` if columns don't need explicit track sizing |

For `.sleep-stage-labels`, `.stat-tile-row`, `.stage-label`: the layout IS the only behavior. The CSS class exists solely to set flex/grid. If the JSX used `<Grid cols={4} gap="sm">`, the CSS class could be deleted entirely. The JSX component is already responsible for this decision anyway — the class is just a thin CSS wrapper around what a layout primitive already provides.

For `.home-widget-grid`: the `.full { grid-column: 1 / -1 }` modifier needs CSS, so a hybrid approach makes sense — use the CSS class for the `.full` modifier but let `<Grid>` own the base layout. Or keep the class but add a comment.

**Bugs from missing `display` property**

Two cases where `flex-wrap` or `gap` is set on an element with no `display: flex/grid`:

1. `session.css` `.exercise-rail { flex-wrap: nowrap; white-space: nowrap; }` — no `display: flex` on `.exercise-rail` itself. It relies entirely on the parent `<Row>` providing the flex context. The `flex-wrap: nowrap` is either redundant (Row defaults to nowrap) or silent if this element is ever not inside a Row.

2. `overlays.css` `.bottom-sheet .body { gap: var(--s-3); }` — `.body` has gap but no `display: flex/grid`. Gap is silently dead unless `.body` receives flex/grid context from a layout component in JSX (e.g. `<Column className="body">`). This assumption is invisible in CSS. **Either add `display: flex; flex-direction: column;` to the rule, or document the layout component dependency in a comment.**

---

## Font Overrides: CSS vs Text/Heading Atoms

The `Text` atom (`ui/atoms/Text.tsx`) supports: `size = body | detail | caption | eyebrow`, `color = default | muted | faint | positive | negative`, plus `mono`, `bold`, `truncate`, `nowrap` props. The `Heading` atom handles `h1-h6` display.

When CSS sets `font-size` / `font-weight` on a bare element or generic class in the project layer, and that typography would be covered by Text atom props, the JSX should use the atom instead.

### CSS font rules that should be Text atoms

**`home-widgets.css` — `.stage-label strong`**
```css
.stage-label {
  strong { font-size: var(--t-sm); font-weight: 700; }
}
```
Styles a bare `<strong>` element. The JSX likely has:
```jsx
<strong>{value}</strong>
```
Should be:
```jsx
<Text bold size="detail">{value}</Text>
```
Then the CSS rule is deleted.

**`session.css` — `.splits-table td:first-child`**
```css
& td {
  &:first-child { color: var(--ink-muted); font-size: var(--t-xs); font-weight: 600; }
}
```
Typography on a bare `<td>`. The JSX should wrap the cell content:
```jsx
<Text size="caption" bold color="muted">{split.km}</Text>
```
The CSS rule then only needs `border-top: 1px solid var(--line)` and `padding`.

**`session.css` — `.splits-table { font-size: var(--t-sm); }`**  
Global font-size on the `<table>` element. If each cell uses a `<Text>` atom with the correct size, this table-level override is unnecessary and should be removed.

**`home-widgets.css` — `.status-word { font-size: var(--t-xs); font-weight: 700; }`**  
`.status-word` is a domain-specific label with `data-tone` variants. It's a standalone atom. The font rules are appropriate here since there's no Text variant that expresses `font-size: --t-xs + font-weight: 700` together. **Acceptable in project layer.** (But consider: is `status-word` the correct primitive, or should it compose `<Text size="caption" bold>` with a tone class wrapper?)

### Pattern: project CSS sets typography on bare elements

Several project-layer CSS rules target bare HTML elements (`strong`, `td`, `th`, `a`) inside a component class. These bypass the Text atom and create invisible dependencies between CSS and the exact DOM structure the JSX produces. When the JSX changes the element (e.g. `<strong>` → `<b>` or → a component), the CSS silently stops applying.

**Rule:** Project-layer CSS should target classes, `data-*` attributes, or ARIA attributes — never bare element tags (except for universal resets). Typography on text runs belongs on `<Text>` atoms, not bare `<td>`, `<strong>`, or `<span>` elements.

Files with bare-element typography rules in the project layer:
- `home-widgets.css`: `strong { }` inside `.stage-label`
- `session.css`: `td:first-child { }`, `th { }` inside `.splits-table`
- `data-display.css`: `.trend-item` (the entire class is domain typography — should be in a project file, not molecules, and should delegate text runs to `<Text>`)

### The Text atom's gaps

The current `Text` size vocabulary (`body | detail | caption | eyebrow`) doesn't cover everything. Gaps that force CSS:

| Needed | Token | Text equivalent |
|--------|-------|----------------|
| `--t-xl` (22px heading) | `var(--t-xl)` | None — use `<Heading>` or CSS |
| `--t-lg` (18px medium) | `var(--t-lg)` | None — use CSS |
| `--t-xs` (11px tiny) | `var(--t-xs)` | `caption` (if --t-xs maps to caption) |
| `--t-2xs` (9px micro) | `var(--t-2xs)` | None — use CSS |

Where CSS is forced to use `--t-lg` or `--t-xl` on running text (not headings), that's a gap in the Text atom's size vocabulary. Consider adding `size="lg"` or mapping to the closest existing variant.

---

## Priority Action List

### P0 — Broken/Invisible behavior

1. **Fix Alert variants** — `feedback.css` must add tone-specific border/background using `[data-tone]` or add `--status-color` consumption to `surface.css`
2. **Define `--z-overlay`** in `tokens.css` or migrate `.widget-context-menu` to Popover API
3. **Fix StatusDot tones** — add CSS mapping for `status-live`, `status-online`, etc. in `project-activity.css`
4. **Fix `.widget-add-tile`** undefined token references (`--border-subtle`, `--radius-md`, `--text-muted`, `--surface-raised`)

### P1 — Layer architecture violations

5. Change `nav.css` import in `global.css` from `layer(atoms)` to `layer(layout)`
6. Move `.widget-grid`, `.widget-cell`, `.widget-add-tile` from `layout.css` to `home-widgets.css`
7. Move `.exercise-suggestions` from `overlays.css` to `session.css`
8. Move `.trend-item` from `data-display.css` to a project-layer file
9. Move `.empty` from `labels.css` to `feedback.css`

### P2 — Naming conflicts

10. Resolve `warning` color ambiguity: pick `--warn` (yellow) as the canonical token, rename `--color-warning` to `--color-warn` or point it to `var(--warn)`
11. Standardize on `color-mix(in srgb, ...)` in `training-plans.css`
12. Document or unify `.interactive` utility vs `.surface.interactive` behavior

### P3 — Dead code cleanup

13. Remove `.dashed` from `training-plans.css`
14. Remove redundant `@media(360px)` block in `surface.css`
15. Remove `-webkit-overflow-scrolling: touch` from `session.css` and `layout.css`
16. Remove redundant `.custom-file-upload` rule at bottom of `buttons.css`
17. Remove `.choice-title { color: var(--ink); }` from `forms.css`
18. Remove `.label { color: var(--ink); }` from `labels.css`
19. Remove `width: 100%; height: 100%` from `.route-map-canvas` (keep `inset: 0`)
20. Remove `.settings-section` container declaration from `patterns.css` (or add `@container` rules)

### P4 — Token housekeeping

21. Add `--s-2-5: 10px` to tokens.css and remove fallback from `project-activity.css`
22. Audit and remove `--spacing-*` and `--border-radius-*` backward-compat aliases from `tokens.css`
23. Add `--s-0-5: 2px` to tokens.css for the sleep-stages gap
24. Fix `100dvw` → `100%` in `.full-screen` to prevent horizontal scrollbar

### P5 — Minor inconsistencies

25. Rename `nav.css` → `app-shell.css` (after fixing layer import)
26. Remove `.icon-box` alias from `metric.css`; canonicalize to `.icon-frame`
27. Replace `.route-card-icon` in `route-planner.css` with `.icon-frame` atom
28. Scope `form { padding }` to a `.form-padded` class
29. Scope `main { padding }` out of reset.css or add `.fill-screen` exception
30. Scope `table { text-align: left }` to a `.table-default` class
