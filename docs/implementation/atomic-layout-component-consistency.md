# Atomic Layout-Component Consistency

## Context
The project has an atomic design system (`ui/atoms`, `ui/molecules`, `ui/layout`) with layout primitives `Row`, `Column`, `Cluster`, `ScrollRow`, `Spacer`, `Grid`. But large parts of the codebase still hand-roll raw layout `<div className="row">` / `<div className="column">` / `<div className="cluster">` instead of using those components — even inside molecules (which should be exemplary). This violates the **atomic-components-first** convention (see memory `feedback_css_conventions` §0).

**Scope counted** (`className="row|column|cluster|scroll-row …"`):
- `ui/molecules`: **14** occurrences / 7 files
- `ui/components`: **409** occurrences / 57 files (the bulk)
- `ui/screens`: **14** occurrences / 5 files (mostly already migrated)

Goal: every raw layout div becomes the corresponding layout component, with **zero visual change** — a pure structural/semantic swap. This makes the atomic system real, centralizes layout behavior, and lets future changes (gap scale, container queries) happen in one place.

## ⚠️ Phase 0 (PREREQUISITE) — Reconcile layout component APIs with the CSS
`ui/layout/Row.tsx` (and by symmetry `Column`/`Cluster`) emit class names that **do not exist in the stylesheet**, so several documented props are silently inert today:

| Prop value | Class emitted | Exists in CSS? |
|---|---|---|
| `gap="md"` / `gap="lg"` | `gap-md` / `gap-lg` | ❌ no |
| `align="start/end/stretch/baseline"` | `align-start` … | ❌ no |
| `justify="center/end/around"` | `justify-center` / `justify-end` / `justify-around` | ❌ no (CSS has `.center`, `.space-around`) |
| `wrap` | `wrap` | ❌ no (CSS has `.cluster` for wrapping) |
| `gap="xs"` | `compact` | ✅ |
| `gap="sm"` (default) | `` (base) | ✅ |
| `align="center"` | `align-center` | ✅ |
| `justify="between"` | `space-between` | ✅ |

Also seen: `Switch.tsx` uses `gap-sm` (❌ inert).

**Action:** make the component output and the CSS agree. Preferred direction — **add the missing flex utilities to `layout.css`** so the component APIs work as designed:
- `.row.gap-md, .column.gap-md { gap: var(--s-4); }` and `.gap-lg { gap: var(--s-5); }` (pick token values to match intent)
- `.align-start { align-items: flex-start; } .align-end { … flex-end; } .align-stretch { … stretch; } .align-baseline { … baseline; }`
- `.justify-center { justify-content: center; } .justify-end { … flex-end; } .justify-around { … space-around; }`
- `.row.wrap { flex-wrap: wrap; }`
- `.row.gap-sm` (or fix `Switch` to a real class)

Reconcile duplicates: CSS already has `.center` (justify center) and `.space-around` — either alias them or update the component maps to emit `center`/`space-around`. Decide one canonical name per axis and make the component + CSS match. Do this FIRST so conversions in later phases land on a working API.

## Mapping reference (raw class combo → component)
| Raw | Component |
|---|---|
| `column` | `<Column>` (default gap = sm = 16px) |
| `column compact` | `<Column gap="xs">` |
| `column gap-0` | `<Column gap="none">` |
| `row` | `<Row>` (default gap = sm = 12px) |
| `row compact` | `<Row gap="xs">` |
| `row space-between align-center` | `<Row justify="between" align="center">` |
| `row compact wrap` | `<Row gap="xs" wrap>` |
| `cluster` | `<Cluster>` |
| `scroll-row` | `<ScrollRow>` |
| `grow` (spacer div) | `<Spacer>` |
| extra non-layout classes (`surface`, `screen-header`, `photo-thumb`, `q-row` …) | pass through via `className` |
| semantic element (`<section>/<ul>` etc.) | `as` prop where supported (Column supports `as`; extend Row/Cluster if needed) |
| `onClick` on a row/column | `Row` already supports `onClick`; add to `Column`/`Cluster` if required |

## Phasing (commit per phase/area; verify visual parity each)
- **Phase 0** — API/CSS reconciliation above. Commit.
- **Phase 1 — molecules (7 files, 14 occ):** `WidgetCard`, `Timeline`, `StatDisplay`, `ScreenHeader`, `PhotoGallery`, `Dialog`, `Alert`. Also fix the `DetailRow` inner `<div className="row …">` (added during the CSS-modernization pass) to `<Row>`. Molecules first — they're the reference implementations.
- **Phase 2 — ui/components (409 occ, 57 files), sub-phased by area, biggest first:**
  - `widgets/` (DashboardMiniWidgets 46, DashWidgets 28, WeatherWidget 20, SleepWidgets 18 …)
  - `session/` (SessionDetail 44, FinishedView 27, BlockCard 15 …)
  - `log/` (SessionListItem 12 …), `modals/` (ImportModal 18, SettingsModal 16 …)
  - `social/`, `profile/`, `health/` (mostly 1 each), `shared/`
- **Phase 3 — screens (5 files, 14 occ):** `TrainingPlansScreen` (9), `ProfileScreen`, `HomeScreen`, `WeatherScreen`, `NotificationsScreen`.

## Non-goals / guardrails
- **No visual change** — structural swap only. If a raw combo can't be expressed by component props, pass it via `className` (don't redesign).
- Don't convert non-layout divs (cards, named components, wrappers like `q-row`/`photo-thumb`). Keep `q-row`/`q-tile` container wrappers as-is.
- Don't touch the `toast-stack` class or `Grid`/`GridItem` usages (already components).
- Keep diffs mechanical and reviewable; one area per commit.

## Verification
1. `npx tsc --noEmit` clean after each phase.
2. Visual parity: run the dev app, spot-check each converted area against `DESIGN.md` spacing (gaps unchanged).
3. After Phase 0, confirm previously-inert props now work (e.g. a `<Row gap="md">` actually spaces at the intended token).
4. Grep regression: raw `className="row|column|cluster"` count trends to ~0 in the phase's scope (excluding intentional `className` pass-through on components and `toast-stack`).
5. Rebuild the code graph per CLAUDE.md after each phase.

## Status
**PHASES 0–2 COMPLETE** (branch `refactor/screen-atomic-components`, commits `edba1aa`–`bbe55c1`).

What shipped:
- Phase 0: layout.css `:is()` restructure, gap-0..5 token scale, z-index flattened to 4 levels, layout primitive APIs reconciled with CSS, `_classes.ts` shared helper, Row/Column/Cluster/Grid all use numeric Gap type
- Phase 1: Surface pure block (`.surface.block` shim), Badge → `.badge` canonical + tone/color props, Button nesting + destructive variant, Metric/Text/Input/Textarea/Switch atoms compose layout, dead utilities deleted, skeleton deduped, rarity-dot merged into .dot, buttons.css/forms.css/wizard.css natively nested
- Phase 2: All 21 molecules compose Row/Column/Surface/Cluster internally; zero raw layout classes in ui/molecules; new TrendItem/PainScale molecules; Divider atom; .trend-item/.pain-scale/.tabs/.header-slot flex removed from CSS

**NEXT: Deferred sweep** — sweep ~570 raw `className="row|column|cluster|surface…"` in `ui/components` (session/ + widgets/ first, 43% of usage) and `ui/screens`. Then purify CSS — remove legacy aliases and `.surface.block` shim.
