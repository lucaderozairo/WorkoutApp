# Section Component Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a `Section` pattern component (eyebrow label + optional ghost action button + children slot) and migrate existing ad-hoc header rows to use it.

**Architecture:** `Section` lives at `ui/patterns/common/Section.tsx` — patterns layer, composes layout + primitives only. No Surface wrapping: callers decide. Existing raw `span.eyebrow` + `btn ghost` header rows in HomeScreen and HomeSections are replaced with `Section`.

**Tech Stack:** React, TypeScript, Vitest + @testing-library/react

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `ui/patterns/common/Section.tsx` | Section component |
| Create | `ui/patterns/common/Section.test.tsx` | Unit tests |
| Modify | `ui/patterns/index.ts` | Export Section |
| Modify | `ui/screens/home/HomeScreen.tsx` | Replace "Widgets" header row |
| Modify | `ui/screens/home/HomeSections.tsx` | Replace UpcomingContent + ThisWeekContent eyebrow headers |

---

### Task 1: Section component (TDD)

**Files:**
- Create: `ui/patterns/common/Section.test.tsx`
- Create: `ui/patterns/common/Section.tsx`

- [ ] **Step 1: Write the failing test**

Create `ui/patterns/common/Section.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Section } from './Section';

describe('Section', () => {
  it('renders the eyebrow label', () => {
    render(<Section label="Last Sessions">content</Section>);
    expect(screen.getByText('Last Sessions')).toBeInTheDocument();
  });

  it('renders children', () => {
    render(<Section label="Last Sessions"><p>child content</p></Section>);
    expect(screen.getByText('child content')).toBeInTheDocument();
  });

  it('renders action button when action prop is provided', () => {
    const onClick = vi.fn();
    render(
      <Section label="Last Sessions" action={{ label: 'See all', onClick }}>
        content
      </Section>,
    );
    expect(screen.getByRole('button', { name: 'See all' })).toBeInTheDocument();
  });

  it('does not render action button when action prop is omitted', () => {
    render(<Section label="Last Sessions">content</Section>);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('calls action.onClick when action button is clicked', async () => {
    const onClick = vi.fn();
    render(
      <Section label="Last Sessions" action={{ label: 'See all', onClick }}>
        content
      </Section>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'See all' }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run test — confirm it fails**

```bash
npx vitest run ui/patterns/common/Section.test.tsx
```

Expected: FAIL — `Cannot find module './Section'`

- [ ] **Step 3: Write the component**

Create `ui/patterns/common/Section.tsx`:

```tsx
import type { ReactNode } from 'react';
import { Column, Row } from '@ui/layout';
import { Text } from '@ui/atoms';
import { Button } from '@ui/molecules';

interface SectionAction {
  label: string;
  onClick: () => void;
}

interface SectionProps {
  label: string;
  action?: SectionAction;
  gap?: number;
  children: ReactNode;
}

