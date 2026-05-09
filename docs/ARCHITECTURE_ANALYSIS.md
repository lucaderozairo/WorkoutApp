# Architecture Analysis — Workout App

**Generated:** 2026-04-16
**See also:** [../LAYER_RULES.md](../LAYER_RULES.md) · [../DECISIONS.md](../DECISIONS.md) · [../IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md) · [../AGENTS.md](../AGENTS.md)

---

## 1. What you have (architecture reality check)

Your repo already commits to a **strong layered, event-sourced CQRS design** that is mostly correctly implemented:

```
app/      composition + routing
ui/       screens, components, bindings, view_state      [presentation]
features/ domain events, reducers, commands, projections [business]
data/     event store, sources, repositories             [persistence/IO]
core/     clock, id, events bus, reducer primitives      [framework]
shared/   contracts + branded types                      [no deps]
styling/  CSS tokens + design system
config/   env + flags (stubbed)
```

`@ui/bindings` already exposes `useQuery<T>(key)` + `useCommand(...)` that subscribe to a `viewStore`. That is the **one sanctioned seam** between frontend and backend — and it's the right one.

---

## 2. What's **not** clean right now (flag-worthy)

### A. Layer violations (6 files leak `@data/*` into UI)
- [../ui/layouts/DashboardScreen.tsx](../ui/layouts/DashboardScreen.tsx) — imports `viewStore` directly
- [../ui/layouts/LogScreen.tsx](../ui/layouts/LogScreen.tsx) — same
- [../ui/layouts/AnalyticsScreen.tsx](../ui/layouts/AnalyticsScreen.tsx) — `@data/sources/files/gps` type imports
- [../ui/components/ImportModal.tsx](../ui/components/ImportModal.tsx) — imports `parseGpsFile` (logic) from `@data/sources/files/gps`
- [../ui/components/Map.tsx](../ui/components/Map.tsx), [../ui/components/SessionDetail.tsx](../ui/components/SessionDetail.tsx), [../ui/components/SessionGpsPreview.tsx](../ui/components/SessionGpsPreview.tsx) — GPS types from data

These violate [../LAYER_RULES.md](../LAYER_RULES.md). CI should fail on `from '@data` in `ui/**`.

### B. Styling is split across two token files with **conflicting primary colors**
- [../styling/global.css](../styling/global.css) — primary `#c05621` (burnt orange), cascade layers, `--space-*` 4px scale
- [../styling/styleguide.css](../styling/styleguide.css) — primary `#3058bd` (blue), `--spacing-*` 2px scale, own shadow vars

Same concept, two sources of truth. This is the single biggest source of future pain.

### C. Docs drift
- [../README.md](../README.md), [../TABS.md](../TABS.md), [../QWEN.md](../QWEN.md) still list 6 tabs; [../ui/layouts/](../ui/layouts/) has 9 (+ Nutrition, Stretching, TrainingPlans)
- [../IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md) marks phases 16–18 pending but their UI is already shipped
- `.cursorrules` + `.windsurfrules` are byte-identical duplicates
- `GEMINI.md` ≈ `CLAUDE.md` (redundant)

### D. Dead weight
- [../legacy/](../legacy/) — 253 KB `src.zip` + old `STRUCTURE.md` + empty `src/`. Nothing depends on it.
- [../plans/todo/](../plans/todo/) — empty
- [../dashboardwidgets.html](../dashboardwidgets.html), [../example.html](../example.html) — scratch files at root

### E. Hardcoded UI data
- `MOCK_WORKOUTS` in [../ui/components/CalendarWidgets.tsx](../ui/components/CalendarWidgets.tsx)
- `MOCK_SLEEP_WEEK` in [../ui/layouts/DashboardScreen.tsx](../ui/layouts/DashboardScreen.tsx)
- `DAILY_FORECAST`, `HOURLY_PRECIP`, `AQI_DATA`, `HOURLY_TEMP` in [../ui/components/WeatherWidget.tsx](../ui/components/WeatherWidget.tsx) (deliberate stubs — mark them TODO)

These belong in `features/{feature}/projections/` or `data/sources/remote/` and reach UI through `useQuery`.

---

## 3. Recommended restructuring (minimal, high-leverage)

