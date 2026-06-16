---
name: WorkoutApp
description: A personal fitness tracking instrument for performance athletes — clinical, data-forward, precise.
colors:
  # Core surfaces (light-mode hex; dark values in prose)
  surface-0: "#f4f6fb"
  surface-1: "#ffffff"
  surface-2: "#ebf0fa"
  surface-3: "#dde5f5"
  # Ink
  ink: "#0e1320"
  ink-muted: "#4a5270"
  ink-faint: "#8e96b0"
  # Lines / dividers
  line: "#dde5f5"
  line-strong: "#c5d0e8"
  # Accent
  accent: "#4f8ef7"
  accent-ink: "#ffffff"
  accent-soft: "#c5d9fc"
  # Status
  ok: "#6fbf73"
  warn: "#e8a33d"
  bad: "#e25555"
  # Activity domain (theme-agnostic)
  c-strength: "#e8785a"
  c-cardio: "#ef4a4a"
  c-recovery: "#7b9ef8"
  c-nutrition: "#6fbf73"
  c-water: "#4dc8f0"
  c-mind: "#b57bdc"
typography:
  display:
    fontFamily: "Geist, Georgia, serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "Geist, system-ui, -apple-system, sans-serif"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Geist, system-ui, -apple-system, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Geist, system-ui, -apple-system, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Geist, system-ui, -apple-system, sans-serif"
    fontSize: "11px"
    fontWeight: 500
    letterSpacing: "0.12em"
  mono:
    fontFamily: "Geist Mono, ui-monospace, SFMono-Regular, monospace"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  xs: "4px"
  sm: "8px"
  md: "14px"
  lg: "20px"
  pill: "999px"
spacing:
  s1: "4px"
  s2: "8px"
  s3: "12px"
  s4: "16px"
  s5: "24px"
  s6: "32px"
  s7: "48px"
  s8: "64px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.sm}"
    padding: "4px 12px"
    typography: "{typography.body}"
  button-primary-hover:
    backgroundColor: "{colors.accent}"
  button-secondary:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "4px 12px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "4px 12px"
  button-destructive:
    backgroundColor: "transparent"
    textColor: "{colors.bad}"
    rounded: "{rounded.sm}"
    padding: "4px 12px"
  surface-default:
    backgroundColor: "{colors.surface-1}"
    rounded: "{rounded.md}"
    padding: "{spacing.s4}"
  surface-flat:
    backgroundColor: "{colors.surface-2}"
    rounded: "{rounded.md}"
    padding: "{spacing.s4}"
  input-default:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "4px 12px"
  chip-default:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.pill}"
    padding: "8px 12px"
  chip-active:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "8px 12px"
  badge-default:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
---

# Design System: WorkoutApp

## 1. Overview

**Key Characteristics:**
- Geist single-family type system; all numerics in Geist Mono
- Cool blue-tinted neutral surfaces, `#0e1320` near-black ink
- Single accent (`#4f8ef7`) — appears on ≤1 element per screen at rest
- Flat-by-default elevation; tonal surface layering instead of shadows
- 150ms micro-interactions, 300ms panel transitions; no choreographed sequences
- Full light/dark support via CSS `light-dark()`; high-contrast mode via `[data-contrast="high"]`
- Domain color vocabulary for activity categories (strength, cardio, recovery, nutrition, water, mind)

## 2. Colors

A cool-toned neutral ramp anchored by near-black navy ink and a single clear-sky-blue accent. All surface and ink values respond to OS color scheme automatically via `light-dark()`; the accent shifts 16% lighter in dark mode.

### Primary

- **Instrument Blue** (`#4f8ef7` light / `#6ba3ff` dark): The sole accent. Primary actions, active navigation states, focus rings. Used on at most one element per screen at rest. Its rarity is the point.

### Neutral

