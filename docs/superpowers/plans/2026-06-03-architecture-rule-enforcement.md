# Architecture Rule Enforcement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the ten architecture rules in `CLAUDE.md` machine-enforced so violations fail CI instead of relying on discipline.

**Architecture:** Two linters wired into the existing CI pipeline. ESLint (flat config) enforces the layer dependency graph and the inline-style ban using `eslint-plugin-boundaries`. Stylelint enforces token-driven CSS using `stylelint-declaration-strict-value`. Rules that the codebase already satisfies ship as `error`; rules with existing violations ship as `warn`, get triaged, then ratchet to `error`.

**Tech Stack:** ESLint 9 (flat config), `typescript-eslint` 8, `eslint-plugin-boundaries` 5, Stylelint 16, `stylelint-config-standard`, `stylelint-declaration-strict-value`. Build is Vite + `tsc`; tests are Vitest. CI is GitHub Actions (`.github/workflows/ci.yml`).

**Layer model (from CLAUDE.md):**

```
tokens ← primitives(ui/atoms,ui/molecules) ← layouts(ui/layout) ← patterns(ui/patterns)
       ← feature-ui(ui/components) ← screens(ui/screens,ui/navigation)
features(features/*) → infrastructure(data,core) → shared    (domain logic side)
```

**Rule → mechanism map:**
| Rule | Enforced by |
|---|---|
| 1, 2, 3, 9, 10 (layer dependency direction) | `eslint-plugin-boundaries` element-types |
| 4 (no cross-feature imports) | boundaries same-feature capture + Task 6 type migration |
| 6, 7 (no inline styles) | ESLint `no-restricted-syntax` on `style` JSX attribute |
| 5, 6, 7 (token-driven CSS values) | `stylelint-declaration-strict-value` |
| 8 (fails CI) | `ci.yml` lint steps |

---

## File Structure

- `eslint.config.js` (create) — flat ESLint config; layer element definitions + dependency rules + inline-style ban.
- `stylelint.config.js` (create) — token-discipline rules for `styling/**/*.css`.
- `package.json` (modify) — add `lint`, `lint:css` scripts + devDependencies.
- `.github/workflows/ci.yml` (modify) — add two lint steps.
- `shared/contracts/index.ts` (modify, Task 6) — re-export shared domain types so features stop importing each other.
- `CLAUDE.md` (modify, Task 8) — flip Rule 8 from "planned" to "enforced".
- `eslint-fixtures/` (create then delete per task) — throwaway violation files used only to prove a rule fires.

---

### Task 1: Install linting toolchain

**Files:**

- Modify: `package.json` (devDependencies + scripts)

- [ ] **Step 1: Install ESLint + boundaries toolchain**

Run:

```bash
npm install -D eslint@^9 @eslint/js@^9 typescript-eslint@^8 eslint-plugin-boundaries@^5 globals
```

Expected: packages added to `devDependencies`, no peer-dep errors.

- [ ] **Step 2: Install Stylelint toolchain**

Run:

```bash
npm install -D stylelint@^16 stylelint-config-standard@^36 stylelint-declaration-strict-value@^1
```

Expected: packages added to `devDependencies`.

- [ ] **Step 3: Add lint scripts to `package.json`**

In the `"scripts"` block add:

```json
    "lint": "eslint .",
    "lint:css": "stylelint \"styling/**/*.css\"",
```

- [ ] **Step 4: Verify the binaries resolve**

