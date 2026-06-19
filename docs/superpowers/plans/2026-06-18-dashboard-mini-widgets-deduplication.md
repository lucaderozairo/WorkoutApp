# DashboardMiniWidgets Deduplication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the two exact-duplication patterns found in `ui/components/widgets/DashboardMiniWidgets.tsx` (450 lines) — the heart-rate/HRV row repeated 3 times across `HeartStatsWidget`'s size branches, and the score-ring-plus-detail-text block repeated identically in `SleepWidget` and `ReadinessRecoveryWidget` — by extracting two small, file-local presentational components, with zero visual or behavioral change.

**Architecture:** This is a narrow, evidence-based extraction, not a general "responsive widget" framework. Per the architecture audit, only the parts that are byte-for-byte (or near-byte-for-byte) identical get extracted: `HeartStatRow` (used 3x inside `HeartStatsWidget`) and `ScoreRingDetail` (used 2x, inside `SleepWidget` and `ReadinessRecoveryWidget`). Both stay local to `DashboardMiniWidgets.tsx` — they have exactly one caller file and no other widget needs them, so per YAGNI they are not promoted to `ui/molecules`. The widely-different `WeatherDashWidget` and `CalendarDashWidget` size branches are left untouched: their three branches genuinely render different content per size, so there's nothing to deduplicate (confirmed by reading every branch — no candidate fix touches them).

**Tech Stack:** React 18 + TypeScript, Vitest + @testing-library/react, existing `@ui/atoms`, `@ui/molecules`, `@ui/layout`, `@ui/components/charts/domain-charts` — no new dependencies.

## Global Constraints

- Zero visual change: every existing render (all five widgets, every size) must produce identical DOM/text output before and after.
- No new files outside `DashboardMiniWidgets.tsx` and its test file — these two extracted components have exactly one caller and don't belong in the design system per CLAUDE.md rule 10 ("project-specific UI never enters the design system").
- `WeatherDashWidget`, `CalendarDashWidget` are out of scope — verified no exact duplication exists in their branches worth extracting.
- Write characterization tests for the *existing* behavior before refactoring (these widgets currently have zero test coverage), so the extraction is provably behavior-preserving.

---

## File Structure

| File | Responsibility |
|---|---|
| `ui/components/widgets/DashboardMiniWidgets.tsx` | Existing file. Gains two new file-local components (`HeartStatRow`, `ScoreRingDetail`) above their respective widgets; `HeartStatsWidget`, `SleepWidget`, `ReadinessRecoveryWidget` are edited to use them. |
| `ui/components/widgets/DashboardMiniWidgets.test.tsx` | New file. Characterization tests for `HeartStatsWidget`, `SleepWidget`, `ReadinessRecoveryWidget` across all three sizes, written before the refactor and kept green after. |

---

### Task 1: Characterize and deduplicate `HeartStatsWidget`

**Files:**
- Create: `ui/components/widgets/DashboardMiniWidgets.test.tsx`
- Modify: `ui/components/widgets/DashboardMiniWidgets.tsx:363-449` (`HeartStatsWidget` and its three branches)

