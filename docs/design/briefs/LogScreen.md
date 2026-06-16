Title: Log Screen — One-page Design Brief

Purpose:
- Central hub for session logs (past and ongoing), creation, and quick actions.

Audience:
- UX, Product.

Goals:
- Surface active sessions, provide fast access to create/log entries.

Layout & Structure:
- Top controls (new session), list of sessions grouped by date, quick actions.

Key Components:
- Session tile, FAB for new session, filter/sort controls, in-timeline markers for ongoing sessions.

States & Interactions:
- Start/resume actions, swipe actions (delete/edit), inline quick-edit.

Content Guidelines:
- Keep session titles descriptive; show primary metric prominently.

Accessibility:
- Ensure clear focus order and accessible labels for actions.

Assets for Figma:
- Session list components, FAB variants, empty-state artwork.

Acceptance Criteria:
- Create or resume a session in 2 taps; session list readable at glance.

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