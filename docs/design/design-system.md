# DESIGN.md

> Design system reference for AI agents generating UI. Drop this file in any project using this token set to get consistent, on-brand output.

---

## 1. Visual Theme & Atmosphere

**Personality:** Calm, data-forward, precise. Not loud or gamified — information should feel trustworthy and scannable. Prioritise content density over decoration.

**Light mode:** Off-white background (`#f4f6fb`), white cards (`#ffffff`), navy-ink text (`#0e1320`). Clean, airy, clinical.

**Dark mode:** Deep navy background (`#080c18`), midnight-blue cards (`#0f1525`), cool-white text (`#e8eefa`). High contrast, low eye strain.

**Accent:** Clear sky blue — `#4f8ef7` (light) / `#6ba3ff` (dark). Used sparingly: primary actions, active nav items, focus rings. Never more than one accented element visible at a time.

**Motion:** Subtle. 150ms for micro-interactions, 300ms for panel transitions. Easing: `cubic-bezier(0.2, 0.8, 0.2, 1)`. No decorative animation.

**Icons:** Phosphor Icons — outline weight for default/inactive, fill weight for active/selected states. No emoji in UI chrome; emoji only in user-generated content.

---

## 2. Color Palette & Roles

### Core surface & ink tokens

| Token | Light | Dark | Role |
|-------|-------|------|------|
| `--surface-0` | `#f4f6fb` | `#080c18` | Page background |
| `--surface-1` | `#ffffff` | `#0f1525` | Card / primary surface |
| `--surface-2` | `#ebf0fa` | `#171e30` | Secondary surface, hover bg |
| `--surface-3` | `#dde5f5` | `#1f2840` | Tertiary surface, pressed bg |
| `--ink` | `#0e1320` | `#e8eefa` | Primary text |
| `--ink-muted` | `#4a5270` | `#8a93b2` | Labels, secondary text |
| `--ink-faint` | `#8e96b0` | `#4a5270` | Placeholders, disabled, empty-state icons |
| `--line` | `#dde5f5` | `#1f2840` | Borders, dividers |
| `--line-strong` | `#c5d0e8` | `#2a3555` | Prominent borders |
| `--accent` | `#4f8ef7` | `#6ba3ff` | Primary action, active nav, focus |
| `--accent-soft` | `#c5d9fc` | `#0f2050` | Tint background behind accent elements |
| `--accent-ink` | `#ffffff` | `#050c20` | Text on accent backgrounds |

### Status colors

| Token | Value | Use |
|-------|-------|-----|
| `--ok` | `#6fbf73` | Success, positive state, good condition |
| `--warn` | `#e8a33d` | Warning, caution |
| `--bad` | `#e25555` | Error, danger, destructive action |

### Shadows

| Token | Value | Use |
|-------|-------|-----|
| `--shadow-1` | `0 1px 2px rgba(14,19,32,.06), 0 1px 1px rgba(14,19,32,.04)` | Resting cards, inputs |
| `--shadow-2` | `0 8px 32px rgba(14,19,32,.10), 0 2px 6px rgba(14,19,32,.06)` | Dropdowns, modals, sticky headers |

Dark mode uses heavier opacity (`0.60` / `0.85`).

---

## 3. Typography Rules

**Font stack:** Geist (display + UI), Geist Mono (numbers, statistics, code)

### Scale

| Token | Size | Use |
|-------|------|-----|
| `--t-xs` | 11px | Captions, eyebrow labels, compact nav labels |
| `--t-sm` | 13px | Detail text, table cells, chip labels |
| `--t-md` | 16px | Body text, buttons, inputs |
| `--t-lg` | 18px | Sub-headings |
| `--t-xl` | 22px | Screen/page titles |
| `--t-2xl` | 28px | Section hero numbers |
| `--t-3xl` | 40px | Large metrics |
| `--t-4xl` | 56px | Display statistics |
| `--t-5xl` | 80px | Hero display numbers |

### Rules

- **Screen titles:** `--t-xl`, weight 600, centred in the `<ScreenHeader>` component
- **Section eyebrows:** `--t-xs`, weight 500, `--ink-muted`, uppercase, 0.12em letter-spacing
- **Body copy:** `--t-md`, weight 400, line-height 1.5
- **All numbers/statistics:** Geist Mono (`.mono` class) — numbers never use the UI font
- **Captions:** `--t-xs`, `--ink-muted`
- Body text is always left-aligned. Centre-align only empty-state headlines and isolated hero stats.