Run: `npx eslint --version && npx stylelint --version`
Expected: prints an ESLint 9.x version and a Stylelint 16.x version.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(lint): add eslint + stylelint toolchain"
```

---

### Task 2: ESLint flat config with layer element definitions

**Files:**

- Create: `eslint.config.js`

- [ ] **Step 1: Write the flat config with element types (no rules enabled yet)**

```js
// eslint.config.js
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import boundaries from "eslint-plugin-boundaries";

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "eslint-fixtures/**",
      "graphify-out/**",
      "docs/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { boundaries },
    settings: {
      "boundaries/elements": [
        { type: "tokens", pattern: "styling/*" },
        { type: "primitives", pattern: "ui/atoms/*" },
        { type: "primitives", pattern: "ui/molecules/*" },
        { type: "layouts", pattern: "ui/layout/*" },
        { type: "patterns", pattern: "ui/patterns/*" },
        { type: "feature-ui", pattern: "ui/components/*" },
        { type: "screens", pattern: "ui/screens/*" },
        { type: "screens", pattern: "ui/navigation/*" },
        { type: "feature-logic", pattern: "features/*", capture: ["feature"] },
        { type: "infrastructure", pattern: "data/*" },
        { type: "infrastructure", pattern: "core/*" },
        { type: "shared", pattern: "shared/*" },
        { type: "app", pattern: "app/*" },
      ],
      "boundaries/ignore": ["**/*.test.{ts,tsx}", "**/*.d.ts"],
    },
    rules: {},
  },
);
```

- [ ] **Step 2: Verify config loads and parses the repo**

Run: `npx eslint . --no-warn-ignored`
Expected: ESLint runs to completion (it may report `typescript-eslint` recommended findings, but NO config/parse errors). If recommended rules produce excessive noise, narrow them in a follow-up — do not let them block this task.

- [ ] **Step 3: Commit**

```bash
git add eslint.config.js
git commit -m "chore(lint): eslint flat config with layer element types"
```

---

### Task 3: Enforce design-system → feature dependency ban (Rules 1,2,3,9,10)

The codebase is already clean here (`ui/atoms`, `ui/molecules`, `ui/layout` import no features), so this ships as `error`.

**Files:**

- Modify: `eslint.config.js` (add `boundaries/element-types` rule)
- Create (temp): `eslint-fixtures/violation.tsx`

- [ ] **Step 1: Add the dependency-direction rule**

In `eslint.config.js`, replace `rules: {}` with:

```js
    rules: {
      'boundaries/element-types': ['error', {
        default: 'disallow',
        rules: [
          { from: ['tokens'],         allow: [] },
          { from: ['primitives'],     allow: ['primitives', 'shared'] },
          { from: ['layouts'],        allow: ['primitives', 'layouts', 'shared'] },
          { from: ['patterns'],       allow: ['primitives', 'layouts', 'patterns', 'shared'] },
          { from: ['feature-ui'],     allow: ['primitives', 'layouts', 'patterns', 'feature-ui', 'feature-logic', 'shared'] },
          { from: ['screens'],        allow: ['primitives', 'layouts', 'patterns', 'feature-ui', 'feature-logic', 'screens', 'shared'] },
          // feature-logic: same-feature only (Rule 4) + downward to infra/shared
          { from: ['feature-logic'],  allow: ['infrastructure', 'shared', ['feature-logic', { feature: '${from.feature}' }]] },
          { from: ['infrastructure'], allow: ['infrastructure', 'shared'] },
          { from: ['shared'],         allow: ['shared'] },
          { from: ['app'],            allow: ['*'] },
        ],
      }],
    },