### Rule of thumb: every file is answering one of three questions
- **"How does it look?"** → `ui/` or `styling/`
- **"What does it mean?"** → `features/` (domain, projections, queries)
- **"Where does it live?"** → `data/` (event store, sources, repositories)

### Concrete moves

| Current location | Should be | Why |
|---|---|---|
| `ui/components/ImportModal.tsx`'s `parseGpsFile` usage | keep UI; move parsing call into `features/cardio/commands` via `useCommand` | UI doesn't parse — it dispatches an `ImportGpsFileRequested` command |
| `ui/layouts/*` `viewStore` imports | replace with `useQuery<T>('key')` | already works, just apply consistently |
| `MOCK_WORKOUTS`, `MOCK_SLEEP_WEEK`, forecast arrays | `features/scheduling/projections`, `features/readiness/projections`, `features/conditions/projections` respectively | projections own mock → real transition |
| `dashboardwidgets.html`, `example.html`, `styleguide.html` | `docs/prototypes/` or delete | not part of build |
| `legacy/` | delete | no imports, old scaffold |
| `GEMINI.md` | delete | `AGENTS.md` covers it |
| `.windsurfrules` | replace with symlink or delete | duplicate of `.cursorrules` |
| `plans/todo/` | delete | empty |

### `ui/` — collapse some folders
You have `ui/components/`, `ui/layouts/`, `ui/patterns/{charts,modals,widgets}`, `ui/platform/{mobile,tablet,web}`, `ui/primitives/`, `ui/interactions/`, `ui/bindings/`, `ui/view_state/`. Most of `ui/patterns/` and `ui/platform/` are empty READMEs. **Flatten until there's real code in them.** Keep `components/`, `layouts/`, `bindings/`, `interactions/`. Move charts from [../ui/components/Charts.tsx](../ui/components/Charts.tsx) to `ui/components/charts/` when it grows past one file.

---

## 4. The Supabase integration point (this is the important one)

You are in the **best possible position** to add Supabase without touching UI or features. Here's why:

### The seam already exists
1. [../data/store/event-store.ts](../data/store/event-store.ts) is a `HybridEventStore` with `append()`, `readStream()`, `hydrate()` — all in-memory today
2. Features only know `EventStore` via the contract in [../shared/contracts/](../shared/contracts/)
3. UI only knows `useQuery(key)` — it never sees storage

### The swap, in order
```
┌─────────────────────────────────────────────────────────────────┐
│  Step 1  data/store/supabase-event-store.ts                     │
│           implements EventStore contract                        │
│           append() → INSERT into `events` table                 │
│           readStream() → SELECT WHERE aggregate_id = $1         │
│           hydrate() → bootstrap viewStore from events           │
│                                                                 │
│  Step 2  app/bootstrap/container.ts                             │
│           pick store based on config/environments/              │
│           if (import.meta.env.VITE_SUPABASE_URL) use supabase   │
│           else fall back to HybridEventStore (offline/dev)      │
│                                                                 │
│  Step 3  data/sources/remote/realtime.ts                        │
│           subscribe to supabase.channel('events')               │
│           on INSERT → eventBus.publish(event)                   │
│           (enables multi-device sync + collaboration)           │
└─────────────────────────────────────────────────────────────────┘
```

### Zero changes needed in `ui/`, `features/`, `core/`, `shared/`

That is the whole point of the CQRS boundary you already built.

### Schema for Supabase
```sql
create table events (
  id uuid primary key,
  aggregate_id text not null,       -- e.g. 'session:abc123'
  stream text not null,             -- e.g. 'training_log'
  type text not null,               -- 'SessionStarted'
  payload jsonb not null,
  occurred_at timestamptz default now(),
  user_id uuid references auth.users
);
create index on events (aggregate_id, occurred_at);
create index on events (user_id, stream);
-- RLS: user can only read their own events
alter table events enable row level security;
create policy "own_events" on events
  using (user_id = auth.uid());
```

Projections stay client-side (replay from stream), so your read side is still CQRS; Supabase is purely the durable event log + realtime bus.