export function Section({ label, action, gap = 3, children }: SectionProps) {
  return (
    <Column gap={gap}>
      <Row justify="between" align="center">
        <Text size="eyebrow">{label}</Text>
        {action && (
          <Button variant="ghost" size="sm" onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </Row>
      {children}
    </Column>
  );
}
```

- [ ] **Step 4: Run test — confirm it passes**

```bash
npx vitest run ui/patterns/common/Section.test.tsx
```

Expected: PASS — 5 tests

- [ ] **Step 5: Commit**

```bash
git add ui/patterns/common/Section.tsx ui/patterns/common/Section.test.tsx
git commit -m "feat(patterns): add Section component — eyebrow label + optional ghost action + children slot"
```

---

### Task 2: Export from patterns index

**Files:**
- Modify: `ui/patterns/index.ts`

- [ ] **Step 1: Add export**

In `ui/patterns/index.ts`, add one line after the existing exports. File after edit:

```ts
export { StatTile } from './common/StatTile';
export { SearchBar } from './common/SearchBar';
export { EmptyState } from './common/EmptyState';
export { Empty } from '@ui/molecules/Empty';
export { LoadingState } from './common/LoadingState';
export { SplitTabs } from './common/SplitTabs';
export type { SplitTabsPanel } from './common/SplitTabs';
export { Section } from './common/Section';
```

- [ ] **Step 2: Verify build compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add ui/patterns/index.ts
git commit -m "chore(patterns): export Section from patterns index"
```

---

### Task 3: Migrate HomeScreen "Widgets" header

**Files:**
- Modify: `ui/screens/home/HomeScreen.tsx`

Current code at line ~63 in `HomeScreen.tsx`:

```tsx
<Row align="center" justify="between">
  <span className="eyebrow">Widgets</span>
</Row>

<WidgetGrid
  widgets={widgets}
  ...
/>
```

- [ ] **Step 1: Replace with Section**

Update the import line — add `Section` to the `@ui/patterns` import:

```tsx
import { SplitTabs, Section } from '@ui/patterns';
```

Replace the `<Row>` header + `<WidgetGrid>` block with a `<Section>` wrapper:

```tsx
<Section
  label="Widgets"
  action={{ label: 'Edit', onClick: () => setAddPanelOpen(true) }}
>
  <WidgetGrid
    widgets={widgets}
    contextMenu={contextMenu}
    setContextMenu={setContextMenu}
    addPanelOpen={addPanelOpen}
    setAddPanelOpen={setAddPanelOpen}
    activeIds={activeIds}
    setSize={setSize}
    removeWidget={removeWidget}
    addWidget={addWidget}
    handleDragStart={handleDragStart}
    handleDrop={handleDrop}
    openContextMenu={openContextMenu}
    startLongPress={startLongPress}
    cancelLongPress={cancelLongPress}
  />
</Section>
```

- [ ] **Step 2: Run full test suite**

```bash
npm test
```

Expected: all tests pass

- [ ] **Step 3: Commit**

```bash
git add ui/screens/home/HomeScreen.tsx
git commit -m "refactor(home): replace ad-hoc widgets header row with Section component"
```

---

### Task 4: Migrate HomeSections headers

**Files:**
- Modify: `ui/screens/home/HomeSections.tsx`

`HomeSections.tsx` has two components with raw eyebrow headers: `UpcomingContent` and `ThisWeekContent`.

**UpcomingContent** — current structure (lines 28–35):

```tsx
<Column gap={2}>
  <Row align="center" justify="between">
    <span className="eyebrow">Upcoming</span>
    <button className="btn ghost sm" onClick={() => navigate('/sessions/new')}>
      + New
    </button>
  </Row>
  {/* rest of content */}
</Column>
```

**ThisWeekContent** — current structure (lines 85–88):

```tsx
<Column gap={2}>
  <span className="eyebrow">This Week</span>
  {/* rest of content */}
</Column>
```

- [ ] **Step 1: Add Section import**

At the top of `ui/screens/home/HomeSections.tsx`, add:

```tsx
import { Section } from '@ui/patterns';
```

- [ ] **Step 2: Replace UpcomingContent inner header**

Replace the outer `<Column gap={2}>` + `<Row>` header block with `<Section>`:

```tsx
export function UpcomingContent({ appointments }: UpcomingContentProps) {
  const navigate = useNavigate();

  return (
    <Section label="Upcoming" action={{ label: '+ New', onClick: () => navigate('/sessions/new') }} gap={2}>
      {appointments.length === 0 ? (
        <Column gap={1}>
          <Text size="detail" color="muted">No sessions planned</Text>
          <Text size="caption" color="muted">Add one to see it here</Text>
        </Column>
      ) : (
        <Column gap={2}>
          {appointments.map(a => {
            const timeStr = new Date(a.scheduledAt).toLocaleTimeString(undefined, {
              hour: '2-digit', minute: '2-digit',
            });
            const dayLabel = appointmentDayLabel(a.scheduledAt);
            return (
              <Row key={a.id} align="center" gap={2} className="upcoming-row">
                <span className="upcoming-icon">
                  <Barbell size={14} weight="fill" />
                </span>
                <Column gap={0} className="min-w-0">
                  <Text size="detail">{a.title}</Text>
                  <Text size="caption" color="muted">{dayLabel}</Text>
                </Column>
                <span className="mono upcoming-time">{timeStr}</span>
              </Row>
            );
          })}
        </Column>
      )}
    </Section>
  );
}
```

- [ ] **Step 3: Replace ThisWeekContent inner header**

```tsx
export function ThisWeekContent({ weekDays, workoutsThisWeek, streak }: ThisWeekContentProps) {
  const sessionsLabel = workoutsThisWeek === 1 ? '1 session' : `${workoutsThisWeek} sessions`;

  return (
    <Section label="This Week" gap={2}>
      <Row align="center" justify="between" gap={1} className="week-dots">
        {weekDays.map((d, i) => (
          <Column key={i} align="center" gap={1}>
            <span
              className="week-dot"
              data-done={d.done || undefined}
              data-today={d.isToday || undefined}
              data-future={d.isFuture || undefined}
              aria-label={`${d.label}${d.done ? ' completed' : ''}`}
            />
            <Text size="caption" color="muted">{d.label}</Text>
          </Column>
        ))}
      </Row>
      <Text size="caption" color="muted">
        {workoutsThisWeek === 0 ? 'No sessions yet this week' : `${sessionsLabel} completed`}
        {streak >= 2 ? ` · ${streak} day streak` : ''}
      </Text>
    </Section>
  );
}
```

- [ ] **Step 4: Run full test suite**

```bash
npm test
```

Expected: all tests pass

- [ ] **Step 5: Commit**

```bash
git add ui/screens/home/HomeSections.tsx
git commit -m "refactor(home): replace ad-hoc eyebrow headers in HomeSections with Section component"
```

---

## Verification

1. Run `npm run dev` — open HomeScreen, confirm "Widgets" shows eyebrow label + "Edit" button
2. Open SplitTabs "Upcoming" tab — confirm eyebrow label + "+ New" button render correctly
3. Open SplitTabs "This Week" tab — confirm eyebrow label renders, no action button
4. Click "Edit" on Widgets section — confirm `setAddPanelOpen(true)` fires (add panel opens)
5. Click "+ New" in Upcoming — confirm navigates to `/sessions/new`
6. Run `npm test` — all tests green
7. Run `npx tsc --noEmit` — no type errors
