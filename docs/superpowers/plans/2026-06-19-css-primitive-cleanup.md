# CSS Chord-Graph Cleanup (verified subset) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the small set of CSS rules in `styling/` that genuinely duplicate an existing primitive (`Button`, `Surface`, `IconFrame`, `Grid`) with the primitive itself, and delete the now-dead CSS.

**Architecture:** No new components. Two are prop additions to an existing primitive (`Surface` gets `danger`/`warning` variants, mirroring its existing `accent` variant). The rest are call-site swaps from a bespoke `className` to an existing primitive/prop that already produces the same CSS.

**Tech Stack:** React/TS, CSS `@layer` cascade (see `CLAUDE.md`), Stylelint/ESLint boundary rules.

## Global Constraints

- Token-driven values only; zero new hardcoded spacing/color (`CLAUDE.md` rule 6-7).
- No inline `style=` (project-wide rule, see memory `feedback_no_inline_styles_gap`).
- CSS nesting via `&` for any new rules (memory `feedback_css_nesting_required`).
- Variant API: one component with variant props, not new named components (`CLAUDE.md` "Variant API for primitives").
- Commit per source file, not one giant diff (per original request).

---

## Context

This plan acts on a graphify CSS co-occurrence report (`graphify-out/css-chord-graph.html`) that flagged 41 "redundant primitive" candidates across three tables. On inspection (reading real property *values*, not just matched property *keys*, and reading actual JSX usage) the false-positive rate was 62% (near-exact table), 100% (composite table), and 68% (Row/Column/Grid table) — all over the 30% stop threshold the request specified. Per that threshold, the full report is not being executed; only the handful of entries that checked out as real duplication are in scope here. The rest (CSS-key matches with mismatched real values, or single-element centering misread as a layout container) are listed in "Not in scope" below so the reasoning isn't lost.

