Title: Tab Navigation — One-page Design Brief

Purpose:
- App-level navigation shell: expose primary sections and quick actions.

Audience:
- UI/UX Designer, Product Manager, Frontend Engineer.

Goals:
- Make primary destinations discoverable and tappable.
- Surface unread/activity badges and quick actions.

Layout & Structure:
- Bottom tab bar with 4–5 primary tabs, plus overflow/More.
- Optional center FAB for primary action (Start Session).

Key Components:
- Tab items (icon + label), active state, unread badge, long-press context menu, optional swipe gestures.

States & Interactions:
- Active/inactive states, focused/high-contrast for accessibility, keyboard focus.
- Animated active indicator (slide or scale).

Content Guidelines:
- Labels: short (1 word), use tokens for spacing and sizes.
- Badge: single-digit shorthand ("9+" truncation).

Accessibility:
- 48px minimum tap targets, 4.5:1 contrast for active label color, screen-reader labels.

Assets for Figma:
- Icon set (filled + outline), tokens for spacing/colors, motion spec (200ms ease).

Acceptance Criteria:
- Tab bar usable on small/large devices; active tab visible; badges readable.

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