- **Observatory Night** (`#0e1320`): Primary ink. Used for all body text, headings, and high-emphasis labels. In dark mode: `#e8eefa`.
- **Muted Navy** (`#4a5270`): Secondary text, labels, and inactive navigation items. In dark mode: `#8a93b2`.
- **Faint Steel** (`#8e96b0`): Placeholders, disabled states, empty-state icons. In dark mode: `#4a5270`.
- **Cold White** (`#ffffff`): Primary surface (cards, modals, inputs). In dark mode: `#0f1525`.
- **Haze** (`#f4f6fb`): Page canvas. In dark mode: `#080c18`.
- **Frost** (`#ebf0fa`): Secondary surface, hover backgrounds. In dark mode: `#171e30`.
- **Pale Blue** (`#dde5f5`): Tertiary surface and border/divider color. In dark mode: `#1f2840`.
- **Steel Line** (`#c5d0e8`): Strong borders. In dark mode: `#2a3555`.

### Status

- **Signal Green** (`#6fbf73`): Success, good condition, positive trends.
- **Caution Amber** (`#e8a33d`): Warnings, moderate stress, watch-level alerts.
- **Alert Red** (`#e25555`): Errors, dangerous actions, overtraining flags.

### Domain Colors (activity categories, theme-agnostic)

- **Strength** (`#e8785a`): Resistance training and weightlifting.
- **Cardio** (`#ef4a4a`): Running, high-intensity cardio.
- **Recovery** (`#7b9ef8`): Recovery sessions, light movement.
- **Nutrition** (`#6fbf73`): Cycling and nutrition tracking.
- **Water** (`#4dc8f0`): Swimming and aquatic activities.
- **Mind** (`#b57bdc`): Mindfulness, breathwork, sleep focus.

### Named Rules

**The One Voice Rule.** The accent (`#4f8ef7`) appears on at most one element per screen at rest — the current nav item, the focused input, or the primary CTA. Never two accented elements visible simultaneously.

**The Domain Palette Rule.** Activity colors exist only to distinguish categories in charts, chips, and status indicators. They never decorate structural UI elements (headers, cards, borders).

## 3. Typography

**Display / Body Font:** Geist (variable weight 100–900), loaded from Google Fonts
**Data / Statistics Font:** Geist Mono (variable weight)

**Character:** One family, two expressions. The sans carries all prose, labels, and navigation. The mono carries every number, stat, and data value — the visual distinction enforces the hierarchy between narrative and measurement without needing color or size.

### Hierarchy

- **Display** (600, 28px, line-height 1.1, -0.015em): Section hero headings. `text-wrap: balance`. App used on `h1` elements.
- **Headline** (600, 22px, line-height 1.15, -0.01em): Screen and panel titles. Used on `h2` and `.headline`.
- **Title** (600, 18px, line-height 1.3): Sub-section headings. `h3`.
- **Body** (400–500, 16px, line-height 1.5): Primary reading text, button labels, input values.
- **Label / Eyebrow** (500, 11px, +0.12em letter-spacing, UPPERCASE, `--ink-muted`): Section markers, nav labels, table headers. Use sparingly — not above every section.
- **Detail** (400, 13px): Table cells, secondary metadata, compact lists.
- **Caption** (400, 11px, `--ink-muted`): Chart axis labels, timestamps, footnotes.
- **Mono** (400, inherits size from context): All numbers and statistics. Applied via `.mono` class. Never use the UI font for a numeric readout.

### Named Rules

**The Mono Numbers Rule.** Every measurement, distance, duration, pace, and statistic renders in Geist Mono. The visual split between Geist (prose) and Geist Mono (data) is the primary hierarchy signal in data-dense views. No exceptions.

**The Eyebrow Budget Rule.** Uppercase tracked labels (`--t-xs`, `.eyebrow`) may appear at the top of a distinct section to orient the user. Using them above every section turns them into scaffolding noise. One eyebrow per logical grouping, not one per element.

## 4. Elevation

This system is flat by default. Depth is expressed through tonal surface layering — `surface-0` (canvas) → `surface-1` (card) → `surface-2` (raised inset) → `surface-3` (pressed/selected) — not through shadows. Shadows are a response to state, not a resting condition.

### Shadow Vocabulary

