Title: Home Screen — One-page Design Brief

Purpose:
- Daily dashboard providing the user’s readiness, next session, and motivation.

Audience:
- Product, UX, Visual Designer.

Goals:
- Surface next action (Start/Resume session) and a concise health snapshot.
- Encourage engagement via clear CTAs and motivational metrics.

Layout & Structure:
- Top hero (readiness + CTA), mid cards (metrics & trends), activity feed bottom.

Key Components:
- Readiness card, next-session card, metric tiles, quick actions strip, recent activity feed.

States & Interactions:
- Collapsible sections, CTA primary animation, inline edit for quick notes.

Content Guidelines:
- Prioritize one CTA; metrics use consistent units and sparklines for trend.

Accessibility:
- Ensure semantic headings, large CTAs, color-safe indicators, keyboard navigation.

Assets for Figma:
- Token set for spacing/colors, sample data for metrics, iconography.

Acceptance Criteria:
- At a glance user knows readiness and next step; CTA succeeds in 1 tap.

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