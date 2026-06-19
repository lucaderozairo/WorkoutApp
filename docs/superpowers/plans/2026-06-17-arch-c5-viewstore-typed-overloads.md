# C5: Remove Untyped ViewStore Overloads — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the legacy untyped overloads on `ViewStore.get`, `.set`, and `.subscribe` so every call site is checked against `ViewRegistry` at compile time.

**Architecture:** `data/projections/views/index.ts` has typed overloads (`get<K extends keyof ViewRegistry>`) that enforce types for known keys, plus legacy fallback overloads (`get<T = unknown>(key: string)`) for callers that predate `ViewRegistry`. The typed overloads already cover all production keys in `schema.ts`. The legacy overloads exist only for mock/seed callers and a handful of `useQuery` call sites that pass explicit type params. This plan migrates those remaining call sites and removes the fallback overloads. The mock keys in `ViewRegistry` are typed as `unknown` — leave them as-is; they're already in the registry.

**Tech Stack:** TypeScript, Vitest.

---

## File Map

| Action | File |
|--------|------|
| Modify | `data/projections/views/index.ts` (remove legacy overloads) |
| Modify | Call sites that relied on the legacy overloads (grep-driven) |

---

### Task 1: Find all legacy call sites

**Files:**
- Read-only grep

- [ ] **Step 1: Grep for legacy `get<T>` calls with an explicit type param**

  Run:
  ```bash
  grep -rn "viewStore\.get<[^k]" --include="*.ts" --include="*.tsx"
  grep -rn "useQuery<[^k]" --include="*.ts" --include="*.tsx"
  ```

  These patterns find calls like `viewStore.get<ActivityView>('key')` or `useQuery<ActivityView>('key')` where a type param is passed explicitly — the typed overload would infer the type automatically for keys in `ViewRegistry`, so an explicit param means either the key is missing from the registry or the caller hasn't been updated.

- [ ] **Step 2: Grep for legacy `set` and `subscribe` calls**

  Run:
  ```bash
  grep -rn "viewStore\.set<" --include="*.ts" --include="*.tsx"
  grep -rn "viewStore\.subscribe<" --include="*.ts" --include="*.tsx"
  ```

- [ ] **Step 3: List the files**

  Write down the list of files with legacy calls. These are the migration targets for Task 2.

---

### Task 2: Migrate legacy call sites to use inferred types

For each file found in Task 1, remove the explicit type param — TypeScript will infer it from the `ViewRegistry` key.

**Files:**
- Modify: each file from Task 1's grep output

- [ ] **Step 1: For each file, remove the explicit type param from the call**

  Example migration:
  ```typescript
  // Before (legacy — explicit type param)
  const state = viewStore.get<ActivitiesState>('sessions');
  const session = useQuery<ActivityView>('active_session');

  // After (typed overload — type inferred from ViewRegistry)
  const state = viewStore.get('sessions');      // inferred as ActivitiesState | undefined
  const session = useQuery('active_session');   // inferred as ActivityView | undefined
  ```

  Do this for every call site. Do not change the key strings.

- [ ] **Step 2: TypeScript check after each file**

  After editing each file, run: `npx tsc --noEmit`
  Expected: zero errors. If a key is missing from `ViewRegistry`, the error message will say `Argument of type '"my-key"' is not assignable to parameter of type 'keyof ViewRegistry'` — that's a real gap that needs fixing (see Task 3).

- [ ] **Step 3: Commit once all call sites are migrated**

  ```bash
  git add <all modified files>
  git commit -m "refactor(viewstore): remove explicit type params — use ViewRegistry inference"
  ```

---

### Task 3: Add any missing keys to `ViewRegistry`

If Task 2 produced TypeScript errors about keys not in `ViewRegistry`, this task fixes them.

**Files:**
- Modify: `data/projections/views/schema.ts`

- [ ] **Step 1: For each missing key, determine its type**

  Read the file that produced the error. The generic type param on the old `get<T>` call tells you the intended type (e.g., `viewStore.get<SomeView>('some_key')` → the key is `some_key` with type `SomeView`).

- [ ] **Step 2: Add the key to `ViewRegistry` in `schema.ts`**

  Find the correct feature section in `schema.ts` (or add a new one). Import the type directly from the feature's domain/projections (never from the feature barrel `@features/<name>` with no sub-path). Add the entry:

  ```typescript
  // ── my_feature ───────────────────────────────────────────────────────────
  import type { SomeView } from '@features/my_feature/projections/someProjection';

  // In ViewRegistry:
  some_key: SomeView;
  ```

- [ ] **Step 3: TypeScript check**

  Run: `npx tsc --noEmit`
  Expected: zero errors.

- [ ] **Step 4: Commit**

  ```bash
  git add data/projections/views/schema.ts
  git commit -m "feat(viewstore): register missing ViewRegistry keys"
  ```

---

### Task 4: Remove the legacy overloads from `ViewStore`

Only proceed here once Task 2 and Task 3 have zero TypeScript errors.

**Files:**
- Modify: `data/projections/views/index.ts`

- [ ] **Step 1: Remove the three legacy overloads**

  In `data/projections/views/index.ts`, remove:

  ```typescript
  // Legacy fallback: explicit type param at call site (e.g. viewStore.get<T>('key')).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- legacy overload, callers will be migrated (TODO arch)
  get<T = unknown>(key: string): T | undefined;
  ```

  ```typescript
  // Legacy fallback: untyped key/value pairs (mock seeds, unknown keys, etc.).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- legacy overload, callers will be migrated (TODO arch)
  set<T = unknown>(key: string, value: T): void;
  ```

  ```typescript
  // Legacy fallback: no-arg callback (existing internal usage in ui/bindings).
  subscribe(key: string, fn: () => void): () => void;
  ```

  After removing them, update the implementation method signature for `get`, `set`, and `subscribe` — they should now only accept `K extends keyof ViewRegistry`. If the implementation's `string` key parameter causes a TypeScript error after removal, keep it as `string` in the implementation body (the overloads enforce the call site; the implementation can stay loose internally).

- [ ] **Step 2: TypeScript check**

  Run: `npx tsc --noEmit`
  Expected: zero errors. If new errors appear, a call site was missed in Task 2 — go back and fix it.

- [ ] **Step 3: Run full test suite**

  Run: `npx vitest run`
  Expected: all pass.

- [ ] **Step 4: Commit**

  ```bash
  git add data/projections/views/index.ts
  git commit -m "refactor(viewstore): remove legacy untyped overloads — ViewRegistry enforced everywhere"
  ```

---

## Self-Review

**Spec coverage:** ✓ Legacy `get`/`set`/`subscribe` overloads removed (Task 4). ✓ Call sites migrated first (Task 2). ✓ Missing keys added to registry before removing overloads (Task 3).

**Placeholder scan:** Task 2 Step 1 says "for each file from Task 1" — the actual files are unknown until the grep runs. This is unavoidable; the grep drives the work. No code is deferred.1

**Type consistency:** `ViewRegistry` from `schema.ts` is the single source of truth throughout. No new types are introduced; existing types are inferred from the registry.

**Note on mock keys:** `ViewRegistry` already has `social_posts_mock`, `nutrition_entries_mock`, etc. typed as `unknown`. These are correct — leave them. The mock seed file (`data/mock/seed.ts`) uses these keys and will be covered by the existing typed overload once the legacy fallback is removed.
