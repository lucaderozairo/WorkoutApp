# Bindings

The glue between UI and features. Two responsibilities:

1. **Query subscriptions** — turn a feature query into a reactive value the UI can render. When the underlying projection updates, the binding re-emits.
2. **Command dispatch** — provide command-issuing handles to UI components. Bindings handle correlation IDs, optimistic updates, and rollback on failure.

## API shape
```
useQuery(queryName, params) → { data, loading, error }
useCommand(commandName) → (payload) → Promise<Result>
```

## Rules
- Bindings are the *only* place UI touches features
- A widget that needs data uses `useQuery`; never imports a feature directly
- A widget that triggers an action uses `useCommand`; never imports a command handler
- Bindings handle batching: multiple subscribers to the same query share one underlying subscription
