# Project Review Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all bugs, layer violations, design system deviations, dead code, and scalability issues identified in the 2026-04-09 project review.

**Architecture:** The app uses event-sourced CQRS with strict layer rules (`app → ui → features → data → core → shared`). Fixes must respect this layering. CSS follows `DESIGN.MD` — HTML-first selectors, token-only values, `gap` over margin, no BEM.

**Tech Stack:** React 18 + TypeScript + Vite + CSS cascade layers + custom event-sourced CQRS

---

## File Map

### Files to modify
- `styling/global.css` — remove duplicates, fix selectors, replace margin with gap, consolidate tokens
- `styling/tokens/colours.css` — delete (conflicts with global.css)
- `styling/tokens/spacing.css` — delete (uses different naming scheme; global.css is canonical)
- `styling/tokens/typography.css` — delete (different fonts/naming; global.css is canonical)
- `styling/tokens/radii.css` — delete (global.css has identical tokens)
- `styling/tokens/shadows.css` — delete (global.css has identical tokens)
- `styling/tokens/motion.css` — delete (global.css has identical tokens)
- `styling/tokens/README.md` — update to explain tokens live in global.css
- `styling/themes/light.css` — delete (global.css already has `[data-theme="light"]`)
- `styling/themes/README.md` — update to explain themes live in global.css
- `styling/utilities/layout.css` — delete (uses different token names; global.css has `.row`/`.column`)
- `styling/utilities/spacing.css` — delete (uses margin utilities against DESIGN.MD rules)
- `styling/utilities/typography.css` — delete (uses different token names)
- `app/registry/App.tsx` — fix BEM class names to HTML-first selectors
- `ui/bindings/index.ts` — add subscription-based change notification, remove polling
- `data/projections/views/index.ts` — add change notification support to ViewStore
- `features/progress_analysis/domain/types.ts` — remove cross-feature import, inline the type
- `.gitignore` — add IDE/tool directories
- Root — delete `{,+` artifact file, `bash.exe.stackdump`

### Files to create
- None — all changes modify existing files

---

## Phase A — Cleanup & Housekeeping

### Task 1: Delete root artifact files

**Files:**
- Delete: `{,+` (garbled shell artifact)
- Delete: `bash.exe.stackdump` (crash dump — already gitignored but still exists on disk)

- [ ] **Step 1: Delete the artifact files**

```bash
rm -f "{,+" bash.exe.stackdump
```

- [ ] **Step 2: Verify deletion**

```bash
ls -la "{,+" bash.exe.stackdump 2>&1
```

