# Dropdown action menu width fix

## Problem

`ui/molecules/Dropdown.tsx` is used in live code in exactly one place: the session action menu (`Delete session`) in `ui/components/log/SessionListItem.tsx`. The menu renders far wider than its content — a single destructive button — because `.dropdown` in `styling/overlays.css` sets `min-width: 280px`, a value sized for a filter-panel-style menu, not a short action list.

There is a `.dropdown.actions` CSS rule (`min-width: 120px`, plus legacy `top`/`right` positioning) already in `overlays.css`, but nothing in `Dropdown.tsx` ever applies the `.actions` class. It's dead CSS carried over from an old HTML prototype (`docs/prototypes/legacy-html/session-list.html`) and never wired into the live component.

## Fix

Since the only current consumer of `Dropdown` needs a compact action menu, change the base `.dropdown` rule directly rather than adding a variant prop for a hypothetical second use case:

- Shrink `.dropdown`'s `min-width` from `280px` to a value that fits short action labels without looking cramped (target ~`160px`).
- Delete the unused `.dropdown.actions` rule block (dead, never referenced by any `.tsx`) — its legacy `top: 100%; right: 0;` positioning predates the native Popover API anchoring (`position-area`) already used by `.menu-popover`.
- No changes to `Dropdown.tsx` — `align`/`popover-bottom`/`popover-align-end` already handle anchoring correctly; only the width was wrong.

## Out of scope

- The original app-wide overlay audit (modals, popovers, drawers, context menus, floating panels across all routes) is explicitly descoped. This fix addresses only the one concrete visual bug reported: the session list item's action menu width.
- No new `variant`/`size` prop on `Dropdown` — add one only if/when a second consumer with different width needs shows up.

## Test plan

- Visual check: open the "⋮" action menu on a session list item (`/sessions`) and confirm the "Delete session" menu is compact, not ~280px wide.
- Confirm no other live `.tsx` file references `.dropdown.actions` before deleting that CSS block (already verified via grep — zero matches).