```

- [ ] **Step 2: Write a deliberate violation fixture**

Create `eslint-fixtures/violation.tsx` — temporarily add `eslint-fixtures` as a `primitives` element by appending `{ type: 'primitives', pattern: 'eslint-fixtures/*' }` to `boundaries/elements`, then:

```tsx
// eslint-fixtures/violation.tsx — proves a primitive cannot import a feature
import { something } from "@features/training_log/queries";
export const X = something;
```

- [ ] **Step 3: Run ESLint, expect the boundary error**

Run: `npx eslint eslint-fixtures/violation.tsx`
Expected: FAIL with a `boundaries/element-types` error ("element of type primitives is not allowed to import feature-logic").

- [ ] **Step 4: Remove the fixture and the temporary element entry**

```bash
rm -rf eslint-fixtures
```

Then delete the `{ type: 'primitives', pattern: 'eslint-fixtures/*' }` line from `boundaries/elements`.

- [ ] **Step 5: Run ESLint on the whole repo, expect NO boundary errors**

Run: `npx eslint . --no-warn-ignored --rule '{}' 2>&1 | grep -c "boundaries/element-types" || true`
Expected: `0` boundary violations from the design-system layers. (If any appear in `features/*` cross-imports, they belong to Task 6 — note them and continue; they are expected until Task 6 runs.)

- [ ] **Step 6: Commit**

```bash
git add eslint.config.js
git commit -m "feat(lint): enforce layer dependency boundaries"
```

---

### Task 4: Ban inline styles (Rules 6,7)

8 `.tsx` files currently use `style={{`. Ship as `warn`, triage in Task 5, ratchet to `error` in Task 8.

**Files:**

- Modify: `eslint.config.js`

- [ ] **Step 1: Add the inline-style rule as a warning**

Add to the `rules` block:

```js
      'no-restricted-syntax': ['warn', {
        selector: 'JSXAttribute[name.name="style"]',
        message: 'No inline styles (Rules 6/7): use CSS classes + tokens. Dynamic CSS custom properties are the only allowed exception — add `// eslint-disable-next-line no-restricted-syntax` with a one-line justification.',
      }],
```

- [ ] **Step 2: Run ESLint and capture the inline-style warnings**

Run: `npx eslint . --no-warn-ignored 2>&1 | grep "no-restricted-syntax" | wc -l`
Expected: a non-zero count (~8). Save the file list for Task 5.

- [ ] **Step 3: Commit**

```bash
git add eslint.config.js
git commit -m "feat(lint): warn on inline styles"
```

---

### Task 5: Triage existing inline styles

Convert each `style={{...}}` to either a CSS class or a dynamic CSS custom property. Dynamic values (progress %, chart heights) may keep `style` ONLY to set a CSS variable, with an `eslint-disable` justification.

**Files:**

- Modify: each `.tsx` flagged in Task 4 Step 2.

- [ ] **Step 1: List the flagged files**

Run: `npx eslint . --no-warn-ignored 2>&1 | grep -B1 "no-restricted-syntax" | grep -oE "^\S+\.tsx" | sort -u`
Expected: the list of files to fix.

- [ ] **Step 2: For each file — static styles → CSS class**

If the style is static (e.g. `style={{ display: 'flex' }}`), move it to the appropriate `styling/*.css` file as a class (token-driven, nested), and apply via `className`. Follow existing semantic-class + nesting conventions.

- [ ] **Step 3: For each file — dynamic styles → CSS custom property**

If the value is computed (e.g. a width percentage), set a CSS variable instead and consume it in CSS:

```tsx
// eslint-disable-next-line no-restricted-syntax -- dynamic value must be a CSS custom property
<div
  className="bar"
  style={{ "--bar-fill": `${pct}%` } as React.CSSProperties}
/>
```

```css
.bar {
  inline-size: var(--bar-fill);
}
```

- [ ] **Step 4: Re-run ESLint, expect zero un-disabled inline-style warnings**

Run: `npx eslint . --no-warn-ignored 2>&1 | grep "no-restricted-syntax" | wc -l`
Expected: `0` (every remaining `style` usage carries a justification disable comment).

- [ ] **Step 5: Verify nothing visually broke**

Run: `npm run build` (Expected: succeeds) then spot-check the affected screens with the `run` skill if available.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor(ui): remove inline styles in favour of token-driven CSS"
```

---

### Task 6: Migrate cross-feature types into shared/contracts (Rule 4)

~10 sites import another feature's `domain/types` (mostly `training_log` and `cardio` types: `SetEntry`, `SessionFinishedPayload`, `SportType`, `CardioSession`, `CardioSport`, `StrengthSet`). These shared contracts move to `shared/contracts` so no feature imports another.

**Files:**

- Modify: `shared/contracts/index.ts`
- Modify: the importing files (listed in Step 1)

- [ ] **Step 1: Enumerate cross-feature imports**

Run: `npx eslint . --no-warn-ignored 2>&1 | grep "boundaries/element-types" | grep -i feature` and cross-check with:

```bash
grep -rn "from '@features/" features | grep -vE "from '@features/([a-z_]+)'" | grep "$(basename "$PWD")" || grep -rn "from '@features/.*domain" features
```

Expected: the set of cross-feature type-import sites.

- [ ] **Step 2: Identify the shared types**

These are the domain types referenced across features. Confirm the canonical definition of each (e.g. `SessionFinishedPayload`, `SetEntry`, `SportType` in `features/training_log/domain/types.ts`; `CardioSession`, `CardioSport` in `features/cardio/domain/types.ts`).

- [ ] **Step 3: Re-export shared contracts from `shared/contracts`**

In `shared/contracts/index.ts`, add a cross-feature contract surface. Prefer relocating the type definitions here; if a type is co-owned with a feature's reducers, re-export it:

```ts
// shared/contracts/index.ts — cross-feature domain contracts (Rule 4)
export type {
  SessionFinishedPayload,
  SetEntry,
  SportType,
} from "@features/training_log/domain/types";
export type { CardioSession, CardioSport } from "@features/cardio/domain/types";
```

> Note: this re-export still lives logically above features. If stricter purity is wanted, move the type _definitions_ into `shared/contracts` and have the features import them back. Decide per-type; re-export is the minimal change.

- [ ] **Step 4: Repoint every cross-feature importer**

In each file from Step 1, change `from '@features/<other>/domain/types'` to `from '@shared/contracts'`. Leave same-feature imports untouched.

- [ ] **Step 5: Typecheck + test**

Run: `npx tsc --noEmit && npm test`
Expected: PASS (no type errors, tests green).

- [ ] **Step 6: Run ESLint, expect zero cross-feature boundary errors**

Run: `npx eslint . --no-warn-ignored 2>&1 | grep -c "boundaries/element-types" || true`
Expected: `0`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor(features): route cross-feature types through shared/contracts"
```

---

### Task 7: Stylelint token-discipline config (Rules 5,6,7)

Hardcoded values exist (e.g. `padding: 6px var(--s-2)`), so strict-value ships as `warning`, gets triaged, then ratchets to `error` in Task 8.

**Files:**

- Create: `stylelint.config.js`
- Create (temp): `stylelint-fixtures/bad.css`

- [ ] **Step 1: Write the Stylelint config**

```js
// stylelint.config.js
export default {
  extends: ["stylelint-config-standard"],
  plugins: ["stylelint-declaration-strict-value"],
  rules: {
    "scale-unlimited/declaration-strict-value": [
      [
        "/color$/",
        "background-color",
        "fill",
        "stroke",
        "padding",
        "padding-top",
        "padding-right",
        "padding-bottom",
        "padding-left",
        "margin",
        "margin-top",
        "margin-right",
        "margin-bottom",
        "margin-left",
        "gap",
        "row-gap",
        "column-gap",
        "border-radius",
        "box-shadow",
        "font-size",
        "z-index",
      ],
      {
        ignoreValues: [
          "transparent",
          "inherit",
          "currentColor",
          "currentcolor",
          "none",
          "unset",
          "initial",
          "auto",
          "0",
          "fit-content",
          "max-content",
          "min-content",
        ],
        ignoreFunctions: false,
        severity: "warning",
        disableFix: true,
        message:
          "Use a design token (var(--…)) instead of a hardcoded value (Rules 5/6/7).",
      },
    ],
  },
  ignoreFiles: [
    "dist/**",
    "node_modules/**",
    "styling/tokens.css",
    "styling/themes/**",
    "styling/reset.css",
  ],
};
```

> `tokens.css`, `themes/`, and `reset.css` are exempt — they are where literal values are _defined_.

- [ ] **Step 2: Write a deliberate violation fixture**

```css
/* stylelint-fixtures/bad.css */
.x {
  padding: 12px;
  color: #ff0000;
}
```

- [ ] **Step 3: Run Stylelint on the fixture, expect warnings**

Run: `npx stylelint stylelint-fixtures/bad.css`
Expected: warnings on both `padding` and `color` (hardcoded values).

- [ ] **Step 4: Remove the fixture**

```bash
rm -rf stylelint-fixtures
```

- [ ] **Step 5: Run Stylelint on the real CSS, capture the baseline**

Run: `npx stylelint "styling/**/*.css" 2>&1 | grep -c "declaration-strict-value" || true`
Expected: a non-zero count — the triage backlog for Task 8 Step 1.

- [ ] **Step 6: Commit**

```bash
git add stylelint.config.js
git commit -m "feat(lint): stylelint token-discipline config (warning)"
```

---

### Task 8: Triage CSS, ratchet rules to error, update CLAUDE.md

**Files:**

- Modify: `styling/*.css` (flagged files)
- Modify: `eslint.config.js`, `stylelint.config.js` (severity → error)
- Modify: `CLAUDE.md`

- [ ] **Step 1: Fix flagged hardcoded CSS values**

For each warning from Task 7 Step 5, replace the literal with the matching token (e.g. `padding: 6px var(--s-2)` → `padding: var(--s-1) var(--s-2)`). If no token exists for a needed value, add it to `styling/tokens.css` first, then reference it. Re-run `npx stylelint "styling/**/*.css"` until the count is `0`.