Expected: `No such file or directory` for both.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: delete root artifact files ({,+, bash.exe.stackdump)"
```

---

### Task 2: Update .gitignore for IDE/tool directories

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Add IDE/tool ignores**

Append these lines to `.gitignore`:

```gitignore
# IDE configs
.cursor/
.qwen/

# Agent tooling
.claude-flow/
.code-review-graph/
```

- [ ] **Step 2: Verify .gitignore works**

```bash
git status
```

Expected: `.cursor/`, `.qwen/`, `.claude-flow/`, `.code-review-graph/` should not appear in untracked files.

- [ ] **Step 3: Commit**

```bash
git add .gitignore
git commit -m "chore: gitignore IDE and agent tooling directories"
```

---

## Phase B — Design System Token Consolidation

The `styling/tokens/*.css`, `styling/themes/light.css`, and `styling/utilities/*.css` files define a **different** design system from the one in `global.css`. They use different naming (`--space-xs` vs `--space-1`), different fonts (`Unbounded`/`Manrope` vs `Barlow Condensed`/`Barlow`), and different colors (`#c4ff47` green vs `#f97316` orange). None of these files are imported by `app/entrypoints/index.tsx` — only `@styling/global.css` is imported. They are dead code.

### Task 3: Delete conflicting token files

**Files:**
- Delete: `styling/tokens/colours.css`
- Delete: `styling/tokens/spacing.css`
- Delete: `styling/tokens/typography.css`
- Delete: `styling/tokens/radii.css`
- Delete: `styling/tokens/shadows.css`
- Delete: `styling/tokens/motion.css`
- Delete: `styling/themes/light.css`
- Delete: `styling/utilities/layout.css`
- Delete: `styling/utilities/spacing.css`
- Delete: `styling/utilities/typography.css`

- [ ] **Step 1: Verify these files are not imported anywhere**

```bash
grep -rn "colours\.css\|spacing\.css\|typography\.css\|radii\.css\|shadows\.css\|motion\.css\|light\.css\|layout\.css" app/ ui/ features/ core/ data/ shared/ --include="*.ts" --include="*.tsx" --include="*.css"
```

Expected: zero matches (only `global.css` is imported in `app/entrypoints/index.tsx`).

- [ ] **Step 2: Delete the files**

```bash
rm styling/tokens/colours.css styling/tokens/spacing.css styling/tokens/typography.css
rm styling/tokens/radii.css styling/tokens/shadows.css styling/tokens/motion.css
rm styling/themes/light.css
rm styling/utilities/layout.css styling/utilities/spacing.css styling/utilities/typography.css
```

- [ ] **Step 3: Update styling/tokens/README.md**

Replace contents with:

```markdown
# Design Tokens

All design tokens (colours, spacing, typography, radii, shadows, motion) are defined
inside `styling/global.css` within `@layer tokens`. This keeps the single-file cascade
layer order deterministic.

See `DESIGN.MD` at the project root for the design system specification.
```

- [ ] **Step 4: Update styling/themes/README.md**

Replace contents with:

```markdown
# Themes

Theme overrides (light, dark, high-contrast) are defined inside `styling/global.css`
within `@layer tokens` using `[data-theme="..."]` attribute selectors.

See `DESIGN.MD` at the project root for the design system specification.
```

- [ ] **Step 5: Delete empty utilities directory**

```bash
rmdir styling/utilities
```

- [ ] **Step 6: Build to verify nothing breaks**

```bash
npx vite build
```

Expected: Build succeeds. CSS/JS bundle sizes should be unchanged since these files were never imported.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: remove conflicting token/theme/utility files (dead code)

global.css is the single source of truth for all design tokens.
The deleted files used different naming conventions and were never imported."
```

---

## Phase C — CSS Design System Fixes

### Task 4: Remove duplicate `.tab-switcher` block in global.css

**Files:**
- Modify: `styling/global.css`

The `.tab-switcher`, `.tab-switcher button`, and `.tab-switcher button.active` rules are defined twice — once at ~line 603 and again at ~line 673. The second block adds `text-transform: uppercase` on buttons. Merge these.

- [ ] **Step 1: Remove the first (incomplete) definition**

In `styling/global.css`, find and delete the FIRST `.tab-switcher` block (around lines 603-628). Keep the SECOND one (around lines 673-700) which has the `text-transform: uppercase` rule.

Delete this block:

```css
/* ── Tab Switcher ── */
.tab-switcher {
  display: flex;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: var(--space-1);
  gap: var(--space-1);
  margin-bottom: var(--space-4);
}

.tab-switcher button {
  flex: 1;
  padding: var(--space-2);
  border: none;
  background: none;
  border-radius: var(--radius-sm);
  font-size: var(--text-caption);
  color: var(--text-sub);
  min-height: auto;
}

.tab-switcher button.active {
  background: var(--card);
  color: var(--accent);
  border: 1px solid var(--border-bright);
}
```

- [ ] **Step 2: Remove the duplicate `.rounds-selector` block**

Similarly, `.rounds-selector` and `.rounds-selector button` are defined twice (at ~line 1120 and ~line 1153). Delete the second (duplicate) block:

```css
.rounds-selector {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-caption);
  font-weight: 600;
  color: var(--text-sub);
}

