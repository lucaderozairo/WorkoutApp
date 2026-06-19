# Row/Column `grow` Prop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give `Row`/`Column` a typed `grow` prop so "this child fills remaining space" reads in JSX instead of being spelled out as a free-text `className="grow"` string, closing the gap identified in the architecture audit (`architecture-review-flutter-vs-atomic-20260618.html`, Candidate 4) without inventing new CSS or a wrapper component.

**Architecture:** This supersedes an earlier draft of this plan that proposed a separate `FlexItem` wrapper component (mirroring `Grid`/`GridItem`) plus a new `basis` prop. Both were dropped after auditing real call sites:

- **No `FlexItem` wrapper.** Unlike CSS Grid, flexbox needs no special per-child marker class — every direct child of a `display:flex` container is automatically a flex item, so `flex-grow` can be set directly on whatever component is already there. A grep of every current flex-grow usage in this codebase (`className="grow"`, 8 call sites) confirmed every single one is applied to a `Row`/`Column` itself, never to some other wrapped element. A wrapper wasn't just unnecessary, it would have added a DOM div nobody needed.
  - **Flutter/Figma note:** this is a deliberate divergence from Flutter, whose idiom (`Expanded(child: ...)`) *is* a wrapper, decoupled from what the child is. It's chosen anyway because (a) every real call site grows the Row/Column itself, not some other child — a wrapper would solve a case that doesn't exist here — and (b) JSX has no structural cost forcing a wrapper widget the way Dart's `Flex` children do, so there's no equivalent pressure toward that shape. It does, however, align with Figma's model, where Hug/Fill/Fixed is a property on the node itself, not a separate sizing layer.
- **No new CSS, no `@property`, no inline-style escape hatch.** `.grow { flex: 1; min-width: 0; min-height: 0; }` already exists in `styling/utilities.css:39` and is exactly what every call site wants. The only gap was that it's reached via free-text `className` instead of a typed prop — the fix is to expose it as `grow?: boolean` on `Row`/`Column`, append the *existing* class when true, and migrate call sites. No CSS file changes at all.
- **No `basis` prop.** Zero real call sites set an explicit `flex-basis` today. The original audit candidate itself called this speculative, conditional on a third/fourth component reaching for a one-off width class — that hasn't happened. Building it now would be premature.

**Tech Stack:** React 19 + TypeScript, Vitest + @testing-library/react for tests, existing `layoutClasses()` helper in `ui/layout/_classes.ts` (the same enum-to-class mapping `gap`/`align`/`justify`/`wrap` already use — no inline styles, no CSS custom properties).

## Global Constraints

- Token-driven values only; **zero inline `style=""`**. This plan introduces no exception to that rule (contrast with `GridItem`/`Grid`, which already use a CSS-custom-property + inline-style escape hatch for genuinely unbounded values like grid-template-areas — that pattern is not reused here because `grow` is a plain boolean, exactly the shape `wrap` already is).
- CSS nesting via `&`, semantic class names, no per-component CSS Modules.
- `ui/layout/` components are pure composition — no business logic, no domain vocabulary (rule 2 in `CLAUDE.md`).
- Test runner: `npm test` (= `vitest run`). Run a single file with `npx vitest run <path> --reporter=verbose`.
- Don't touch unrelated code while migrating call sites — e.g. `LastSessionWidget.tsx` hardcodes `surface flat pad-sm r-sm` classes directly on a `Column` instead of using the `Surface` component; that's a pre-existing smell, out of scope here. Only remove the `grow` (and, where present, the now-redundant `min-w-0`/`min-h-0`) token from each `className` string.

---

### Task 1: Add `grow` prop to `layoutClasses()`, `Row`, and `Column`

**Files:**
- Modify: `ui/layout/_classes.ts`
- Modify: `ui/layout/Row.tsx`
- Modify: `ui/layout/Column.tsx`
- Create: `ui/layout/_classes.test.ts`
- Create: `ui/layout/Row.test.tsx`
- Create: `ui/layout/Column.test.tsx`
- Modify: `ui/layout/Row.stories.tsx` (add a `Grow` story)
- Modify: `ui/layout/Column.stories.tsx` (add a `Grow` story)

**Interfaces:**
- Produces: `layoutClasses(opts)` gains an optional `grow?: boolean` field in its options object; when `true`, the returned class string includes `'grow'`. `Row` and `Column` both gain `grow?: boolean` (default `false`), passed straight through to `layoutClasses()`.
- Consumes: nothing from other tasks — this is the foundation task.

