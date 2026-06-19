# C4: Fix `computeDashboard` Interface Mismatch — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `computeDashboard`'s interface honest: the function accepts `ActivitiesState` but ignores it and re-reads from `viewStore` via `getActivityHistory()`. Fix by threading `ActivityView[]` (the real input) through the interface so it's testable without a `viewStore` mock.

**Architecture:** `computeDashboard` in `features/training_log/projections/dashboard.ts` receives `state: ActivitiesState | undefined` but on its first line calls `getActivityHistory()` which reads `viewStore.get('sessions')` independently. The fix: change the parameter to `history: ActivityView[]` (the actual data it uses), remove the internal `viewStore` read, and update the two call sites in `registerTrainingDashboardProjection`. This makes the function a pure computation testable with plain arrays.

**Tech Stack:** TypeScript, Vitest.

---

## File Map

| Action | File |
|--------|------|
| Modify | `features/training_log/projections/dashboard.ts` |
| Create | `features/training_log/projections/dashboard.test.ts` |

---

### Task 1: Write failing tests for a pure `computeDashboard`

**Files:**
- Create: `features/training_log/projections/dashboard.test.ts`

- [ ] **Step 1: Read `features/training_log/projections/dashboardTypes.ts`**

  The return type is:
  ```typescript
  export interface TrainingDashboardView {
    streak: number;
    workoutsThisWeek: number;
    totalSessions: number;
  }
  ```

- [ ] **Step 2: Read `features/training_log/projections/dashboard.ts` in full**

  Note that `computeDashboard` is currently not exported. The plan exports it so it can be unit-tested.

- [ ] **Step 3: Write the test file**

  Create `features/training_log/projections/dashboard.test.ts`:

  ```typescript
  import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
  import { computeDashboard } from './dashboard';
  import type { ActivityView } from './index';

  // Fix the clock so "today" and "this week" are deterministic.
  const FIXED_NOW = new Date('2026-06-17T12:00:00Z').getTime(); // Tuesday

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function makeSession(startedAt: Date): ActivityView {
    return {
      id: `s-${startedAt.getTime()}` as never,
      name: 'Test',
      status: 'finished',
      startedAt: startedAt.getTime(),
      finishedAt: startedAt.getTime() + 3600_000,
      segments: [],
      rpe: undefined,
      notes: undefined,
      tags: [],
      primarySport: undefined,
    } as unknown as ActivityView;
  }

  describe('computeDashboard', () => {
    it('returns zeroes for empty history', () => {
      expect(computeDashboard([])).toEqual({ streak: 0, workoutsThisWeek: 0, totalSessions: 0 });
    });

    it('counts a session on today as workoutsThisWeek=1', () => {
      const today = new Date(FIXED_NOW);
      const result = computeDashboard([makeSession(today)]);
      expect(result.workoutsThisWeek).toBe(1);
      expect(result.totalSessions).toBe(1);
    });

    it('does not count a session from last week', () => {
      const lastSunday = new Date('2026-06-14T10:00:00Z'); // before Mon Jun 16
      const result = computeDashboard([makeSession(lastSunday)]);
      expect(result.workoutsThisWeek).toBe(0);
    });

    it('streak is 1 for a session today', () => {
      const today = new Date(FIXED_NOW);
      expect(computeDashboard([makeSession(today)]).streak).toBe(1);
    });

    it('streak is 2 for sessions today and yesterday', () => {
      const today = new Date(FIXED_NOW);
      const yesterday = new Date(FIXED_NOW - 86400_000);
      expect(computeDashboard([makeSession(today), makeSession(yesterday)]).streak).toBe(2);
    });

    it('streak gaps reset the count', () => {
      const today = new Date(FIXED_NOW);
      const twoDaysAgo = new Date(FIXED_NOW - 2 * 86400_000);
      // No session yesterday — gap
      expect(computeDashboard([makeSession(today), makeSession(twoDaysAgo)]).streak).toBe(1);
    });

    it('streak counts yesterday when not trained today', () => {
      const yesterday = new Date(FIXED_NOW - 86400_000);
      expect(computeDashboard([makeSession(yesterday)]).streak).toBe(1);
    });
  });
  ```

- [ ] **Step 4: Run the test to confirm it fails**

  Run: `npx vitest run features/training_log/projections/dashboard.test.ts`
  Expected: FAIL — `computeDashboard` is not exported and accepts a different parameter type.

