Title: Route Planner — One-page Design Brief

Purpose:
- Build and preview outdoor routes with distance/elevation context.

Audience:
- Product, UX designer, Mapping engineer.

Goals:
- Make creating, editing, and saving routes fast and visual.

Layout & Structure:
- Large map canvas, floating control panel for inputs, bottom summary bar.

Key Components:
- Map, start/end inputs, draw/modify tools, elevation profile, save/share actions.

States & Interactions:
- Draw mode vs. edit mode, snap-to-trails, preview elevation interaction, undo/redo.

Content Guidelines:
- Keep overlays minimal; primary controls contrast with map.

Accessibility:
- Keyboard shortcuts for drawing actions, textual distance/elevation readouts.

Assets for Figma:
- Map frame components, control panel variants, elevation sparkline components.

Acceptance Criteria:
- User can draw and save a route within 3 interactions; preview accurate.

Design System Reference:
- Theme: calm and data-forward with a clinical, trustworthy tone.
- Light mode: off-white page background, white cards, navy-ink text. Dark mode: deep navy background, midnight-blue cards, cool-white text.
- Accent: sky blue for primary actions and active states, used sparingly.
- Typography: Geist body, Geist Mono for numbers, headings sized progressively from 16px to 56px, captions at 11px.
- Components: primary buttons use accent background with white text; secondary buttons use surface background and border; cards are surface-1 with subtle border and shadow; inputs use surface-1 fill with line border.
- Layout: use token-based spacing, parent `gap` instead of element margins, content constrained to 960px on desktop, forms 480px, full bleed only for map or media-heavy screens.
- Navigation: mobile uses a bottom tab bar on small screens; desktop uses a left rail with an optional pin for settings.

Web vs App Guidance:
- Web: desktop-first, left navigation rail, hover states, tooltips, wider content panels, and keyboard shortcuts where appropriate.
- App: mobile-first, bottom tab bar, simplified flows, bottom sheets for contextual panels, and gesture-friendly controls.

Mobile vs Desktop Guidance:
- Mobile: stacked single-column layout, 44px minimum touch targets, sticky headers, icon-only tabs on very small widths, bottom sheet contextual panels.
- Desktop: two-pane layouts for maps/messages, fixed left rail or side panel, hover affordances, card grids, and constrained max-width content pages.