---
name: condense-global-css
overview: Condense `styling/global.css` by introducing a small set of reusable base classes (Surface/Button/Text/Layout), migrating screen-by-screen (renames allowed), and pruning unused selectors, while keeping visuals stable and respecting the project’s single-stylesheet rule.
todos: []
isProject: false
---

# Condense `styling/global.css` classes

## Goals
- Reduce the number of CSS rules / repeated declarations in [`styling/global.css`](c:\Users\Deroz01\Documents\Coding Projects\Workout App\workoutApp\styling\global.css) while keeping visuals stable.
- You said **renames are allowed** (we can update TSX usage), and the target is **medium scope**: consolidate repeated patterns (buttons/cards/sheets/nav), not a full CSS architecture rewrite.
- Align the refactor with [`styling/styleguide.css`](c:\Users\Deroz01\Documents\Coding Projects\Workout App\workoutApp\styling\styleguide.css) as the primary design-system reference.

## Constraints
- No UI library; keep styling in `styling/global.css` (project rule).
- **Minimise utility classes**: prefer semantic/component classes and selector grouping over adding lots of `.u-*` helpers.
- Avoid fragile cascade changes; prefer a few explicit base component classes + small modifier set.
- **Prefer tokens**: increase reuse by pushing repeated literal values into `:root` tokens (and reusing existing ones) rather than proliferating new classes.
- Preserve the existing token system in `:root` (including “legacy aliases”).
- Adopt styleguide naming/roles where practical: `.surface`, `.primary/.secondary/.ghost/.warning`, `.pill`, `.tabs/.tab`, `.row/.column`.

## Styleguide adoption rules (new source-of-truth layer)
- Use [`styling/styleguide.css`](c:\Users\Deroz01\Documents\Coding Projects\Workout App\workoutApp\styling\styleguide.css) as the canonical reference for:
  - Color semantics (`--color-primary`, `--color-warning`, `--color-surface`, `--color-background`, text colors)
  - Spacing scale (`--spacing-*`)
  - Radius scale (`--border-radius-*`)
  - Shadow scale (`--box-shadow-*`)
  - Typography sizes (`--headline`, `--title`, `--subtitle`, `--body`, `--detail`, `--caption`)
- Where `global.css` has overlapping tokens, keep a compatibility mapping layer (aliases) instead of hard breaking renames.
- Prefer component-level semantics over utility sprawl, even though styleguide includes utility helpers.

## What we know from the file already (quick metrics)
- ~**184** class blocks (`.class { ... }`), **4** media queries, **0** `!important`.
- There are clear “systems” already present (e.g. App shell, Tab navigation) which are good candidates for consolidation rather than deletion.

## Approach (safe, incremental)

### Modularity improvements (while staying single-file)
These changes keep styling **modular by convention** even if everything lives in `styling/global.css`:
- **Adopt cascade layers (`@layer`) inside the file** to prevent accidental overrides and make intent explicit.
  - Recommended order: `@layer reset, tokens, base, components, screens, overrides;`
  - Put screen/tab-specific selectors only in `@layer screens`.
- **Define “component contracts” via tokens** so variants don’t become new classes.
  - Example token families: `--control-h`, `--control-radius`, `--control-pad-x`, `--control-pad-y`, `--surface-pad`, `--surface-radius`, `--surface-shadow`.
  - Components consume tokens; screens set tokens on a wrapping element when needed.
- **Use consistent naming boundaries**
  - Global components: `.Button`, `.Surface`, `.TabNav`, `.Header` (+ minimal modifiers like `--primary`, `--outline`).
  - Screen components keep a namespace: `.Dashboard_*`, `.Log_*`, `.Progress_*`, etc. (or existing `dashboard-`/`log-` style), and should not be reused cross-screen.
- **Prefer low-specificity selectors** to keep composition predictable:
  - Use `:where(...)` for shared base blocks.
  - Avoid chaining like `.foo .bar .baz` unless it’s truly structural.
- **Create an explicit “escape hatch” section** (`@layer overrides`) for one-off fixes, with a rule to revisit/remove.

### 1) Inventory + group classes by pattern
Create a map of selectors into buckets:
- **Layout primitives**: flex/stack/grid wrappers, gap/padding rules
- **Surfaces**: cards/panels/containers (background, border, radius, shadow)
- **Typography**: title/subtitle/label/caps/mono
- **Controls**: buttons, pills, toggles, segmented controls
- **Overlays**: sheets/modals/popovers (if present)
- **Screen-specific**: `dashboard-*`, `log-*`, `progress-*`, `social-*`, `profile-*`

Deliverable: a short “CSS map” section at the top of the file (or in a side doc) identifying the new base classes and what old classes they replace.

### 2) Introduce a *small* semantic base layer (not utilities)
Create **a few** base component classes that everything else can share, and keep the class surface area small:
- **Surfaces**: standardize on `.surface`/`.card` patterns backed by shared surface tokens.
- **Buttons**: standardize on base `button` + styleguide variants (`.primary`, `.secondary`, `.ghost`, `.warning`) with optional size modifier.
- **Typography**: keep this minimal (e.g. `.TextCaps`, `.TextSub`) and prefer tokens for font-size/letter-spacing where possible.

Avoid broad layout utilities (`.Row`, `.Stack`, `.Grid`) unless they replace substantial duplicated CSS across many screens. Prefer semantic wrappers already present (e.g. `.app-header__wordmark`, `.tab-nav`) and consolidate them via shared selector blocks instead.

