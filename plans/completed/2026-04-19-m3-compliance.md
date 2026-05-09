# M3 Compliance Plan — `styling/styleguide.css`

**Created:** 2026-04-19
**Source audit:** [styling/DESIGN_PRINCIPLES.md](../../styling/DESIGN_PRINCIPLES.md)
**Scope:** `styling/styleguide.css` (single stylesheet — project rule)

## Goal

Bring the current design system into alignment with Material Design 3 foundations without introducing new files. Keep visuals stable; prefer additive tokens and role aliases over breaking renames.

---

## Phase 1 — Bug fixes (quick wins)

Concrete errors discovered during the audit. Do these first; they are independent and low-risk.

- [ ] **Fix modal surface tokens** — `.modal-overlay .surface` uses `var(--space-5)` and `var(--shadow-lg)` which don't exist. Replace with `var(--spacing-5)` and `var(--box-shadow-lg)`. (line ~933–935)
- [ ] **Fix invalid `opacity()` call** — `.surface.interactive:hover { background: opacity(var(--color-surface) / 0.9); }` is invalid CSS. Replace with `color-mix(in srgb, var(--color-surface) 90%, transparent)`. (line ~489)
- [ ] **Fix broken hover selector** — `button:hover input[type="button"]:hover` is a descendant selector that never matches. Add the missing comma. (line ~392)
- [ ] **Remove duplicate badge modifier** — `.badge.amber` and `.badge.coral` both map to `--color-warning`. Delete `.badge.coral` or point it at a distinct token.
- [ ] **Rename `--color-row_`** — trailing underscore breaks naming convention. Rename to `--color-rowing`, update all `.bg-row_` / `.pill.row_` usages in CSS and component markup.

**Verify:** `grep -r "space-5\|shadow-lg\|opacity(var\|color-row_" styling/ features/ ui/ app/` returns zero matches.

---

## Phase 2 — Color roles (M3 alignment)

M3 pairs every container role with an `on-*` role to guarantee contrast. Right now `.primary { color: white }` hard-codes the foreground.

- [ ] Add `on-*` tokens to `:root`:
  ```css
  --color-on-primary: #ffffff;
  --color-on-surface: var(--color-text-primary);
  --color-on-background: var(--color-text-primary);
  --color-outline: var(--color-text-secondary);
  --color-primary-container: color-mix(in srgb, var(--color-primary) 18%, var(--color-surface));
  --color-on-primary-container: var(--color-primary);
  ```
- [ ] Override `--color-on-primary` in `[data-theme="dark"]` if primary tone changes.
- [ ] Replace hard-coded `color: white` in `.primary`, `.tab.active`, `a.active` with `var(--color-on-primary)`.
- [ ] Replace `border: 1px solid var(--color-text-secondary)` on inputs with `var(--color-outline)`.

---

## Phase 3 — Dark-mode primary tone

M3 requires tonal palettes to shift per mode. Currently `--color-primary: #3058bd` is identical light/dark.

- [ ] In `[data-theme="dark"]`, override `--color-primary` to a lighter tone (~tone 70–80). Target: `#8ea9e8` or similar.
- [ ] Verify contrast: `--color-on-primary` against new dark primary ≥ 4.5:1.
- [ ] Spot-check dark mode on: nav active link, `.tab.active`, `.pill.primary`, `.primary` button, `.seg.filled`.

---

## Phase 4 — Focus, state layers, and touch targets

- [ ] **Focus indicator** — replace `button:focus { border: 2px solid … }` (shifts layout) with:
  ```css
  button:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
  ```
- [ ] **State-layer opacity tokens** (M3 spec):
  ```css
  --state-hover: 0.08;
  --state-focus: 0.10;
  --state-pressed: 0.10;
  --state-dragged: 0.16;
  ```
- [ ] Rework `button:hover` to apply a tinted overlay using `color-mix` + `--state-hover` instead of changing `background-color` to `--color-background`.
- [ ] **Touch targets** — ensure `button.icon` (currently 30×30 px) and `nav a` meet ≥ 44 px tap target on touch. Add `min-height: 44px` where needed.

---

## Phase 5 — Motion tokens

- [ ] Add motion tokens:
  ```css
  --duration-short: 150ms;
  --duration-medium: 300ms;
  --duration-long: 500ms;
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --ease-emphasized: cubic-bezier(0.3, 0, 0, 1);
  ```
- [ ] Apply to existing transitions: `button:active { transform: scale(0.98); transition: transform var(--duration-short) var(--ease-standard); }`.
- [ ] Add `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }`.

---

## Phase 6 — Contrast fixes

- [ ] Audit sport/rarity pill colors on tinted backgrounds. `.pill.run` (`#ff6b6b` on 18% tint) ≈ 2.5:1 — below AA.
- [ ] Either darken the foreground color or raise the tint background opacity to pass ≥ 4.5:1 for the text.
- [ ] Add a comment noting which colors are decorative-only (rarity dots) vs load-bearing (pill text).

---

## Phase 7 — Elevation (stretch)

M3 elevates surfaces by combining a tonal tint with shadow. Currently shadow-only.

- [ ] Add three elevation helpers:
  ```css
  .elev-1 { background: color-mix(in srgb, var(--color-primary) 5%, var(--color-surface)); box-shadow: var(--box-shadow-sm); }
  .elev-2 { background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface)); box-shadow: var(--box-shadow-md); }
  .elev-3 { background: color-mix(in srgb, var(--color-primary) 11%, var(--color-surface)); box-shadow: var(--box-shadow-lg); }
  ```
- [ ] Decide per-surface whether to migrate (menus/dialogs first). Leave base `.surface` alone.

---

## Out of scope

- Typography expansion to M3's 15-style scale — current 7-step scale is intentional simplification.
- Brand font swap — current system stack is fine for now.
- Dynamic-color generation from user input — not a product need.
- Splitting `styleguide.css` into multiple files — project rule forbids it.

---

## Rollout order

1. Phase 1 (bugs) — merge standalone.
2. Phase 2 (color roles) + Phase 3 (dark primary) — merge together; they share a contrast verification pass.
3. Phase 4 (focus/states/targets) — one PR.
4. Phase 5 (motion) — one PR.
5. Phase 6 (contrast) — one PR.
6. Phase 7 (elevation) — optional; revisit once 1–6 land.

## Verification per phase

After each phase:
- [ ] Open dashboard, log, progress, social, profile screens in both light and dark.
- [ ] Tab through each screen with keyboard — focus must be visible and non-destructive to layout.
- [ ] Run at 360 px, 760 px, 1024 px widths.
- [ ] Check `prefers-reduced-motion` by toggling OS setting.
