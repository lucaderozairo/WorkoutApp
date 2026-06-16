# Plan: Widget Personalization — Add/Remove + Goal Defaults
**Date:** 2026-06-10
**Phase:** 3B
**Priority:** P2
**Status:** Ready to implement (after Phase 3A)

## Problem

`useWidgetGrid.ts` already supports add/remove and drag-reorder. But:

1. There is no UI affordance to **set a goal profile** that resets defaults — users start with the same layout regardless of whether they train for strength, endurance, or weight loss.
2. Add/remove works but the `WidgetAddPanel` shows all widgets with equal weight. No guidance on what to add.
3. Full drag-resize grid is deferred (complex). The immediate gap is smarter defaults, not drag-resize.

This plan adds goal-based default layouts and a minimal goal picker. It does **not** add the full `TrainingFocus` domain from Phase 12A — that is a broader preference stored in the user profile with coaching and navigation effects. This plan is UI-only: goal affects default widget order, nothing else.

## Goal

- 5 goal presets: `strength | endurance | weight-loss | general | recovery`
- Each preset maps to a `WidgetInstance[]` default layout
- A goal picker in home (compact — single-select chip row)
- Selecting a goal: if layout is the unmodified default, apply new preset silently; if user has customized, ask before resetting
- Preference stored in `localStorage` key `widget-goal-v1`
- No server, no event store — this is a local UI preference only

## Scope

- `ui/components/widgets/useWidgetGrid.ts` — add goal preset logic
- `ui/components/widgets/widgetGoalPresets.ts` — new file with preset layouts
- `ui/screens/home/HomeScreen.tsx` — add goal picker row
- New: `ui/components/widgets/GoalPicker.tsx` — chip row with 5 options

Out of scope: `TrainingFocus` stored in user profile (Phase 12A), coaching priority based on goal (Phase 5C), navigation emphasis changes (Phase 12A), backend sync of preference.

---

## Implementation

### Step 1 — `widgetGoalPresets.ts`

File: `ui/components/widgets/widgetGoalPresets.ts`

```ts
import type { WidgetInstance } from './widgetTypes';

export type WidgetGoal = 'strength' | 'endurance' | 'weight-loss' | 'general' | 'recovery';

export const GOAL_PRESETS: Record<WidgetGoal, WidgetInstance[]> = {
  general: [
    { id: 'readiness',     instanceId: 'readiness',     size: 'sm'   },
    { id: 'sleep',         instanceId: 'sleep',         size: 'md'   },
    { id: 'next-workout',  instanceId: 'next-workout',  size: 'wide' },
    { id: 'last-session',  instanceId: 'last-session',  size: 'wide' },
    { id: 'weekly-volume', instanceId: 'weekly-volume', size: 'wide' },
    { id: 'insights',      instanceId: 'insights',      size: 'wide' },
  ],
  strength: [
    { id: 'readiness',     instanceId: 'readiness',     size: 'sm'   },
    { id: 'next-workout',  instanceId: 'next-workout',  size: 'wide' },
    { id: 'last-session',  instanceId: 'last-session',  size: 'wide' },
    { id: 'weekly-volume', instanceId: 'weekly-volume', size: 'wide' },
    { id: 'sleep',         instanceId: 'sleep',         size: 'md'   },
    { id: 'insights',      instanceId: 'insights',      size: 'wide' },
  ],
  endurance: [
    { id: 'readiness',      instanceId: 'readiness',      size: 'sm'   },
    { id: 'sleep',          instanceId: 'sleep',          size: 'md'   },
    { id: 'next-workout',   instanceId: 'next-workout',   size: 'wide' },
    { id: 'monthly-dist',   instanceId: 'monthly-dist',   size: 'wide' },
    { id: 'weekly-volume',  instanceId: 'weekly-volume',  size: 'wide' },
    { id: 'insights',       instanceId: 'insights',       size: 'wide' },
  ],
  'weight-loss': [
    { id: 'readiness',     instanceId: 'readiness',     size: 'sm'   },
    { id: 'calories',      instanceId: 'calories',      size: 'sm'   },
    { id: 'macros',        instanceId: 'macros',        size: 'wide' },
    { id: 'sleep',         instanceId: 'sleep',         size: 'md'   },
    { id: 'weekly-volume', instanceId: 'weekly-volume', size: 'wide' },
    { id: 'insights',      instanceId: 'insights',      size: 'wide' },
  ],
  recovery: [
    { id: 'readiness',   instanceId: 'readiness',   size: 'sm'   },
    { id: 'sleep',       instanceId: 'sleep',        size: 'md'   },
    { id: 'hrv',         instanceId: 'hrv',          size: 'sm'   },
    { id: 'resting-hr',  instanceId: 'resting-hr',  size: 'sm'   },
    { id: 'insights',    instanceId: 'insights',     size: 'wide' },
  ],
};

export const GOAL_LABELS: Record<WidgetGoal, string> = {
  general:      'General',
  strength:     'Strength',
  endurance:    'Endurance',
  'weight-loss':'Weight loss',
  recovery:     'Recovery',
};

const GOAL_STORAGE_KEY = 'widget-goal-v1';

export function loadGoal(): WidgetGoal {
  try {
    const raw = localStorage.getItem(GOAL_STORAGE_KEY);
    if (raw && raw in GOAL_PRESETS) return raw as WidgetGoal;
  } catch {}
  return 'general';
}

export function saveGoal(goal: WidgetGoal): void {
  try {
    localStorage.setItem(GOAL_STORAGE_KEY, goal);
  } catch {}
}
```

