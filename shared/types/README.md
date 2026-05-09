# Shared Types

Cross-layer type definitions. No runtime code beyond constructors and type guards.

## Core types
- `Id<T>` — phantom-typed identifier
- `Result<T, E>` — success/failure union
- `Option<T>` — present/absent union
- `Series<T>` — `{ x, y, label?, meta? }[]` for charts
- `DateRange` — `{ from, to }` ISO dates
- `Money`, `Distance`, `Duration`, `Weight` — typed scalars with unit
- `Envelope` — event envelope shape (re-export from core)
