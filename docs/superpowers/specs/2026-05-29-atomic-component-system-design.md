# Atomic Component System — Design Spec
**Date:** 2026-05-29

## Problem

Components throughout the app inline utility classes directly at every call site (`className="primary sm"`, `className="chip active"`). This causes:
- No shared prop contract — variant names are scattered strings
- No enforced state coverage — loading/error/disabled handled inconsistently
- No slot pattern — icon placement varies per file
- 120-variant explosion risk as the app grows

## Solution

A typed, slot-based atomic component system built on top of the existing CSS utility classes. Props map 1:1 to existing class names — no new CSS required. Every component ships with the full state set: default, hover, active, disabled, loading/skeleton, error, success, empty.

---

## Folder Structure

```
ui/
  atoms/        ← typed wrappers for all primitive UI
  layout/       ← typed wrappers for flex/grid layout classes
  screens/      ← renamed from ui/layouts/ (screens are not layout primitives)
  components/   ← domain components, completely unchanged
```

`ui/atoms/index.ts` and `ui/layout/index.ts` barrel-export everything.
Import at call sites: `import { Button, Icon, Row } from '../atoms'`

---

## API Contract — Prop Slots

All components follow the same pattern:
- **`variant`** — maps to a CSS class string
- **`size`** — maps to a size modifier class
- **`leading` / `trailing`** — `ReactNode` slots rendered before/after children
- **State booleans** — `loading`, `disabled`, `success`, `error` — applied as class modifiers or conditional renders
- **`className`** — always accepted for escape-hatch overrides

---

## Atoms

### Button

```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'neutral'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  leading?: ReactNode
  trailing?: ReactNode
  loading?: boolean       // renders <Spinner /> in trailing slot, disables click
  disabled?: boolean
  success?: boolean       // renders check icon in trailing slot
  block?: boolean         // width: 100%
  type?: 'button' | 'submit' | 'reset'
  onClick?: () => void
  className?: string
  children?: ReactNode
}
```

Class mapping: `variant` → `'primary' | 'secondary' | 'ghost' | 'neutral'`; `size` → `'sm' | 'lg' | 'icon'`; `block` → `'block'`; `destructive` variant → `'warning'` class.

States: default · hover (CSS) · active (CSS) · disabled (HTML attribute + opacity) · loading (Spinner in trailing) · success (check in trailing).

---

### Icon

```tsx
interface IconProps {
  name: keyof typeof uiIcons   // from ui/atoms/icons.ts registry
  size?: 'sm' | 'md' | 'lg'   // 16 / 20 / 24px
  'aria-label'?: string
  className?: string
}
```

`ui/atoms/icons.ts` — a new registry of common UI icons (play, pause, check, close, back, add, edit, delete, chevron-down, search, etc.) mapped to specific react-icons/lucide components. Activity-specific icons continue using `ui/icons/activityIcons.ts` directly.

---

### Spinner

```tsx
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'   // 14 / 18 / 24px
  className?: string
}
```

CSS-only animation. Used internally by Button `loading` state and available standalone.

---

### Badge

```tsx
interface BadgeProps {
  variant?: 'ok' | 'warn' | 'bad' | 'accent'
    | 'lift' | 'run' | 'cycle' | 'swim' | 'rowing' | 'mind'
    | 'awake' | 'light' | 'deep' | 'rem' | 'plain'
  dot?: boolean
  active?: boolean    // outline + bold
  children: ReactNode
  className?: string
}
```

Maps to `.pill` + variant class. Replaces all direct `.pill` usage at call sites.

---

### Avatar

```tsx
interface AvatarProps {
  src?: string
  name?: string          // generates initials if src missing/fails
  size?: 'sm' | 'md' | 'lg' | 'xl'   // 28 / 36 / 48 / 80px
  className?: string
}
```

Maps to `.avatar` + size class. Initials fallback: first letter of each word in `name`, max 2.

---

### Chip

```tsx
interface ChipProps {
  active?: boolean
  source?: boolean       // smaller source variant
  leading?: ReactNode
  trailing?: ReactNode
  onClick?: () => void
  className?: string
  children: ReactNode
}
```

Maps to `.chip` + `.active` + `.source`. Used for filter rows, toggle groups.

---

### Input

```tsx
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string         // shows error message + error styling
  leading?: ReactNode    // icon inside input left
  trailing?: ReactNode   // icon inside input right
  loading?: boolean      // shows Spinner in trailing slot
  // disabled from HTMLInputElement
}
```

