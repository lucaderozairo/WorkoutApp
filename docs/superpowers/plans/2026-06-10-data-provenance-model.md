# Plan: Data Provenance Model
**Date:** 2026-06-10
**Phase:** 2B
**Priority:** P2
**Status:** Ready to implement (after 2A)

## Problem

No shared vocabulary for "where did this data come from?" Phase 2A adds a
local `source` field to `TodayReadinessView`. Phase 2C needs data-status labels
on route metrics. Phase 7A will need per-factor source labels. Without a shared
contract, each feature invents its own ad-hoc `source` strings.

## Goal

Establish `DataProvenance` in `shared/contracts/provenance.ts` as the single
cross-feature vocabulary for data origin. Migrate Phase 2A's inline `ReadinessSource`
to use it. All future plans (2C, 3, 7A…) attach this type to new data — no
big-bang backfill of existing data.

## Scope

- New file: `shared/contracts/provenance.ts`
- `shared/contracts/index.ts` — re-export
- `features/readiness/domain/reducers.ts` — migrate `ReadinessSource` to `DataSourceKind`
- No other feature changes in this plan

Out of scope: attaching `DataProvenance` to existing session events, nutrition
data, or any non-readiness domain. Those happen incrementally in later plans.

---

## Implementation

### Step 1 — Create `shared/contracts/provenance.ts`

```ts
export type DataSourceKind =
  | 'manual'     // user entered directly in the app
  | 'imported'   // loaded from a file (CSV, GPX, FIT…)
  | 'synced'     // pulled from a connected service (Garmin, Strava, HealthKit)
  | 'estimated'  // computed / interpolated — no real measurement
  | 'unavailable' // data field exists in the model but no value is known
  | 'mock';      // seeded test/demo data

export type DataProvider =
  | 'garmin' | 'strava' | 'healthkit' | 'wahoo'
  | 'file' | 'app';

export interface DataProvenance {
  source: DataSourceKind;
  provider?: DataProvider;
  confidence?: 'high' | 'medium' | 'low';
  importedAt?: number; // unix ms — set when source is 'imported' or 'synced'
}
```

Rules (enforced by convention, no lint rule yet):
- Every new data type in Phase 3+ that is displayed as a metric attaches
  `DataProvenance` or at minimum `DataSourceKind`
- UI components must not render `estimated` or `unavailable` data as if it
  were real without a visible label

### Step 2 — Re-export from `shared/contracts/index.ts`

```ts
export type { DataProvenance, DataSourceKind, DataProvider } from './provenance';
```

### Step 3 — Migrate `ReadinessSource` in `features/readiness/domain/reducers.ts`

Replace local `ReadinessSource = 'manual' | 'imported' | 'mock'` with
`DataSourceKind` from `@shared/contracts`.

Update `TodayReadinessView.source` type to `DataSourceKind`.

No logic change — `applyReadinessLogged` already sets `source: 'manual'`.

---

## Acceptance Criteria

- `npx tsc --noEmit` → 0 errors
- `npx vitest run` → same pass count
- `npm run lint` → no new errors
- `shared/contracts/provenance.ts` exists and is importable from any layer
- `TodayReadinessView.source` uses `DataSourceKind`, not a local alias
- No duplicate `source` type definitions in readiness domain

## Definition of Done

All acceptance criteria pass. Single source of truth for data provenance vocab.
