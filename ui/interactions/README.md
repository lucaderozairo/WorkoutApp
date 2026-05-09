# Interactions

Cross-cutting interaction handlers. Pluggable across platforms.

- `gestures` — pinch, swipe, drag, long-press
- `keyboard` — shortcut registration and dispatch
- `pointer` — hover, focus rings (web/desktop)
- `drag_and_drop` — used by appointment reorder, sport pin reorder

Interactions emit semantic events (`onReorder`, `onPinch`) — never raw touch events — so layouts and widgets stay platform-agnostic.
