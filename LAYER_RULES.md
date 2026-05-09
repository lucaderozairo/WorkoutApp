# Layer Rules (Lint-Enforceable)

Dependency direction is enforced. A layer may only depend on layers below it.

```
app           ← may depend on everything
ui            ← features, core, shared, styling
features      ← core, data (via interfaces only), shared
data          ← core, shared
core          ← shared
shared        ← (nothing)
plugins       ← plugins/api, shared
styling       ← (nothing)
config        ← (nothing)
```

## Forbidden imports (catch in CI)

| From | To | Why |
|---|---|---|
| `ui/*` | `data/*` | UI must go through features |
| `ui/*` | `features/*/commands` | UI dispatches via bindings, not direct import |
| `features/*` | `ui/*` | Features have no UI knowledge |
| `features/*` | `features/<other>/*` | Cross-feature talks through events only |
| `core/*` | `features/*` | Core is feature-agnostic |
| `core/*` | `data/*` | Core has no I/O |
| `shared/*` | anything | Shared depends on nothing |

## Cross-feature communication

Features never import each other. They communicate by:
1. **Events** — feature A emits, feature B subscribes
2. **Shared projections** — both read the same view (rare; usually a smell)

If feature A needs to call a command on feature B, it emits an event and feature B's policy reacts.
