# Workout App — Agent Instructions

## Commands

```bash
npm run dev        # Dev server (Vite)
npm run build      # TypeScript check + production build (tsc && vite build)
npm run preview    # Preview production build
npm run host       # Dev server accessible on LAN
npm run test       # vitest run (jsdom environment)
npm run test:watch # vitest --watch
```

## Architecture

Event-sourced CQRS with layered dependency flow:

```
app → ui → features → data → core → shared
      ↓
  features never import each other; communicate via DomainEvents only
```

Path aliases: `@app`, `@ui`, `@features`, `@data`, `@core`, `@shared`, `@styling`, `@config`

## Feature Module Pattern

Each feature follows this structure:

```
features/{name}/
  domain/types.ts       # Types, event interfaces, command interfaces
  domain/reducers.ts    # Pure state reducers
  domain/events.ts      # DomainEvent definitions
  commands/handlers.ts  # Emit events, register projections
  projections/          # View state builders
  queries/              # Read from viewStore
  index.ts              # Public re-exports
```

**See:** `features/training_log/manifest.md` for a documented example.

## Layer Rules

Enforced (see `LAYER_RULES.md`):

- `ui/*` never imports `data/*` — must go through features
- `ui/*` never imports `features/*/commands` — use bindings instead
- `features/*` never imports other features — events only
- `core/*` never imports `features/*` or `data/*`

## Design System

CSS tokens first. Zero inline styles, zero BEM.

- Layout: `.row`, `.column`, `.grid-2`, `.grid-3`, `.grid-4`, `.grid-auto`
- Surfaces: `section.card` with `.compact`, `.accent` modifiers
- Buttons: `button.primary`, `button.secondary`, `button.ghost`, `button.danger`
- Spacing: `--space-1` through `--space-12` (4px scale)
- Typography: `h3`, `p`, `span.caption`, `.value`, `.label`

**See:** `styling/global.css` for tokens and patterns.

## Tab → Screen Map

| Route        | Layout                        |
| ------------ | ----------------------------- |
| `/dashboard` | `ui/layouts/dashboard_screen` |
| `/sessions`       | `ui/layouts/log_screen`       |
| `/sessions/:sessionId` | `ui/layouts/log_screen`       |
| `/sessions/:sessionId/summary` | `ui/layouts/finish_session_screen` |
| `/sessions/:sessionId/edit`    | `ui/layouts/finish_session_screen` |
| `/sessions/new`  | `ui/layouts/new_session_screen`  |
| `/progress`  | `ui/layouts/progress_screen`  |
| `/analytics` | `ui/layouts/analytics_screen` |
| `/social`    | `ui/layouts/social_screen`    |
| `/profile`   | `ui/layouts/profile_screen`   |

Modals are addressable routes (e.g., `/dashboard/day/:date`).

## Event System

- Events are PascalCase (`SessionStarted`, `PRRecorded`)
- Commands have a `type` field
- `data/store/event-store.ts` is hybrid: IndexedDB backend with in-memory fallback
- Query via `viewStore.get(key)` — never read projection state directly

## Knowledge Graph

This repo has a graphify knowledge graph at `graphify-out/`. Use code-review-graph MCP tools **before** Grep/Glob/Read for exploration and impact analysis.

After modifying code, rebuild the graphify graph. On Windows/PowerShell, force UTF-8 so Graphify can emit/report Unicode characters such as `≤`:

```powershell
$env:PYTHONIOENCODING='utf-8'; $env:PYTHONUTF8='1'; python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"
```

On UTF-8 shells, this is sufficient:

```bash
python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"
```

## References

- `README.md` — layer overview
- `DECISIONS.md` — architecture decisions (D1-D6)
- `LAYER_RULES.md` — dependency rules
- `TABS.md` — tab → feature → query mapping
- `app/navigation/router.md` — full route table
