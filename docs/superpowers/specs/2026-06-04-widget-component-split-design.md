# Widget Component Split — Design Spec

**Date:** 2026-06-04
**Status:** Approved

## Goal

Break the monolithic `DashWidgets.tsx` into one file per widget. Wire the existing `Toast` and `Modal` molecules into `HomeScreen` to replace the custom inline implementations added during the polish pass.

---

## 1. Component Split

`ui/components/widgets/DashWidgets.tsx` is deleted and replaced with 15 focused files:

### Shared primitives

**`ui/components/widgets/widgetPrimitives.tsx`**
Exports: `MiniBar`, `MiniRing`, `scoreBadge`

All three are currently private to `DashWidgets.tsx`. `MiniBar` and `MiniRing` are Recharts-based micro-chart primitives used by multiple widgets. `scoreBadge` is a pure utility that maps a numeric score to `{ label, cls }`. Moving them here avoids duplication across widget files.

### Individual widget files (all in `ui/components/widgets/`)

| File | Exports | Shared deps from widgetPrimitives |
|---|---|---|
| `ReadinessWidget.tsx` | `ReadinessWidget` | MiniBar, MiniRing, scoreBadge |
| `ActivityFeedWidget.tsx` | `ActivityFeedWidget` | — |
| `ActiveGoalsWidget.tsx` | `ActiveGoalsWidget` | MiniBar |
| `InsightsWidget.tsx` | `InsightsWidget` | — |
| `WeeklyVolumeWidget.tsx` | `WeeklyVolumeWidget` | — |
| `SleepBreakdownWidget.tsx` | `SleepBreakdownWidget` | — |
| `HRVWidget.tsx` | `HRVWidget` | — |
| `RestingHRWidget.tsx` | `RestingHRWidget` | — |
| `BodyBatteryWidget.tsx` | `BodyBatteryWidget` | MiniRing, scoreBadge |
| `PlanAdherenceWidget.tsx` | `PlanAdherenceWidget` | MiniRing, scoreBadge |
| `MacrosWidget.tsx` | `MacrosWidget` | — |
| `CaloriesWidget.tsx` | `CaloriesWidget` | MiniBar |
| `HabitsWidget.tsx` | `HabitsWidget` | — |
| `MonthlyDistanceWidget.tsx` | `MonthlyDistanceWidget` | — |

Each file carries only the mock data its own widget uses (extracted from the central `MOCK` object in `DashWidgets.tsx`). No widget file imports from another widget file. The `Flame` icon import in affected files uses `phosphor-react` (already the project standard after the polish pass).

---

## 2. Toast Integration

### Replace custom inline toast with `useToast()` + `Toaster`

`ui/molecules/Toast.tsx` exports `Toaster` (provider) and `useToast()` (hook). The hook returns `{ success, error, info, warn }` — each takes a `message: string` and an optional `{ duration }`.

**HomeScreen changes:**
- Remove: `toast` state, `UnlockedToast` interface, `Trophy`/`X` phosphor imports, `<div className="toast">` block, `RARITY_EMOJI` map
- Add: `const toast = useToast()` call; in the `AchievementUnlocked` handler, call `toast.info(\`Achievement unlocked: ${def.name}\`)` — the description is secondary and does not need to appear in a transient notification
- The `ACHIEVEMENT_DEFINITIONS` lookup stays to resolve the display name from the payload ID

**App.tsx change:**
Wrap the `App` return with `<Toaster>`. `Toaster` is not yet present anywhere in the app tree. It must sit above every component that calls `useToast()`, so wrapping the entire `App` JSX is the correct placement:

```tsx
return (
  <Toaster>
    <ErrorBoundaryRoot>
      ...
    </ErrorBoundaryRoot>
  </Toaster>
);
```

### CSS fix for `.toast` and `.toast-stack`

The polish pass wrote a `.toast` class in `feedback.css` with `position: fixed` and `inset-inline`. This conflicts with `Toaster`'s own use of `className="toast"` on each individual toast item (which should not be fixed-positioned).

Replace with two targeted rules:

```css
/* Container — positions the stack in the viewport */
.toast-stack {
  position: fixed;
  bottom: calc(var(--nav-height) + var(--s-3));
  inset-inline: var(--s-4);
  max-width: var(--modal-md);
  margin-inline: auto;
  z-index: var(--z-fixed);
}

/* Item — mount animation only; positioning is handled by .toast-stack */
.toast {
  @starting-style { opacity: 0; transform: translateY(6px); }
  opacity: 1;
  transform: translateY(0);
  transition:
    opacity var(--duration-medium) var(--ease),
    transform var(--duration-medium) var(--ease),
    display var(--duration-medium) allow-discrete;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
}
```

`@starting-style` (Baseline 2024) replaces the `@keyframes toast-in` approach. The `allow-discrete` on `display` enables smooth exit when the toast is dismissed. The `@keyframes toast-in` block added in the polish pass is removed.

---

## 3. Edit Widgets Panel — Modal Molecule

### Replace `<dialog ref={editRef}>` with `<Modal>`

`ui/molecules/Modal.tsx` accepts `open`, `onClose`, `title`, `size`, `children`, `footer`. It uses the Popover API internally (top-layer, native light-dismiss, Esc closes).

**HomeScreen changes:**
- Remove: `editRef` useRef, `showModal()` calls, the `<dialog className="modal-dialog">` element
- Add: `editOpen` boolean state; `<Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit widgets" size="md" footer={<Button variant="ghost" onClick={() => setEditOpen(false)}>Done</Button>}>` wrapping the checkbox list; the "Edit widgets" button calls `setEditOpen(true)`
- `Modal` handles close via Popover light-dismiss (Esc + backdrop click) and the "Done" footer button. No explicit header close button is needed.
- The `X` phosphor import in HomeScreen is removed entirely once both the toast and the dialog are replaced (neither needs it).

**CSS cleanup:**
Remove `.modal-dialog` from `overlays.css` — it was added in the polish pass specifically for the native `<dialog>` element. `Modal` uses the Popover API with the existing `.modal` class, so `.modal-dialog` becomes dead CSS.

---

## 4. Files Changed

| Action | File |
|---|---|
| **Delete** | `ui/components/widgets/DashWidgets.tsx` |
| **Create × 15** | `ui/components/widgets/widgetPrimitives.tsx` + 14 widget files (see §1) |
| **Update** | `ui/screens/home/HomeScreen.tsx` — imports, toast, edit panel |
| **Update** | `app/registry/App.tsx` — add `<Toaster>` wrapper |
| **Update** | `styling/feedback.css` — replace `.toast` with `.toast-stack` + `@starting-style`-based `.toast` |
| **Update** | `styling/overlays.css` — remove `.modal-dialog` |

---

## 5. Out of Scope

- Wiring widgets to real data sources (mock data stays in each widget file)
- Moving widgets to domain folders (`health/`, `log/`, etc.) — deferred until real data is connected
- Changes to other screens