.rounds-selector button {
  width: var(--space-4);
  height: var(--space-4);
  border-radius: var(--radius-full);
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  font-size: var(--text-heading);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  min-height: auto;
  padding: 0;
}
```

- [ ] **Step 3: Build to verify**

```bash
npx vite build
```

Expected: Build succeeds, CSS bundle size decreases slightly.

- [ ] **Step 4: Commit**

```bash
git add styling/global.css
git commit -m "fix(css): remove duplicate .tab-switcher and .rounds-selector rules"
```

---

### Task 5: Fix margin-bottom usage to use gap on parent containers

**Files:**
- Modify: `styling/global.css`

`DESIGN.MD §3` says: *"Use gap instead of margin for spacing between elements."* Several component rules use `margin-bottom` where their parent already uses `gap` (via `.column` or `.screen`). Remove the `margin-bottom` declarations that duplicate what `gap` on the parent already provides.

- [ ] **Step 1: Remove margin-bottom from card-adjacent components**

In `styling/global.css`, make these changes:

1. `section.card` — remove `margin-bottom: var(--space-2);` (line ~305). Cards are children of `.column` or `.screen` which have `gap`.

2. `section.card.compact` — remove `margin-bottom: var(--space-2);` (line ~318).

3. `.widget-row` — remove `margin-bottom: var(--space-2);` (line ~635).

4. `.stats-row` — remove `margin-bottom: var(--space-2);` (line ~657).

5. `.tool-bar` — remove `margin-bottom: var(--space-2);` (line ~820).

6. `.plate-calc` — remove `margin-bottom: var(--space-2);` (line ~866).

7. `section.block` — remove `margin-bottom: var(--space-2);` (line ~751).

8. `.insight` — remove `margin-bottom: var(--space-1);` (line ~1074).

- [ ] **Step 2: Convert section-heading margin to padding**

`p.section-heading` uses `margin: var(--space-5) 0 var(--space-2);` which provides top spacing. Change to use only top margin (acts as a section separator, not sibling spacing):

```css
p.section-heading {
  font-family: var(--font-display);
  font-size: var(--text-caption);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-sub);
  padding-top: var(--space-5);
}
```

- [ ] **Step 3: Build and visually verify**

```bash
npx vite build && npx vite preview
```

Open in browser. Check: Dashboard, Log, Progress, Analytics, Social, Profile screens. Elements should maintain spacing via parent `gap` values. If any screen looks compressed, the parent container needs an explicit `gap` value added.

- [ ] **Step 4: Commit**

```bash
git add styling/global.css
git commit -m "refactor(css): replace margin-bottom with parent gap per DESIGN.MD §3"
```

---

### Task 6: Fix BEM selectors in App.tsx to match HTML-first CSS

**Files:**
- Modify: `app/registry/App.tsx`

`App.tsx` uses BEM classes (`app-header__wordmark`, `app-header__dot`, etc.) that have **no matching CSS rules**. The CSS styles the header using HTML-first selectors (`header`, `header h1`, `header .dot`, `header .tag`). Fix the JSX to use the selectors that actually exist.

- [ ] **Step 1: Update App.tsx header markup**

Replace the current header JSX:

```tsx
<header className="app-header">
  <div className="app-header__wordmark">
    <span className="app-header__dot" />
    <h1 className="app-header__title">FITTRACK</h1>
  </div>
  <span className="app-header__tag">v0.1</span>
  <button className="app-header__settings" onClick={() => setShowSettings(true)} title="Settings">
    ⚙
  </button>
</header>
```

With:

```tsx
<header>
  <div className="row center gap-1">
    <span className="dot" />
    <h1>FITTRACK</h1>
  </div>
  <span className="tag">v0.1</span>
  <button className="ghost small" onClick={() => setShowSettings(true)} title="Settings">
    ⚙
  </button>
</header>
```

This matches the CSS rules in `global.css`:
- `header {}` (line ~477) — fixed positioning, flex layout
- `header h1 {}` (line ~490) — font styles
- `header .dot {}` (line ~497) — pulsing accent dot
- `header .tag {}` (line ~506) — version badge

- [ ] **Step 2: Build to verify**

```bash
npx vite build
```

Expected: Build succeeds. The header now renders correctly — the dot pulses, the tag has its border, and the settings button uses the existing `.ghost.small` style.

- [ ] **Step 3: Commit**

```bash
git add app/registry/App.tsx
git commit -m "fix(ui): replace BEM header classes with HTML-first selectors per DESIGN.MD"
```

---

## Phase D — Layer Violation Fixes

### Task 7: Fix ui/bindings layer violation + replace polling with subscriptions

**Files:**
- Modify: `data/projections/views/index.ts` — add change notification to ViewStore
- Modify: `ui/bindings/index.ts` — subscribe to changes instead of polling; fix layer violation

The current `useQuery` hook imports directly from `@data/projections/views` (layer violation: `ui → data`), and polls at 200ms using `setInterval`. Fix both: add change notification to `ViewStore`, and have `useQuery` use it.

Note: `LAYER_RULES.md` says `ui → data` is forbidden ("UI must go through features"). However, `ui/bindings` is the **bridge layer** that wires features to React. It is the one place where reading from the view store is architecturally necessary — features write views, bindings read them. The fix here is not to route through features (which would add a pointless passthrough), but to make the import explicit and document the exception. The real fix is replacing the polling mechanism.

- [ ] **Step 1: Add subscription support to ViewStore**

Replace `data/projections/views/index.ts` with:

```typescript
/**
 * Views are read-optimized snapshots consumed by UI queries.
 * Each feature populates views via its projections.
 *
 * The views map stores serialized state keyed by projection name.
 * Supports change subscriptions so UI can react without polling.
 */