States: default · focus (CSS) · disabled · error (red border + message) · loading (Spinner trailing).
Renders: `<label>` → wrapper div → `<input>` → hint/error text.

---

### Surface

```tsx
interface SurfaceProps {
  variant?: 'default' | 'plain' | 'flat' | 'accent' | 'ghost' | 'inset' | 'pinned' | 'warning'
  interactive?: boolean   // adds .interactive
  selected?: boolean      // adds .selected
  as?: 'div' | 'section' | 'article' | 'aside'   // default 'div'
  className?: string
  children: ReactNode
}
```

Maps to `.surface` + variant class. `as` prop handles semantic element choice. Replaces raw `<div className="surface ...">` everywhere.

---

## Layout

All layout components accept `className` and forward a `ref`. They render semantic `<div>` by default.

### Row

```tsx
interface RowProps {
  gap?: 'xs' | 'sm' | 'md' | 'lg'         // s-1 / s-2 / s-3 / s-4
  align?: 'start' | 'center' | 'end'      // align-items
  justify?: 'start' | 'center' | 'end' | 'between' | 'around'
  wrap?: boolean                            // flex-wrap
  className?: string
  children: ReactNode
}
```

Maps to `.row` + `.align-center` / `.space-between` / `.compact` etc.

### Column

```tsx
interface ColumnProps {
  gap?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
  children: ReactNode
}
```

Maps to `.column`.

### Cluster

```tsx
interface ClusterProps {
  gap?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
  children: ReactNode
}
```

Maps to `.cluster`.

### Grid

```tsx
interface GridProps {
  variant?: 'auto' | 'widget' | 'columns'   // auto-grid / widget-grid / auto-columns
  className?: string
  children: ReactNode
}
```

### ScrollRow

Wraps `.scroll-row`. No configurable props beyond `className` and `children`.

### Spacer

`<Spacer />` — renders a `<div className="grow" />`. No props. Used to push items to opposite ends in a Row.

---

## Screens Rename

`ui/layouts/` → `ui/screens/`

- All internal imports updated
- `ui/screens/index.ts` barrel-export updated
- No behavioural change, purely semantic rename

---

## Reconstructibility Audit

Existing components audited against the proposed atoms:

| Component | Verdict | Reconstruction |
|-----------|---------|---------------|
| `shared/ScreenHeader.tsx` | ✅ Full | `<Row justify="between" align="center">` + `<Button variant="ghost" size="icon">` + `<Icon>` |
| `shared/EmptyState.tsx` | ✅ Full | `<Surface variant="default">` (centered) + `<Column>` + action slot |
| `shared/ExpandableCard.tsx` | ✅ Full | `<Surface interactive>` + `expanded` prop replaces manual class concat |
| `log/ActivityInlinePicker.tsx` | ✅ Full | `<Column>` + `<Row>` + `<Button>` variants + `<Chip>` |
| `session/BlockCard.tsx` | ⚡ Partial | Row/Column/Button/Chip/Badge atoms apply; complex menu logic stays domain-specific |
| `log/SessionListItem.tsx` | ⚡ Partial | Ghost buttons + Badge/Pill; dropdown stays as-is |
| Screen layouts (home, session, etc.) | ✅ Layout | `<Row>` / `<Column>` / `<Grid>` replace raw layout class divs |

**Icon situation:** The app uses both `react-icons` (activity icons) and `lucide-react` (UI chrome icons — Trash2, X, EllipsisVertical, Map, etc.). The `Icon` atom wraps lucide-react for UI icons. Activity icons stay in `ui/icons/activityIcons.ts` and are passed as ReactNode slots directly.

**Migration strategy:** The 3 shared components (ScreenHeader, EmptyState, ExpandableCard) are rebuilt using atoms in the same files — they become the first real-world molecule examples. Domain components (BlockCard, SessionListItem) are not migrated now; atoms become available for future call-site cleanup.

---

## Verification

1. TypeScript compiles with no errors after rename
2. Each atom renders its correct CSS class in the DOM (inspect element)
3. Button: verify loading spinner appears, success state shows check, disabled prevents click
4. Input: verify error message renders, focus state visible, hint text shows
5. Surface: verify all `variant` values apply the correct class
6. Layout components: verify `.row.align-center.space-between` etc generated correctly
7. Existing screens still render after `layouts/` → `screens/` rename
