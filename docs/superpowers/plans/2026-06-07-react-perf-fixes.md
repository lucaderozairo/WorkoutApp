# React Performance Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix five React performance and correctness violations found during the Vercel React Best Practices audit: a rendering bug, two re-render anti-patterns, a missing-memoization gap in a frequently-used hook, and index-key misuse.

**Architecture:** Each task is a focused, self-contained change to one or two files. No new abstractions are introduced — all fixes bring existing code in line with the rules already enforced by the project's ESLint config. Changes in Tasks 1–3 are one-liners; Task 4 is the only medium-effort change (wrapping 6 values in a hook with `useMemo`/`useCallback`); Task 5 is mechanical key substitution.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, ESLint (`eslint-plugin-boundaries`)

---

## File Map

| File | Change |
|---|---|
| `features/training_log/commands/handlers.ts` | Fix `applyAll` to populate `active_session` view; add `defineCommand`-based commit helpers |
| `ui/screens/session/useFinishSession.ts:91` | Ensure `startTimestamp` is `number \| null`, never `NaN` |
| `ui/screens/session/FinishSessionScreen.tsx:60` | Guard condition: `{startTimestamp && …}` → `{startTimestamp != null && …}` |
| `ui/patterns/charts/charts.tsx:265-266` | Hoist `GanttBar` / `GanttBarActive` to module level |
| `ui/components/widgets/DashboardMiniWidgets.tsx:37` | Hoist empty array default for `scoreHistory` |
| `ui/screens/progress/useProgressScreen.ts` | Wrap 6 derived values in `useMemo` / `useCallback` |
| `ui/components/session/FinishedView.tsx:147,211` | Replace index keys with stable string keys |

---

## Task 0 — Fix pre-existing test failures: `active_session` not populated after `handleStartSession`

**Background:** Two tests in `features/training_log/commands/handlers.test.ts` fail in this worktree because the committed `applyAll` function in `handlers.ts` does not write `active_session` to the viewStore. The committed version only sets `sessions` and `recent_exercises`. The `active_session` key was present in an earlier implementation but was accidentally dropped in a prior refactor.

The main working directory (master branch) already has unstaged changes that fix this, but the worktree (`fix/react-perf-fixes`) was created from the committed state and is missing them. These tests block the `npm run test` verification steps in every subsequent task — fix them first.

**Root cause:** `applyAll` in the committed `handlers.ts`:
```ts
export function applyAll(events: TrainingLogEvent[]): void {
  events.forEach(e => { ... });
  viewStore.set('sessions', sessionProjection.getState());
  viewStore.set('recent_exercises', recentExercisesProjection.getState());
}
```
Missing: `viewStore.set('active_session', ...)`. `viewStore.get('active_session')` returns `undefined` (key never set), so the tests fail.

**Files:**
- Modify: `features/training_log/commands/handlers.ts` (lines 50–57 in the committed worktree file)

- [ ] **Step 1: Run the failing tests to confirm baseline**

  ```bash
  npx vitest run features/training_log/commands/handlers.test.ts
  ```

  Expected: 2 tests fail (`populates active_session in the viewStore`, `AddBlock appends to active_session.segments`).

- [ ] **Step 2: Fix `applyAll` to set `active_session`**

  In `features/training_log/commands/handlers.ts`, replace the `applyAll` function:

  ```ts
  // Before
  export function applyAll(events: TrainingLogEvent[]): void {
    events.forEach(e => {
      sessionProjection.apply(e);
      recentExercisesProjection.apply(e);
    });
    viewStore.set('sessions', sessionProjection.getState());
    viewStore.set('recent_exercises', recentExercisesProjection.getState());
  }

  // After
  export function applyAll(events: TrainingLogEvent[]): void {
    events.forEach(e => {
      sessionProjection.apply(e);
      recentExercisesProjection.apply(e);
    });
    const sessions = sessionProjection.getState();
    viewStore.set('sessions', sessions);
    viewStore.set('active_session', sessions.activeId ? sessions.byId[sessions.activeId] ?? null : null);
    viewStore.set('recent_exercises', recentExercisesProjection.getState());
  }
  ```