**Interfaces:**
- Consumes: `HealthMetricsView` from `@features/readiness` (only used for the `history` prop, can be passed as `[]` in tests since none of the three branches' assertions depend on sparkline data).
- Produces: `HeartStatRow(props: { bpm: number | null; hrv: number | null; bpmLabel: string })` — file-local, not exported, used only within `DashboardMiniWidgets.tsx`.

- [ ] **Step 1: Write the failing characterization test (captures current behavior, before any refactor)**

```tsx
// ui/components/widgets/DashboardMiniWidgets.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { HeartStatsWidget } from './DashboardMiniWidgets';

describe('HeartStatsWidget', () => {
  it('sm size shows "HR" as the bpm label', () => {
    render(<HeartStatsWidget size="sm" bpm={58} hrv={72} history={[]} />);
    expect(screen.getByText('HR')).toBeInTheDocument();
    expect(screen.queryByText('Resting HR')).not.toBeInTheDocument();
    expect(screen.getByText('HRV')).toBeInTheDocument();
  });

  it('wide size shows "Resting HR" as the bpm label', () => {
    render(<HeartStatsWidget size="wide" bpm={58} hrv={72} history={[]} />);
    expect(screen.getByText('Resting HR')).toBeInTheDocument();
  });

  it('lg (default) size shows "Resting HR" as the bpm label', () => {
    render(<HeartStatsWidget size="lg" bpm={58} hrv={72} history={[]} />);
    expect(screen.getByText('Resting HR')).toBeInTheDocument();
  });

  it('renders a dash when bpm or hrv is null', () => {
    render(<HeartStatsWidget size="sm" bpm={null} hrv={null} history={[]} />);
    expect(screen.getAllByText('—')).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run test to verify it currently passes against the unmodified widget**

Run: `npx vitest run ui/components/widgets/DashboardMiniWidgets.test.tsx`
Expected: PASS (4 tests) — this locks down current behavior before touching any code.

- [ ] **Step 3: Extract `HeartStatRow` and use it in all three branches**

In `ui/components/widgets/DashboardMiniWidgets.tsx`, add this above `export function HeartStatsWidget` (after the existing helper functions, before line 363):

```tsx
function HeartStatRow({ bpm, hrv, bpmLabel }: { bpm: number | null; hrv: number | null; bpmLabel: string }) {
  return (
    <Row justify="between" align="center">
      <Column gap={1}>
        <Metric value={bpm ?? '—'} unit="bpm" />
        <Text size="caption" color="faint">{bpmLabel}</Text>
      </Column>
      <Column gap={1} align="end">
        <Metric value={hrv ?? '—'} unit="ms" />
        <Text size="caption" color="faint">HRV</Text>
      </Column>
    </Row>
  );
}
```

Then replace the body of `HeartStatsWidget` (lines 376-449) with:

```tsx
export function HeartStatsWidget({ size, bpm, hrv, history }: { size: WidgetSize; bpm: number | null; hrv: number | null; history: HealthMetricsView[] }) {
  const hrData = history
    .filter(h => h.restingHr !== null)
    .slice(0, 14)
    .reverse()
    .map(h => ({ x: new Date(h.loggedAt).toLocaleDateString('en', { day: 'numeric', month: 'short' }), y: h.restingHr as number }));

  const hrvData = history
    .filter(h => h.hrv !== null)
    .slice(0, 14)
    .reverse()
    .map(h => ({ x: new Date(h.loggedAt).toLocaleDateString('en', { day: 'numeric', month: 'short' }), y: h.hrv as number }));

  if (size === 'sm') {
    return (
      <Surface><Column gap={1} className="h-full">
        <Text size="caption">Heart</Text>
        <HeartStatRow bpm={bpm} hrv={hrv} bpmLabel="HR" />
      </Column></Surface>
    );
  }

  if (size === 'wide') {
    return (
      <Surface><Column gap={1} className="h-full">
        <Text size="caption">Heart</Text>
        <HeartStatRow bpm={bpm} hrv={hrv} bpmLabel="Resting HR" />
      </Column></Surface>
    );
  }

  return (
    <Surface><Column gap={1} className="h-full">
      <Text size="caption">Heart</Text>
      <HeartStatRow bpm={bpm} hrv={hrv} bpmLabel="Resting HR" />
      {hrData.length > 0 && (
        <SparklineArea
          data={hrData}
          color="var(--color-warning)"
          height={40}
          id="dash-hr"
          yDomain={[35, 70]}
          showTooltip
          tooltipFormatter={(v) => `${v} bpm HR`}
        />
      )}
      {hrvData.length > 0 && (
        <SparklineArea
          data={hrvData}
          color="var(--color-primary)"
          height={40}
          id="dash-hrv"
          yDomain={[30, 140]}
          showTooltip
          tooltipFormatter={(v) => `${v} ms HRV`}
        />
      )}
    </Column></Surface>
  );
}
```

- [ ] **Step 4: Run test to verify it still passes after the refactor**

Run: `npx vitest run ui/components/widgets/DashboardMiniWidgets.test.tsx`
Expected: PASS (4 tests) — same assertions, same results, proving the extraction changed nothing observable.

- [ ] **Step 5: Commit**

```bash
git add ui/components/widgets/DashboardMiniWidgets.tsx ui/components/widgets/DashboardMiniWidgets.test.tsx
git commit -m "refactor(widgets): extract HeartStatRow to dedupe HeartStatsWidget size branches"
```

---

### Task 2: Characterize and deduplicate the score-ring detail block

**Files:**
- Modify: `ui/components/widgets/DashboardMiniWidgets.tsx:35-121` (`SleepWidget`), `:316-359` (`ReadinessRecoveryWidget`)
- Modify: `ui/components/widgets/DashboardMiniWidgets.test.tsx` (add to the file created in Task 1)

**Interfaces:**
- Consumes: `ScoreRing` from `@ui/components/charts/domain-charts` (signature: `{ score, color?, subtitle?, size? }`, confirmed at `ui/components/charts/domain-charts.tsx:100-105`); `ReactNode` from `react`.
- Produces: `ScoreRingDetail(props: { score: number; color?: string; primary: ReactNode; secondary: ReactNode })` — file-local, not exported.

- [ ] **Step 1: Write the failing characterization tests (before refactor)**

Add to `ui/components/widgets/DashboardMiniWidgets.test.tsx`:

```tsx
import { SleepWidget, ReadinessRecoveryWidget } from './DashboardMiniWidgets';

describe('SleepWidget', () => {
  const session = {
    start: new Date('2026-06-18T23:00:00'),
    end: new Date('2026-06-19T07:00:00'),
    score: 88,
    stages: { deep: 90, light: 240, rem: 100, awake: 50 },
  };

  it('lg (default) size renders the score ring with duration and debt label', () => {
    render(<SleepWidget size="lg" session={session} />);
    expect(screen.getByText('8h 0m')).toBeInTheDocument();
    expect(screen.getByText(/vs goal/)).toBeInTheDocument();
  });
});

describe('ReadinessRecoveryWidget', () => {
  it('lg (default) size renders the score ring with recovery detail and tip', () => {
    render(<ReadinessRecoveryWidget size="lg" score={91} scoreClass="good" />);
    expect(screen.getByText('Well recovered. Ready to train hard.')).toBeInTheDocument();
    expect(screen.getByText('You can push hard today — HRV and sleep support it.')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it currently passes against the unmodified widgets**

Run: `npx vitest run ui/components/widgets/DashboardMiniWidgets.test.tsx`
Expected: PASS (6 tests total — the 4 from Task 1 plus these 2)

- [ ] **Step 3: Extract `ScoreRingDetail` and use it in both widgets**

Add this near the top of `ui/components/widgets/DashboardMiniWidgets.tsx`, below the existing imports (the file needs `ReactNode` added to its React import — change line 1's sibling import or add a new one):

```tsx
import type { ReactNode } from 'react';
```

Then add the component above `export function SleepWidget` (before line 35):

```tsx
function ScoreRingDetail({ score, color, primary, secondary }: { score: number; color?: string; primary: ReactNode; secondary: ReactNode }) {
  return (
    <Row align="center">
      <ScoreRing score={score} color={color} subtitle="score" size={72} />
      <Column gap={1} className="min-w-0">
        <Text size="detail">{primary}</Text>
        <Text size="caption" color="faint">{secondary}</Text>
      </Column>
    </Row>
  );
}
```

In `SleepWidget`, replace the `default` branch's score-ring block (the `<Row align="center">...</Row>` containing `<ScoreRing score={session.score} ...>` at lines 95-101) with:

```tsx
<ScoreRingDetail score={session.score} primary={duration} secondary={debtLabel} />
```

In `ReadinessRecoveryWidget`, replace the `default` branch's score-ring block (the `<Row align="center">...</Row>` containing `<ScoreRing score={score} color={ringColor} ...>` at lines 350-356) with:

```tsx
<ScoreRingDetail score={score} color={ringColor} primary={RECOVERY_DETAIL[scoreClass]} secondary={RECOVERY_TIP[scoreClass]} />
```

- [ ] **Step 4: Run test to verify it still passes after the refactor**

Run: `npx vitest run ui/components/widgets/DashboardMiniWidgets.test.tsx`
Expected: PASS (6 tests)

- [ ] **Step 5: Type-check and lint**

Run: `npx tsc --noEmit -p . && npx eslint ui/components/widgets/DashboardMiniWidgets.tsx`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add ui/components/widgets/DashboardMiniWidgets.tsx ui/components/widgets/DashboardMiniWidgets.test.tsx
git commit -m "refactor(widgets): extract ScoreRingDetail to dedupe SleepWidget and ReadinessRecoveryWidget"
```

---

## Self-Review Notes

- **Spec coverage:** Both exact-duplication findings from the audit (HeartStatsWidget's 3-way label duplication, SleepWidget/ReadinessRecoveryWidget's score-ring block duplication) have a task each. `WeatherDashWidget` and `CalendarDashWidget` were checked and have no equivalent exact duplication, so correctly excluded — not a gap.
- **Placeholder scan:** none — every step shows the actual diff/code.
- **Type consistency:** `HeartStatRow`'s `bpm: number | null; hrv: number | null` matches `HeartStatsWidget`'s existing prop types exactly (`ui/components/widgets/DashboardMiniWidgets.tsx:363`). `ScoreRingDetail`'s `score: number; color?: string` matches `ScoreRing`'s existing prop types (`ui/components/charts/domain-charts.tsx:100-105`).
