# Error Taxonomy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the deletion test to the 9 unused typed error classes in `core/errors/AppError.ts`. They exist but are unused — all handlers return `Result<T, string>` with bare string messages. This plan applies Option A (delete the ceremony) unless a concrete use case surfaces during the work.

**Architecture:** Delete `core/errors/AppError.ts` and `core/errors/AppError.test.ts`. Update `core/errors/index.ts` and any imports. If the error boundary (`app/registry/App.tsx`) currently imports error types for display purposes, replace with a simpler runtime `instanceof Error` check.

**Tech Stack:** TypeScript, existing `Result<T, E>` type from `@shared/types`.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Read | `core/errors/AppError.ts` | Understand what exists before deleting |
| Read | `core/errors/index.ts` | Understand re-exports |
| Read | `app/registry/App.tsx` | Find where error types are imported |
| Delete | `core/errors/AppError.ts` | Remove unused ceremony |
| Delete | `core/errors/AppError.test.ts` | Tests for deleted code |
| Modify | `core/errors/index.ts` | Remove re-exports of deleted types |
| Modify | `app/registry/App.tsx` | Remove imports, simplify error boundary |

---

## Task 1: Verify the deletion is safe

- [x] **Step 1.1: Check all imports of AppError**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Also run:

```bash
grep -r "AppError\|from.*core/errors\|from.*@core/errors" src features ui data shared --include="*.ts" --include="*.tsx" -l
```

Expected: only `app/registry/App.tsx` and `core/errors/index.ts` appear. If other files appear, read them before continuing — they may need updating.

- [x] **Step 1.2: Read `core/errors/AppError.ts`**

Confirm the file only contains class definitions (no runtime logic like global error handlers, sentry wrappers, etc.). If it contains anything beyond class definitions, stop and assess before deleting.

- [x] **Step 1.3: Read `app/registry/App.tsx` error boundary section**

Find how the error types are used. Expected: just an `import` that is never referenced at runtime (the boundary catches `unknown` and shows a fallback UI). If the import is unused, TypeScript may already warn about it.

---

## Task 2: Delete AppError.ts and AppError.test.ts

- [x] **Step 2.1: Delete the files**

```bash
git rm core/errors/AppError.ts core/errors/AppError.test.ts
```

- [x] **Step 2.2: `npx tsc --noEmit` — check errors**

Expected errors: only import sites that referenced the deleted types. Proceed to fix them.

---

## Task 3: Clean up core/errors/index.ts

- [x] **Step 3.1: Read the current index.ts**

Identify which named exports came from AppError.ts.

- [x] **Step 3.2: Remove the AppError exports**

If `core/errors/index.ts` only re-exported from AppError.ts and is now empty, delete it too:

```bash
git rm core/errors/index.ts
```

If it also exports other things (e.g., `TelemetryLogger`, `ErrorBoundaryRoot`), only remove the AppError lines.

---

## Task 4: Update app/registry/App.tsx

- [x] **Step 4.1: Remove the AppError import**

Find the import line, e.g.:

```typescript
import { StorageFullError, NetworkOfflineError, ... } from '@core/errors';
```

Delete it.

- [x] **Step 4.2: Simplify any error-type checks in the error boundary**

If the boundary has code like:

```typescript
if (error instanceof StorageFullError) {
  return <StorageFullMessage />;
}
```

Replace with a simpler message (since the typed errors were never thrown, these branches are dead code):

```typescript
// Error boundary catches any thrown error — show generic fallback
```

If the boundary only catches `unknown` and renders a generic fallback with no type-specific logic, no change needed beyond removing the import.

- [x] **Step 4.3: `npx tsc --noEmit` — 0 errors**

- [x] **Step 4.4: Run all tests**

```bash
npx vitest run
```
Expected: same pass/fail count as before (the deleted test file is no longer counted).

- [ ] **Step 4.5: Commit**

```bash
git add core/errors/ app/registry/App.tsx
git rm core/errors/AppError.ts core/errors/AppError.test.ts  # if not already staged
git commit -m "refactor(errors): delete unused AppError typed error classes — deletion test passed"
```

---

## When to use Option B instead

If, during Step 1.3, you find that `App.tsx` (or another file) actually switches on error type at runtime — for example to show a "Storage full" dialog or a "Retry — you're offline" message — then Option B (wiring the errors) is more appropriate than deletion.

In that case, **stop this plan** and implement Option B:

1. Change `Result<T, string>` to `Result<T, AppError>` in all handlers
2. Each handler's error path returns `err(new StorageFullError(...))` instead of `err('Storage full')`
3. The error boundary and toast renderer switch on `error instanceof X` for UX-specific messaging
4. Remove the `// eslint-disable` comments on the AppError imports in the boundary

Do not mix the two options — either all handlers use typed errors or none do.
