# Spec: Nav Restructure + Profile Tabs

**Date:** 2026-05-07
**Status:** Approved

---

## Context

The mobile nav currently has a Nutrition tab as one of five slots. As the app grows, that slot is more valuable for an Activity planning entry point (Spec 3). Nutrition moves into the Profile screen as a tab, keeping it accessible without occupying prime nav real estate.

The Profile screen also has no tabbed structure — metrics, injuries, achievements, PRs, and goals all sit in one long scroll. Adding tabs lets us organise content into Activities (social sharing history), Health (consolidated metrics, sleep, injuries), and Nutrition (existing screen), while keeping achievements, PRs, and goals anchored in the profile hero above the tabs.

"Kudos" is replaced with "Likes" throughout the app to use less derivative terminology.

---

## Scope

This spec covers:
- Mobile nav tab swap (Nutrition → Activity)
- Desktop nav addition (Activity tab added)
- Profile screen tab structure and content organisation
- "Kudos" → "Likes" rename across the app

Not in scope: Activity screen content (Spec 3), Discover/map (Spec 2), live run notifications (Spec 4).

---

## 1. Navigation Changes

### Mobile (≤780px) — bottom tab bar

| Position | Before | After |
|----------|--------|-------|
| 1 | Home → `/dashboard` | Home → `/dashboard` |
| 2 | Workout → `/log-v2` | Workout → `/log-v2` |
| 3 | Nutrition → `/nutrition` | **Messages → `/messages`** |
| 4 | Social → `/social` | Social → `/social` |
| 5 | Profile → `/profile` | Profile → `/profile` |

### Desktop (>780px) — left sidebar rail

All existing tabs retained. Messages tab added to the rail (after Social, before Profile). Nutrition tab stays — it is not removed from desktop.

### New `/messages` route

`MessageScreen` already exists at `ui/layouts/MessageScreen.tsx`. Add it to the barrel export and wire up the `/messages` route in App.tsx.

---

## 2. Profile Screen Tabs

### Approach: Component composition

Profile screen uses `useState<'activities' | 'health' | 'nutrition'>('activities')` to control active tab. Tab bar rendered using existing `.tabs` / `.tab` / `.tab.active` CSS classes (same pattern as Social screen). Each tab renders a focused component, not inline JSX.

### Profile hero (unchanged above tabs)

Existing hero content stays in the main profile section above the tab bar:
- Avatar, name, email, active status
- Summary stats (total sessions, lifts, km)
- Achievements, Personal Records, Goals

### Tab: Activities

Shows sessions the user has posted to the social feed.

- Filter sessions by shared-to-feed flag (e.g. `sharedToFeed: true` or equivalent). The Social feed already has a posts/sharing mechanism — implementation should check whether posts reference session IDs or whether sessions carry a flag, and derive the list accordingly rather than adding a duplicate field.
- Each card displays: session title, date, key stats (duration, exercises or distance), likes count
- Tapping a card navigates to the existing `SessionDetailScreen`
- Empty state: "No shared sessions yet. Share a workout from your session history."

### Tab: Health

Consolidates health data currently scattered across Profile and Dashboard into one place.

Sections (in order):
1. **Body metrics** — weight, resting HR, HRV, VO₂ max (moved from profile hero)
2. **Sleep** — sleep summary using the same data/component as the Dashboard sleep card
3. **Injuries** — active injury tracking with resolve functionality (moved from profile hero)

Body metrics and injuries are extracted from the profile hero into a `HealthTab` component. The hero retains achievements, PRs, and goals only.

### Tab: Nutrition

Renders `<NutritionScreen />` directly. No changes to the nutrition UI or data. The standalone `/nutrition` route can remain active (desktop nav still links to it) — this tab is a second entry point, not a replacement.

---

## 3. Likes (replaces Kudos)

All instances of "kudos" replaced with "likes" across the codebase:
- Social feed activity cards
- Session detail screen
- Profile Activities tab cards
- Any button labels, counters, or aria labels
- Icon: heart (♥) — replace any raised-fist or clap icon if present

This is a string and icon swap only — no data model changes required unless the field is named `kudos` in the data layer, in which case add a display alias or rename consistently.

---

## Files to Modify

| File | Change |
|------|--------|
| `ui/layouts/TabNavigation.tsx` | Swap mobile Nutrition entry for Messages; add Messages to desktop rail |
| `app/registry/App.tsx` | Add `/messages` route → `MessageScreen` |
| `ui/layouts/ProfileScreen.tsx` | Add tab bar, extract Health content into `HealthTab`, wire Activities and Nutrition tabs |
| `ui/layouts/NutritionScreen.tsx` | No changes (imported as component) |
| `ui/layouts/SocialScreen.tsx` | "Kudos" → "Likes", update icon |
| Any other files referencing "kudos" | String replace |

New files:
| File | Purpose |
|------|---------|
| `ui/components/profile/ActivitiesTab.tsx` | Shared-session list with cards |
| `ui/components/profile/HealthTab.tsx` | Metrics + sleep + injuries |

---

## Verification

1. Mobile nav shows Messages tab in position 3; Nutrition tab is gone
2. Messages tab navigates to `/messages` without error
3. Desktop sidebar shows all previous tabs plus Messages; Nutrition remains
4. Profile screen renders three tabs — Activities, Health, Nutrition
5. Activities tab shows only sessions with the shared-to-feed flag set; empty state shown when none exist
6. Health tab shows body metrics, sleep summary, and injuries; metrics and injuries no longer appear in the hero
7. Nutrition tab renders the full nutrition logging UI
8. Achievements, PRs, and Goals remain in the profile hero above the tabs
9. No instance of "kudos" visible anywhere in the UI