- [ ] **Step 2: Ratchet Stylelint to error**

In `stylelint.config.js`, change `severity: 'warning'` to `severity: 'error'`.
Run: `npx stylelint "styling/**/*.css"`
Expected: PASS (exit 0).

- [ ] **Step 3: Ratchet the inline-style rule to error**

In `eslint.config.js`, change `'no-restricted-syntax': ['warn', …]` to `['error', …]`.
Run: `npx eslint . --no-warn-ignored`
Expected: no `no-restricted-syntax` errors (all remaining usages carry justified disables).

- [ ] **Step 4: Update CLAUDE.md Rule 8**

Replace the Rule 8 line so it no longer says "planned":

```md
8. **ESLint + Stylelint boundaries fail CI when violated.** Layer dependencies via `eslint-plugin-boundaries`; token discipline via `stylelint-declaration-strict-value`. See `eslint.config.js` / `stylelint.config.js`.
```

Also add under the Architecture section: `Enforcement plan: docs/superpowers/plans/2026-06-03-architecture-rule-enforcement.md`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(lint): ratchet token + inline-style rules to error; update CLAUDE.md"
```

---

### Task 9: Wire linting into CI

**Files:**

- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Add lint steps after the type-check step**

In `.github/workflows/ci.yml`, insert between the `Type check` and `Build` steps:

```yaml
- name: Lint (architecture boundaries)
  run: npm run lint