- [ ] **Step 3: Also apply the `defineCommand` refactor that accompanies this fix**

  The committed code uses `eventRepository.commit(events)` + `applyAll(events)` inline in every handler. The main working directory refactors this into two reusable command wrappers. Apply the same refactor in the worktree so the worktree's `handlers.ts` matches the main working directory — this avoids a merge conflict when this branch is eventually merged.

  **3a.** Replace the import at the top of `handlers.ts`:

  ```ts
  // Before
  import { eventRepository } from '@data/event-repository';

  // After
  import { defineCommand } from '@data/define-command';
  ```

  **3b.** Add two command helpers immediately after `applyAll` (before the `// ─── Command Handlers ─` comment):

  ```ts
  const commitTrainingLogEvents = defineCommand<TrainingLogEvent[], Result<void, string>>({
    execute: async (events) => {
      applyAll(events);
      return { events, result: ok(undefined) };
    },
  });

  const commitSessionStartedEvents = defineCommand<
    { events: TrainingLogEvent[]; sessionId: string },
    Result<{ sessionId: string }, string>
  >({
    execute: async ({ events, sessionId }) => {
      applyAll(events);
      return { events, result: ok({ sessionId }) };
    },
  });
  ```

  **3c.** Replace every handler body that currently ends with:

  ```ts
  await eventRepository.commit(events);
  applyAll(events);
  return ok(undefined);
  ```

  with:

  ```ts
  return commitTrainingLogEvents(events);
  ```

  And the `handleStartSession` handler body that ends with:

  ```ts
  await eventRepository.commit(events);
  applyAll(events);
  return ok({ sessionId });
  ```

  with:

  ```ts
  return commitSessionStartedEvents({ events, sessionId });
  ```

  And the private `commit` helper at the bottom of the file:

  ```ts
  // Before
  async function commit(events: TrainingLogEvent[]): Promise<Result<void, string>> {
    await eventRepository.commit(events);
    applyAll(events);
    return ok(undefined);
  }

  // After
  async function commit(events: TrainingLogEvent[]): Promise<Result<void, string>> {
    return commitTrainingLogEvents(events);
  }
  ```

- [ ] **Step 4: Run the tests to confirm they pass**

  ```bash
  npx vitest run features/training_log/commands/handlers.test.ts
  ```

  Expected: all 4 tests pass (including the 2 that were failing).

- [ ] **Step 5: Run full test suite and lint**

  ```bash
  npm run test && npm run lint
  ```

  Expected: all tests pass, no new lint errors.

- [ ] **Step 6: Commit**

  ```bash
  git add features/training_log/commands/handlers.ts
  git commit -m "fix(training_log): set active_session in applyAll and refactor handlers to use defineCommand"
  ```

---

## Task 1 — Fix `startTimestamp` rendering bug

**Background:** `startTimestamp` is `number | null` but can silently be `NaN` when `date` and `startTime` are both truthy yet form an invalid ISO datetime string (e.g. `"2026-06-07T"`). In JSX, `{NaN && <Input>}` evaluates to `NaN`, and React renders the literal text `"NaN"` in the DOM. The component guard `{startTimestamp && …}` also renders `"0"` for the Unix epoch (January 1, 1970 00:00 UTC), which is technically valid input.

**Files:**
- Modify: `ui/screens/session/useFinishSession.ts` (line 91)
- Modify: `ui/screens/session/FinishSessionScreen.tsx` (line 60)

- [ ] **Step 1: Verify the current type of `startTimestamp` in the hook**

  Open `ui/screens/session/useFinishSession.ts`. Line 91 currently reads:

  ```ts
  const startTimestamp = date && startTime ? new Date(`${date}T${startTime}`).getTime() : null;
  ```

  `new Date('invalid-string').getTime()` returns `NaN`. When `date` and `startTime` are both non-empty strings that don't form a valid ISO datetime, `startTimestamp` is `NaN` and its declared type is `number | null` — but NaN slips through TypeScript because `NaN` is of type `number`.

- [ ] **Step 2: Fix the hook to ensure `startTimestamp` is never `NaN`**

  Replace line 91 in `ui/screens/session/useFinishSession.ts`:

  ```ts
  // Before
  const startTimestamp = date && startTime ? new Date(`${date}T${startTime}`).getTime() : null;

  // After
  const rawTs = date && startTime ? new Date(`${date}T${startTime}`).getTime() : NaN;
  const startTimestamp = Number.isFinite(rawTs) ? rawTs : null;
  ```

  This also fixes `endTimestampRaw` on line 92, which has the same shape:

  ```ts
  // Before
  const endTimestampRaw = date && endTime ? new Date(`${date}T${endTime}`).getTime() : null;

  // After
  const rawEndTs = date && endTime ? new Date(`${date}T${endTime}`).getTime() : NaN;
  const endTimestampRaw = Number.isFinite(rawEndTs) ? rawEndTs : null;
  ```