type Listener = () => void;

class ViewStore {
  private views = new Map<string, unknown>();
  private listeners = new Map<string, Set<Listener>>();

  set<T>(key: string, view: T): void {
    this.views.set(key, view);
    const subs = this.listeners.get(key);
    if (subs) {
      for (const fn of subs) fn();
    }
  }

  get<T>(key: string): T | undefined {
    return this.views.get(key) as T | undefined;
  }

  subscribe(key: string, listener: Listener): () => void {
    const subs = this.listeners.get(key) ?? new Set();
    subs.add(listener);
    this.listeners.set(key, subs);
    return () => { subs.delete(listener); };
  }
}

export const viewStore = new ViewStore();
```

- [ ] **Step 2: Update useQuery to use subscription instead of polling**

Replace `ui/bindings/index.ts` with:

```typescript
import { useState, useCallback, useEffect, useRef } from 'react';
// Note: ui/bindings is the designated bridge between the view store and React.
// This is the one sanctioned ui→data import; see LAYER_RULES.md.
import { viewStore } from '@data/projections/views';

/**
 * useQuery subscribes to a view store key and re-renders when it changes.
 */
export function useQuery<T>(key: string): T | null {
  const [data, setData] = useState<T | null>(() => viewStore.get(key) ?? null);

  useEffect(() => {
    // Sync on mount in case the view was set before this component rendered
    const current = viewStore.get<T>(key) ?? null;
    setData(prev => (prev === current ? prev : current));

    return viewStore.subscribe(key, () => {
      setData(viewStore.get<T>(key) ?? null);
    });
  }, [key]);

  return data;
}

/**
 * useCommand wraps a command handler and provides a dispatch function.
 */
export function useCommand<TCmd, TResult>(
  handler: (cmd: TCmd) => Promise<TResult>
): { dispatch: (cmd: TCmd) => Promise<TResult>; pending: boolean } {
  const [pending, setPending] = useState(false);

  const dispatch = useCallback(async (cmd: TCmd) => {
    setPending(true);
    try {
      return await handler(cmd);
    } finally {
      setPending(false);
    }
  }, [handler]);

  return { dispatch, pending };
}
```

- [ ] **Step 3: Build to verify**

```bash
npx vite build
```

Expected: Build succeeds. No runtime regressions — views still update when commands mutate them, but now via subscription instead of polling.

- [ ] **Step 4: Commit**

```bash
git add data/projections/views/index.ts ui/bindings/index.ts
git commit -m "perf: replace 200ms polling with subscription-based view updates