---

### Task 2: Fix `computeDashboard` to accept `ActivityView[]`

**Files:**
- Modify: `features/training_log/projections/dashboard.ts`

- [ ] **Step 1: Change the function signature and body**

  Current:
  ```typescript
  import { viewStore } from '@data/projections/views';
  import type { ActivitiesState } from './index';
  import type { TrainingDashboardView } from './dashboardTypes';
  import { getActivityHistory } from '../queries';

  function computeDashboard(state: ActivitiesState | undefined): TrainingDashboardView {
    if (!state) return { streak: 0, workoutsThisWeek: 0, totalSessions: 0 };

    const history = getActivityHistory();
    ...
  }
  ```

  Replace with:
  ```typescript
  import type { TrainingDashboardView } from './dashboardTypes';
  import type { ActivityView } from './index';

  export function computeDashboard(history: ActivityView[]): TrainingDashboardView {
    if (history.length === 0) return { streak: 0, workoutsThisWeek: 0, totalSessions: 0 };

    // workoutsThisWeek — Mon–Sun calendar week
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sun
    const daysFromMon = (dayOfWeek + 6) % 7;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - daysFromMon);
    startOfWeek.setHours(0, 0, 0, 0);
    const workoutsThisWeek = history.filter(s => new Date(s.startedAt) >= startOfWeek).length;

    // streak — consecutive training days ending today or yesterday
    const trained = new Set(history.map(s => new Date(s.startedAt).toLocaleDateString()));
    const cursor = new Date();
    if (!trained.has(cursor.toLocaleDateString())) cursor.setDate(cursor.getDate() - 1);
    let streak = 0;
    while (trained.has(cursor.toLocaleDateString())) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    return { streak, workoutsThisWeek, totalSessions: history.length };
  }
  ```

  Remove `viewStore` and `ActivitiesState` imports — they are no longer needed in this file.

- [ ] **Step 2: Fix `registerTrainingDashboardProjection` to pass `ActivityView[]`**

  In the same file, the registration block currently calls `computeDashboard(viewStore.get('sessions'))`. Change both call sites:

  ```typescript
  export function registerTrainingDashboardProjection(): void {
    if (registered) return;
    registered = true;

    const history = getActivityHistory();
    viewStore.set('training_log_dashboard', computeDashboard(history));
    viewStore.set('activity_history', history);

    viewStore.subscribe('sessions', () => {
      const h = getActivityHistory();
      viewStore.set('training_log_dashboard', computeDashboard(h));
      viewStore.set('activity_history', h);
    });
  }
  ```

  Add the necessary imports at the top:
  ```typescript
  import { viewStore } from '@data/projections/views';
  import { getActivityHistory } from '../queries';
  ```

  Note: the subscription callback now ignores the `state` parameter it was passed (the `sessions` state snapshot) and calls `getActivityHistory()` directly, which is consistent with what it was doing before. The improvement is that `computeDashboard` no longer silently bypasses its caller.

- [ ] **Step 3: Run the tests**

  Run: `npx vitest run features/training_log/projections/dashboard.test.ts`
  Expected: all pass.

- [ ] **Step 4: Run the full training_log test suite**

  Run: `npx vitest run features/training_log`
  Expected: all pass.

- [ ] **Step 5: TypeScript check**

  Run: `npx tsc --noEmit`
  Expected: zero errors.

- [ ] **Step 6: Commit**

  ```bash
  git add features/training_log/projections/dashboard.ts features/training_log/projections/dashboard.test.ts
  git commit -m "fix(training_log): computeDashboard accepts ActivityView[] — honest interface, pure function"
  ```

---

## Self-Review

**Spec coverage:** ✓ `computeDashboard` parameter changed to `ActivityView[]` — interface matches what the function actually uses. ✓ `viewStore` read removed from the function body. ✓ Tests written first and cover streak, week count, gaps, and empty history.

**Placeholder scan:** No placeholders. All test cases have concrete dates relative to `FIXED_NOW = 2026-06-17T12:00:00Z` (a Tuesday — week starts Monday June 16).

**Type consistency:** `ActivityView` is imported from `./index` in both `dashboard.ts` and `dashboard.test.ts`. `TrainingDashboardView` from `./dashboardTypes`. Both are consistent throughout.