- name: Lint CSS (token discipline)
  run: npm run lint:css
```

- [ ] **Step 2: Verify the commands pass locally exactly as CI runs them**

Run: `npm run lint && npm run lint:css`
Expected: both exit 0.

- [ ] **Step 3: Commit and push to trigger CI**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: enforce architecture + token rules on PRs"
```

- [ ] **Step 4: Confirm CI is green**

After pushing, check the GitHub Actions run for the branch.
Run: `gh run list --branch "$(git branch --show-current)" --limit 1`
Expected: the latest CI run concludes `success`.

---

## Self-Review Notes

- **Rule coverage:** Rules 1,2,3,9,10 → Task 3; Rule 4 → Tasks 3+6; Rules 6,7 → Tasks 4,5,8; Rules 5,6,7 (CSS) → Tasks 7,8; Rule 8 → Task 9. Rule 9 (shared design system) is structurally enforced because there is a single `app/` shell — boundaries prevent a second design system from importing differently; no separate task needed until a second shell exists.
- **Phasing rationale:** rules the repo already satisfies (design-system→feature) start as `error`; rules with a known backlog (inline styles, CSS literals, cross-feature types) start as `warn`/`warning` and ratchet to `error` only after triage, so CI never goes red on the introducing commit.
- **Open decision carried from CLAUDE.md:** global CSS files vs CSS Modules is NOT decided by this plan; Stylelint operates on `styling/**/*.css` either way.
- **Risk:** `typescript-eslint` recommended rules may surface unrelated findings on first run (Task 2). They are out of scope — if noisy, downgrade to `tseslint.configs.base` rather than blocking this plan.