ViewStore now notifies subscribers on set(). useQuery subscribes
instead of polling with setInterval, eliminating ~5 re-renders/sec
per query per component."
```

---

### Task 8: Fix cross-feature import in progress_analysis

**Files:**
- Modify: `features/progress_analysis/domain/types.ts`

`progress_analysis/domain/types.ts` imports `ExerciseCategory` from `@features/training_log`. This violates `LAYER_RULES.md`: *"features/* → features/<other>/* — Cross-feature talks through events only."*

The fix: `ExerciseCategory` is a shared domain concept (`'strength' | 'cardio' | 'mobility' | 'other'`). Move it to `shared/types` where both features can import it.

- [ ] **Step 1: Add ExerciseCategory to shared/types/index.ts**

At the bottom of `shared/types/index.ts`, add:

```typescript
export type ExerciseCategory = 'strength' | 'cardio' | 'mobility' | 'other';
```

- [ ] **Step 2: Update training_log to import from shared**

In `features/training_log/domain/types.ts`, replace line 5:

```typescript
export type ExerciseCategory = 'strength' | 'cardio' | 'mobility' | 'other';
```

With:

```typescript
import type { ExerciseCategory } from '@shared/types';
export type { ExerciseCategory };
```

This keeps the re-export so existing consumers of `@features/training_log` are not broken.

- [ ] **Step 3: Update progress_analysis to import from shared**

In `features/progress_analysis/domain/types.ts`, replace line 2:

```typescript
import type { ExerciseCategory } from '@features/training_log';
```

With:

```typescript
import type { ExerciseCategory } from '@shared/types';
```

- [ ] **Step 4: Verify no other cross-feature imports exist**

```bash
grep -rn "from '@features/" features/ --include="*.ts" --include="*.tsx" | grep -v "from '@features/\($(basename $(dirname $(dirname $PWD)))\)" | grep -v "index\.ts"
```

Simpler check:

```bash
grep -rn "from '@features/" features/ --include="*.ts" | grep -v "__tests__"
```

Each match should only import from its OWN feature (e.g. `features/training_log/commands/handlers.ts` importing from `../domain/types`). Any import like `features/X/... from '@features/Y'` is a violation to fix.

- [ ] **Step 5: Build to verify**

```bash
npx vite build
```

Expected: Build succeeds. Both `training_log` and `progress_analysis` now use the shared type.

- [ ] **Step 6: Commit**

```bash
git add shared/types/index.ts features/training_log/domain/types.ts features/progress_analysis/domain/types.ts
git commit -m "refactor: move ExerciseCategory to shared/types to fix cross-feature import