### Step 2 — Update `useWidgetGrid.ts`

Add goal-preset support:

```ts
import { loadGoal, saveGoal, GOAL_PRESETS, type WidgetGoal } from './widgetGoalPresets';

const STORAGE_KEY = 'widget-grid-v2'; // already bumped in Phase 3A

function isUnmodifiedDefault(layout: WidgetInstance[], goal: WidgetGoal): boolean {
  const preset = GOAL_PRESETS[goal];
  if (layout.length !== preset.length) return false;
  return layout.every((w, i) => w.id === preset[i].id && w.size === preset[i].size);
}
```

Add to `useWidgetGrid` hook:
```ts
const [goal, setGoalRaw] = useState<WidgetGoal>(loadGoal);

function applyGoal(newGoal: WidgetGoal, force = false): boolean {
  const current = widgets;
  const currentGoal = goal;
  const isDefault = isUnmodifiedDefault(current, currentGoal);
  if (!isDefault && !force) {
    // caller must confirm; return false to signal "needs confirmation"
    return false;
  }
  const preset = GOAL_PRESETS[newGoal];
  setWidgets(() => preset.map(w => ({ ...w })));
  setGoalRaw(newGoal);
  saveGoal(newGoal);
  return true;
}
```

Return `goal` and `applyGoal` from the hook.

**"Needs confirmation" flow:** `applyGoal` returning `false` means the caller must show a confirm dialog. The dialog is in `GoalPicker` — `useWidgetGrid` stays dumb.

### Step 3 — `GoalPicker.tsx`

File: `ui/components/widgets/GoalPicker.tsx`

```tsx
import { GOAL_LABELS, type WidgetGoal } from './widgetGoalPresets';

interface GoalPickerProps {
  currentGoal: WidgetGoal;
  onSelect: (goal: WidgetGoal, force?: boolean) => boolean;
}
```

Renders a horizontal chip row. On click:
1. Call `onSelect(goal)`.
2. If returns `false` — show a browser `confirm()` (or a `Surface` inline notice) asking "Reset your widget layout to the [Goal] default? Your current layout will be replaced." If confirmed, call `onSelect(goal, true)`.

Chip styling: use existing `Badge` or `Surface pill` atom. Active chip uses `data-active` attribute with nested CSS `&[data-active="true"]` style. No inline `style=`.

### Step 4 — Wire into `HomeScreen.tsx`

Import `GoalPicker` and `useWidgetGrid`'s `goal`/`applyGoal`. Add `GoalPicker` between the "Widgets" header row and `WidgetGrid`:

```tsx
<Row align="center" justify="between">
  <Text>Widgets</Text>
</Row>
<GoalPicker currentGoal={goal} onSelect={applyGoal} />
<WidgetGrid />
```

`useWidgetGrid` is currently called inside `WidgetGrid` — to pass `goal`/`applyGoal` up to `HomeScreen`, either:
- Lift `useWidgetGrid` into `HomeScreen` and thread props down to `WidgetGrid`, or
- Extract a shared context

Prefer lifting into `HomeScreen` (simpler, no context needed at this scale). Pass `widgets`, all handlers, and `goal`/`applyGoal` to `WidgetGrid` as props.

**`WidgetGrid` signature change:**
```ts
interface WidgetGridProps {
  widgets: WidgetInstance[];
  // ... all existing handler props
}
```

This is the only structural change to `WidgetGrid` — it stops calling `useWidgetGrid` internally.

---

## Acceptance Criteria

- `npx tsc --noEmit` → 0 errors
- `npx vitest run` → same pass count
- `npm run lint` → no new errors
- Goal picker renders below "Widgets" header with 5 chips
- Active chip is visually distinguished
- Selecting a goal with unmodified layout silently applies preset
- Selecting a goal with modified layout shows confirmation; cancel = no change; confirm = layout resets
- Goal preference survives page reload (`widget-goal-v1` in localStorage)
- `GOAL_PRESETS.general` matches the `DEFAULT_LAYOUT` from Phase 3A
- `endurance` preset includes `monthly-dist`; `weight-loss` includes `calories` + `macros`; `recovery` includes `hrv` + `resting-hr`
- No inline `style=` in `GoalPicker`
- No drag-resize added in this plan

## Definition of Done

All acceptance criteria pass. Users can pick a goal and get a relevant default widget layout on first use or after a reset.
