---
target: ui/screens/home
total_score: 19
p0_count: 1
p1_count: 3
timestamp: 2026-06-03T21-28-37Z
slug: ui-screens-home
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | hidden={true} on main widget grid; weather is hardcoded mock; toast has no auto-dismiss |
| 2 | Match Between System / Real World | 3 | Domain language is solid; Import/Export as daily-dashboard widgets is dissonant |
| 3 | User Control and Freedom | 2 | Toast dismissible; no skip for first-run; no undo |
| 4 | Consistency and Standards | 2 | Three icon libraries; Link styled as buttons; raw span instead of Badge component |
| 5 | Error Prevention | 2 | Import widget validated well; --color-danger token missing; grid area mismatch |
| 6 | Recognition Rather Than Recall | 2 | "edit" button with no affordance; utility widgets before data widgets |
| 7 | Flexibility and Efficiency | 1 | No keyboard shortcuts; widget customisation not implemented |
| 8 | Aesthetic and Minimalist Design | 2 | Utility widgets dominate; training data hidden |
| 9 | Error Recovery | 2 | Import errors clear; grid area toast undefined; --color-danger silent fail |
| 10 | Help and Documentation | 1 | First-run section present but unstyled; no contextual help elsewhere |
| **Total** | | **19/40** | **Acceptable — significant improvements needed** |

## Anti-Patterns Verdict

LLM assessment: Not AI-slop aesthetically. Token system and component vocabulary are solid. The problem is structural: the screen is half-built and the build order is inverted. Utility admin widgets render prominently; training data is hidden. Passes aesthetic slop test, fails UX test immediately.

Deterministic scan: Zero findings from detect.mjs. Issues here are structural, not cosmetic markup patterns.

## Overall Impression

Strong foundations — clean token system, correct component vocabulary, athlete-appropriate language. The home screen puts four settings-tier widgets (Import Data, Export Data, Edit Display Name, Plan Route) in the primary widget slot, and hides actual data widgets behind `hidden={true}`. A performance athlete sees an admin panel. The rich widget library in DashWidgets.tsx is built but not wired.

## What's Working

1. WelcomeWidget is the right idea, executed well: date-aware greeting, workout count, streak badge, quiet and data-forward.
2. ImportDataWidget error handling is specific, plain-language, and actionable — the standard for the rest of the screen.
3. Token system and layout primitives are solid throughout all widget files.

## Priority Issues

**[P0] Main data widget grid is `hidden={true}`**
The `<Grid min="sm" hidden={true}>` (HomeScreen.tsx:165) containing SleepLarge, WeatherWidget, CalendarLarge is hidden. The entire lower data half of the dashboard doesn't render.
Fix: Remove `hidden={true}`. Verify Grid component's hidden prop handling.
Command: $impeccable polish ui/screens/home

**[P1] Utility widgets occupy the primary data slot**
EditDisplayNameWidget, ImportDataWidget, ExportDataWidget, PlanRouteWidget render as the first visible widgets. These are settings-tier. DashWidgets.tsx contains 14 rich widgets (Readiness, HRV, Activity Feed, Goals, Insights) that are built but not wired to the home screen.
Fix: Move utility widgets to Settings/Profile. Define default layout using DashWidgets.tsx subset.
Command: $impeccable shape home screen default widget layout

**[P1] Three icon libraries active — Phosphor is the spec**
WelcomeWidget: lucide Flame. DashWidgets: lucide Flame. dashboardUtils: react-icons/md sport icons. DESIGN.md specifies Phosphor only.
Fix: Replace lucide imports with phosphor-react equivalents. Remove or replace react-icons/md.
Command: $impeccable audit ui/components/widgets

**[P1] Grid area "toast" declared but not defined in grid template**
GridItem area="toast" (HomeScreen.tsx:78) references area not in Grid areas="welcome-widget". Silent layout failure.
Fix: Define toast area in the template, or move toast outside the Grid as a fixed/portal element.
Command: $impeccable polish ui/screens/home

**[P2] --color-danger is not a valid token — correct token is --bad**
dashboardUtils.ts:9 RING_COLORS.poor = 'var(--color-danger)'. Token doesn't exist. Silent wrong color for poor readiness scores.
Fix: Change to var(--bad). Audit for other invalid token references.
Command: $impeccable audit ui/screens/home

**[P2] WeatherWidget uses hardcoded mock data and emoji icons**
All weather data is hardcoded. current_conditions query from useHomeScreen is not passed to WeatherWidget. Uses emoji in UI chrome (violates DESIGN.md). Modal uses className="modal-overlay" on raw div (clipping risk).
Fix: Wire current_conditions as props. Replace emoji with Phosphor icons. Migrate modal to dialog.
Command: $impeccable harden ui/components/widgets/WeatherWidget

## Persona Red Flags

**Alex (Performance Athlete, Power User)**: Readiness widget absent from dashboard. First visible widgets are Import/Export Data. Ghost "edit" button does nothing. Dashboard provides zero daily decision support. Navigates away to Log or Profile instead.

**Sam (Accessibility-Dependent)**: First-run CTAs use Link styled as buttons — announced as "link: Open map" not "button" by screen reader. RARITY_EMOJI map outputs text strings under aria-hidden span — nothing renders for rarity indicator.

**Custom — Pre-Run Check**: Opens app to check readiness and weather before morning run. Sees greeting, then four admin widgets. Taps through two before realising they're settings. Closes app, checks Garmin instead.

## Minor Observations

- Dismiss button uses "x" text — should be Phosphor X icon
- Fallback readiness score of 82 when no entry exists is misleading — should be null with a no-data state
- RARITY_EMOJI maps to text strings ("Bronze") not emoji, under aria-hidden span — nothing renders
- useHomeScreen.ts eslint-disable on line 25 suppresses legitimate exhaustive-deps warning
