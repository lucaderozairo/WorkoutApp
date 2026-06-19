# Screen Reorganization + Activity UX (Strava/Hevy) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move two misplaced screen folders, then add Strava-style segment-guided active sessions + post-workout segment splits, and surface the existing PR flag in the workout UI (Hevy-style).

**Architecture:** File moves are pure renames with two import updates. Segment feature threads `paceTarget` from the existing `PlannedSession` domain through a new `StartSession` field into `TrainingSession`, then renders a `SegmentGuide` component inside `WorkoutView` for cardio sessions. `FinishedView` gains a `SegmentSplitsCard` that compares actual cardio sets to planned targets. PR badge is a one-liner in `SetRow` — the `isPR` flag is already computed.

**Tech Stack:** TypeScript, React, existing `useToast`, `Badge`, `Surface`, `Text`, `Row`, `Column` primitives; no new dependencies.

## Code Review Findings

> Reviewed against current source + public Strava/Hevy product references (Strava Jan 30 & May 28 2026; Hevy official site). Phase 1 (file moves) is clean. All blockers are in Phase 2–3.

### [P1] Projection layer gap — paceTarget won't reach the UI as written

Task 3 threads `paceTarget` into `TrainingSession`, but both active and finished session UIs consume `ActivityView` (the projected read model), not `TrainingSession` directly. `WorkoutView` and `FinishedView` read from the projection/query layer (`features/training_log/projections/index.ts`). The `session.paceTarget` reads in Tasks 5 and 6 won't exist at runtime unless `ActivityView` (or the relevant view type) is also updated to carry `paceTarget` through the projection.

**Fix required before Tasks 5–6:** Add a task that updates the projection and/or query layer so `paceTarget` is present on the object that `WorkoutView` and `FinishedView` actually receive.

Relevant files: `ui/components/session/WorkoutView.tsx:40`, `ui/components/session/FinishedView.tsx:35`, `features/training_log/projections/index.ts:51`.

### [P1] Tasks 4–6 use wrong runtime shape

The plan references `session.blocks`, `b.segments`, `CardioSegment.distanceKm`, and `timer.elapsedSeconds`. The current app uses:
- `session.segments` (not `session.blocks`)
- `domainBlocksToUIBlocks` to map domain → UI shape
- `distanceMeters` and `durationSeconds` on cardio entries (not `distanceKm` / `durationMin`)
- `timerDisplay` string passed into `WorkoutView` (not `timer.elapsedSeconds`)

The helper `sumCompletedCardioKm` in Task 5 and the `SegmentSplitsCard` consumer in Task 6 will both be wrong as written. The segment-guide and segment-splits tasks are materially larger than described.

**Fix required:** Audit the actual `WorkoutView` props and `FinishedView` data shape before implementing Tasks 4–6, and rewrite the code samples to match (`distanceMeters → /1000` for km; parse `timerDisplay` or add `elapsedSeconds` to the timer hook).

Relevant files: `ui/components/session/WorkoutView.tsx:50,59,309`, `ui/components/session/FinishedView.tsx:193`.

### [P1] Strava parity goal is understated

Current Strava (Jan 30 + May 28 2026) emphasises **live route-following with deviation alerts** on watch/mobile, not just target-pace display. The app's pre-workout route stack (saved routes, route detail, elevation profile, surface mix, per-segment pace) is already a strong Strava-adjacent foundation — stronger than the plan acknowledges. But the in-workout surface is still log-first rather than map-first. A `SegmentGuide` banner improves pacing feedback; it does not deliver the live route-following model Strava now leads with.

**Recommendation:** Decide whether the goal is (a) "pace guidance for planned segments" — `SegmentGuide` achieves this — or (b) "live route-following parity with Strava" — which requires a separate map-first active-session surface. Scope the plan accordingly rather than implying (b) is achieved by (a).

Relevant files: `ui/screens/routes/RouteOverviewScreen.tsx:152`, `ui/screens/routes/useRouteOverview.ts:145`, `ui/components/session/WorkoutView.tsx:59`.

### [P2] Post-activity experience is the weakest Strava match

Strava's Quick Edit flow (Sept 25 2024 and current) prioritises title, photos, and share controls immediately after an activity. The app already has social cards that can render titles, photos, and comments (`ui/components/social/ActivityPostCard.tsx`), but `FinishedView` only fires a generic native-share payload. The plan adds no post-activity quick-edit/share step.