---

## 4. Component Stylings

### Buttons

```
.primary    accent bg, accent-ink text, 600 weight, --r-sm radius, s-1/s-3 padding
.secondary  surface-1 bg, line-strong border, ink text
.ghost      transparent, no border — icon-only or low-emphasis actions
destructive --bad color, used only for irreversible actions + confirm dialogs
disabled    opacity 0.3, pointer-events none
```

- Minimum 44×44px touch target on mobile (use padding, not element size)
- Press state: `scale(0.98)` transform
- Focus: 2px solid `--accent` outline, 2px offset

### Surfaces / Cards

```
.surface         surface-1 bg, --line border, --r-md (14px) radius, --shadow-1, 16px padding
.surface.tight   same, 4px padding
.surface.flat    surface-2 bg, no border, no shadow
.surface.inset   surface-2 bg, dashed border — placeholder / drop-target areas
.surface.accent  accent bg, accent-ink text — featured / CTA cards
.surface.warning --bad tint bg + border — destructive action sections
```

### Inputs

```
Default   surface-1 bg, line-strong border, --r-sm, s-1/s-3 padding, 32px min-height
Focus     accent border + 2px outline
Error     --bad border + .error-text label below
Disabled  transparent border and background
Ghost     transparent — for inline edits (e.g. title fields on a map view)
```

Numeric steppers: use Phosphor `Minus` / `Plus` buttons flanking the value instead of free-text inputs wherever the range is known.

### Screen Header

Every secondary/sub-screen uses a three-slot header:

```
[ Leading 40px min ]  [ Centre: title --t-md 600 ]  [ Trailing 40px min ]

Leading:   Back button (Phosphor CaretLeft) — always top-LEFT
Centre:    Screen title, always centred
Trailing:  Single primary action (Save, + Add, etc.) — optional

Divider:   1px --line bottom border
Position:  sticky top-0, z-index 10, surface-1 bg
```

Never place the back button top-right. Never put branding or a theme toggle in this bar.

### Navigation

**Desktop rail (> 780px):** Left sidebar, 150px wide.
```
Items     44px min-height, 16px horizontal padding, --r-sm, icon 20px + label
Active    dark: accent bg + accent-ink text | light: ink bg + surface-1 text
Inactive  --ink-muted
Settings  pinned to bottom of rail
```

**Mobile tab bar (<= 780px):** Fixed bottom, 60px tall.
```
Items     icon 24px centred, label below (--t-xs, uppercase, 0.12em tracking)
Active    icon in accent, label in --ink
Inactive  --ink-muted
≤ 500px   icon only, no labels
```

### Pills & Chips

```
.pill             --r-pill, --t-xs, surface-2 bg — small read-only labels
.pill.accent      accent bg, accent-ink — active counts, current values
.pill.ok/warn/bad semantic status

.chip             transparent bg, --line border, --r-pill — interactive filter/tag
.chip.active      surface-2 bg, line-strong border
```

### Empty States

Three-element centred pattern — used whenever a list or section has no data:

```
1. Icon      Phosphor icon, 48px, --ink-faint (never emoji)
2. Headline  --t-lg, 600 weight, centred
3. Subtext   --t-md, --ink-muted, centred, max 2 lines
4. CTA       primary button, centred — include when there is a clear next action
```

### Charts

All charts share the `<ChartCard>` scaffold:

```
Eyebrow label   --t-xs uppercase --ink-muted (e.g. "THIS WEEK")
Value pill      .pill.accent with current value (e.g. "7.9 h")
Chart body      recharts, 100% width, --ink-faint axis lines
Legend          row of .pill components (optional)
```

Use semantic color tokens for data series (activity type, status). Use `--accent` for single-series generic data. Never hardcode hex values in chart config.

---

## 5. Layout Principles

### Spacing (base 4px)

```
--s-1: 4px   --s-2: 8px   --s-3: 12px  --s-4: 16px
--s-5: 24px  --s-6: 32px  --s-7: 48px  --s-8: 64px
```

Sibling spacing: always `gap` on the parent container. Never `margin-top/bottom/right` on individual elements.

### Layout primitives

```
.row          flex-row, gap 12px
.column       flex-column, gap 16px
.cluster      wrapping flex-row, gap 8px — tags, chips, filter rows
.*.compact    same with gap 4px
```

### Content max-width

```
Main content (desktop)   max-width 960px, margin-inline auto
Form-focused screens     max-width 480px, centred
Full-bleed (maps etc.)   max-width none — override with .full-bleed
```