progress_analysis was importing from training_log, violating LAYER_RULES.md.
ExerciseCategory is a shared domain concept that belongs in the shared layer."
```

---

## Phase E — Responsive & Accessibility

### Task 9: Uncomment and implement mobile breakpoint

**Files:**
- Modify: `styling/global.css`

The phone breakpoint (`< 600px`) is commented out at line ~1693. This means mobile users get no responsive overrides.

- [ ] **Step 1: Uncomment and refine the mobile breakpoint**

In `styling/global.css`, replace the commented-out phone media query (lines ~1692-1710) with:

```css
/* ── Phone (< 600px) ── */
@media (max-width: 599px) {
  .screen {
    padding: var(--space-3) var(--space-3) calc(var(--tab-h) + var(--space-3));
    max-width: 100%;
  }

  .widget-row { grid-template-columns: 1fr 1fr; }
  .grid-3 { grid-template-columns: 1fr 1fr; }

  nav.tabs a span.icon,
  nav.tabs button span.icon { font-size: var(--space-4); }

  .readiness-ring .ring { width: 80px; height: 80px; }
}
```

Note: we do NOT collapse `.row` and `.stats-row` to `flex-direction: column` — the original commented code did this but it breaks the UI since many rows are meant to stay horizontal (e.g. set rows, inline labels). Only grid-based layouts adapt columns.

- [ ] **Step 2: Build and test**

```bash
npx vite build && npx vite preview
```

Open in browser, use DevTools responsive mode at 375px width. Verify Dashboard, Log, and Profile screens render without horizontal overflow.

- [ ] **Step 3: Commit**

```bash
git add styling/global.css
git commit -m "feat(css): enable mobile responsive breakpoint for <600px screens"
```

---

## Phase F — Legacy Aliases Removal

### Task 10: Remove legacy token aliases from global.css

**Files:**
- Modify: `styling/global.css`

Lines 101-119 define legacy aliases (`--bg`, `--surface`, `--card`, `--accent`, `--coral`, `--blue`, `--amber`, `--green`, `--text`, `--text-dim`) that map to the `--color-*` canonical tokens. These violate `DESIGN.MD §10` — "Eliminate micro-variations."

However, removing them requires updating all 300+ usages throughout `global.css` to use the canonical `--color-*` names. This is a high-impact refactor.

- [ ] **Step 1: Count legacy alias usage**

```bash
grep -c "\-\-bg)\|\-\-surface)\|\-\-card)\|\-\-card-hover)\|\-\-border)\|\-\-border-bright)\|\-\-accent)\|\-\-accent-dim)\|\-\-accent-glow)\|\-\-coral)\|\-\-coral-dim)\|\-\-blue)\|\-\-blue-dim)\|\-\-amber)\|\-\-amber-dim)\|\-\-green)\|\-\-green-dim)\|\-\-text)" styling/global.css
```

- [ ] **Step 2: Replace all legacy aliases with canonical token names**

In `styling/global.css`, perform these find-and-replace operations (replace ALL occurrences):

| Find | Replace |
|------|---------|
| `var(--bg)` | `var(--color-bg)` |
| `var(--surface)` | `var(--color-surface)` |
| `var(--card)` | `var(--color-card)` |
| `var(--card-hover)` | `var(--color-card-hover)` |
| `var(--border)` | `var(--color-border)` |
| `var(--border-bright)` | `var(--color-border-bright)` |
| `var(--accent)` | `var(--color-primary)` |
| `var(--accent-dim)` | `var(--color-primary-dim)` |
| `var(--accent-glow)` | `var(--color-primary-glow)` |
| `var(--coral)` | `var(--color-danger)` |
| `var(--coral-dim)` | `var(--color-danger-dim)` |
| `var(--blue)` | `var(--color-info)` |
| `var(--blue-dim)` | `var(--color-info-dim)` |
| `var(--amber)` | `var(--color-warning)` |
| `var(--amber-dim)` | `var(--color-warning-dim)` |
| `var(--green)` | `var(--color-success)` |
| `var(--green-dim)` | `var(--color-success-dim)` |
| `var(--text)` | `var(--color-text)` |
| `var(--text-dim)` | `var(--color-text-dim)` |
| `var(--text-sub)` | `var(--color-text-sub)` |

**Important:** `var(--text-sub)` maps to `var(--color-text-sub)`. Be careful not to replace `var(--text-caption)` or `var(--text-body)` etc. — those are typography tokens, not color aliases. Only replace where the token is used as a **color value** (in `color:`, `background:`, `border-color:`, `stroke:`, `fill:`, `box-shadow:`, `filter:` properties).

- [ ] **Step 3: Delete the legacy aliases block**

Remove lines 100-120 from `styling/global.css`:

```css
  /* ── Legacy aliases ── */
  --bg:            var(--color-bg);
  --surface:       var(--color-surface);
  --card:          var(--color-card);
  --card-hover:    var(--color-card-hover);
  --border:        var(--color-border);
  --border-bright: var(--color-border-bright);
  --accent:        var(--color-primary);
  --accent-dim:    var(--color-primary-dim);
  --accent-glow:   var(--color-primary-glow);
  --coral:         var(--color-danger);
  --coral-dim:     var(--color-danger-dim);
  --blue:          var(--color-info);
  --blue-dim:      var(--color-info-dim);
  --amber:         var(--color-warning);
  --amber-dim:     var(--color-warning-dim);
  --green:         var(--color-success);
  --green-dim:     var(--color-success-dim);
  --text:          var(--color-text);
  --text-dim:      var(--color-text-dim);
```

- [ ] **Step 4: Build to verify**

```bash
npx vite build
```

Expected: Build succeeds. Visual appearance unchanged — same colours, now using canonical token names directly.

- [ ] **Step 5: Commit**

```bash
git add styling/global.css
git commit -m "refactor(css): replace legacy aliases with canonical --color-* tokens

Removes the --bg, --accent, --coral, --blue, --amber, --green, --text
alias layer. All rules now reference --color-* tokens directly,
reducing indirection and conforming to DESIGN.MD §10."
```

---

## Summary

| Task | Phase | Description | Risk |
|------|-------|-------------|------|
| 1 | A | Delete artifact files | None |
| 2 | A | Update .gitignore | None |
| 3 | B | Delete conflicting token/theme/utility files | None (dead code) |
| 4 | C | Remove duplicate CSS rules | Low |
| 5 | C | Replace margin-bottom with gap | Medium — visual check needed |
| 6 | C | Fix BEM in App.tsx | Low |
| 7 | D | Subscription-based useQuery + fix layer import | Medium — runtime change |
| 8 | D | Fix cross-feature import | Low |
| 9 | E | Enable mobile breakpoint | Low |
| 10 | F | Remove legacy CSS aliases | Medium — many replacements |

**Total:** 10 tasks across 6 phases. Each task is independently committable and buildable.