**Recommendation:** Add a task for a post-activity edit/share step in `FinishedView` — at minimum: editable title, photo attach, share target selection — wiring `ActivityPostCard` into the finish flow.

Relevant files: `ui/components/session/FinishedView.tsx:62,162`, `ui/components/session/WorkoutView.tsx:433`, `ui/components/social/ActivityPostCard.tsx:69`.

### [P2] Hevy reference is too narrow

Hevy's workflow is not just "show PR"; it's fast set logging, routine-first starts, set-status markers (completed / failed / skipped), rest timers, and social accountability. The app already has warmup, dropset, notes, and auto-PR computation. A PR badge alone will feel cosmetic rather than Hevy-like.

**Recommendation:** If Hevy parity is the goal, scope Task 7 as "active logging feedback" — visible rest timer, set-status marker (completed/failed), and PR badge together — rather than badge alone. The building blocks are present; it's a wiring task, not a greenfield one.

Relevant files: `ui/components/session/SetRow.tsx:32,227`, `ui/components/session/WorkoutView.tsx:70`, `features/training_log/manifest.md:21`.

---

### Suggested pre-implementation order

1. Add a projection-layer task — decide the exact active-session data shape and update the view type before Tasks 5–6.
2. Audit and correct the code samples in Tasks 4–6 against the real `WorkoutView` props and `FinishedView` data.
3. Decide Strava scope: segment-pace guidance vs. live route-following model.
4. Expand Task 7 from "PR badge" to "active logging feedback" if Hevy parity is the actual goal.
5. Add a post-activity quick-edit/share task.

---

## Global Constraints

- No inline `style=""` attributes — spacing via CSS `gap` on parent containers
- Token-driven values only (`var(--space-md)` etc.), zero hardcoded px/colours
- CSS nesting via `&` — no flat `.x:hover` rules outside their parent
- All new primitives stay in `ui/atoms|molecules|layout|patterns`; domain UI in `ui/components/session/`
- No new npm packages

---

## Phase 1 — File Reorganization

### Task 1: Move WeatherScreen

**Files:**
- Move: `ui/screens/health/WeatherScreen.tsx` → `ui/screens/weather/WeatherScreen.tsx`
- Move: `ui/screens/health/useWeatherScreen.ts` → `ui/screens/weather/useWeatherScreen.ts`
- Create: `ui/screens/weather/index.ts`
- Modify: `app/registry/App.tsx` (import path)
- Modify: `ui/screens/health/index.ts` (remove exports, if barrel exists)

**Interfaces:**
- Produces: `WeatherScreen` exported from `ui/screens/weather/`

- [ ] **Step 1: Create the new folder and move files**

```bash
mkdir -p ui/screens/weather
mv ui/screens/health/WeatherScreen.tsx ui/screens/weather/WeatherScreen.tsx
mv ui/screens/health/useWeatherScreen.ts ui/screens/weather/useWeatherScreen.ts
```

- [ ] **Step 2: Fix the internal import in WeatherScreen.tsx**

Open `ui/screens/weather/WeatherScreen.tsx`. The hook import `./useWeatherScreen` is still correct since both files moved together — no change needed.

- [ ] **Step 3: Create barrel**

Create `ui/screens/weather/index.ts`:
```ts
export { WeatherScreen } from './WeatherScreen';
```

- [ ] **Step 4: Update App.tsx import**

In `app/registry/App.tsx`, find and replace the WeatherScreen import:
```ts
// Before
import { WeatherScreen } from '../ui/screens/health/WeatherScreen';

// After
import { WeatherScreen } from '../ui/screens/weather';
```
(Adjust path prefix to match the alias convention used in the file.)

- [ ] **Step 5: Remove from health barrel**

Check `ui/screens/health/index.ts`. If it re-exports `WeatherScreen`, remove that line.

- [ ] **Step 6: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors related to WeatherScreen.

- [ ] **Step 7: Commit**

```bash
git add ui/screens/weather/ ui/screens/health/ app/registry/App.tsx
git commit -m "refactor(screens): move WeatherScreen out of health/ into weather/"
```

---

### Task 2: Move NotificationsScreen

**Files:**
- Move: `ui/screens/health/NotificationsScreen.tsx` → `ui/screens/notifications/NotificationsScreen.tsx`
- Move: `ui/screens/health/useNotificationsScreen.ts` → `ui/screens/notifications/useNotificationsScreen.ts`
- Create: `ui/screens/notifications/index.ts`
- Modify: `app/registry/App.tsx`
- Modify: `ui/screens/health/index.ts` (remove exports)