### What to add to `config/`
[../config/environments/](../config/environments/) is empty. Add:
```
config/environments/local.ts      → in-memory store
config/environments/staging.ts    → supabase + staging keys
config/environments/production.ts → supabase + prod keys
config/flags.ts                   → feature toggles (offline-first, realtime-sync)
```
Read via `import.meta.env.MODE`.

---

## 5. Typography/styling won't touch backend — lock it in

**Today:** a backend dev editing `features/readiness/projections/sleep.ts` and a designer editing typography both open — the designer touches [../styling/styleguide.css](../styling/styleguide.css), the dev touches `features/**`, nothing overlaps. That's already true **except** for these leaks:

| Leak | Fix |
|------|-----|
| Two CSS token files | Merge into `styling/tokens.css` (primary color, spacing scale, shadows), then `styling/components.css` (surfaces, pills, tabs), `styling/layout.css` (row/column/grid). Keep `global.css` ≈ 30 lines for resets + cascade layers only. |
| Inline `style={{ ... }}` in 5 files (CoachingInsightCard, SessionDetail, DashboardScreen, ExerciseProgressionChart, Map) | Move to CSS classes. Your standing rule is zero `style=""` — enforce with an ESLint rule. |
| Mock data in UI | Move to projections (see §3 table). Then typography changes can't accidentally break data. |

### Propose a single styling structure
```
styling/
├─ tokens.css          # :root vars: colors, spacing, radius, shadows, typography sizes
├─ themes.css          # [data-theme="dark"], [data-theme="high-contrast"]
├─ base.css            # element resets, body, h1-h3, a, button
├─ layout.css          # .row, .column, .grid-*, .surface, .screen
├─ components.css      # .pill, .badge, .tabs, .tab, .modal-overlay, .footer.row
├─ charts.css          # recharts overrides (optional)
└─ index.css           # imports the above in order
```
Replace imports of `styleguide.css` and `global.css` with one `import '@styling/index.css'` in [../app/entrypoints/index.tsx](../app/entrypoints/index.tsx).

---

## 6. Enforcement — so violations don't creep back

Three things pay for themselves:

### (a) ESLint `no-restricted-imports` in `eslint.config` (create)
```js
{
  files: ['ui/**'],
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [
        { group: ['@data/*'], message: 'UI must go through @features or @ui/bindings' },
        { group: ['@features/*/commands/*'], message: 'Dispatch via useCommand, not direct import' },
      ]
    }]
  }
}
```

### (b) A `features/<name>/manifest.md` pattern check
[../features/training_log/manifest.md](../features/training_log/manifest.md) exists. Make it the template; a 10-line CI script can fail the build if a feature folder lacks `domain/types.ts`, `index.ts`, or `manifest.md`.

### (c) Single docs source of truth
Keep `AGENTS.md` + `LAYER_RULES.md` + `DECISIONS.md`. Delete `QWEN.md`, `GEMINI.md`, `.windsurfrules`, and the `legacy/` folder. Regenerate `README.md` + `TABS.md` from the actual `ui/layouts/` directory + `features/*/index.ts` exports (can be a 20-line script).

---

## 7. Priority order if you want to execute this

1. **Delete dead weight** — `legacy/`, `GEMINI.md`, `.windsurfrules`, `plans/todo/`, scratch HTMLs (1 hour)
2. **Merge CSS tokens** into `styling/tokens.css` + `styling/components.css` (half day — payoff: typography changes never risk backend)
3. **Fix layer violations** — 6 files importing `@data/*` move to `@ui/bindings` / `useCommand` (half day)
4. **Move mock data** from UI to feature projections (half day)
5. **Refresh** `README.md` + `TABS.md` + `IMPLEMENTATION_PLAN.md` status (1 hour)
6. **Add ESLint layer rule** + manifest check (1 hour — now violations can't regress)
7. **Supabase integration** — `data/store/supabase-event-store.ts` + `config/environments/*.ts` (1 day — and *only* these files change)

Steps 1–6 total ~2 days and leave you with a codebase where a designer and a backend engineer genuinely can't step on each other. Step 7 is then a self-contained swap.

---

## 8. The one-line summary

Your architecture is already good; the **discipline gap** is (a) UI files reaching into `@data`, (b) styling split across two conflicting token files, and (c) doc drift. Fix those three and Supabase is a single-folder change.