- [ ] **Step 1: Write the failing test for `layoutClasses()`**

Create `ui/layout/_classes.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { layoutClasses } from './_classes';

describe('layoutClasses', () => {
  it('omits the grow class by default', () => {
    expect(layoutClasses({ base: 'row', defaultGap: 3 })).toBe('row');
  });

  it('appends the grow class when grow is true', () => {
    expect(layoutClasses({ base: 'row', defaultGap: 3, grow: true })).toBe('row grow');
  });

  it('omits the grow class when grow is explicitly false', () => {
    expect(layoutClasses({ base: 'row', defaultGap: 3, grow: false })).toBe('row');
  });

  it('combines grow with other modifiers in a stable order', () => {
    expect(
      layoutClasses({ base: 'column', defaultGap: 4, align: 'center', wrap: true, grow: true, className: 'custom' }),
    ).toBe('column align-center wrap grow custom');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run ui/layout/_classes.test.ts --reporter=verbose`
Expected: FAIL — `layoutClasses({ base: 'row', defaultGap: 3, grow: true })` currently returns `'row'` (the `grow` field doesn't exist on the options type and is silently ignored by the object literal, so the assertion `toBe('row grow')` fails).

- [ ] **Step 3: Add `grow` to `layoutClasses()`**

Replace the full contents of `ui/layout/_classes.ts`:

```ts
/** Gap scale: numeric 0–5 maps directly to CSS gap-{n} classes (= --s-{n} tokens). */
export type Gap = 0 | 1 | 2 | 3 | 4 | 5;
export type Align = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
export type Justify = 'start' | 'center' | 'end' | 'between' | 'around';

const ALIGN_CLASS: Record<Align, string> = {
  start:    'align-start',
  center:   'align-center',
  end:      'align-end',
  stretch:  'align-stretch',
  baseline: 'align-baseline',
};

const JUSTIFY_CLASS: Record<Justify, string> = {
  start:   'justify-start',
  center:  'justify-center',
  end:     'justify-end',
  between: 'justify-between',
  around:  'justify-around',
};

export function layoutClasses(opts: {
  base: string;
  gap?: Gap;
  defaultGap: Gap;
  align?: Align;
  justify?: Justify;
  wrap?: boolean;
  grow?: boolean;
  className?: string;
}): string {
  const { base, gap, defaultGap, align, justify, wrap, grow, className } = opts;
  const gapClass = gap !== undefined && gap !== defaultGap ? `gap-${gap}` : '';
  return [
    base,
    gapClass,
    align   ? ALIGN_CLASS[align]   : '',
    justify ? JUSTIFY_CLASS[justify] : '',
    wrap    ? 'wrap'                 : '',
    grow    ? 'grow'                 : '',
    className,
  ].filter(Boolean).join(' ');
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run ui/layout/_classes.test.ts --reporter=verbose`
Expected: PASS — all 4 tests green.

- [ ] **Step 5: Write the failing tests for `Row` and `Column`**

Create `ui/layout/Row.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Row } from './Row';

describe('Row', () => {
  it('does not include the grow class by default', () => {
    render(<Row>Content</Row>);
    expect(screen.getByText('Content')).not.toHaveClass('grow');
  });

  it('includes the grow class when grow is true', () => {
    render(<Row grow>Content</Row>);
    expect(screen.getByText('Content')).toHaveClass('row', 'grow');
  });
});
```

Create `ui/layout/Column.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Column } from './Column';

describe('Column', () => {
  it('does not include the grow class by default', () => {
    render(<Column>Content</Column>);
    expect(screen.getByText('Content')).not.toHaveClass('grow');
  });

  it('includes the grow class when grow is true', () => {
    render(<Column grow>Content</Column>);
    expect(screen.getByText('Content')).toHaveClass('column', 'grow');
  });
});
```

- [ ] **Step 6: Run the tests to verify they fail**

Run: `npx vitest run ui/layout/Row.test.tsx ui/layout/Column.test.tsx --reporter=verbose`
Expected: FAIL — neither `RowProps` nor `ColumnProps` has a `grow` field yet, so `<Row grow>`/`<Column grow>` fail to type-check/render the class.

- [ ] **Step 7: Add `grow` to `Row`**

Replace the full contents of `ui/layout/Row.tsx`:

```tsx
import type { ElementType, KeyboardEventHandler, ReactNode } from 'react';
import { layoutClasses, type Gap, type Align, type Justify } from './_classes';

interface RowProps {
  gap?: Gap;
  align?: Align;
  justify?: Justify;
  wrap?: boolean;
  grow?: boolean;
  as?: ElementType;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
  onKeyDown?: KeyboardEventHandler;
}

export function Row({ gap, align, justify, wrap = false, grow = false, as: Tag = 'div', className, children, onClick, onKeyDown }: RowProps) {
  const classes = layoutClasses({ base: 'row', gap, defaultGap: 3, align, justify, wrap, grow, className });
  return <Tag className={classes} onClick={onClick} onKeyDown={onKeyDown}>{children}</Tag>;
}
```

- [ ] **Step 8: Add `grow` to `Column`**

Replace the full contents of `ui/layout/Column.tsx`:

```tsx
import type { ElementType, ReactNode } from 'react';
import { layoutClasses, type Gap, type Align, type Justify } from './_classes';

interface ColumnProps {
  gap?: Gap;
  align?: Align;
  justify?: Justify;
  grow?: boolean;
  as?: ElementType;
  className?: string;
  'aria-describedby'?: string;
  'aria-labelledby'?: string;
  children: ReactNode;
  onClick?: () => void;
}

export function Column({
  gap,
  align,
  justify,
  grow = false,
  as: Tag = 'div',
  className,
  'aria-describedby': ariaDescribedBy,
  'aria-labelledby': ariaLabelledBy,
  children,
  onClick,
}: ColumnProps) {
  const classes = layoutClasses({ base: 'column', gap, defaultGap: 4, align, justify, grow, className });
  return (
    <Tag
      className={classes}
      aria-describedby={ariaDescribedBy}
      aria-labelledby={ariaLabelledBy}
      onClick={onClick}
    >
      {children}
    </Tag>
  );
}
```

- [ ] **Step 9: Run the tests to verify they pass**

Run: `npx vitest run ui/layout/_classes.test.ts ui/layout/Row.test.tsx ui/layout/Column.test.tsx --reporter=verbose`
Expected: PASS — all tests green.

- [ ] **Step 10: Add stories**

In `ui/layout/Row.stories.tsx`, add this story after `Wrap` (keep the existing `Box` helper and all existing stories unchanged):

```tsx
export const Grow: Story = {
  args: { grow: true, children: [<Box key="a" label="A" />, <Box key="b" label="B" />] },
};
```

In `ui/layout/Column.stories.tsx`, add the equivalent story following whatever pattern the existing stories in that file use for `children` (read the file first to match its helper component before inserting).

- [ ] **Step 11: Run the full test suite to check for regressions**

Run: `npm test`
Expected: PASS — no existing test broken (the new `grow` field is additive and optional everywhere).

- [ ] **Step 12: Commit**

```bash
git add ui/layout/_classes.ts ui/layout/Row.tsx ui/layout/Column.tsx ui/layout/_classes.test.ts ui/layout/Row.test.tsx ui/layout/Column.test.tsx ui/layout/Row.stories.tsx ui/layout/Column.stories.tsx
git commit -m "feat(layout): add typed grow prop to Row/Column"
```

---

### Task 2: Migrate existing `className="grow"` call sites to the typed prop

**Files:**
- Modify: `ui/components/home/HomeWidgetPanel.tsx:78`
- Modify: `ui/components/home/HomeWidgetPanel.tsx:277`
- Modify: `ui/components/widgets/LastSessionWidget.tsx:48`
- Modify: `ui/components/widgets/LastSessionWidget.tsx:52`
- Modify: `ui/components/widgets/LastSessionWidget.tsx:56`
- Modify: `ui/molecules/Modal.tsx:47`
- Modify: `ui/molecules/Drawer.tsx:50`
- Modify: `ui/molecules/Dialog.tsx:21`

**Interfaces:**
- Consumes: `Row`/`Column`'s new `grow?: boolean` prop from Task 1.
- Produces: nothing — this is the final task. (`ui/layout/Spacer.tsx:2`, `return <div className="grow" />;`, is **not** touched: it's a plain `div`, not a `Row`/`Column`, so the new prop doesn't apply there.)

- [ ] **Step 1: Migrate `HomeWidgetPanel.tsx` line 78**

Before:

```tsx
        <Column gap={1} className="grow min-w-0">
```

After (drop `min-w-0` too — `.grow` already sets `min-width: 0`, so it was redundant even before this change):

```tsx
        <Column gap={1} grow>
```

- [ ] **Step 2: Migrate `HomeWidgetPanel.tsx` line 277**

Before:

```tsx
        <Column gap={0} className="grow min-w-0">
```

After:

```tsx
        <Column gap={0} grow>
```

- [ ] **Step 3: Migrate `LastSessionWidget.tsx` lines 48, 52, 56**

Before (all three identical):

```tsx
                <Column gap={0} className="surface flat pad-sm r-sm grow">
```

After (strip only the `grow` token from the className; leave the rest of the smell alone, per the global constraint above):

```tsx
                <Column gap={0} className="surface flat pad-sm r-sm" grow>
```

- [ ] **Step 4: Migrate `Modal.tsx` line 47**

Before:

```tsx
      {footer && <Row className='grow' justify='between'>{footer}</Row>}
```

After (no other classes were present, so `className` is dropped entirely):

```tsx
      {footer && <Row grow justify='between'>{footer}</Row>}
```

- [ ] **Step 5: Migrate `Drawer.tsx` line 50**

Before:

```tsx
        <Column gap={3} className="grow min-h-0 scroll-y">
```

After (drop `min-h-0` too — `.grow` already sets `min-height: 0`):

```tsx
        <Column gap={3} grow className="scroll-y">
```

- [ ] **Step 6: Migrate `Dialog.tsx` line 21**

Before:

```tsx
        <Row className='grow' justify="between">
```

After:

```tsx
        <Row grow justify="between">
```

- [ ] **Step 7: Run the full test suite**

Run: `npm test`
Expected: PASS — no test asserts on the literal `className` string at any of these 6 call sites (confirm by re-running the suite, not by inspection alone).

- [ ] **Step 8: Visually spot-check in Storybook**

Run: `npm run storybook`
Open the stories for whichever components wrap these usages (e.g. search for `LastSessionWidget`, `Drawer`, `Dialog`, `Modal` in the sidebar) and confirm layout is pixel-identical to before the migration — `grow` now produces the exact same `flex: 1; min-width: 0; min-height: 0;` rule as the className it replaced.

- [ ] **Step 9: Commit**

```bash
git add ui/components/home/HomeWidgetPanel.tsx ui/components/widgets/LastSessionWidget.tsx ui/molecules/Modal.tsx ui/molecules/Drawer.tsx ui/molecules/Dialog.tsx
git commit -m "refactor(ui): migrate className=\"grow\" call sites to Row/Column grow prop"
```

---

## Self-Review Notes

- **Spec coverage:** The audit's Candidate 4 ask ("sizing intent should read in JSX the same way it reads in a Figma layer panel") is satisfied — `grow` is now a typed prop, not a string the reader has to recognize as meaningful. `basis` is deliberately not built (zero real demand; audit itself flagged it as speculative). The follow-up extension's recommendation (don't touch padding/Surface, keep `grow`/`basis` scoped to sizing-arrangement concerns on Row/Column) is honored.
- **Design pivot from the original draft, and Flutter/Figma alignment:** the original version of this plan proposed a `FlexItem` wrapper component mirroring `Grid`/`GridItem` (and, behind that, Flutter's `Expanded(child: ...)` idiom). That was dropped after a call-site audit showed 100% of real `flex-grow` usages apply to the `Row`/`Column` itself, never a separate child, making a wrapper both unnecessary and DOM-bloating. The chosen shape — a boolean prop directly on the node — diverges from Flutter (which always wraps) but aligns with Figma, where Hug/Fill/Fixed lives on the node's own properties panel, not a separate sizing layer. It also avoids relying on, or further normalizing, the CSS-custom-property + inline-style escape hatch `GridItem` already uses for genuinely unbounded values — `grow` is a plain boolean, exactly the shape `wrap` already has via `layoutClasses()`.
- **No placeholders:** every step has literal before/after code, not descriptions.
- **Type consistency:** `grow?: boolean` is defined identically in `layoutClasses()`'s options type (Task 1, Step 3), `RowProps` (Step 7), and `ColumnProps` (Step 8); the tests in Steps 1 and 5 exercise exactly those signatures.
- **YAGNI:** no `FlexItem`, no `basis`, no `shrink`, no numeric grow weights — only the one thing 8 existing call sites already needed.
