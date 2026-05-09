# Material Design 3 — Foundations Summary

A condensed reference of the foundational design principles defined at
[m3.material.io](https://m3.material.io/foundations). Use this as the
canonical source when making design decisions for the app.

---

## 1. Accessibility

Design must be usable by the widest possible range of people.

- **Perceivable** — content available to all senses (text alternatives, captions, sufficient contrast).
- **Operable** — all functionality reachable via keyboard, touch, and assistive tech; no time traps.
- **Understandable** — clear language, predictable navigation, helpful error recovery.
- **Robust** — works across platforms, input modes, and assistive technologies.

Concrete targets:
- Text contrast ≥ **4.5:1** (body), ≥ **3:1** (large text, UI elements).
- Touch targets ≥ **48×48 dp** with adequate spacing.
- Respect `prefers-reduced-motion`, `prefers-contrast`, and user font-size settings.
- Every interactive element must have an accessible name and focus state.

---

## 2. Adaptive Design

One design language that adapts across window sizes, input modes, and device postures.

- **Window size classes:** Compact (<600dp), Medium (600–839), Expanded (840–1199), Large (1200–1599), Extra-large (≥1600).
- **Canonical layouts:** List-detail, supporting pane, feed — pick one per screen and adapt its regions to the window class.
- **Navigation patterns:** Bottom bar → rail → drawer as width grows.
- **Input flexibility:** Design for touch, mouse, keyboard, stylus, and voice simultaneously — don't optimize for one.

---

## 3. Color

Color is systematic, accessible, and expressive.

### Color system
- Built from **key colors** (Primary, Secondary, Tertiary, Neutral, Neutral-variant, Error).
- Each generates a **tonal palette** of 13 tones (0, 10, 20, … 99, 100).
- **Roles** (not raw hexes) are applied in code: `primary`, `on-primary`, `primary-container`, `on-primary-container`, `surface`, `surface-variant`, `outline`, etc.
- Each role has a **light** and **dark** mapping to tonal palette tones.

### Principles
- Use color **roles**, never palette tones directly, in component code.
- Pair every "container" with its "on-container" for guaranteed contrast.
- Primary = most prominent brand moments. Secondary = less prominent accents. Tertiary = contrasting highlights and balance.
- **Dynamic color** allows palettes to be generated from a source (wallpaper, brand, content).

---

## 4. Typography

A type scale that expresses hierarchy consistently.

### Type scale (15 styles)
| Group   | Styles                    | Use |
|---------|---------------------------|-----|
| Display | Large, Medium, Small      | Short, hero moments. |
| Headline| Large, Medium, Small      | High-emphasis text that starts a region. |
| Title   | Large, Medium, Small      | Medium-emphasis text, shorter than headlines. |
| Body    | Large, Medium, Small      | Long-form reading. |
| Label   | Large, Medium, Small      | UI elements: buttons, tabs, captions. |

Each style defines font, weight, size, line-height, and tracking.

### Principles
- Pick **one brand font** and one optional secondary font; let the scale drive hierarchy.
- Prefer **variable fonts** for fluid weight/width across sizes.
- Line-length target: **~60–75 characters** for body copy.
- Tracking tightens as size grows; line-height loosens inversely.

---

## 5. Shape

Shape carries meaning and reinforces hierarchy.

- **Shape scale:** None (0), Extra-small (4), Small (8), Medium (12), Large (16), Extra-large (28), Full (pill).
- Components default to a shape token; don't override per-instance.
- **Semantic use:** Round shapes soften and signal interactivity; square shapes feel structural and static.
- Use shape to differentiate states (e.g., selected chips morph corners).

---

## 6. Elevation

Elevation communicates surface relationships and hierarchy.

- **Six levels:** 0, 1, 2, 3, 4, 5 dp.
- In M3, elevation is expressed through **tonal overlay** (surface tint) **and** shadow, not shadow alone.
- Higher elevation = more prominent surface tint + larger shadow.
- Reserve higher levels for **temporary** surfaces (menus, dialogs, FABs). Persistent surfaces stay low.

---

## 7. Layout

Layout defines structure, rhythm, and adaptability.

### Grid
- **Columns:** 4 (Compact), 8 (Medium), 12 (Expanded+).
- **Margins and gutters** scale with window class.
- Use **panes** (fixed or flexible regions) to compose canonical layouts.

### Spacing
- Everything snaps to a **4 dp grid** (or 8 dp for larger elements).
- Spacing tokens encode semantic scale, not raw values.
- Use consistent spacing at the **component edge**, not just internally, to create rhythm between groups.

### Composition
- Define a **hero** region, **supporting** regions, and **navigation** region per screen.
- Content density: Default / Comfortable / Compact — pick one per surface.

---

## 8. Motion

Motion makes change legible and delightful.

### Easing
- **Standard easing** — most motions (emphasized in/out).
- **Emphasized easing** — primary, on-screen transitions with character.
- **Linear** — only for continuous motion (progress indicators).

### Duration
- **Short:** 50–200 ms (small UI changes, ripples).
- **Medium:** 250–400 ms (element entrances/exits).
- **Long:** 450–600+ ms (large, full-screen transitions).

### Principles
- Motion should be **functional first** — explain, guide, confirm — then expressive.
- Respect `prefers-reduced-motion`: fall back to instant or cross-fade.
- Match motion character to the product's personality (calm, energetic, playful).

---

## 9. Interaction States

Every interactive element signals its state consistently.

- **States:** Enabled, Hovered, Focused, Pressed, Dragged, Disabled, Selected, Activated.
- Each state layers a **state layer** (a semi-transparent tint of `on-surface`) over the base.
- **Opacity tokens:** Hover 8%, Focus 10%, Pressed 10%, Dragged 16%.
- Disabled = 38% opacity on content, 12% on container — never just greyscale.
- Focus indicators must be **visible**, **high contrast**, and **non-color-only**.

---

## 10. Icons

Icons are a typographic companion to the product.

- Use a **consistent style**: Outlined, Rounded, Sharp, Two-tone, or Filled — pick one set per product.
- **Default size:** 24 dp; scale 20/24/40/48 for density variants.
- Variable icons allow weight, grade, and optical-size adjustment alongside typography.
- Always pair icons with accessible labels — icon-only buttons need `aria-label`.

---

## 11. Content Design

Words are part of the design.

- **Clear** — plain language, active voice, short sentences.
- **Concise** — remove every word that doesn't earn its place.
- **Consistent** — same term for the same thing, everywhere.
- **Useful** — write for the moment and task, not for completeness.
- **Inclusive** — gender-neutral, culturally aware, jargon-free.
- Error messages: say what happened, why, and what to do next.

---

## 12. Customization and Theming

Theming is systematic, not cosmetic overrides.

- Define a **theme** as: key colors → tonal palettes → role mappings → component tokens.
- Swapping a brand = changing key colors; the system regenerates everything else.
- Support **light**, **dark**, and **high-contrast** modes from the same source.
- Dynamic theming can derive a palette at runtime from content or user settings.

---

## 13. Design Tokens

Tokens are the bridge between design and code.

- **Reference tokens** — raw values (e.g., `palette.blue.40 = #3058bd`).
- **System tokens** — semantic roles (e.g., `color.primary`).
- **Component tokens** — per-component values (e.g., `button.container.color`).
- Rule: components reference **component tokens**; component tokens reference **system tokens**; system tokens reference **reference tokens**. Never skip a layer.
- Tokens are the single source of truth — design tools and code read the same token JSON.

---

## Applying These Principles in This Project

This project's implementation intentionally diverges from M3 in some places but adopts the same principles:

| M3 principle        | This project's mapping                                                     |
|---------------------|-----------------------------------------------------------------------------|
| Color roles         | `--color-primary`, `--color-surface`, `--color-background`, `--color-text-*` |
| Type scale          | `--headline`, `--title`, `--subtitle`, `--body`, `--detail`, `--caption`, `--label` |
| Spacing (4dp grid)  | `--spacing-1..7` (2, 4, 8, 16, 24, 32, 48 px)                              |
| Shape scale         | `--border-radius-0..3` (0, 4, 8, 16 px)                                     |
| Elevation           | `--box-shadow-sm/md/lg`                                                     |
| Theming             | `[data-theme="dark"]` root override                                         |
| Tokens              | All values in `styling/styleguide.css` `:root`                              |
| Motion              | _Not yet tokenized — add `--duration-*` and `--ease-*` when needed._        |
| State layers        | _Implemented ad-hoc on `.active`; consider unifying via state tokens._      |
