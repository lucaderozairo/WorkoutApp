# C1: Close the Cross-Feature Seam at `contract.ts` — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate two concrete cross-feature implementation leaks so that every inter-feature import flows only through `contract.ts`.

**Architecture:** Two files currently bypass `contract.ts`: `NutritionTracking.ts` re-exports the entire nutrition barrel (`@features/nutrition`); `calendarUtils.ts` imports `CardioSession`/`CardioSport` directly from `@features/cardio/domain/types`. Both target types already exist in the respective `contract.ts` files — the fix is two import path changes plus one ESLint upgrade.

**Tech Stack:** TypeScript, ESLint (`eslint-plugin-boundaries`, `no-restricted-imports`), Vitest.

---

## File Map

| Action | File |
|--------|------|
| Modify | `features/profile/domain/health/NutritionTracking.ts` |
| Modify | `features/training_log/queries/calendarUtils.ts` |
| Modify | `eslint.config.js` (add `no-restricted-imports` rule) |
| Verify | `features/nutrition/contract.ts` (read-only reference) |
| Verify | `features/cardio/contract.ts` (read-only reference) |

---

### Task 1: Fix `NutritionTracking.ts`

The file currently does `export * from '@features/nutrition'`, which re-exports implementation through the profile domain boundary.

**Files:**
- Modify: `features/profile/domain/health/NutritionTracking.ts`

- [ ] **Step 1: Read the current file**

  ```
  features/profile/domain/health/NutritionTracking.ts
  ```
  Current content:
  ```typescript
  // Re-exports the nutrition domain under the Health umbrella.
  export * from '@features/nutrition';
  ```

- [ ] **Step 2: Read `features/nutrition/contract.ts` to know what types are available**

  Run: `grep -n "^export" features/nutrition/contract.ts`

  This tells you which types the contract already surfaces. Do not add types to `contract.ts` — only use what is already there.

- [ ] **Step 3: Find callers of `NutritionTracking.ts` inside `features/profile`**

  Run: `grep -r "NutritionTracking" features/profile/ --include="*.ts" --include="*.tsx" -l`

  This tells you which types profile code actually needs from nutrition. Only re-export those.

- [ ] **Step 4: Replace the barrel re-export with specific contract imports**

  Replace `features/profile/domain/health/NutritionTracking.ts` with targeted re-exports from `@features/nutrition/contract`:

  ```typescript
  // Re-exports nutrition types needed by the profile health domain.
  // Import from contract only — never from @features/nutrition barrel.
  export type { NutritionCategory, NutritionEntry, NutritionEntryView } from '@features/nutrition/contract';
  ```

  Adjust the exact list to match what callers actually import (Step 3).

- [ ] **Step 5: Verify TypeScript still compiles**

  Run: `npx tsc --noEmit`
  Expected: zero errors. If errors appear, check which type is missing and add it from `@features/nutrition/contract` (if it's already exported there) or leave a comment pointing to where it should be added to the contract.

- [ ] **Step 6: Commit**

  ```bash
  git add features/profile/domain/health/NutritionTracking.ts
  git commit -m "fix(arch): import nutrition types from contract, not barrel"
  ```

---

### Task 2: Fix `calendarUtils.ts`

The file imports `CardioSession` and `CardioSport` directly from `@features/cardio/domain/types`. Both are already exported by `@features/cardio/contract`.

**Files:**
- Modify: `features/training_log/queries/calendarUtils.ts`

- [ ] **Step 1: Confirm both types exist in the cardio contract**

  Run: `grep "CardioSession\|CardioSport" features/cardio/contract.ts`
  Expected output contains:
  ```
  export type { CardioSport, CardioSession, SessionComment } from './domain/types';
  ```

- [ ] **Step 2: Replace the domain imports with contract imports**

  In `features/training_log/queries/calendarUtils.ts`, change:
  ```typescript
  // eslint-disable-next-line boundaries/element-types -- TODO(arch): cross-layer import baselined; see docs/superpowers/plans/2026-06-03-architecture-rule-enforcement.md
  import type { CardioSession } from '@features/cardio/domain/types';
  import type { ActivityHistoryItem } from '@features/training_log';
  // eslint-disable-next-line boundaries/element-types -- TODO(arch): cross-layer import baselined; see docs/superpowers/plans/2026-06-03-architecture-rule-enforcement.md
  import type { CardioSport } from '@features/cardio/domain/types';
  ```
  to:
  ```typescript
  import type { CardioSession, CardioSport } from '@features/cardio/contract';
  import type { ActivityHistoryItem } from '@features/training_log';
  ```

  The `eslint-disable` comments are removed because the import is now clean.

- [ ] **Step 3: Verify TypeScript compiles**

  Run: `npx tsc --noEmit`
  Expected: zero errors.

- [ ] **Step 4: Run the test suite**

  Run: `npx vitest run features/training_log`
  Expected: all pass.

- [ ] **Step 5: Commit**

  ```bash
  git add features/training_log/queries/calendarUtils.ts
  git commit -m "fix(arch): import CardioSession/CardioSport from cardio/contract"
  ```

---

### Task 3: Add ESLint rule to catch future violations

The two existing violations had `// eslint-disable` comments with TODO notes. Upgrade those TODOs to an enforced rule.

**Files:**
- Modify: `eslint.config.js`

- [ ] **Step 1: Read the current `eslint.config.js`**

  Open `eslint.config.js` and find where `no-restricted-imports` or `boundaries/element-types` rules are configured. Look for an existing pattern to follow.

- [ ] **Step 2: Add the rule**

  In the appropriate rules block, add or extend a `no-restricted-imports` rule that blocks direct domain/commands/projections imports across features:

  ```js
  {
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['@features/*/domain/*', '@features/*/commands/*', '@features/*/projections/*', '@features/*/queries/*', '@features/*/policies/*'],
            message: 'Cross-feature imports must go through contract.ts only. Import from @features/<name>/contract instead.',
          },
        ],
      }],
    },
  }
  ```

  **Important:** Apply this rule only to files *inside* `features/` (not to the feature's own files importing their own internals). Scope it with a `files` glob like `['features/**/*.ts', 'features/**/*.tsx']`.

  The exact syntax depends on the existing config format — follow what's already there for `boundaries/element-types`.

- [ ] **Step 3: Run ESLint to verify no regressions outside the two already-fixed files**

  Run: `npx eslint features/ --ext .ts,.tsx`
  Expected: no new errors. If you see errors, those are real leaks — fix them or add them to a baselined ignore list with a TODO comment.

- [ ] **Step 4: Commit**

  ```bash
  git add eslint.config.js
  git commit -m "chore(arch): enforce cross-feature contract-only imports via ESLint"
  ```

---

## Self-Review

**Spec coverage:** ✓ NutritionTracking.ts fixed (Task 1). ✓ calendarUtils.ts fixed (Task 2). ✓ ESLint rule added (Task 3).

**Placeholder scan:** No placeholders.

**Type consistency:** All types (`CardioSession`, `CardioSport`, `NutritionCategory`, `NutritionEntry`, `NutritionEntryView`) are drawn from the contracts where they are already defined.
