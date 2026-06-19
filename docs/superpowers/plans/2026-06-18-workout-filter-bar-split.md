# WorkoutFilterBar Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split `ui/components/workout/WorkoutFilterBar.tsx` (330 lines, 6 independent `useState` hooks, 4 unrelated filter concerns in one function) into four self-contained pieces — `DateFilterPanel`, `TypeFilterPanel`, `ExerciseSearchFilter`, and a slimmed-down `WorkoutFilterBar` that only lays them out — with zero behavior change.

**Architecture:** Each filter section becomes its own component owning only the state it needs (its own expanded/collapsed flag, its own search text). All four already share the same `SessionFilters` read/write contract (`filters: SessionFilters; onChange: (f: SessionFilters) => void`), so no new shared state container is needed — props in, `onChange` out, exactly like the rest of `ui/patterns`. `WorkoutFilterBar` keeps the top-level `filtersOpen` toggle (it controls the whole popover, not one section) and the chip-rendering at the bottom (it reads from all filters at once, so it doesn't belong to any single panel).

**Tech Stack:** React 18 + TypeScript, Vitest + @testing-library/react (project convention, see `ui/components/session/SegmentSplitsCard.test.tsx`), existing `@ui/atoms`, `@ui/molecules`, `@ui/layout` primitives — no new dependencies.

## Global Constraints

- Zero behavior change: every existing interaction (open/close panels, pick a date range, pick a type, search exercises, clear filters, chip removal) must work identically after the split.
- No new primitives, no new abstraction layers — this is a decomposition of existing JSX into existing-shaped components (per CLAUDE.md's "every visual element originates from a primitive" rule, these new components are `ui/components/workout`-local, not new design-system pieces).
- Follow the project's "two-stage state" pattern already in the file: a local UI-only `useState` (e.g. `dateExpanded`) is fine to keep local to its new component; anything that mutates `SessionFilters` must go through the `onChange` prop, never local state.
- Token/CSS rules from CLAUDE.md apply if any markup changes (it shouldn't — this is a pure extraction) — don't introduce inline styles or hardcoded spacing.

---

## File Structure

| File | Responsibility |
|---|---|
| `ui/components/workout/DateFilterPanel.tsx` | Date-range chips (list view only) + custom from/to date inputs. Owns `dateExpanded`, `datePickerExpanded`. |
| `ui/components/workout/TypeFilterPanel.tsx` | Workout-type chip grid. Owns `typeExpanded`. |
| `ui/components/workout/ExerciseSearchFilter.tsx` | Exercise search input + suggestion dropdown + selected-exercise chip. Owns `exerciseSearch`, `exerciseFocused`. |
| `ui/components/workout/WorkoutFilterBar.tsx` | Session-name search, sort chip, the Filters button/popover shell, lays out the three panels above, renders the active-filter chip row. Owns `filtersOpen` only. |
| `ui/components/workout/DateFilterPanel.test.tsx` | New test file. |
| `ui/components/workout/TypeFilterPanel.test.tsx` | New test file. |
| `ui/components/workout/ExerciseSearchFilter.test.tsx` | New test file. |
| `ui/components/workout/WorkoutFilterBar.test.tsx` | New test file (covers the composed bar still works end-to-end). |

---

### Task 1: Extract `DateFilterPanel`

**Files:**
- Create: `ui/components/workout/DateFilterPanel.tsx`
- Create: `ui/components/workout/DateFilterPanel.test.tsx`
- Modify: `ui/components/workout/WorkoutFilterBar.tsx:131-207` (replace with `<DateFilterPanel ... />`)

**Interfaces:**
- Consumes: `SessionFilters`, `ViewMode` from `@ui/components/log/SessionFilterBar` (already imported in `WorkoutFilterBar.tsx:3`); `Row`, `Column` from `@ui/layout`; `Text`, `Chip` from `@ui/atoms`; `Button`, `Input` from `@ui/molecules`; `ChevronDown`, `X` from `lucide-react`.
- Produces: `DateFilterPanel(props: { filters: SessionFilters; onChange: (f: SessionFilters) => void; view: ViewMode })` — a default-exported-free named export, rendered by `WorkoutFilterBar`.

- [ ] **Step 1: Write the failing test**

```tsx
// ui/components/workout/DateFilterPanel.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DateFilterPanel } from './DateFilterPanel';
import { DEFAULT_FILTERS } from '@ui/components/log/SessionFilterBar';

describe('DateFilterPanel', () => {
  it('shows date-range chips in list view and selects one', () => {
    const onChange = vi.fn();
    render(<DateFilterPanel filters={DEFAULT_FILTERS} onChange={onChange} view="list" />);

    fireEvent.click(screen.getByText('Past 7 days'));

    expect(onChange).toHaveBeenCalledWith({
      ...DEFAULT_FILTERS,
      dateRange: '7d',
      dateFrom: '',
      dateTo: '',
    });
  });

  it('hides the date-range chip group outside list view', () => {
    render(<DateFilterPanel filters={DEFAULT_FILTERS} onChange={vi.fn()} view="month" />);
    expect(screen.queryByText('Past 7 days')).not.toBeInTheDocument();
  });

  it('expands the custom date picker and sets a from-date', () => {
    const onChange = vi.fn();
    render(<DateFilterPanel filters={DEFAULT_FILTERS} onChange={onChange} view="list" />);

    fireEvent.click(screen.getByText('Custom date'));
    const fromInput = screen.getByDisplayValue('');
    fireEvent.change(fromInput, { target: { value: '2026-06-01' } });

    expect(onChange).toHaveBeenCalledWith({
      ...DEFAULT_FILTERS,
      dateFrom: '2026-06-01',
      dateRange: 'all',
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run ui/components/workout/DateFilterPanel.test.tsx`
Expected: FAIL with "Cannot find module './DateFilterPanel'"

- [ ] **Step 3: Write the implementation**

```tsx
// ui/components/workout/DateFilterPanel.tsx
import { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import type { SessionFilters, ViewMode } from '@ui/components/log/SessionFilterBar';
import { Row, Column } from '@ui/layout';
import { Text, Chip } from '@ui/atoms';
import { Button, Input } from '@ui/molecules';

const DATE_OPTIONS: { key: SessionFilters['dateRange']; label: string }[] = [
  { key: 'all', label: 'All time' },
  { key: '7d', label: 'Past 7 days' },
  { key: '30d', label: 'Past 30 days' },
];

interface DateFilterPanelProps {
  filters: SessionFilters;
  onChange: (f: SessionFilters) => void;
  view: ViewMode;
}

export function DateFilterPanel({ filters, onChange, view }: DateFilterPanelProps) {
  const [dateExpanded, setDateExpanded] = useState(true);
  const [datePickerExpanded, setDatePickerExpanded] = useState(false);

  return (
    <Column gap={1}>
      {view === 'list' && (
        <>
          <Button
            variant="ghost"
            block
            className="flush"
            onClick={() => setDateExpanded(e => !e)}
          >
            <Row justify="between" align="center">
              Date range
              <ChevronDown size={12} className={`chevron${dateExpanded ? ' open' : ''}`} />
            </Row>
          </Button>
          {dateExpanded && (
            <Row gap={1} wrap>
              {DATE_OPTIONS.map(opt => (
                <Chip
                  key={opt.key}
                  active={filters.dateRange === opt.key}
                  onClick={() => onChange({ ...filters, dateRange: opt.key, dateFrom: '', dateTo: '' })}
                >
                  {opt.label}
                </Chip>
              ))}
            </Row>
          )}
        </>
      )}

      <Button
        variant="ghost"
        block
        className="flush"
        onClick={() => setDatePickerExpanded(e => !e)}
      >
        <Row justify="between" align="center">
          Custom date
          <ChevronDown size={12} className={`chevron${datePickerExpanded ? ' open' : ''}`} />
        </Row>
      </Button>
      {datePickerExpanded && (
        <Column gap={1}>
          <Column gap={1}>
            <Text size="caption" color="muted">From</Text>
            <Input
              type="date"
              className="min-w-0"
              value={filters.dateFrom}
              onChange={e => onChange({ ...filters, dateFrom: e.target.value, dateRange: 'all' })}
            />
          </Column>
          <Column gap={1}>
            <Text size="caption" color="muted">To</Text>
            <Input
              type="date"
              className="min-w-0"
              value={filters.dateTo}
              min={filters.dateFrom || undefined}
              onChange={e => onChange({ ...filters, dateTo: e.target.value, dateRange: 'all' })}
            />
          </Column>
          {(filters.dateFrom || filters.dateTo) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange({ ...filters, dateFrom: '', dateTo: '' })}
            >
              <Row justify="between" align="center">
                Clear dates <X size={12} />
              </Row>
            </Button>
          )}
        </Column>
      )}
    </Column>
  );
}
```

Note: the original used `<Cluster gap={1}>` for the date-range chip wrap; `Cluster` forces `wrap: true` and defaults `gap` to `2`, while the original explicit `gap={1}` plus wrapping behavior is reproduced here with `<Row gap={1} wrap>` to keep the exact same gap value — confirm visually after Step 4 that chip wrapping still looks identical (it uses the same `layoutClasses()` helper either way, only `gap`/`wrap` differ from `Cluster`'s defaults).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run ui/components/workout/DateFilterPanel.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Wire `DateFilterPanel` into `WorkoutFilterBar`**

In `ui/components/workout/WorkoutFilterBar.tsx`:
- Add import: `import { DateFilterPanel } from './DateFilterPanel';`
- Remove the `dateExpanded`/`setDateExpanded` and `datePickerExpanded`/`setDatePickerExpanded` `useState` lines (lines 52-53).
- Replace lines 131-207 (the `{/* Date range — list view only */}` block through the closing `)}` of the custom date picker) with:

```tsx
<DateFilterPanel filters={filters} onChange={onChange} view={view} />
```

- [ ] **Step 6: Run the full WorkoutFilterBar test (written in Task 4) once it exists — for now, manually verify the file still compiles**

Run: `npx tsc --noEmit -p .`
Expected: no new type errors referencing `WorkoutFilterBar.tsx` or `DateFilterPanel.tsx`

- [ ] **Step 7: Commit**

```bash
git add ui/components/workout/DateFilterPanel.tsx ui/components/workout/DateFilterPanel.test.tsx ui/components/workout/WorkoutFilterBar.tsx
git commit -m "refactor(workout): extract DateFilterPanel from WorkoutFilterBar"
```

---

### Task 2: Extract `TypeFilterPanel`

**Files:**
- Create: `ui/components/workout/TypeFilterPanel.tsx`
- Create: `ui/components/workout/TypeFilterPanel.test.tsx`
- Modify: `ui/components/workout/WorkoutFilterBar.tsx:210-235` (replace with `<TypeFilterPanel ... />`)

**Interfaces:**
- Consumes: `SessionFilters`, `TypeFilter` from `@ui/components/log/SessionFilterBar`; `Row` from `@ui/layout`; `Chip` from `@ui/atoms`; `Button` from `@ui/molecules`; `ChevronDown` from `lucide-react`.
- Produces: `TypeFilterPanel(props: { filters: SessionFilters; onChange: (f: SessionFilters) => void })`.

- [ ] **Step 1: Write the failing test**

```tsx
// ui/components/workout/TypeFilterPanel.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TypeFilterPanel } from './TypeFilterPanel';
import { DEFAULT_FILTERS } from '@ui/components/log/SessionFilterBar';

describe('TypeFilterPanel', () => {
  it('renders all type chips and selects one', () => {
    const onChange = vi.fn();
    render(<TypeFilterPanel filters={DEFAULT_FILTERS} onChange={onChange} />);

    fireEvent.click(screen.getByText('Run'));

    expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_FILTERS, type: 'run' });
  });

  it('collapses the chip grid when the header is toggled', () => {
    render(<TypeFilterPanel filters={DEFAULT_FILTERS} onChange={vi.fn()} />);
    expect(screen.getByText('Run')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Workout type'));
    expect(screen.queryByText('Run')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run ui/components/workout/TypeFilterPanel.test.tsx`
Expected: FAIL with "Cannot find module './TypeFilterPanel'"

- [ ] **Step 3: Write the implementation**

```tsx
// ui/components/workout/TypeFilterPanel.tsx
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { SessionFilters, TypeFilter } from '@ui/components/log/SessionFilterBar';
import { Row } from '@ui/layout';
import { Chip } from '@ui/atoms';
import { Button } from '@ui/molecules';

const TYPE_OPTIONS: { key: TypeFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'strength', label: 'Gym' },
  { key: 'run', label: 'Run' },
  { key: 'cycle', label: 'Cycle' },
  { key: 'hike', label: 'Hike' },
  { key: 'swim', label: 'Swim' },
  { key: 'row', label: 'Row' },
  { key: 'ski', label: 'Ski' },
  { key: 'snowboard', label: 'Snowboard' },
  { key: 'climb', label: 'Climb' },
  { key: 'surf', label: 'Surf' },
  { key: 'kayak', label: 'Kayak' },
  { key: 'yoga', label: 'Yoga' },
  { key: 'boxing', label: 'Boxing' },
  { key: 'stretch', label: 'Stretch' },
  { key: 'hiit', label: 'HIIT' },
];

interface TypeFilterPanelProps {
  filters: SessionFilters;
  onChange: (f: SessionFilters) => void;
}

export function TypeFilterPanel({ filters, onChange }: TypeFilterPanelProps) {
  const [typeExpanded, setTypeExpanded] = useState(true);

  return (
    <>
      <Button
        variant="ghost"
        block
        className="flush"
        onClick={() => setTypeExpanded(e => !e)}
      >
        <Row justify="between" align="center">
          Workout type
          <ChevronDown size={12} className={`chevron${typeExpanded ? ' open' : ''}`} />
        </Row>
      </Button>
      {typeExpanded && (
        <Row gap={1} wrap>
          {TYPE_OPTIONS.map(opt => (
            <Chip
              key={opt.key}
              active={filters.type === opt.key}
              onClick={() => onChange({ ...filters, type: opt.key })}
            >
              {opt.label}
            </Chip>
          ))}
        </Row>
      )}
    </>
  );
}
```

Also export `TYPE_LABEL` from this file (it's still needed by `WorkoutFilterBar` for the active-chip row):

```tsx
export const TYPE_LABEL: Record<string, string> = Object.fromEntries(
  TYPE_OPTIONS.map(o => [o.key, o.label])
);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run ui/components/workout/TypeFilterPanel.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Wire `TypeFilterPanel` into `WorkoutFilterBar`**

In `ui/components/workout/WorkoutFilterBar.tsx`:
- Add import: `import { TypeFilterPanel, TYPE_LABEL } from './TypeFilterPanel';`
- Remove the local `TYPE_OPTIONS` and `TYPE_LABEL` constants (lines 20-41) — `TYPE_LABEL` now comes from `./TypeFilterPanel`.
- Remove the `typeExpanded`/`setTypeExpanded` `useState` line (line 54).
- Replace lines 210-235 (the `{/* Workout type */}` block) with:

```tsx
<TypeFilterPanel filters={filters} onChange={onChange} />
```

- [ ] **Step 6: Verify compilation**

Run: `npx tsc --noEmit -p .`
Expected: no new type errors

- [ ] **Step 7: Commit**

```bash
git add ui/components/workout/TypeFilterPanel.tsx ui/components/workout/TypeFilterPanel.test.tsx ui/components/workout/WorkoutFilterBar.tsx
git commit -m "refactor(workout): extract TypeFilterPanel from WorkoutFilterBar"
```

---

### Task 3: Extract `ExerciseSearchFilter`

**Files:**
- Create: `ui/components/workout/ExerciseSearchFilter.tsx`
- Create: `ui/components/workout/ExerciseSearchFilter.test.tsx`
- Modify: `ui/components/workout/WorkoutFilterBar.tsx:238-286` (replace with `<ExerciseSearchFilter ... />`)

**Interfaces:**
- Consumes: `SessionFilters` from `@ui/components/log/SessionFilterBar`; `Row, Layered` from `@ui/layout`; `Text, Chip` from `@ui/atoms`; `Button, FloatingPanel, Input` from `@ui/molecules`; `Check, X` from `lucide-react`.
- Produces: `ExerciseSearchFilter(props: { filters: SessionFilters; onChange: (f: SessionFilters) => void; exerciseOptions: string[] })`.

- [ ] **Step 1: Write the failing test**

```tsx
// ui/components/workout/ExerciseSearchFilter.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ExerciseSearchFilter } from './ExerciseSearchFilter';
import { DEFAULT_FILTERS } from '@ui/components/log/SessionFilterBar';

describe('ExerciseSearchFilter', () => {
  it('shows matching suggestions while focused and typing', () => {
    render(
      <ExerciseSearchFilter
        filters={DEFAULT_FILTERS}
        onChange={vi.fn()}
        exerciseOptions={['Bench Press', 'Back Squat', 'Deadlift']}
      />
    );

    const input = screen.getByPlaceholderText('Search exercises…');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'b' } });

    expect(screen.getByText('Bench Press')).toBeInTheDocument();
    expect(screen.getByText('Back Squat')).toBeInTheDocument();
    expect(screen.queryByText('Deadlift')).not.toBeInTheDocument();
  });

  it('selects a suggestion and clears the search text', () => {
    const onChange = vi.fn();
    render(
      <ExerciseSearchFilter
        filters={DEFAULT_FILTERS}
        onChange={onChange}
        exerciseOptions={['Bench Press']}
      />
    );

    const input = screen.getByPlaceholderText('Search exercises…');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'bench' } });
    fireEvent.mouseDown(screen.getByText('Bench Press'));

    expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_FILTERS, exercise: 'Bench Press' });
  });

  it('shows a removable chip when an exercise is already selected', () => {
    const onChange = vi.fn();
    render(
      <ExerciseSearchFilter
        filters={{ ...DEFAULT_FILTERS, exercise: 'Bench Press' }}
        onChange={onChange}
        exerciseOptions={['Bench Press']}
      />
    );

    fireEvent.click(screen.getByText('Bench Press'));
    expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_FILTERS, exercise: '' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run ui/components/workout/ExerciseSearchFilter.test.tsx`
Expected: FAIL with "Cannot find module './ExerciseSearchFilter'"

- [ ] **Step 3: Write the implementation**

```tsx
// ui/components/workout/ExerciseSearchFilter.tsx
import { useState } from 'react';
import { Check, X } from 'lucide-react';
import type { SessionFilters } from '@ui/components/log/SessionFilterBar';
import { Row, Layered } from '@ui/layout';
import { Text, Chip } from '@ui/atoms';
import { Button, FloatingPanel, Input } from '@ui/molecules';

interface ExerciseSearchFilterProps {
  filters: SessionFilters;
  onChange: (f: SessionFilters) => void;
  exerciseOptions: string[];
}

export function ExerciseSearchFilter({ filters, onChange, exerciseOptions }: ExerciseSearchFilterProps) {
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [exerciseFocused, setExerciseFocused] = useState(false);

  const matchingExercises = exerciseOptions.filter(n =>
    n.toLowerCase().includes(exerciseSearch.toLowerCase())
  );

  return (
    <>
      <Text size="caption" color="muted">Exercise</Text>
      <Layered className="min-w-0">
        <Row gap={1} align="center">
          <Input
            className="min-w-0"
            placeholder="Search exercises…"
            value={exerciseSearch}
            onChange={e => setExerciseSearch(e.target.value)}
            onFocus={() => setExerciseFocused(true)}
            onBlur={() => setTimeout(() => setExerciseFocused(false), 150)}
          />
        </Row>
        {exerciseFocused && exerciseSearch && matchingExercises.length > 0 && (
          <FloatingPanel pin="below-left" z="fixed" pad="sm" className="exercise-suggestions">
            {matchingExercises.slice(0, 6).map(name => (
              <Button
                key={name}
                variant="ghost"
                block
                onMouseDown={() => {
                  onChange({ ...filters, exercise: name });
                  setExerciseSearch('');
                }}
              >
                <Row justify="between" align="center">
                  {name}
                  {filters.exercise === name && <Check size={12} />}
                </Row>
              </Button>
            ))}
            {filters.exercise && (
              <Button
                variant="ghost"
                size="sm"
                block
                onMouseDown={() => onChange({ ...filters, exercise: '' })}
              >
                Clear ✕
              </Button>
            )}
          </FloatingPanel>
        )}
      </Layered>
      {filters.exercise && (
        <Chip active trailing={<X size={9} />} onClick={() => onChange({ ...filters, exercise: '' })}>
          {filters.exercise}
        </Chip>
      )}
    </>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run ui/components/workout/ExerciseSearchFilter.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Wire `ExerciseSearchFilter` into `WorkoutFilterBar`**

In `ui/components/workout/WorkoutFilterBar.tsx`:
- Add import: `import { ExerciseSearchFilter } from './ExerciseSearchFilter';`
- Remove the `exerciseSearch`/`setExerciseSearch` and `exerciseFocused`/`setExerciseFocused` `useState` lines, and the now-unused `matchingExercises` computation (lines 55-56, 67-69).
- Replace lines 238-286 (the `{/* Exercise search */}` block through its closing `)}`) with:

```tsx
<ExerciseSearchFilter filters={filters} onChange={onChange} exerciseOptions={exerciseOptions} />
```

- [ ] **Step 6: Verify compilation**

Run: `npx tsc --noEmit -p .`
Expected: no new type errors

- [ ] **Step 7: Commit**

```bash
git add ui/components/workout/ExerciseSearchFilter.tsx ui/components/workout/ExerciseSearchFilter.test.tsx ui/components/workout/WorkoutFilterBar.tsx
git commit -m "refactor(workout): extract ExerciseSearchFilter from WorkoutFilterBar"
```

---

### Task 4: Verify the slimmed `WorkoutFilterBar` end-to-end

**Files:**
- Modify: `ui/components/workout/WorkoutFilterBar.tsx` (should now be ~110 lines: session-name search, sort chip, Filters button + popover shell laying out the three panels, active-chip row)
- Create: `ui/components/workout/WorkoutFilterBar.test.tsx`

**Interfaces:**
- Consumes: `DateFilterPanel`, `TypeFilterPanel` + `TYPE_LABEL`, `ExerciseSearchFilter` (all produced in Tasks 1-3); same `WorkoutFilterBarProps` as before (unchanged: `filters`, `onChange`, `exerciseOptions`, `view`).
- Produces: nothing new — same public component signature as before the refactor, so any existing caller is unaffected.

- [ ] **Step 1: Write the failing test**

```tsx
// ui/components/workout/WorkoutFilterBar.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WorkoutFilterBar } from './WorkoutFilterBar';
import { DEFAULT_FILTERS } from '@ui/components/log/SessionFilterBar';

describe('WorkoutFilterBar', () => {
  it('opens the filter popover and shows all three panels', () => {
    render(
      <WorkoutFilterBar
        filters={DEFAULT_FILTERS}
        onChange={vi.fn()}
        exerciseOptions={['Bench Press']}
        view="list"
      />
    );

    fireEvent.click(screen.getByText('Filters'));

    expect(screen.getByText('Date range')).toBeInTheDocument();
    expect(screen.getByText('Workout type')).toBeInTheDocument();
    expect(screen.getByText('Exercise')).toBeInTheDocument();
  });

  it('shows an active-filter chip and a badge count when a type filter is applied', () => {
    render(
      <WorkoutFilterBar
        filters={{ ...DEFAULT_FILTERS, type: 'run' }}
        onChange={vi.fn()}
        exerciseOptions={[]}
        view="list"
      />
    );

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Run')).toBeInTheDocument();
  });

  it('clears all filters via the clear-all button', () => {
    const onChange = vi.fn();
    render(
      <WorkoutFilterBar
        filters={{ ...DEFAULT_FILTERS, type: 'run', exercise: 'Bench Press' }}
        onChange={onChange}
        exerciseOptions={[]}
        view="list"
      />
    );

    fireEvent.click(screen.getByText('Filters'));
    fireEvent.click(screen.getByText('Clear all'));

    expect(onChange).toHaveBeenCalledWith({
      ...DEFAULT_FILTERS,
      type: 'all', exercise: '', dateRange: 'all',
      dateFrom: '', dateTo: '', sort: 'newest',
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run ui/components/workout/WorkoutFilterBar.test.tsx`
Expected: FAIL — at this point in the plan `WorkoutFilterBar.tsx` should already be updated by Tasks 1-3, so this step instead confirms it currently passes or reveals a wiring bug. If it fails, the wiring from a previous task is incomplete — fix `WorkoutFilterBar.tsx` before continuing, do not change the test to match broken behavior.

- [ ] **Step 3: Confirm the final `WorkoutFilterBar.tsx` matches this shape**

```tsx
// ui/components/workout/WorkoutFilterBar.tsx
import { useState } from 'react';
import { SlidersHorizontal, Search, X } from 'lucide-react';
import type { SessionFilters, ViewMode } from '@ui/components/log/SessionFilterBar';
import { Row, Column, Cluster, Layered } from '@ui/layout';
import { Text, Chip } from '@ui/atoms';
import { Button, FloatingPanel, Input } from '@ui/molecules';
import { DateFilterPanel } from './DateFilterPanel';
import { TypeFilterPanel, TYPE_LABEL } from './TypeFilterPanel';
import { ExerciseSearchFilter } from './ExerciseSearchFilter';

const DATE_LABEL: Record<SessionFilters['dateRange'], string> = {
  all: 'All time',
  '7d': 'Past 7d',
  '30d': 'Past 30d',
};

interface WorkoutFilterBarProps {
  filters: SessionFilters;
  onChange: (f: SessionFilters) => void;
  exerciseOptions: string[];
  view: ViewMode;
}

export function WorkoutFilterBar({ filters, onChange, exerciseOptions, view }: WorkoutFilterBarProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeCount = [
    filters.type !== 'all',
    filters.exercise !== '',
    filters.dateRange !== 'all',
    filters.dateFrom !== '',
  ].filter(Boolean).length;

  const hasActivechips = activeCount > 0 || filters.sessionName !== '' || filters.sort !== 'newest';

  function clearAll() {
    onChange({
      ...filters,
      type: 'all', exercise: '', dateRange: 'all',
      dateFrom: '', dateTo: '', sort: 'newest',
    });
  }

  const filtersBtnOpen = filtersOpen && activeCount === 0;

  return (
    <Column gap={1}>
      <Row gap={1} align="center">
        <Input
          className="min-w-0"
          leading={<Search size={14} className="faint" />}
          trailing={filters.sessionName ? (
            <Button variant="ghost" size="icon-sm" onClick={() => onChange({ ...filters, sessionName: '' })}>
              <X size={12} />
            </Button>
          ) : undefined}
          placeholder="Search sessions…"
          value={filters.sessionName}
          onChange={e => onChange({ ...filters, sessionName: e.target.value })}
        />

        <Chip
          active={filters.sort !== 'newest'}
          onClick={() => onChange({ ...filters, sort: filters.sort === 'newest' ? 'oldest' : 'newest' })}
        >
          {filters.sort === 'newest' ? '↓ Newest' : '↑ Oldest'}
        </Chip>

        <Layered>
          <Button
            variant={activeCount > 0 ? 'primary' : 'secondary'}
            size="sm"
            active={filtersBtnOpen}
            onClick={() => setFiltersOpen(o => !o)}
            leading={<SlidersHorizontal size={14} />}
          >
            Filters
            {activeCount > 0 && <span className="badge">{activeCount}</span>}
          </Button>

          {filtersOpen && (
            <FloatingPanel pin="below-right" z="fixed" className="filter-panel">
              <Column gap={1}>
                <Row gap={1} justify="between" align="center">
                  <Text size="caption">Filters</Text>
                  {activeCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearAll}>Clear all</Button>
                  )}
                </Row>

                <DateFilterPanel filters={filters} onChange={onChange} view={view} />
                <TypeFilterPanel filters={filters} onChange={onChange} />
                <ExerciseSearchFilter filters={filters} onChange={onChange} exerciseOptions={exerciseOptions} />
              </Column>
            </FloatingPanel>
          )}
        </Layered>
      </Row>

      {hasActivechips && (
        <Cluster gap={1}>
          {filters.sessionName && (
            <Chip active trailing={<X size={9} />} onClick={() => onChange({ ...filters, sessionName: '' })}>
              "{filters.sessionName}"
            </Chip>
          )}
          {filters.type !== 'all' && (
            <Chip active trailing={<X size={9} />} onClick={() => onChange({ ...filters, type: 'all' })}>
              {TYPE_LABEL[filters.type]}
            </Chip>
          )}
          {filters.exercise && (
            <Chip active trailing={<X size={9} />} onClick={() => onChange({ ...filters, exercise: '' })}>
              {filters.exercise}
            </Chip>
          )}
          {filters.dateFrom ? (
            <Chip active trailing={<X size={9} />} onClick={() => onChange({ ...filters, dateFrom: '', dateTo: '' })}>
              {filters.dateFrom}{filters.dateTo && filters.dateTo !== filters.dateFrom ? ` – ${filters.dateTo}` : ''}
            </Chip>
          ) : filters.dateRange !== 'all' && (
            <Chip active trailing={<X size={9} />} onClick={() => onChange({ ...filters, dateRange: 'all' })}>
              {DATE_LABEL[filters.dateRange]}
            </Chip>
          )}
          {filters.sort !== 'newest' && (
            <Chip active trailing={<X size={9} />} onClick={() => onChange({ ...filters, sort: 'newest' })}>
              ↑ Oldest
            </Chip>
          )}
        </Cluster>
      )}
    </Column>
  );
}
```

- [ ] **Step 4: Run the full test suite for this directory**

Run: `npx vitest run ui/components/workout/`
Expected: PASS — all of `DateFilterPanel.test.tsx`, `TypeFilterPanel.test.tsx`, `ExerciseSearchFilter.test.tsx`, `WorkoutFilterBar.test.tsx` green.

- [ ] **Step 5: Type-check and lint the whole touched directory**

Run: `npx tsc --noEmit -p . && npx eslint ui/components/workout/`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add ui/components/workout/WorkoutFilterBar.tsx ui/components/workout/WorkoutFilterBar.test.tsx
git commit -m "test(workout): add WorkoutFilterBar integration test after panel split"
```

---

## Self-Review Notes

- **Spec coverage:** Date filter (Task 1), type filter (Task 2), exercise search (Task 3), bar composition + clear-all + chip row (Task 4) — all four roles identified in the audit are covered.
- **Placeholder scan:** none found — every step has runnable code.
- **Type consistency:** `SessionFilters`, `onChange: (f: SessionFilters) => void`, `ViewMode`, `TypeFilter` are used identically across all four tasks, matching `ui/components/log/SessionFilterBar.tsx:1-18`. `TYPE_LABEL` is defined once (Task 2) and imported, not redefined, by Task 4.