- [ ] **Step 3: Fix the JSX guard in `FinishSessionScreen.tsx`**

  Line 60 currently reads:

  ```tsx
  {startTimestamp && (
    <Input label="Duration" type="time" disabled value={...} />
  )}
  ```

  `startTimestamp` is now `number | null` with no NaN possible. Rule 6.9 (`rendering-conditional-render`) says to use a ternary rather than `&&`, even when the condition is already boolean, to eliminate the whole class of falsy-render bugs:

  ```tsx
  {startTimestamp != null ? (
    <Input label="Duration" type="time" disabled value={(() => {
      if (!durationMs || durationMs <= 0) return '00:00';
      const m = Math.floor(durationMs / 60000);
      const h = Math.floor(m / 60);
      return `${String(h).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    })()} />
  ) : null}
  ```

  Replace the entire `{startTimestamp && (...)}` block (lines 60–62) with the ternary above.

- [ ] **Step 4: Run tests and lint**

  ```bash
  npm run test && npm run lint
  ```

  Expected: all tests pass, no new lint errors.

- [ ] **Step 5: Commit**

  ```bash
  git add ui/screens/session/useFinishSession.ts ui/screens/session/FinishSessionScreen.tsx
  git commit -m "fix(session): guard startTimestamp against NaN and falsy-number render"
  ```

---

## Task 2 — Hoist inline Gantt shape components in charts.tsx

**Background:** In the `'timeline'` case of the `ChartContainer` switch, `GanttBar` and `GanttBarActive` are defined as arrow-function components inside the `switch` body. Recharts compares `shape` and `activeBar` prop references by identity to decide whether to unmount and remount bar shapes. Because these functions are created fresh on every render cycle, recharts treats them as "new" components every time and re-mounts the `<Bar>` children, even when the data hasn't changed.

**Files:**
- Modify: `ui/patterns/charts/charts.tsx` (lines 27–29 and 265–266)

- [ ] **Step 1: Add module-level Gantt shape components after `timelineColor`**

  `timelineColor` is defined at lines 27–28 of `ui/patterns/charts/charts.tsx`. Add the two hoisted components immediately below it:

  ```tsx
  const timelineColor = (outcome: TimelineOutcome) =>
      outcome === 'success' ? 'hsl(160,60%,50%)' : outcome === 'error' ? 'hsl(0,65%,55%)' : 'hsl(220,15%,55%)';

  const GanttBar = (props: any) => <Rectangle {...props} fill={timelineColor(props.outcome)} radius={4} />;
  const GanttBarActive = (props: any) => <Rectangle {...props} fill={timelineColor(props.outcome)} radius={4} stroke="var(--accent)" strokeWidth={2} />;
  ```

- [ ] **Step 2: Remove the inline definitions from the switch case**

  The `'timeline'` case currently reads:

  ```tsx
  case 'timeline': {
      const td = (data ?? []) as unknown as TimelineItem[];
      const GanttBar = (props: any) => <Rectangle {...props} fill={timelineColor(props.outcome)} radius={4} />;
      const GanttBarActive = (props: any) => <Rectangle {...props} fill={timelineColor(props.outcome)} radius={4} stroke="var(--accent)" strokeWidth={2} />;
      return (
          ...
  ```

  Delete only the two `const GanttBar` / `const GanttBarActive` lines. The rest of the case is unchanged:

  ```tsx
  case 'timeline': {
      const td = (data ?? []) as unknown as TimelineItem[];
      return (
          <BarChart layout="vertical" data={td} margin={margin}>
              <CartesianGrid strokeDasharray="2 2" horizontal={false} />
              <Tooltip shared={false} />
              <XAxis type="number" dataKey={undefined} domain={[0, 20]} tickCount={5} label={{ value: 'Time (s)', position: 'insideBottomRight', style: { fontSize: 'var(--t-xs)' } }} tick={tick} />
              <YAxis width={40} type="category" dataKey="name" tick={tick} />
              <Bar dataKey="firstCycle" stackId="t" shape={GanttBar} activeBar={GanttBarActive} />
              <Bar dataKey="secondCycle" stackId="t" shape={GanttBar} activeBar={GanttBarActive} />
          </BarChart>
      );
  }
  ```

- [ ] **Step 3: Run tests and lint**

  ```bash
  npm run test && npm run lint
  ```

  Expected: `ui/layout/ChartContainer.test.tsx` passes. No new lint errors.

- [ ] **Step 4: Commit**

  ```bash
  git add ui/patterns/charts/charts.tsx
  git commit -m "perf(charts): hoist GanttBar/GanttBarActive to module level to prevent remount on every render"
  ```

---

## Task 3 — Fix non-primitive default prop in `SleepWidget`

**Background:** `scoreHistory = []` in a function parameter creates a brand-new array instance every time the component renders without that prop. Rule 5.5 (`rerender-memo-with-default-value`) targets this pattern specifically for `memo()`-wrapped components, where a new reference breaks memoization. `SleepWidget` is not itself wrapped in `memo()`, but any downstream child that _is_ memoized and receives `scoreHistory` as a prop will see a new reference on every parent render and re-render unnecessarily. Hoisting to a module-level constant restores reference stability regardless of whether `SleepWidget` itself is memoized.

**Files:**
- Modify: `ui/components/widgets/DashboardMiniWidgets.tsx` (around line 31–37)

- [ ] **Step 1: Add a module-level constant before `SleepWidget`**

  Add one line immediately before the `// ── Sleep ──` comment at line 31:

  ```ts
  const EMPTY_SCORE_HISTORY: Array<{ x: string; y: number }> = [];

  // ── Sleep ────────────────────────────────────────────────────────────────────
  ```

- [ ] **Step 2: Replace the inline default**

  Change the parameter default in `SleepWidget`:

  ```ts
  // Before
  scoreHistory = [],

  // After
  scoreHistory = EMPTY_SCORE_HISTORY,
  ```

  The type annotation `scoreHistory?: Array<{ x: string; y: number }>` on the type object below is unchanged.

- [ ] **Step 3: Run tests and lint**

  ```bash
  npm run test && npm run lint
  ```

  Expected: all tests pass, no new lint errors.

- [ ] **Step 4: Commit**

  ```bash
  git add ui/components/widgets/DashboardMiniWidgets.tsx
  git commit -m "perf(widgets): hoist scoreHistory default to module level to stabilise prop reference"
  ```

---

## Task 4 — Memoize derived values in `useProgressScreen`

**Background:** `useProgressScreen` computes six derived values on every render using `.sort()`, `.reduce()`, `.filter()`, `Array.from(new Set(...))`, a `cardioBySport` closure, and ternary logic. Since the hook is the single data source for `ProgressScreen`, these run on every state change anywhere in the hook — including `showAnnForm` toggling, which has nothing to do with sessions or cardio data.

`exerciseList`, `totalSets`, `prCount`, `visibleCardioSports`, `cardioBySport`, `sportsToShow`, and `allAnnotations` all belong in `useMemo` / `useCallback`.

**Files:**
- Modify: `ui/screens/progress/useProgressScreen.ts`

- [ ] **Step 1: Add `useCallback` to the React import**

  Line 1 currently reads:

  ```ts
  import { useMemo, useState } from 'react';
  ```

  Change to:

  ```ts
  import { useCallback, useMemo, useState } from 'react';
  ```

- [ ] **Step 2: Memoize `exerciseList`**

  Currently (line 31–33):

  ```ts
  const progressions = (useQuery<ProgressionState>('exercise_progressions') ?? {}) as ProgressionState;
  const exerciseList = Object.values(progressions).sort((a, b) =>
    a.exerciseName.localeCompare(b.exerciseName)
  );
  ```

  **⚠ Trap:** Do NOT write `const progressions = (useQuery(...) ?? {}) as ProgressionState` and then put `progressions` in the dependency array. The `?? {}` creates a fresh object on every render while the query returns `null`, so the dependency is always a new reference and the memo recomputes every render — worse than nothing.

  Instead, keep `useQuery`'s raw return value as the dependency and inline the fallback inside the memo:

  ```ts
  const progressionsRaw = useQuery<ProgressionState>('exercise_progressions');
  const exerciseList = useMemo(
    () => Object.values(progressionsRaw ?? {}).toSorted((a, b) =>
      a.exerciseName.localeCompare(b.exerciseName)
    ),
    [progressionsRaw],
  );
  ```

  `progressionsRaw` is reference-stable: `useQuery` uses `setData(prev => prev === current ? prev : current)`, so it only emits a new reference when the store value actually changes. `.toSorted()` is used instead of `.sort()` per rule 7.14 (immutability — `Object.values` returns a new array we own, so mutation is safe, but `.toSorted()` is the explicit best-practice form).

- [ ] **Step 3: Memoize `totalSets` and `prCount` together**

  Currently (lines 46–47):

  ```ts
  const totalSets = history.reduce((acc, s) => acc + s.totalSets, 0);
  const prCount = history.filter(s => s.hasPR).length;
  ```

  Replace with:

  ```ts
  const { totalSets, prCount } = useMemo(() => ({
    totalSets: history.reduce((acc, s) => acc + s.totalSets, 0),
    prCount: history.filter(s => s.hasPR).length,
  }), [history]);
  ```

- [ ] **Step 4: Stabilise `allCardio` before it feeds downstream memos**

  Currently (line 44):

  ```ts
  const allCardio = ((useQuery<RecentCardioView>('recent_cardio_sessions') ?? { sessions: [] }) as RecentCardioView).sessions;
  ```

  Same `?? { sessions: [] }` trap as Step 2: the object literal `{ sessions: [] }` is created on every render when the query is `null`, producing a new `allCardio` array each time and invalidating `visibleCardioSports` and `cardioBySport` on every render.

  Fix: keep the raw query value as the memo dependency and compute `allCardio` inside the memo:

  ```ts
  const recentCardioRaw = useQuery<RecentCardioView>('recent_cardio_sessions');
  const allCardio = useMemo(
    () => (recentCardioRaw as RecentCardioView | null)?.sessions ?? [],
    [recentCardioRaw],
  );
  ```

  The `?? []` here creates a new empty array only when the memo recomputes (i.e., when `recentCardioRaw` changes reference), not on every render.

- [ ] **Step 5: Memoize `visibleCardioSports`**

  Currently (line 49):

  ```ts
  const visibleCardioSports = Array.from(new Set(allCardio.map(s => s.sport))) as CardioSport[];
  ```

  Replace with:

  ```ts
  const visibleCardioSports = useMemo(
    () => Array.from(new Set(allCardio.map(s => s.sport))) as CardioSport[],
    [allCardio],
  );
  ```

  Because `allCardio` is now memoized (Step 4), this is reference-stable. ✅

- [ ] **Step 6: Stabilise `cardioBySport` with `useCallback`**

  Currently (line 50):

  ```ts
  const cardioBySport = (sport: CardioSport) => allCardio.filter(s => s.sport === sport);
  ```

  Replace with:

  ```ts
  const cardioBySport = useCallback(
    (sport: CardioSport) => allCardio.filter(s => s.sport === sport),
    [allCardio],
  );
  ```

  Because `allCardio` is now memoized (Step 4), `cardioBySport` only gets a new reference when cardio data actually changes. ✅

- [ ] **Step 7: Memoize `sportsToShow`**

  Currently (lines 75–77):

  ```ts
  const sportsToShow: CardioSport[] = sportFilter === 'all' || sportFilter === 'strength'
    ? visibleCardioSports
    : (visibleCardioSports.includes(sportFilter as CardioSport) ? [sportFilter as CardioSport] : []);
  ```

  Replace with:

  ```ts
  const sportsToShow = useMemo<CardioSport[]>(
    () =>
      sportFilter === 'all' || sportFilter === 'strength'
        ? visibleCardioSports
        : visibleCardioSports.includes(sportFilter as CardioSport)
          ? [sportFilter as CardioSport]
          : [],
    [sportFilter, visibleCardioSports],
  );
  ```

- [ ] **Step 8: Memoize `allAnnotations`**

  Currently (line 73):

  ```ts
  const allAnnotations = annExercise ? getAnnotations(annExercise) : [];
  ```

  Replace with:

  ```ts
  const allAnnotations = useMemo(
    () => (annExercise ? getAnnotations(annExercise) : []),
    [annExercise],
  );
  ```

- [ ] **Step 9: Run tests and lint**

  ```bash
  npm run test && npm run lint
  ```

  Expected: all tests pass, no new lint errors. TypeScript should be happy since the return types are unchanged.

- [ ] **Step 10: Commit**

  ```bash
  git add ui/screens/progress/useProgressScreen.ts
  git commit -m "perf(progress): memoize derived values in useProgressScreen to prevent redundant recomputation"
  ```

---

## Task 5 — Replace index keys with stable string keys in `FinishedView`

**Background:** React uses `key` to match elements across renders. Index keys (`key={i}`) are incorrect when list items can be added, removed, or reordered because React reuses the wrong component instance. Two lists in `FinishedView` have stable natural keys: session tags (their string value) and CARDIO_FIELDS entries (their `key` property, a `keyof UICardioSet` string).

**Files:**
- Modify: `ui/components/session/FinishedView.tsx` (lines 147 and 211)

- [ ] **Step 1: Fix the tags list key**

  Line 146–147 currently reads:

  ```tsx
  {session.tags.map((t, i) => (
    <Badge key={i} dot>{t}</Badge>
  ))}
  ```

  Tags are unique strings within a session. Use the tag value as the key and drop the unused index:

  ```tsx
  {session.tags.map((t) => (
    <Badge key={t} dot>{t}</Badge>
  ))}
  ```

- [ ] **Step 2: Fix the CARDIO_FIELDS list key**

  Lines 207–211 currently read:

  ```tsx
  {CARDIO_FIELDS.map((f, i) => {
    const raw = ex.cardioSet?.[f.key] as number | undefined;
    const display = raw != null && raw > 0 ? f.toDisplay(raw) : '—';
    return (
      <Column key={i} gap={1} align="center">
  ```

  `CARDIO_FIELDS` is a module-level constant whose entries each have a unique `.key: keyof UICardioSet` string (`'durationSeconds'`, `'distanceMeters'`, `'avgPowerWatts'`, `'resistance'`). Use that as the key and drop the unused index:

  ```tsx
  {CARDIO_FIELDS.map((f) => {
    const raw = ex.cardioSet?.[f.key] as number | undefined;
    const display = raw != null && raw > 0 ? f.toDisplay(raw) : '—';
    return (
      <Column key={f.key} gap={1} align="center">
  ```

- [ ] **Step 3: Run tests and lint**

  ```bash
  npm run test && npm run lint
  ```

  Expected: all tests pass, no new lint errors.

- [ ] **Step 4: Commit**

  ```bash
  git add ui/components/session/FinishedView.tsx
  git commit -m "fix(session): use stable string keys for tags and CARDIO_FIELDS lists in FinishedView"
  ```

---

## Self-Review

**Spec coverage check:**

| Finding from audit / plan audit | Task |
|---|---|
| `active_session` not set in `applyAll` → 2 pre-existing test failures in worktree | Task 0 |
| `{startTimestamp && …}` renders NaN/0 in DOM | Task 1 |
| JSX conditional uses `&&` instead of ternary (rule 6.9) | Task 1 Step 3 |
| `GanttBar`/`GanttBarActive` defined inside render | Task 2 |
| `scoreHistory = []` new reference per render | Task 3 |
| `progressions = (useQuery(...) ?? {})` creates new ref every render | Task 4 Step 2 |
| `allCardio = (useQuery(...) ?? { sessions: [] })` creates new ref every render | Task 4 Step 4 |
| `.sort()` mutates array (rule 7.14) | Task 4 Step 2 |
| Missing `useMemo` on derived values in useProgressScreen | Task 4 |
| Index keys in `FinishedView` tags and CARDIO_FIELDS | Task 5 |

Barrel imports (83 files, Vite tree-shaken) are tracked as architectural debt in the project's existing lint config and are explicitly out of scope here per the audit note.

**Placeholder scan:** No TBDs, todos, or "similar to" references. Every step contains the full before/after code.

**Type consistency:**
- `startTimestamp: number | null` — used as `number | null` in the hook; ternary guard in the component is boolean-safe. ✅
- `EMPTY_SCORE_HISTORY: Array<{ x: string; y: number }>` matches the existing type annotation `scoreHistory?: Array<{ x: string; y: number }>`. ✅
- `useCallback` added to import before it is used in Task 4 Step 6. ✅
- `f.key: keyof UICardioSet` is the correct stable identifier for CARDIO_FIELDS entries. ✅
- `progressionsRaw` / `recentCardioRaw` — raw `useQuery` return values used as memo deps; `?? {}` / `?? []` inlined inside memos so fallback objects are not created on every render. ✅
- `.toSorted()` used for `exerciseList` instead of `.sort()` per rule 7.14. ✅
