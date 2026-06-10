## Architecture (non-negotiable)

This project follows a **layered design-system + feature + infrastructure** architecture.
The folder structure is secondary; the **dependency rules below cannot be broken**.
Enforcement plan: `docs/superpowers/plans/2026-06-03-architecture-rule-enforcement.md`.

### Target layer vocabulary

```
tokens  →  primitives  →  layouts  →  patterns  →  features  →  screens/pages
```

Lower layers know nothing about higher layers. Domain knowledge enters only at `features`.

### Current → target mapping (we are migrating toward the target names)

| Target layer        | Current location(s)                                              |
| ------------------- | ---------------------------------------------------------------- |
| `tokens`            | `styling/tokens.css`, `styling/themes/`                          |
| `primitives`        | `ui/atoms/` + `ui/molecules/`                                    |
| `layouts`           | `ui/layout/` (`Row`, `Column`, `Grid`, `Cluster`, …)             |
| `patterns`          | `ui/patterns/` (target home for SearchBar, EmptyState, StatTile, Toolbar — currently still in `ui/molecules/`) |
| `features` (UI)     | `ui/components/{health,log,session,social,…}`                    |
| `features` (logic)  | `features/<domain>/{commands,events,projections,queries,policies,domain}` (event-sourced / CQRS) |
| `screens`/`pages`   | `ui/screens/`, `ui/navigation/`                                  |
| `infrastructure`    | `data/{sources,repositories,store,projections}`, `core/`        |
| cross-feature contracts | `shared/contracts/`                                          |

### Dependency rules

Allowed direction only (each layer may import from layers *below* it):

```
tokens ← primitives ← layouts ← patterns ← features ← screens/pages
```

Forbidden (these break reusability and must fail review):

```
primitives → features      layouts → features      patterns → features
design-system → any feature store, API call, or domain type
feature → another feature directly  (use shared/contracts instead)
```

### The ten rules

1. Every visual element originates from a **primitive** (`ui/atoms` / `ui/molecules`). No raw styled `<div>`/`<button>` in features.
2. **Layouts** (`ui/layout`) never contain business logic — pure composition only.
3. **Patterns** never import features.
4. **Features never import other features directly** — communicate via `shared/contracts` (and events / projections).
5. Only **tokens** contain design values.
6. **No hardcoded** spacing, colours, radii, typography, shadows, or animation values.
7. All styling is **token-driven** (`var(--space-md)`, never `12px`).
8. **ESLint + Stylelint boundaries fail CI when violated.** Layer dependencies use `eslint-plugin-boundaries`; inline-style discipline uses `no-restricted-syntax`; token discipline uses `stylelint-declaration-strict-value`. See `eslint.config.js`, `stylelint.config.js`, and `docs/superpowers/plans/2026-06-03-architecture-rule-enforcement.md`.
9. App and any future shells (`app/`) share the **same design system** — never fork it.
10. **Project-specific UI never enters the design system.** `MapContainer`, `WorkoutChart`, `RoutePlanner`, etc. live in `ui/components/<domain>` or `features/<domain>`, not in `ui/atoms|molecules|layout|patterns`.

### CSS conventions (see also memory: CSS conventions / nesting / fallbacks)

- Token-driven values only; compose-first; semantic class names; **CSS nesting** via `&`; **zero inline `style=`**.
- Variant styling uses `data-variant` / `data-*` attributes with nested selectors, e.g. `&[data-variant="primary"]`.
- **Decided:** global semantic CSS files in `styling/` organized by CSS `@layer` — **not** per-component CSS Modules. Module hashing would break the global utility-class layout system (`ui/layout/_classes.ts`) and contradict semantic naming.
- **`@layer` mirrors the component tiers** (the cascade *is* the atomic hierarchy). Declared in `styling/global.css`:
  ```css
  @layer reset, tokens, base, layout, atoms, molecules, patterns, project, utilities, overrides;
  ```
  Map: `tokens`→tokens · `atoms`/`molecules`→primitives · `layout`→layouts · `patterns`→patterns · `project`→feature-ui/domain.
- **CSS dependency rule (mirror of the component rules):** raw design values live **only** in `@layer tokens`; domain vocabulary (sports, sleep, rarity, etc.) lives **only** in `@layer project`. A domain-specific rule in `atoms`/`molecules`/`patterns` is a defect. Each stylesheet is imported into its layer via `@import "./x.css" layer(<layer>)`.

### Variant API for primitives

Prefer a single component with variant props over many named components:

```tsx
<Button variant="primary" size="md" tone="success" loading />   // ✅
PrimaryButton / SecondaryButton / DangerButton                  // ❌
```

---

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:

- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code files in this session, run `python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"` to keep the graph current

<!-- code-review-graph MCP tools -->

## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes` or `query_graph` instead of Grep
- **Understanding impact**: `get_impact_radius` instead of manually tracing imports
- **Code review**: `detect_changes` + `get_review_context` instead of reading entire files
- **Finding relationships**: `query_graph` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview` + `list_communities`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool                        | Use when                                               |
| --------------------------- | ------------------------------------------------------ |
| `detect_changes`            | Reviewing code changes � gives risk-scored analysis    |
| `get_review_context`        | Need source snippets for review � token-efficient      |
| `get_impact_radius`         | Understanding blast radius of a change                 |
| `get_affected_flows`        | Finding which execution paths are impacted             |
| `query_graph`               | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes`     | Finding functions/classes by name or keyword           |
| `get_architecture_overview` | Understanding high-level codebase structure            |
| `refactor_tool`             | Planning renames, finding dead code                    |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes` for code review.
3. Use `get_affected_flows` to understand impact.
4. Use `query_graph` pattern="tests_for" to check coverage.