**In scope (4 tasks):**
1. `.error-tint` (`styling/utilities.css`) on `<Button>` call sites — byte-identical to `Button`'s existing `variant="destructive"` (same `color-mix(var(--bad)...)` at 10%/18%). Pure prop swap, no new code.
2. `.error-tint`/`.caution`/the dead `'warning'` class (`styling/utilities.css`) on `<Surface>` call sites (`InjuryBanner.tsx`, `BlockCard.tsx`) — `Surface` has no matching variant, so add `danger`/`warning` to `SurfaceVariant`. This also fixes a live bug: `BlockCard.tsx:250` assigns a `'warning'` class that doesn't exist in any CSS file, so severe single-exercise warnings currently render unstyled.
3. `.loading-state-mark` (`styling/feedback.css`, used once in `ui/patterns/common/LoadingState.tsx`) — near-duplicate of `ui/atoms/IconFrame.tsx` (32px vs IconFrame's 28px default, same flex-center/neutral-tone shape). Wrap in `<IconFrame>` instead.
4. `.widget-grid` (`styling/home-widgets.css`, used once in `ui/components/widgets/WidgetGrid.tsx`) — a plain `display:grid` 2-column layout on a bare `<div>`. Swap for `<Grid cols="repeat(2, minmax(0, 1fr))" gap={2}>` from `ui/layout/Grid.tsx`.

**Not in scope (checked, rejected):**
- `.pain-control` (project-activity.css): property-key overlap with `buttons.css &.icon`, but real size is 10px (`--s-2-5`) vs the button icon's 40px — different widget, not a duplicate.
- `.route-anchor` (map.css), `.alert` (feedback.css), `.check-icon` (list.css): key overlap with unrelated baselines (map pin vs radio dot, alert box vs form select, custom circular check indicator vs generic Surface tone) — different real values/semantics.
- `controls.css &.active`/`[aria-pressed]`: molecules-tier, ambiguous overlap, left alone per `CLAUDE.md`'s "don't touch molecules/patterns unless clearly redundant" guidance.
- Composite table (25 entries, all `project-activity.css`): every match is keyed on one trivial shared property (`opacity`, or `background`/`color` shared between unrelated `.eyebrow`+`.sticky-region` and rarity/sport color rules) — 100% false positive, no action.
- Row/Column/Grid table, remaining 21 entries: mostly `display:grid; place-items:center` centering a *single* child (`score-circle`, `day-circle`, empty-state placeholders) — not a multi-child layout container, so not a Row/Column/Grid case. `.home-widget` and `.route-explore-card` did check out as real but require inserting a wrapper element inside an *already-primitive* host (`Surface`/`Button`) across multiple call sites for a cosmetic-only win — left for a future pass if wanted.
- Detector tuning (matching on property keys instead of values, and grid/centering without checking child count) was explicitly declined for this pass — re-raise if this report is run again and produces the same noise.

---

## Task 1: Replace `.error-tint` on Button with `variant="destructive"`

**Files:**
- Modify: `ui/components/session/SetRow.tsx:258`
- Modify: `ui/components/session/FinishedView.tsx:320`, `:337`, `:552`, `:569`, `:586`
- Modify: `ui/components/session/WorkoutView.tsx:117`
- Modify: `ui/components/session/SessionHeader.tsx` (no `error-tint` Button usage was found here, verify with grep before skipping — see Step 1)

**Interfaces:**
- Consumes: `Button`'s existing `variant="destructive"` (`ui/molecules/Button.tsx:6`, already styled by `styling/buttons.css:68` `&.destructive`).
- Produces: nothing new — this task only removes call sites of `.error-tint`, freeing it for deletion in Task 2.

- [ ] **Step 1: Confirm every `error-tint` Button call site**

```bash
grep -rn 'className="error-tint"' ui/components/session/
```

Expected: exactly the 7 lines listed above (`SetRow.tsx:258`, `FinishedView.tsx:320,337,552,569,586`, `WorkoutView.tsx:117`). If `SessionHeader.tsx` doesn't show up, drop it from the file list above — it was a mislabel from earlier triage.

- [ ] **Step 2: Swap each `className="error-tint"` for `variant="destructive"`**

Example (`ui/components/session/SetRow.tsx:255-260`, same pattern at every other site — just delete the `className="error-tint"` line and add `variant="destructive"`):

```tsx
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={() => { onOpenMenu(null); onDeleteRequest(); }}
              >
```

For sites that already pass a `variant` (none of the 7 do — they're all default `variant="secondary"` Buttons), `destructive` replaces it; don't stack variants.

- [ ] **Step 3: Visual check**

Run the dev server (use the `run` skill) and open any screen with a delete button (e.g. a session's exercise menu). Confirm the delete button still renders red/tinted, identical to before — `&.destructive` in `styling/buttons.css` and the old `.error-tint` use the exact same `color-mix(in srgb, var(--bad) 10%/18%, transparent)` values, so there should be zero visual diff.

- [ ] **Step 4: Lint**

```bash
npm run lint:ui
```

Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
git add ui/components/session/SetRow.tsx ui/components/session/FinishedView.tsx ui/components/session/WorkoutView.tsx
git commit -m "refactor: use Button variant=destructive instead of error-tint class"
```

---

## Task 2: Add `Surface` `danger`/`warning` variants, retire `.error-tint`/`.caution`/dead `.warning`

**Files:**
- Modify: `ui/atoms/Surface.tsx`
- Modify: `styling/surface.css`
- Modify: `styling/utilities.css`
- Modify: `ui/components/session/InjuryBanner.tsx:15-18`
- Modify: `ui/components/session/BlockCard.tsx:250-253`

**Interfaces:**
- Consumes: nothing new.
- Produces: `SurfaceVariant` gains `'danger' | 'warning'`; `Surface`'s `variant` prop now accepts them. Later tasks don't depend on this.

- [ ] **Step 1: Add the two variants to `Surface`**

In `ui/atoms/Surface.tsx`, extend the type and the class map:

```tsx
export type SurfaceVariant = 'default' | 'plain' | 'flat' | 'accent' | 'ghost' | 'inset' | 'pinned' | 'danger' | 'warning';
```

```tsx
const VARIANT_CLASS: Record<SurfaceVariant, string> = {
  default: '',
  plain:   'plain',
  flat:    'flat',
  accent:  'accent',
  ghost:   'ghost',
  inset:   'inset',
  pinned:  'pinned',
  danger:  'danger',
  warning: 'warning',
};
```

- [ ] **Step 2: Add the CSS rules in `styling/surface.css`**, right after the existing `&.accent` block (around line 23-27), reusing the exact values currently in `.error-tint`/`.caution`:

```css
  &.danger {
    background: color-mix(in srgb, var(--bad) 10%, transparent);
    border-color: var(--bad);
    color: var(--bad);
    &:hover { background: color-mix(in srgb, var(--bad) 16%, transparent); }
  }
  &.warning {
    background: color-mix(in srgb, var(--warn) 10%, transparent);
    border-color: var(--warn);
    color: var(--warn);
    &:hover { background: color-mix(in srgb, var(--warn) 16%, transparent); }
  }
```

- [ ] **Step 3: Delete the now-redundant utility classes from `styling/utilities.css`**

Remove the `.error-tint` and `.caution` blocks (lines 7-21, the whole "Status tint helpers" section) — confirm first that nothing besides the 2 call sites being changed in this task still references them:

```bash
grep -rn 'error-tint\|"caution"\|className="caution' ui/ features/
```

Expected after Step 1's Button changes (Task 1) and this task's Surface changes (Step 4 below): zero remaining matches. If something else shows up, leave the CSS in place and stop — don't delete a class still in use.

- [ ] **Step 4: Update `InjuryBanner.tsx` to use the variant prop**

```tsx
// ui/components/session/InjuryBanner.tsx:14-18
  const top = worstActiveCondition(conditions)!;
  const sevTone = top.severity === 'severe' ? 'danger' : 'warning';

  return (
    <Surface variant={sevTone}>
```

- [ ] **Step 5: Update `BlockCard.tsx` to use the variant prop — and fix the dead `'warning'` class bug**

```tsx
// ui/components/session/BlockCard.tsx:245-253
  if (block.type === 'single') {
    const ex = block.exercises[0];
    const warnings = getWarnings(ex.name, injuries);
    const isAcked = acknowledged.has(ex.name);
    const top = worstSev(warnings);
    const flagTone = top && !isAcked ? (top.severity === 'severe' ? 'danger' : 'warning') : undefined;

    return (
      <Surface variant={flagTone}>
```

This also fixes the existing bug where severe single-exercise warnings assigned a `'warning'` className that had no matching CSS rule anywhere — they now get the real `danger` tone.

- [ ] **Step 6: Visual check**

Run the dev server. Trigger an injury banner (severe and non-severe) and a single-exercise block warning (both severities) — confirm the danger tone is red-tinted and the warning tone is amber-tinted, matching the old `.error-tint`/`.caution` look, and that the previously-broken severe single-exercise case now actually shows red tint instead of nothing.

- [ ] **Step 7: Lint**

```bash
npm run lint:css
npm run lint:ui
```

Expected: no new errors.

- [ ] **Step 8: Commit**

```bash
git add ui/atoms/Surface.tsx styling/surface.css styling/utilities.css ui/components/session/InjuryBanner.tsx ui/components/session/BlockCard.tsx
git commit -m "feat: add Surface danger/warning variants, retire error-tint/caution utility classes"
```

---

## Task 3: Replace `.loading-state-mark` with `IconFrame`

**Files:**
- Modify: `ui/patterns/common/LoadingState.tsx:39`
- Modify: `styling/feedback.css` (delete `.loading-state-mark`, lines 73-82)

**Interfaces:**
- Consumes: `ui/atoms/IconFrame.tsx` (`size?: 'sm'|'md'|'lg'|'xl'`, `tone?: 'neutral'|'accent'|'success'|'warning'|'danger'`, default `size="md"` = 28px, default `tone="neutral"` = `--surface-2` bg / `--ink-muted` text — matches `.loading-state-mark`'s neutral look, off by 4px from its `var(--s-6)`/32px, accepted as visually negligible).
- Produces: nothing new.

- [ ] **Step 1: Confirm this is the only usage**

```bash
grep -rn 'loading-state-mark' ui/ features/
```

Expected: only `ui/patterns/common/LoadingState.tsx:39` and the CSS rule itself.

- [ ] **Step 2: Wrap the mark in `IconFrame` instead of a styled `Text`**

```tsx
// ui/patterns/common/LoadingState.tsx:1-6 — add the import
import { IconFrame } from '@ui/atoms/IconFrame';
```

```tsx
// ui/patterns/common/LoadingState.tsx:38-40
        ) : (
          <IconFrame aria-hidden>
            <Text size="detail" mono bold>{state === 'error' ? '!' : 'i'}</Text>
          </IconFrame>
        )}
```

- [ ] **Step 3: Delete the CSS rule**

Remove `.loading-state-mark { ... }` (lines 73-82) from `styling/feedback.css`.

- [ ] **Step 4: Visual check**

Run the dev server, trigger an error and an empty loading state wherever `LoadingState` is used (check `ui/patterns/common/LoadingState.stories.tsx` if it exists, or any screen rendering an error/empty state). Confirm the `!`/`i` mark still shows as a small centered square badge; a ~4px size difference is acceptable.

- [ ] **Step 5: Lint and run the component's Storybook story if one exists**

```bash
npm run lint:css
npm run lint:ui
```

- [ ] **Step 6: Commit**

```bash
git add ui/patterns/common/LoadingState.tsx styling/feedback.css
git commit -m "refactor: use IconFrame instead of bespoke loading-state-mark class"
```

---

## Task 4: Replace `.widget-grid` with the `Grid` primitive

**Files:**
- Modify: `ui/components/widgets/WidgetGrid.tsx:49`
- Modify: `styling/home-widgets.css` (delete `.widget-grid`, lines 135-139)

**Interfaces:**
- Consumes: `ui/layout/Grid.tsx` (`cols?: 1|2|3|4|5|6|7|12|string`, `gap?: 0|1|2|3|4|5`).
- Produces: nothing new.

- [ ] **Step 1: Confirm this is the only usage**

```bash
grep -rn 'widget-grid' ui/ features/
```

Expected: only `ui/components/widgets/WidgetGrid.tsx:49` and the CSS rule.

- [ ] **Step 2: Swap the bare `div` for `Grid`**

Add the import and swap the element (the original CSS was `display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:var(--s-2)` — `cols` takes a literal string here instead of `2` so the `minmax(0, 1fr)` overflow guard is preserved exactly):

```tsx
// ui/components/widgets/WidgetGrid.tsx — add import
import { Grid } from '@ui/layout/Grid';
```

```tsx
// ui/components/widgets/WidgetGrid.tsx:49 and its matching closing tag
      <Grid cols="repeat(2, minmax(0, 1fr))" gap={2}>
        {widgets.map(instance => {
          const def = WIDGET_REGISTRY.find(d => d.id === instance.id);
          if (!def) return null;
          return (
            <div
              key={instance.instanceId}
              className="widget-cell"
              data-size={instance.size}
              {/* ...unchanged... */}
            >
              {/* ...unchanged... */}
            </div>
          );
        })}
      </Grid>
```

(Only the outer wrapper tag changes — leave every child untouched, including the `.widget-cell` divs, which keep their own CSS for `grid-column`/`grid-row` spanning by size.)

- [ ] **Step 3: Delete the CSS rule**

Remove `.widget-grid { ... }` (lines 135-139) from `styling/home-widgets.css`.

- [ ] **Step 4: Visual check**

Run the dev server, open the home screen's widget grid. Confirm widgets still lay out in a responsive 2-column grid with the same gap as before, including any `full`-size widgets that span both columns via `.widget-cell[data-size="full"]` (verify that rule still works — it was untouched).

- [ ] **Step 5: Lint**

```bash
npm run lint:css
npm run lint:ui
```

- [ ] **Step 6: Commit**

```bash
git add ui/components/widgets/WidgetGrid.tsx styling/home-widgets.css
git commit -m "refactor: use Grid primitive instead of bespoke widget-grid class"
```

---

## Verification (end-to-end, after all 4 tasks)

1. `npm run lint:css && npm run lint:ui` — clean.
2. Start the dev server (`run` skill) and visually check, in order: a session screen's delete buttons (Task 1), an injury banner + a single-exercise block warning at both severities (Task 2 — confirm the previously-broken severe case now shows red), any error/empty `LoadingState` (Task 3), and the home screen's widget grid (Task 4).
3. `git log --oneline -4` should show 4 commits, one per file group, each naming the primitive adopted.
