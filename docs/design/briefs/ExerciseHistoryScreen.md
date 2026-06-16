Title: Exercise History — One-page Design Brief

Purpose:
- Browse past sessions and scan outcomes quickly.

Audience:
- Users, Designers, PM.

Goals:
- Make it easy to find a session and view summary metrics.

Layout & Structure:
- Chronological list with filter controls and expandable details.

Key Components:
- Session card (date, type, summary), filters, search, infinite scroll/pagination.

States & Interactions:
- Expand for full metrics, quick re-run or duplicate session, share button.

Content Guidelines:
- Show win metrics (time, distance, top metric) prominently.

Accessibility:
- Clear headings per date group; ensure tap targets and reading order.

Assets for Figma:
- Session card component, expanded-state layout.

Acceptance Criteria:
- Users can find a past session via search or filter within 3 interactions.

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