Always respect max-width. Never stretch cards to full viewport width on desktop.

### Common grid patterns

- **Stat tiles:** equal-width flex children, `.surface.tight` on each tile
- **Category/option grids:** `auto-grid` (320px columns) desktop, 2-col on mobile
- **Two-pane (map/messages):** fixed left rail (320px), right fills `1fr`

---

## 6. Depth & Elevation

```
Resting cards             --shadow-1, or none for flat/inset variants
Hovered interactive cards --shadow-2 + surface-2 bg
Modals / bottom sheets    --shadow-2 + rgba(0,0,0,.5) backdrop, 12px blur
Sticky headers            --shadow-1, z-index 10
Dropdowns                 --shadow-2, z-index 200
```

Bottom sheets snap between: peek (56px) → mid (240px) → full (65vh).

---

## 7. Do's and Don'ts

### Do

- Use Phosphor icons: outline for default/inactive, fill for active/selected
- Compose CSS from utilities (`.row.align-center.compact`) before writing new rules
- Use `--ink-muted` for secondary labels, `--ink-faint` for placeholders/disabled
- Hit 44px minimum touch targets on all interactive elements
- Put destructive actions in a visually separated section with `--bad` tint
- Always include a CTA in empty states when there is a clear next action
- Show real data — never permanent dashes or placeholder values

### Don't

- No inline `style=""` attributes
- No emoji in UI chrome — use Phosphor icons
- No `margin-top/bottom/right` on siblings — use `gap` on the parent
- No full-width primary buttons in the middle of a form
- No more than one accent-background element visible at a time
- No cards stretched to full viewport width on desktop
- No theme toggle in any screen header — Settings only
- No `.compact` on `.surface` — only on layout containers

---

## 8. Responsive Behavior

### Breakpoints

```
≤ 500px   Mobile S    icon-only tab bar, single column
≤ 780px   Mobile/Tab  bottom tab bar, stacked layouts
> 780px   Desktop     left rail, max-width 960px content
```

### Mobile patterns

- Bottom sheet for contextual panels (snap states above)
- Horizontal scroll rows (`.scroll-row`) for pickers, date strips, chip filters
- Sticky `<ScreenHeader>` — no floating back buttons
- Stepper controls for bounded numeric inputs (no on-screen keyboard)

### Desktop patterns

- Two-pane for map/planning screens: controls rail 320px + map fills rest
- Two-pane for messaging: list 320px + conversation fills rest
- Constrain form screens to 480px centred
- Grid layouts (not stretched single column) for option/category screens

---

## 9. Agent Prompt Guide

### Quick color reference

```
Page background   --surface-0   #f4f6fb / #080c18
Card background   --surface-1   #ffffff / #0f1525
Hover bg          --surface-2   #ebf0fa / #171e30
Primary text      --ink         #0e1320 / #e8eefa
Secondary text    --ink-muted   #4a5270 / #8a93b2
Borders           --line        #dde5f5 / #1f2840
Accent            --accent      #4f8ef7 / #6ba3ff
Success           --ok          #6fbf73
Warning           --warn        #e8a33d
Danger            --bad         #e25555
```

### Reusable prompt fragments

**Card / surface:**
> White card (`#ffffff`), `#dde5f5` border, 14px radius, subtle `0 1px 2px rgba(14,19,32,.06)` shadow, 16px padding.

**Screen header:**
> Sticky header bar, white bg, 1px `#dde5f5` bottom border. Three slots: left (40px, back arrow `#4a5270`), centre (title 16px 600 weight `#0e1320`), right (40px, optional action button).

**Empty state:**
> Centred vertically. Phosphor [icon] 48px `#8e96b0`. Below: headline 18px 600 `#0e1320`. Below: subtitle 16px `#4a5270` max 2 lines. Below: primary button `#4f8ef7` bg white text 14px radius.

**Primary button:**
> `#4f8ef7` background, white text, 14px border-radius, 8px vertical / 16px horizontal padding, 500 weight, 16px font size.

**Stat tile row:**
> Row of equal-width bordered tiles. Each: white bg, `#dde5f5` border, 14px radius, 4px padding, flex-column centred. Value in Geist Mono, label in 11px `#4a5270`.

**Two-pane desktop layout:**
> Left panel 320px fixed, white bg, `#dde5f5` right border, overflow-y scroll. Right panel fills remaining width entirely (no max-width override). Both panels full viewport height.