- **Ambient Lift** (`0 1px 2px rgba(14,19,32,.06), 0 1px 1px rgba(14,19,32,.04)`): Resting cards and inputs. Barely perceptible; the card reads as lifted because the surface is white against `--surface-0`, not because of shadow.
- **Overlay Shadow** (`0 8px 32px rgba(14,19,32,.10), 0 2px 6px rgba(14,19,32,.06)`): Dropdowns, modals, sticky headers, bottom sheets. Signals content floating above the document plane.

Dark mode uses dramatically heavier shadow opacity (0.60 / 0.85) because dark surfaces provide less tonal contrast.

Modals and bottom sheets add a `rgba(0,0,0,0.5)` backdrop with `backdrop-filter: blur(12px)`. Bottom sheets snap between three states: peek (56px) → mid (240px) → full (65vh). All overlay elements use the native Popover API (browser top layer); no `z-index` required.

### Named Rules

**The Flat-by-Default Rule.** Surfaces are flat at rest. Shadow-1 appears only on cards that need to read as lifted from the page canvas; Shadow-2 appears only when content floats above page content (dropdowns, modals, sticky headers). Hover shadows are never added to interactive cards.

## 5. Components

Components are calibrated and quiet. Every interactive element has all required states (default, hover, focus, active, disabled); none are decorative.

### Buttons

Buttons use Geist 500 weight, 13px, the UI font stack. Press state: `scale(0.98)`. Focus: `2px solid --accent, 2px offset`.

- **Shape:** Gently curved (8px radius, `--r-sm`). No pill shape on buttons.
- **Primary:** Accent background (`#4f8ef7`), white text, no border, 600 weight. Hover: `brightness(0.95)`. Used for the single most important action per screen.
- **Secondary / Default:** `--surface-1` background, `--line-strong` border, `--ink` text.
- **Ghost:** Transparent background and border. Hover: `--surface-2`. For icon-only controls and low-emphasis inline actions.
- **Destructive:** 10% `--bad` tint background, `--bad` text and border. Reserved for irreversible actions confirmed in a dialog.
- **Disabled:** Pointer-events none; the button's own disabled style (opacity or grayed out) applies contextually.
- **Sizes:** Default (40px min-height, 4/12px padding), sm (32px, compact nav/toolbar), lg (48px, 16px font, 12/24px padding), icon (40×40px, zero padding, 12px radius).

### Surfaces / Cards

- **Default (`.surface`):** Cold White `#ffffff` bg, `--line` border (1px), `--r-md` (14px) radius, Ambient Lift shadow, 16px padding.
- **Flat (`.surface.flat`):** Frost `#ebf0fa` bg, no border, no shadow. For secondary containers and inset data panels.
- **Ghost (`.surface.ghost`):** Transparent bg, no border, no shadow. For grouping without visual weight.
- **Inset (`.surface.inset`):** Frost bg, dashed border. Drop targets and placeholder slots.
- **Accent (`.surface.accent`):** Accent bg, accent-ink text. Featured CTAs and highlighted status blocks.
- **Selected (`.surface.selected`):** Accent border added to any variant. Applied when the surface represents the currently active item.

Nested cards are prohibited. A card may contain flat sub-surfaces; it may not contain another elevated card.

### Inputs / Fields

- **Default:** Cold White bg, `--line-strong` border, `--r-sm` (8px) radius, 4/12px padding, 32px min-height.
- **Focus:** Accent border + `2px solid --accent` outline, 0px offset.
- **Error:** `--bad` border, `.error-text` (11px red) label below.
- **Disabled:** Transparent border and background; content reads as inactive.
- **Ghost:** Transparent, no border. For inline title edits (e.g., route name in map view).
- For numeric inputs with a known range, use a Phosphor Minus/Plus stepper flanking the value rather than a free-text input.

### Navigation

**Desktop rail (> 780px):** 150px-wide left sidebar, `--surface-1` bg, `--line` right border.
- Items: 44px min-height, icon (20px) + label, `--r-sm` radius, icon-left layout with gap.
- Active: ink background (`#0e1320`) + `--surface-1` text in light mode; accent bg in dark mode.
- Inactive: `--ink-muted` text, transparent bg. Hover: `--surface-2`.
- Settings pinned to bottom.