### 2.1) Introduce a Card model (structured, consistent body text)
Add a **single semantic “Card” component** that standardizes border-radius, background, border, and internal spacing, and provides a consistent structure for content-heavy UI across tabs.

**Core requirement**: cards can vary in width by layout, but their *internal* structure and typography should be consistent.

#### Card structure
- `.card`: base container (surface/background/border/radius/shadow as tokens)
- `.card > .header`: optional header row (title, badges, actions)
- `.card > .body`: main content; **default body text rules** live here to keep text consistent across cards
- `.card > .footer`: optional footer row (secondary actions, metadata)

Note: prefer simple child classes (`.header/.body/.footer`) scoped by the parent `.card` to keep markup lightweight and avoid a large BEM class surface area.

#### Card tokens (“component contract”)
Prefer tokens for the card model so variants don’t require new classes:
- `--card-bg`, `--card-border`, `--card-radius`, `--card-pad`
- `--card-header-gap`, `--card-footer-gap`
- `--card-body-font-size`, `--card-body-line-height`, `--card-body-color`

Screens can set tokens on a wrapping element (or on an individual `.card`) to create “colored cards” without proliferating new class families.
Prefer styleguide semantic color classes for intent (`.primary`, `.warning`) where applicable.

#### Minimal variants (only if needed)
If token overrides alone are insufficient, allow a tiny set of semantic variants:
- `.card--accent`, `.card--danger`, `.card--success`, `.card--warning` (ideally just token setters)
- `.card--compact` (density/spacing only)

#### Concrete migration targets (examples you called out)
Move these card-like UI pieces onto the Card model first (highest leverage):
- **Dashboard**: widgets (sleep/conditions/schedule/recent activity/news) → `.card`/`.surface` with semantic variants
- **Log**: workout sections and block containers; “start session” panel; tool sections
- **Progress**: session summary strips (session number/total sets/PR badges), logged workout cards
- **Social**: posts and event cards
- **Profile**: section cards (profile info, injuries, PRs, goals)
Goal is not to force identical layout; it’s to unify **surface + internal spacing + body typography** while letting each screen’s grid control width.

Key techniques to condense without “utility sprawl”:
- **Selector grouping / `:where()`** to merge repeated declarations across semantic classes.
  - Example: `:where(.tab-link,.profile-tab-btn,.social-tab-btn){ ...shared... }`
- **Tokenise repeated literals** (radii, shadows, paddings, control heights) instead of inventing a new class for each variation.
  - Example: introduce/standardise tokens like `--control-h`, `--control-radius`, `--control-pad-x`, `--control-pad-y`, `--surface-pad`.

### 3) Migrate usage screen-by-screen (renames allowed, but keep semantics)
Update TSX to converge on the few base component classes + semantic screen classes, and delete (or alias) old classes.
- **Start with global systems** (lowest risk / highest reuse):
  - App shell (`.app-shell`, `.app-header`, `.app-main`)
  - Tab navigation (`.tab-nav`, `.tab-link`, `.tab-link__icon`, active states)
- **Then consolidate repeated “button-like” patterns**
  - Find all button class families and move shared parts into base `button` + styleguide-like variants (`.primary`, `.secondary`, `.ghost`, `.warning`).
  - Tokenise spacing/height/radius so variants don’t require extra classes.
- **Then consolidate surfaces** (cards/panels across tabs) via `.surface`/`.card` + tokens.

De-risking option: keep old class names temporarily as aliases:
- `.log-action-btn{ composes: Button; }` isn’t available in plain CSS, so we do it by duplicating selectors:
  - `.Button, .log-action-btn { ... }`
  - then gradually remove `.log-action-btn` usage from TSX and drop it later.

### 4) Remove dead/unreferenced CSS (after migration)
Once TSX is updated, remove selectors that are no longer referenced.
- We’ll do a usage scan across `app/`, `ui/`, `features/` (className strings) to ensure safe removal.

### 5) Verification gates
After each consolidation chunk:
- `npm run build`
- Quick manual route check: `/dashboard`, `/log`, `/progress`, `/analytics`, `/social`, `/profile`
- Ensure no unexpected cascade regressions (especially active/hover/focus states).

## Sequencing (medium scope, practical)
- **Phase A**: add base classes (Surface/Button/Text) + tokenise repeated literals; apply to TabNavigation and App shell
- **Phase B**: unify button variants used across screens
- **Phase C**: introduce the Card model (`.card > .header/.body/.footer`) + migrate existing card-like components across screens
- **Phase D**: prune unused selectors after TSX migration

## Files likely touched
- [`styling/global.css`](c:\Users\Deroz01\Documents\Coding Projects\Workout App\workoutApp\styling\global.css)
- `ui/layouts/*.tsx` (className updates)
- Potentially shared UI components under `app/registry/*` and any `ui/*` components that define button/card markup

## Notes / watch-outs
- Because we only have **4** `@media` blocks, be careful: a lot of responsive behavior may be encoded as duplicated selectors rather than many media queries. Consolidation must preserve breakpoint behavior.
- Keep the token system as-is; condensation should mostly target *rules*, not tokens.
- If we introduce `@layer`, do it early (Phase A) and keep each moved block inside the right layer to avoid subtle cascade changes.
