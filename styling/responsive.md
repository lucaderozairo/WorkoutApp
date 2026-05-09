# Responsive Rules

Breakpoints, density, and adaptive layout rules.

## Breakpoints
- `sm` — < 600 (phone)
- `md` — 600–1024 (tablet portrait, foldable)
- `lg` — 1024–1440 (tablet landscape, small desktop)
- `xl` — > 1440 (desktop)

## Density
- `compact` — small phones, watch
- `regular` — default
- `comfortable` — accessibility preference

## Layout decisions
Layouts query the active breakpoint via a binding hook and pick a variant. The dashboard, for example, renders one column at `sm` and two at `md`+.