**Mobile tab bar (≤ 780px):** Fixed bottom, 60px tall, `--surface-1` bg, `--line` top border.
- Items: icon (24px) centred, label below in `.eyebrow` style.
- Active: icon in `--accent`, label in `--ink`.
- At ≤ 500px: icon only, no labels.

### Chips and Badges

- **Chip (`.chip`):** Transparent bg, `--line` border, pill radius, interactive. Hover: `--line-strong` border. Active: `--surface-2` bg + `--line-strong` border.
- **Badge (`.badge`):** `--surface-2` bg, pill radius, non-interactive label. Status variants (`.ok`, `.warn`, `.bad`) set `--badge-color` driving an internal dot.

### Tabs

Underline style. Inactive: `--ink-muted`, transparent border-bottom. Active: `--ink`, 2px `--accent` border-bottom. No filled-pill active state.

### Switches / Toggles

Pill-shaped track (`--r-pill`), `--surface-3` resting, `--accent` when checked. Thumb: white circle with Ambient Lift shadow, slides with `transform`.

### Empty States

Three-element centred column — used whenever a list or section has no data:
1. Phosphor icon, 48px, `--ink-faint`
2. Headline: `--t-lg`, 600 weight, centred
3. Subtext: `--t-md`, `--ink-muted`, centred, max 2 lines
4. Primary button (when a clear next action exists)

### Screen Header

Three-slot sticky header on every secondary/sub-screen:
- Leading (40px): Phosphor `CaretLeft` back button, always top-left.
- Centre: Screen title, `--t-md` 600 weight, centred.
- Trailing (40px): Single optional primary action.
- `--surface-1` bg, 1px `--line` bottom border, `z-index: --z-controls`.

Never place the back button top-right. Never put branding or a theme toggle in this bar.

### Charts

All charts use the `<ChartContainer>` scaffold: eyebrow label (`--t-xs` uppercase `--ink-muted`) + optional value pill (`.pill.accent`) + chart body (Recharts, 100% width, `--ink-faint` axis lines). Use semantic domain color tokens for series. Use `--accent` only for single-series generic data. Hardcoded hex in chart config is prohibited.

### Signature Component: Icon Rail

Vertical nav rail used in tool screens (Route Planner, session views): 56px wide, icon + 11px uppercase label stacked, `--r-sm` on each item, active state fills `--surface-2`. A collapse button at the top toggles the adjacent content panel.

## 6. Do's and Don'ts

### Do:
- **Do** use Geist Mono for every number, statistic, pace, and measurement — `.mono` class.
- **Do** use Phosphor Icons: outline weight for default/inactive, fill weight for active/selected states.
- **Do** compose layout from primitives (`.row.align-center.gap-2`) before writing new rules.
- **Do** use `gap` on the parent container for sibling spacing — never `margin-top/bottom/right` on individual elements.
- **Do** hit 44px minimum touch targets on all interactive elements (use padding, not element size).
- **Do** use `--ink-muted` for secondary labels and `--ink-faint` for placeholders and disabled content.
- **Do** put destructive actions in a visually separated section with `--bad` tint background.
- **Do** include a CTA in every empty state that has a clear next action.
- **Do** show real data — never permanent dashes or skeleton placeholders as finished UI.
- **Do** respect `prefers-reduced-motion`: crossfade or instant transition, never blocked content.

### Don't:
- **Don't** add inline `style=""` attributes — all styling through tokens and CSS classes.
- **Don't** use emoji in UI chrome — Phosphor icons only; emoji only in user-generated content.
- **Don't** display more than one accent-background element visible at a time.
- **Don't** nest elevated cards (`.surface` with shadow inside another `.surface` with shadow).
- **Don't** put a theme toggle or branding in any screen header bar — Settings only.
- **Don't** use `margin-top/bottom/right` on siblings — use `gap` on the parent.
- **Don't** hardcode hex or `px` values outside `styling/tokens.css` — always reference a token.
- **Don't** introduce domain vocabulary (sport names, health terms, rarity levels) into the `atoms`, `molecules`, or `layout` layers — domain lives in the `project` CSS layer only.
