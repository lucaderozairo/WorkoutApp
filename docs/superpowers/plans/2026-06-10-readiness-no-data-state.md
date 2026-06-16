# Plan: Readiness No-Data State
**Date:** 2026-06-10
**Phase:** 2A
**Priority:** P1
**Status:** Ready to implement

## Problem

`useHomeScreen.ts:24` falls back to `82` when `today_readiness` has no entry:

```ts
const score = readiness?.hasEntry ? readiness.score : 82;
```

`82` looks like a real readiness score. It is not. The widget shows "good" green styling
backed by nothing. This violates the product's core trust rule.

## Goal

- No entry → empty/no-data state with CTA to log readiness
- Entry exists → show real score with source label
- Score displayed only when `hasEntry: true`

## Scope

- `features/readiness/domain/reducers.ts` — extend `TodayReadinessView`
- `features/readiness/contract.ts` — re-export updated type
- `ui/screens/home/useHomeScreen.ts` — remove fallback, expose `hasEntry`
- `ui/components/widgets/WelcomeWidget.tsx` — add no-data state

`DataProvenance` shape (Phase 2B) is **not** a dependency here. Add a minimal
`source` field directly to `TodayReadinessView` — provenance can be migrated
to the shared contract later without breaking this plan.

Out of scope: multi-factor source breakdown (Phase 7A), wearable source labels
(requires HealthKit, platform-gated).

---

## Implementation

### Step 1 — Extend `TodayReadinessView`

File: `features/readiness/domain/reducers.ts`

```ts
export type ReadinessSource = 'manual' | 'imported' | 'mock';

export interface TodayReadinessView {
  score: number;
  sleep: number;
  energy: number;
  soreness: number;
  mood: number;
  hasEntry: boolean;
  source: ReadinessSource;
}
```

Update `applyReadinessLogged` to set `source: 'manual'` (all current log paths
are manual entry).

Update projection initial state:

```ts
{ score: 0, sleep: 0, energy: 0, soreness: 0, mood: 0, hasEntry: false, source: 'manual' }
```

### Step 2 — Fix `useHomeScreen.ts`

Remove the `82` fallback. Expose `hasEntry` and `score` separately:

```ts
const hasReadinessEntry = readiness?.hasEntry ?? false;
const score = readiness?.score ?? 0;
const scoreClass = !hasReadinessEntry
  ? 'none' as const
  : score >= 80 ? 'good' as const
  : score >= 60 ? 'warning' as const
  : 'poor' as const;

return {
  workoutsThisWeek: dashboard?.workoutsThisWeek ?? 0,
  streak: dashboard?.streak ?? 0,
  scoreClass,
  hasReadinessEntry,
  score,
  lastNight: sleepTrend?.lastNight ?? null,
  weeklyTrend: sleepTrend?.weeklyTrend ?? [],
  scoreHistory: sleepTrend?.scoreHistory ?? [],
};
```

### Step 3 — Update `WelcomeWidget` props

Add `hasReadinessEntry: boolean` and `score: number` to `WelcomeWidgetProps`.

When `hasReadinessEntry` is false:
- Do not render the score badge/chip
- Render a short prompt: "Log readiness to see your score" as `Text size="caption"`
  styled with `--color-text-secondary`
- No score number visible at all

When true, render score chip as today (using `scoreClass`).

`scoreClass` type gains `'none'` variant. Callers that switch on it should handle
the new variant — a compile error will surface any missed cases.

### Step 4 — Update `HomeScreen.tsx`

Pass `hasReadinessEntry` and `score` from `useHomeScreen()` to `WelcomeWidget`.

---

## Acceptance Criteria

- `npx tsc --noEmit` → 0 errors
- `npx vitest run` → same or better pass count
- `npm run lint` → no new errors
- Manual: fresh state (no readiness logged) → widget shows prompt, no number
- Manual: log readiness → widget shows real score with correct color class
- No `82` anywhere in readiness rendering path

## Definition of Done

All acceptance criteria pass. No hardcoded fallback scores.