**Interfaces:**
- Produces: `NotificationsScreen` exported from `ui/screens/notifications/`

- [ ] **Step 1: Move files**

```bash
mkdir -p ui/screens/notifications
mv ui/screens/health/NotificationsScreen.tsx ui/screens/notifications/NotificationsScreen.tsx
mv ui/screens/health/useNotificationsScreen.ts ui/screens/notifications/useNotificationsScreen.ts
```

- [ ] **Step 2: Create barrel**

Create `ui/screens/notifications/index.ts`:
```ts
export { NotificationsScreen } from './NotificationsScreen';
```

- [ ] **Step 3: Update App.tsx import**

```ts
// Before
import { NotificationsScreen } from '../ui/screens/health/NotificationsScreen';

// After
import { NotificationsScreen } from '../ui/screens/notifications';
```

- [ ] **Step 4: Remove from health barrel**

Check `ui/screens/health/index.ts` — remove `NotificationsScreen` export if present.

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add ui/screens/notifications/ ui/screens/health/ app/registry/App.tsx
git commit -m "refactor(screens): move NotificationsScreen out of health/ into notifications/"
```

---

## Phase 2 — Segment-Guided Active Sessions (Strava-inspired)

### Task 3: Thread paceTarget into TrainingSession domain

**Context:** `PlannedSession` already has `paceTarget?: PaceTarget` in `features/planning/domain/types.ts`. `TrainingSession` does not. `StartSession` command has no `paceTarget` field. This task adds the field at the domain level and passes it through the route → session creation flow.

**Files:**
- Modify: `features/training_log/domain/types.ts`
- Modify: `features/training_log/commands/handlers.ts`
- Modify: `ui/screens/routes/useRouteOverview.ts`
- Modify: `ui/screens/session/useNewSession.ts`

**Interfaces:**
- Consumes: `PaceTarget` from `features/planning/domain/types.ts`
- Produces: `TrainingSession.paceTarget?: PaceTarget` — readable in WorkoutView and FinishedView

- [ ] **Step 1: Write a failing test**

In the test file alongside `features/training_log/commands/handlers.ts`, add:
```ts
it('preserves paceTarget on StartSession when provided', () => {
  const paceTarget: PaceTarget = {
    kind: 'segments',
    segments: [
      { fromKm: 0, toKm: 2, paceSecPerKm: 300 },
      { fromKm: 2, toKm: 5, paceSecPerKm: 280 },
    ],
  };
  const result = handle({ type: 'StartSession', userId: 'u1', name: 'Test Run', paceTarget });
  expect(result.paceTarget).toEqual(paceTarget);
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx vitest run features/training_log
```
Expected: FAIL — `paceTarget` not on `StartSession` type.

- [ ] **Step 3: Add paceTarget to TrainingSession and StartSession types**

In `features/training_log/domain/types.ts`:

Find `TrainingSession` (currently `Activity & { name: string; blocks: Block[] }`):
```ts
import type { PaceTarget } from '@features/planning/domain/types';

export type TrainingSession = Activity & {
  name: string;
  blocks: Block[];
  paceTarget?: PaceTarget;   // add
};
```

Find `StartSession` interface:
```ts
export interface StartSession {
  type: 'StartSession';
  userId: Id<'User'>;
  name: string;
  primarySport?: SportType;
  paceTarget?: PaceTarget;   // add
}
```

- [ ] **Step 4: Propagate paceTarget in the command handler**

In `features/training_log/commands/handlers.ts`, find the `StartSession` handler. Where the new session object is constructed, spread in `paceTarget`:
```ts
const session: TrainingSession = {
  // ...existing fields
  paceTarget: command.paceTarget,
};
```

- [ ] **Step 5: Run tests to confirm passing**

```bash
npx vitest run features/training_log
```
Expected: PASS

- [ ] **Step 6: Pass paceTarget when navigating from RouteOverviewScreen**

In `ui/screens/routes/useRouteOverview.ts`, find the navigation to `/sessions/new`. Add `paceTarget` to router state:
```ts
navigate('/sessions/new', {
  state: {
    // existing: waypoints, distanceKm, profile, name, date
    paceTarget: paceTarget,  // add — paceTarget is already computed in useRouteOverview
  },
});
```

- [ ] **Step 7: Read paceTarget in useNewSession and pass to StartSession**

In `ui/screens/session/useNewSession.ts`, where `StartSession` is dispatched, read `paceTarget` from router state:
```ts
const { paceTarget, ...otherState } = (location.state ?? {}) as SessionRouteState;
// ...
await dispatch({ type: 'StartSession', ..., paceTarget });
```

Add `paceTarget?: PaceTarget` to the `SessionRouteState` type if it's defined locally.

- [ ] **Step 8: Commit**

```bash
git add features/training_log/ ui/screens/routes/useRouteOverview.ts ui/screens/session/useNewSession.ts
git commit -m "feat(training_log): thread paceTarget from route planning into TrainingSession"
```

---

### Task 4: SegmentGuide component

**Files:**
- Create: `ui/components/session/SegmentGuide.tsx`
- Create: `ui/components/session/SegmentGuide.test.tsx`

**Interfaces:**
- Consumes:
  ```ts
  interface SegmentGuideProps {
    segments: Array<{ fromKm: number; toKm: number; paceSecPerKm: number }>;
    completedDistanceKm: number;   // sum of done cardio sets
    elapsedSeconds: number;        // running session timer value
  }
  ```
- Produces: React component `SegmentGuide` with current segment, target pace, and on-pace indicator

- [ ] **Step 1: Write a unit test**

Create `ui/components/session/SegmentGuide.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import { SegmentGuide } from './SegmentGuide';

const segments = [
  { fromKm: 0, toKm: 2, paceSecPerKm: 300 },
  { fromKm: 2, toKm: 5, paceSecPerKm: 280 },
];

it('shows segment 1 target when distance is 0', () => {
  render(<SegmentGuide segments={segments} completedDistanceKm={0} elapsedSeconds={0} />);
  expect(screen.getByText(/Segment 1/i)).toBeInTheDocument();
  expect(screen.getByText('5:00')).toBeInTheDocument(); // 300 sec/km = 5:00 min/km
});

it('advances to segment 2 once past 2 km', () => {
  render(<SegmentGuide segments={segments} completedDistanceKm={2.1} elapsedSeconds={620} />);
  expect(screen.getByText(/Segment 2/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to confirm fail**

```bash
npx vitest run ui/components/session/SegmentGuide
```

- [ ] **Step 3: Implement SegmentGuide**

Create `ui/components/session/SegmentGuide.tsx`:
```tsx
import { Surface, Text } from '@ui/atoms';
import { Row, Column } from '@ui/layout';

interface Segment { fromKm: number; toKm: number; paceSecPerKm: number }

interface SegmentGuideProps {
  segments: Segment[];
  completedDistanceKm: number;
  elapsedSeconds: number;
}

function formatPace(secPerKm: number): string {
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function SegmentGuide({ segments, completedDistanceKm, elapsedSeconds }: SegmentGuideProps) {
  const rawIdx = segments.findIndex(s => completedDistanceKm < s.toKm);
  const activeIdx = rawIdx < 0 ? segments.length - 1 : rawIdx;
  const seg = segments[activeIdx];
  const segDistanceKm = seg.toKm - seg.fromKm;

  // Seconds expected to have elapsed for the distance covered in this segment
  const distInSeg = Math.max(0, completedDistanceKm - seg.fromKm);
  const secondsForPrevSegs = segments
    .slice(0, activeIdx)
    .reduce((acc, s) => acc + (s.toKm - s.fromKm) * s.paceSecPerKm, 0);
  const elapsedInSeg = elapsedSeconds - secondsForPrevSegs;
  const expectedInSeg = distInSeg * seg.paceSecPerKm;
  const delta = elapsedInSeg - expectedInSeg; // positive = behind pace

  const paceLabel = Math.abs(delta) < 10 ? 'On pace' : delta > 0 ? 'Behind' : 'Ahead';
  const paceVariant = Math.abs(delta) < 10 ? 'success' : delta > 0 ? 'warn' : 'info';

  return (
    <Surface data-variant="ghost">
      <Row justify="between" align="center">
        <Column gap={1}>
          <Text size="eyebrow">Segment {activeIdx + 1} of {segments.length}</Text>
          <Text size="body">{formatPace(seg.paceSecPerKm)} /km · {segDistanceKm.toFixed(1)} km</Text>
        </Column>
        <Text size="caption" data-tone={paceVariant}>{paceLabel}</Text>
      </Row>
    </Surface>
  );
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run ui/components/session/SegmentGuide
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add ui/components/session/SegmentGuide.tsx ui/components/session/SegmentGuide.test.tsx
git commit -m "feat(session): add SegmentGuide component for live segment pace tracking"
```

---

### Task 5: Wire SegmentGuide into WorkoutView

**Files:**
- Modify: `ui/components/session/WorkoutView.tsx`

**Interfaces:**
- Consumes: `session.paceTarget` (added Task 3), cardio distance from session blocks, `timer` (already a prop)

- [ ] **Step 1: Add completedDistanceKm helper inside WorkoutView**

Near the top of `WorkoutView.tsx` (outside the component), add:
```ts
function sumCompletedCardioKm(session: TrainingSession): number {
  return session.blocks
    .flatMap(b => b.segments ?? [])
    .filter(s => s.kind === 'cardio')
    .reduce((acc, s) => acc + ((s as CardioSegment).distanceKm ?? 0), 0);
}
```

Check the actual CardioSegment field name for distance — it may be `distanceKm` or similar. Adjust accordingly.

- [ ] **Step 2: Render SegmentGuide conditionally**

In `WorkoutView.tsx`, inside the JSX, before the exercise blocks list:
```tsx
import { SegmentGuide } from './SegmentGuide';

// Inside return:
{session.paceTarget?.kind === 'segments' && (
  <SegmentGuide
    segments={session.paceTarget.segments}
    completedDistanceKm={sumCompletedCardioKm(session)}
    elapsedSeconds={timer.elapsedSeconds ?? 0}
  />
)}
```

If `timer` doesn't expose `elapsedSeconds` numerically, parse `timerDisplay` string (e.g. `"12:34"` → `12*60+34`) or add `elapsedSeconds` to the timer shape returned by the timer hook.

- [ ] **Step 3: Type check**

```bash
npx tsc --noEmit
```
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add ui/components/session/WorkoutView.tsx
git commit -m "feat(session): show SegmentGuide in WorkoutView for planned cardio sessions"
```

---

### Task 6: SegmentSplitsCard in FinishedView

**Files:**
- Create: `ui/components/session/SegmentSplitsCard.tsx`
- Create: `ui/components/session/SegmentSplitsCard.test.tsx`
- Modify: `ui/components/session/FinishedView.tsx`

**Interfaces:**
- Consumes:
  ```ts
  interface SegmentSplitsCardProps {
    segments: Array<{ fromKm: number; toKm: number; paceSecPerKm: number }>;
    cardioSets: Array<{ distanceKm?: number; durationMin?: number }>;
  }
  ```
- Produces: table of target vs. actual pace per segment

- [ ] **Step 1: Write a test**

Create `ui/components/session/SegmentSplitsCard.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import { SegmentSplitsCard } from './SegmentSplitsCard';

it('shows target and actual pace columns', () => {
  render(
    <SegmentSplitsCard
      segments={[{ fromKm: 0, toKm: 2, paceSecPerKm: 300 }]}
      cardioSets={[{ distanceKm: 2, durationMin: 10 }]}
    />
  );
  // 300 sec/km target = 5:00; 10 min / 2 km = 5:00 actual
  expect(screen.getAllByText('5:00').length).toBeGreaterThanOrEqual(2);
});

it('shows dash for missing actual data', () => {
  render(
    <SegmentSplitsCard
      segments={[{ fromKm: 0, toKm: 2, paceSecPerKm: 300 }]}
      cardioSets={[]}
    />
  );
  expect(screen.getByText('—')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to confirm fail**

```bash
npx vitest run ui/components/session/SegmentSplitsCard
```

- [ ] **Step 3: Implement SegmentSplitsCard**

Create `ui/components/session/SegmentSplitsCard.tsx`:
```tsx
import { Surface, Text, Table, TableHead, TableRow, TableCell } from '@ui/atoms';
import { Column } from '@ui/layout';

interface Segment { fromKm: number; toKm: number; paceSecPerKm: number }
interface CardioSet { distanceKm?: number; durationMin?: number }
interface Props { segments: Segment[]; cardioSets: CardioSet[] }

function formatPace(secPerKm: number): string {
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function SegmentSplitsCard({ segments, cardioSets }: Props) {
  // Greedy assignment: consume sets until accumulated distance fills segment
  let cursor = 0;
  const rows = segments.map((seg, i) => {
    const targetKm = seg.toKm - seg.fromKm;
    let kmAcc = 0, minAcc = 0;
    while (cursor < cardioSets.length && kmAcc < targetKm) {
      kmAcc += cardioSets[cursor].distanceKm ?? 0;
      minAcc += cardioSets[cursor].durationMin ?? 0;
      cursor++;
    }
    const actualPace = kmAcc > 0 ? (minAcc * 60) / kmAcc : null;
    const delta = actualPace != null ? Math.round(actualPace - seg.paceSecPerKm) : null;
    return { i, target: seg.paceSecPerKm, actual: actualPace, delta };
  });

  return (
    <Surface as="section">
      <Column gap={2}>
        <Text size="eyebrow">Segment Splits</Text>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell header><Text size="caption">Seg</Text></TableCell>
              <TableCell header><Text size="caption">Target</Text></TableCell>
              <TableCell header><Text size="caption">Actual</Text></TableCell>
              <TableCell header><Text size="caption">Diff</Text></TableCell>
            </TableRow>
          </TableHead>
          <tbody>
            {rows.map(r => (
              <TableRow key={r.i}>
                <TableCell><Text size="caption">{r.i + 1}</Text></TableCell>
                <TableCell><Text size="caption">{formatPace(r.target)}</Text></TableCell>
                <TableCell><Text size="caption">{r.actual != null ? formatPace(r.actual) : '—'}</Text></TableCell>
                <TableCell>
                  <Text size="caption" data-tone={r.delta == null ? undefined : r.delta > 5 ? 'warn' : r.delta < -5 ? 'info' : 'success'}>
                    {r.delta == null ? '—' : r.delta > 0 ? `+${r.delta}s` : `${r.delta}s`}
                  </Text>
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </Column>
    </Surface>
  );
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run ui/components/session/SegmentSplitsCard
```
Expected: PASS

- [ ] **Step 5: Add to FinishedView**

In `ui/components/session/FinishedView.tsx`, find where `session` is accessed and cardio sets are available. After the stats grid, add:
```tsx
import { SegmentSplitsCard } from './SegmentSplitsCard';

// In JSX, after stats grid:
{session.paceTarget?.kind === 'segments' && (
  <SegmentSplitsCard
    segments={session.paceTarget.segments}
    cardioSets={/* flatten cardio sets from session.blocks here */}
  />
)}
```

To get cardioSets: `session.blocks.flatMap(b => b.segments ?? []).filter(s => s.kind === 'cardio')` — adjust to match the actual data shape in FinishedView.

- [ ] **Step 6: Commit**

```bash
git add ui/components/session/SegmentSplitsCard.tsx ui/components/session/SegmentSplitsCard.test.tsx ui/components/session/FinishedView.tsx
git commit -m "feat(session): add SegmentSplitsCard to FinishedView for post-workout segment analysis"
```

---

## Phase 3 — PR Badge in WorkoutView (Hevy-inspired)

### Task 7: Surface the isPR flag in SetRow

`isPR` is already computed by `recomputePR()` in `features/training_log/domain/reducers.ts` and stored on `SetEntry`. It just isn't shown in the UI.

**Files:**
- Modify: `ui/components/session/SetRow.tsx`

**Interfaces:**
- Consumes: `set.isPR: boolean | undefined` (already on `SetEntry`)
- Produces: `Badge tone="success"` when `isPR === true`

- [ ] **Step 1: Open SetRow and find the right placement**

Open `ui/components/session/SetRow.tsx`. Find the row's right-side / trailing content area. Confirm `set` prop includes `isPR`.

- [ ] **Step 2: Add the PR badge**

```tsx
import { Badge } from '@ui/molecules';

// Inside SetRow JSX, next to the set number or on the trailing edge:
{set.isPR && <Badge tone="success">PR</Badge>}
```

- [ ] **Step 3: Manual verification**

```bash
npm run dev
```

Open an active strength session. Log several sets increasing in weight. The highest-weight set in the block should show a green "PR" badge.

- [ ] **Step 4: Commit**

```bash
git add ui/components/session/SetRow.tsx
git commit -m "feat(session): display PR badge on best set per block (Hevy-style)"
```

---

## Verification Checklist

1. `npx tsc --noEmit` — zero errors after each phase.
2. `npx vitest run` — all tests (new + existing) pass.
3. **File moves:** Navigate to `/weather` and `/notifications` in the running app — both screens load.
4. **Segment guide:** Start a new cardio session from RouteOverviewScreen → Plan → "Per segment" mode → schedule → start session. The `SegmentGuide` bar should appear in WorkoutView above the exercise blocks.
5. **Segment splits:** Finish that session. `FinishedView` should display a Segment Splits table.
6. **PR badge:** In an active strength session, log increasing-weight sets — the heaviest gets a green "PR" badge.
