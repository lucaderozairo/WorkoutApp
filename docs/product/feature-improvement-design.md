# Workout App Feature Improvement Design Spec
**Date:** 2026-06-09  
**Status:** Draft

---

## Overview

This spec describes the complete improvement backlog for the workout app as a local-first hybrid training system. The product direction is not just logging workouts; it should turn logged data into guidance:

```text
User action -> Data -> Interpretation -> Guidance -> Next action
```

The current app already has meaningful foundations: event-sourced training logs, saved routes, route planning, templates, rest timers, exercise history, readiness and sleep data, nutrition data, profile health categories, social/messaging surfaces, notifications, and widget infrastructure. The next phase is to make those features more trustworthy, visible, connected, and competitive.

This is a design spec and backlog, not an implementation checklist. Detailed implementation plans should be split from this document by product area.

---

## Section 1: Trust, Data Integrity & Source Transparency

Trust is the highest-priority product requirement. Any metric that looks precise must be backed by real data, clearly labeled as estimated, or removed until it can be made honest.

### Readiness no-data behavior

The app must not show a default readiness score when the user has not logged or imported readiness inputs.

**Required behavior:**
- No readiness entry -> show an empty/no-data state.
- Manual readiness entry -> label as manual.
- Garmin/wearable readiness entry -> label with source.
- Mixed readiness score -> show contributing factors and source labels.

**Current risk to resolve:**
- `useHomeScreen` falls back to `82` when `today_readiness` has no entry. This should be replaced with a no-data state.

### Route elevation and surface integrity

Route planner elevation and surface mix must not be fabricated.

**Required behavior:**
- Use real DEM/elevation data when available.
- Use OSM-derived surface tags when available.
- If data is unavailable, hide the metric or show an explicit "estimated" state with low confidence.
- Route calories must account for activity, distance, bodyweight when available, and elevation gain when real elevation exists.

**Acceptable source labels:**
- `Real elevation`
- `Estimated elevation`
- `Surface from OSM`
- `Surface unavailable`
- `Estimated calories`

### Data provenance model

All user-facing health, session, route, and nutrition values should expose source provenance.

```ts
type DataSourceKind = 'manual' | 'imported' | 'synced' | 'estimated' | 'mock';

type DataProvenance = {
  source: DataSourceKind;
  provider?: 'garmin' | 'strava' | 'healthkit' | 'file' | 'app';
  confidence?: 'high' | 'medium' | 'low';
  importedAt?: number;
};
```

This does not need to be added everywhere in one pass. New implementation plans should add provenance to the data they touch.

---

## Section 2: Home & Daily Command Center

The home screen should become the daily command center for a hybrid athlete. It should answer three questions immediately:

1. How ready am I today?
2. What should I do next?
3. How am I trending?

### Primary dashboard modules

The default home layout should prioritize:
- Readiness score or no-data state.
- Readiness factor breakdown.
- Sleep summary and sleep debt.
- Last workout summary.
- Next planned workout.
- Weekly training load or volume.
- Nutrition and hydration status.
- Weather and route suitability.
- Streak and achievement progress.
- Top coaching insight.

### Widget personalization

The widget grid should support:
- Add/remove widgets.
- Reorder widgets.
- Resize widgets.
- Goal-based defaults, such as strength, endurance, weight loss, general fitness, or recovery.
- Separate "admin" actions from insight widgets.

Import, export, display name editing, and settings are valuable, but they should not dominate the first screen.

### Empty states

Every dashboard module must have an intentional empty state:
- No readiness data.
- No workouts yet.
- No plan selected.
- No nutrition logged today.
- Weather unavailable.
- No insights yet.

Empty states should explain the next action without implying unavailable data exists.

---

## Section 3: Strength Training Improvements

Strength logging is already a real product surface. The improvements should make it feel like a coaching tool rather than a structured spreadsheet.

### Template management

Saved templates should become first-class:
- Rename template.
- Duplicate template.
- Delete template.
- Favorite template.
- Reorder exercises.
- Edit template without starting a session.
- Start from recent routine.
- Suggest template from training history.

### In-session tools

Add the expected strength workflow helpers:
- Plate calculator.
- Warmup set suggestions.
- Exercise-specific rest defaults.
- Auto-rest timer start after logging a set.
- Previous performance inline by exercise.
- Progressive overload suggestions.
- Failure and RPE trend warnings.

### Exercise library

Introduce or formalize exercise metadata:

```ts
type ExerciseLibraryEntry = {
  id: string;
  name: string;
  aliases: string[];
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string[];
  movementPattern: string;
  instructions?: string[];
  mediaUrl?: string;
};
```

The library should power:
- Exercise picker search.
- Substitutions.
- Muscle heatmaps.
- Progress grouping across aliases.
- Form guidance.

### Progression and PRs

Build on existing progression, 1RM, PR, and plateau foundations:
- PR history by exercise.
- Estimated 1RM trend.
- Rep-max trend.
- Volume trend.
- Frequency by muscle group.
- Plateau explanation and next-step suggestion.
- Deload and substitution guidance when fatigue or injury signals rise.

---

## Section 4: Cardio & Route Improvements

Cardio already supports import and route planning, but it needs native recording and trustworthy route intelligence to compete with endurance apps.

### Current route planner critique

The current route planner has a strong foundation: full-screen map workspace, activity modes, route snapping, search, undo/redo, base layers, waypoints, saved routes, segment pace inputs, distance markers, and a side rail for plan/pins/stats/saved panels.

The main problems are trust, hierarchy, and workflow organization:
- Elevation and surface mix appear analytical but are not backed by real terrain or OSM surface data.
- Important concepts are split across rail panels, floating controls, mobile tabs, route details, and map controls without a clear planning sequence.
- Plan, edit, inspect, save, and export are not presented as distinct workflow stages.
- The stats panel mixes actual route facts with estimates, which makes every number feel less trustworthy.
- Saved routes are present, but they do not yet feel like a route library with filters, versions, tags, or reuse paths.
- Distance markers, elevation profile, surface, and pace estimates are useful, but they need better source labels and confidence states.
- The route planner is task-rich, but the UI should make the next route-building action obvious at all times.

### Competitor benchmark

The route planner should learn different lessons from each competitor:

| Competitor | What they do well | Lesson for this app |
|---|---|---|
| Komoot | Activity-specific routing, surface breakdown, elevation context, highlights, turn-by-turn navigation, offline navigation. | Make route suitability explainable by sport, surface, elevation, and navigation readiness. |
| Strava | Heatmap-informed route suggestions, route generation from start/current location, POIs, segments, popularity, performance context. | Use athlete behavior and performance context to make route choice faster, not just more detailed. |
| AllTrails | Trail discovery, community reviews/photos, trail conditions, offline maps, wrong-turn alerts, clear filters for outdoor use. | Add safety, conditions, and discovery layers for hiking/trail users instead of treating every route as a blank geometry. |
| Plotaroute | Deep route editing: reshape, replot section, split/combine, loops, detours, radius maps, route timers, map snapping. | Add advanced editing tools, but organize them behind modes so the primary route flow stays calm. |
| RideWithGPS / Garmin / Wahoo | Device export, turn cues, route libraries, elevation detail, cycling-focused navigation. | Treat export and device handoff as part of planning, not an afterthought. |
| Locus Map / Organic Maps style tools | Offline maps, POIs, custom map layers, navigation robustness. | Long routes and remote routes need offline and safety affordances before they are trusted. |

### Route planner UX organization

The route planner should be reorganized around a route-building workflow rather than a collection of controls.

Recommended information architecture:
- **Plan:** activity, start/end, waypoints, snap mode, routing profile, search.
- **Edit:** add point, move point, split route, delete section, reverse, replot section, detour, out-and-back, loop, simplify points.
- **Inspect:** distance, elevation, gradient, surface, difficulty, time, calories, weather, POIs, warnings.
- **Navigate/export:** turn cues, GPX/TCX/FIT export, send to Garmin/Wahoo/Strava, offline package, print/cue sheet.
- **Library:** saved routes, favorites, tags, filters, versions, recently used, routes attached to planned sessions.

On desktop, this can remain a rail plus side panel, but each rail item should map to one workflow stage. On mobile, use a bottom sheet with the same stages so controls do not disappear behind map chrome.

### Route data model

Routes need a richer model than waypoints plus distance.

```ts
type RouteDataStatus = 'real' | 'estimated' | 'unavailable';

type PlannedRouteMetrics = {
  distanceKm: number;
  elevationGainM?: number;
  elevationLossM?: number;
  surfaceMix?: Record<string, number>;
  difficulty?: 'easy' | 'moderate' | 'hard' | 'very_hard';
  estimatedMovingTimeSec?: number;
  estimatedCalories?: number;
  dataStatus: {
    elevation: RouteDataStatus;
    surface: RouteDataStatus;
    weather: RouteDataStatus;
    calories: RouteDataStatus;
  };
};
```

The UI should render data status next to the metric, not hidden in a footnote.

### Native GPS recording

Add live recording for:
- Run.
- Ride.
- Walk.
- Hike.

Recording should capture:
- Time.
- Distance.
- GPS track.
- Pace/speed.
- Elevation when available.
- Heart rate when available.
- Cadence and power when available.
- Splits/laps.

### Route import and export

The route planner and completed activity flows should support:
- GPX export.
- TCX export.
- FIT export when feasible.
- Import planned route into a new cardio session.
- Attach saved route to a planned session.
- Export route to device integrations in later phases.
- Cue sheet export for turn-by-turn route plans.
- Route package export with map, cues, elevation, and safety notes.

### Route intelligence

Improve route planning with:
- Real elevation lookup.
- Real surface lookup.
- Difficulty rating.
- Elevation-adjusted calorie estimate.
- Gradient coloring on the route line.
- Climb detection.
- Distance markers default-on.
- POIs and route highlights.
- Route weather forecast by date/time.
- Turn-by-turn directions.
- Offline map support as a long-term platform feature.
- Sport-specific route scoring for run, road ride, gravel, MTB, hike, walk, and trail run.
- Heatmap/popularity layer when privacy-safe aggregate data exists.
- Trail condition layer when user/community or external data exists.
- Route warnings for private roads, missing sidewalks, ferry segments, extreme gradients, exposed terrain, and poor surface confidence.
- POI categories: water, toilets, cafes, viewpoints, transit, parking, bike shops, trailheads.
- Time-of-day and daylight checks for long routes.
- Weather risk checks for heat, wind, rain, ice, storm risk, and poor visibility.

### Advanced route editing

Add advanced editing tools in a controlled mode so the planner does not become noisy for normal users:
- Replot section.
- Reshape route by dragging anchors.
- Split route.
- Combine routes.
- Reverse route.
- Create out-and-back.
- Create loop.
- Add detour.
- Delete section.
- Simplify/reduce points.
- Snap imported GPS track to map.
- Measure section.
- Generate route by target distance/time.
- Generate circular route from a start point.

Advanced tools should be command-like, reversible, and visibly scoped to the selected route section.

### Route library

Saved routes should become a library:
- Filter by activity, distance, elevation, surface, location, tags, difficulty, and last used.
- Mark favorite routes.
- Duplicate route.
- Version route after edits.
- Attach route to planned session.
- Attach route to completed session.
- Compare two route versions.
- Show data completeness before reuse.
- Show route source: manually planned, imported GPX, saved from session, synced from service.

### Safety and navigation readiness

Before a route is used outdoors, the app should surface a readiness checklist:
- Route has real or accepted estimated elevation.
- Surface confidence is acceptable for selected sport.
- Weather checked for planned time.
- Daylight window is sufficient.
- Offline map available if needed.
- Turn cues generated.
- Device export complete if using a watch/head unit.
- Privacy zones applied before sharing.

This is especially important for trail, hike, gravel, and long-distance routes.

### Device and service sync

Long-term integration targets:
- Strava route/activity sync.
- Garmin import/export sync.
- Wahoo route export.
- HealthKit workout write.

---

## Section 5: Progress, Analytics & Coaching

Progress should be easy to find and should explain the meaning of the user's data.

### Navigation and discoverability

The progress screen exists but should be intentionally routed and visible when production-ready.

Required improvements:
- Re-enable progress navigation.
- Link exercise history from session details and exercise rows.
- Link training load from home.
- Link plan adherence from training plans and home.

### Training load

Add a training load model for hybrid athletes:

```ts
type TrainingLoadPoint = {
  date: string;
  acuteLoad: number;
  chronicLoad: number;
  form: number;
  rampRate: number;
};
```

The app should surface:
- Acute load.
- Chronic load.
- Form/freshness.
- Weekly ramp rate.
- Monotony or strain when enough data exists.
- Warnings for sudden load spikes.

### Analytics views

Add or improve:
- Strength volume by exercise.
- Strength volume by muscle group.
- Cardio distance and pace trends.
- Heart-rate zone distribution.
- Power/cadence trends when imported.
- Plan vs actual.
- Week vs week.
- Before/after training block.
- Chart annotations for illness, travel, deloads, injuries, races, and plan changes.

### Coaching insights

Coaching should remain a read-model consumer that emits its own insight events.

Insight examples:
- "Your squat volume has plateaued over the last 3 sessions."
- "Your 7-day load is rising faster than your 28-day base."
- "You slept poorly after your hardest session this week."
- "You are under-fueled on high-volume days."
- "Your next planned workout may need a lighter variation."

Insights must be explainable and link back to the underlying data.

---

## Section 6: Readiness, Recovery & Health

Readiness should be useful only when it is grounded in real or user-entered signals.

### Readiness factor breakdown

The readiness view should show:
- Sleep duration.
- Sleep quality.
- HRV when available.
- Resting heart rate when available.
- Soreness.
- Mood.
- Energy.
- Recent training load.
- Nutrition/hydration context when available.
- Manual override when used.

### Baselines and trends

Add:
- 7-day baseline.
- 30-day baseline.
- Personal normal range.
- Trend direction.
- "Below baseline" and "above baseline" explanations.

### Sleep and recovery

Improve sleep/recovery with:
- Sleep stage visualization.
- Sleep debt.
- Bedtime consistency.
- Recovery trend.
- Train/maintain/rest recommendation.
- Optimal bedtime suggestion as a later feature.

### Behavior journal

Add a daily behavior journal for:
- Alcohol.
- Caffeine.
- Late meal.
- Supplements.
- Stress.
- Screen time.
- Travel.
- Illness.
- Menstrual/cycle symptoms.
- Medication.

Behavior data should feed correlations only after enough data exists.

### Injury-aware training

Improve injury tracking with:
- Affected exercises.
- Pain trend.
- Suggested substitutions.
- Return-to-training status.
- Session warnings when planned exercises conflict with active injuries.

### HealthKit and wearable hub

HealthKit should be treated as a major iOS platform feature:
- Read sleep, HRV, RHR, steps, workouts, body metrics.
- Write completed sessions/workouts when user permits.
- Preserve source provenance for every synced value.

---

## Section 7: Nutrition

Nutrition should connect to training, readiness, and recovery rather than living as a disconnected log.

### Daily nutrition surface

Add dashboard modules for:
- Calories.
- Protein.
- Carbs.
- Fat.
- Hydration.
- Caffeine.
- Supplements.
- Medication.

### Targets

Support user-configurable:
- Macro targets.
- Hydration target.
- Protein target by bodyweight.
- Training-day carb target.
- Caffeine cutoff time.
- Supplement reminders.

### Import and review

Improve nutrition import:
- CSV import review screen.
- Row-level validation.
- Edit-before-save.
- Duplicate detection.
- Clear unsupported-field warnings.

### Training correlations

Generate insights such as:
- Under-fueled hard sessions.
- Low protein consistency during strength blocks.
- Poor hydration on high-sweat days.
- Caffeine timing affecting sleep.
- Bodyweight trend relative to calorie intake and training volume.

### Long-term nutrition features

Potential later additions:
- Food database.
- Barcode scanning.
- Meal templates.
- Recipe import.
- MyFitnessPal/Cronometer sync.

---

## Section 8: Planning & Adaptive Training

Planning should connect templates, schedules, sessions, adherence, readiness, and coaching.

### Route and schedule visibility

The app should intentionally expose:
- Training plan screen.
- Schedule screen or schedule section.
- Planned sessions.
- Saved templates.
- Saved routes.
- Upcoming plan on home.

### Planned sessions

Add support for:
- Recurring planned sessions.
- Drag/reschedule.
- Skip with reason.
- Complete from matching logged session.
- Start session from plan.
- Attach saved template.
- Attach saved route.

### Plan adherence

Adherence should track:
- Completed planned sessions.
- Skipped planned sessions.
- Missed planned sessions.
- Current adherence rate.
- Weekly adherence.
- Plan streak.

### Adaptive training

The app should eventually adjust recommendations based on:
- Readiness.
- Sleep.
- Training load.
- Missed sessions.
- Plateau detection.
- Soreness.
- Injury status.
- Nutrition gaps.

Adaptive changes should be suggestions first, not silent plan mutations.

---

## Section 9: Social, Sharing & Community

Social features should clearly distinguish between local/mock surfaces and real cross-user behavior.

### Shareable objects

Add shareable links for:
- Session summary.
- Route.
- Workout template.
- Training plan.
- Achievement.

### Privacy controls

Users should control visibility for:
- Session.
- Route map.
- Pace/speed.
- Heart rate.
- Body metrics.
- Nutrition.
- Readiness.
- Profile fields.

### Community features

Backend-dependent features:
- Friends.
- Clubs.
- Comments.
- Reactions.
- Mentions.
- Events.
- Challenges.
- Leaderboards.

Leaderboards should wait until identity, privacy, moderation, and anti-cheat rules are defined.

### Sharing media

Improve image sharing:
- Better session summary cards.
- Route snapshot cards.
- PR cards.
- Weekly recap cards.
- Brand-safe export dimensions for common social platforms.

---

## Section 10: Notifications

Notifications should become durable, preference-controlled, and event-driven if they continue growing.

### Event-sourced notification path

Durable notifications should follow the project pattern:
- Commands.
- Events.
- Projections.
- Queries.

Suggested events:
- `NotificationCreated`
- `NotificationRead`
- `AllNotificationsRead`
- `NotificationPreferenceUpdated`

### Notification preferences

Support preferences for:
- PRs.
- Plan reminders.
- Rest timer.
- Streaks.
- Readiness drops.
- Sleep debt.
- Route weather.
- Nutrition reminders.
- Social activity.
- Weekly digest.

### Deep links

Every notification should link to the relevant screen:
- Session detail.
- Exercise history.
- Route planner.
- Planned session.
- Readiness view.
- Nutrition log.
- Social post.
- Settings/preferences.

---

## Section 11: Athlete Mode Extensions

The core product should remain hybrid, but the app should support different athlete identities through configurable training focus. This lets strength-first, cardio-first, and multi-discipline users receive different defaults without forking the product.

### Training focus preference

Add a user preference:

```ts
type TrainingFocus =
  | 'strength'
  | 'cardio'
  | 'hybrid'
  | 'general_fitness'
  | 'bodybuilding'
  | 'powerlifting'
  | 'olympic_lifting'
  | 'running'
  | 'cycling'
  | 'triathlon'
  | 'mobility_rehab';
```

Training focus should influence:
- Dashboard widget defaults.
- Coaching insight priority.
- Progress chart defaults.
- Template and plan suggestions.
- Notification defaults.
- Empty-state calls to action.
- Navigation emphasis.

The focus setting should not hide existing data. It should reorder and contextualize the app around the user's current training identity.

### Strength-first athletes

Strength-focused users need deeper programming, loading, and progression tools.

Add support for:
- Program builder with blocks, mesocycles, deload weeks, top sets, backoff sets, and percentage-based loading.
- Progression models such as linear progression, double progression, wave loading, top-set plus backoff, RPE/RIR progression, and AMRAP-based estimated 1RM updates.
- Lift-specific readiness for squat, hinge, push, pull, and carry patterns.
- Exercise variation grouping, such as competition bench, pause bench, close-grip bench, and incline bench.
- Plate math for kg/lb plates, collars, specialty bars, dumbbells, and machines.
- Attempt selection for powerlifting meets.
- Wilks/DOTS/GL points for powerlifting comparison.
- Velocity-based training fields as an optional future input.
- Personal records by lift, rep range, bodyweight, and equipment variation.
- Volume landmarks by muscle group: minimum effective volume, maximum adaptive volume, and recovery limits when the user opts in.

### Bodybuilding and physique athletes

Bodybuilding-focused users need body-part coverage, consistency, and recovery tools more than maximal load.

Add support for:
- Weekly set targets by muscle group.
- Muscle group heatmap by week, block, and session.
- Exercise selection by target muscle, equipment, joint stress, and stimulus-to-fatigue ratio.
- Pump, soreness, and mind-muscle connection logging.
- Symmetry and weak-point tagging.
- Photo progress with private comparison views.
- Body measurement trends.
- Posing practice or stage-prep checklist as a long-term niche feature.
- Nutrition adherence tied to physique goals.

### Powerlifting and barbell sport athletes

Powerlifting users need competition-specific planning.

Add support for:
- Meet calendar and prep timeline.
- Squat/bench/deadlift attempt planner.
- Openers, seconds, thirds, and attempt success history.
- Equipment category labels: raw, wraps, sleeves, belt, straps.
- Commands for competition lifts versus accessories.
- Fatigue tracking per competition lift.
- Peaking and taper recommendations.
- Total prediction and qualification target tracking.

### Olympic lifting athletes

Olympic lifting users need technique and velocity-oriented structure.

Add support for:
- Snatch, clean, jerk, and derivative lift grouping.
- Complex builder, such as clean pull plus clean plus jerk.
- Technical miss reasons.
- Bar speed or perceived speed notes.
- Percentage work from snatch, clean and jerk, front squat, and back squat maxes.
- Mobility constraints by position.
- Video attachment as a long-term form-review input.

### Cardio-first athletes

Cardio-focused users need structured workouts, zones, routes, and race context.

Add support for:
- Structured workout builder with warmup, intervals, repeats, tempo blocks, hills, cooldown, and free-ride/free-run segments.
- Heart-rate zones.
- Pace zones.
- Power zones.
- Threshold tests and threshold history.
- FTP or critical power for cycling.
- Lactate threshold pace for running.
- Long-run and long-ride progression.
- Base, build, peak, taper, and recovery-week periodization.
- Audio cues for pace, distance, HR, power, nutrition, and route deviation.
- Aerobic decoupling and efficiency factor for endurance sessions.
- Grade-adjusted pace.
- Heat, wind, and altitude adjustments.

### Running athletes

Running users need race planning and terrain-aware pacing.

Add support for:
- Race goal, target time, and predicted finish time.
- Pace plan by split.
- Course profile and climb-adjusted pace.
- Shoe mileage and retirement alerts.
- Running dynamics when available: cadence, ground contact time, stride length, vertical oscillation.
- Workout types: easy, recovery, long, tempo, threshold, intervals, hill repeats, strides, race.
- Taper plan and race-week checklist.
- Fueling and hydration plan for long runs and races.

### Cycling athletes

Cycling users need power, route, and equipment depth.

Add support for:
- FTP tracking and ramp/field test history.
- Power curve: 5 sec, 1 min, 5 min, 20 min, 60 min.
- Normalized power, intensity factor, variability index, and TSS-like score.
- Bike and component mileage tracking.
- Climb categories and route-specific gearing notes.
- Indoor trainer workout support as a long-term feature.
- Cadence targets and torque/low-cadence work.
- Fueling reminders based on duration and intensity.

### Triathlon and multi-sport athletes

Triathlon users need discipline balance and transitions.

Add support for:
- Swim, bike, run weekly distribution.
- Brick workouts.
- Transition practice.
- Race-distance templates: sprint, Olympic, 70.3, Ironman.
- Discipline-specific fatigue and readiness.
- Open-water swim notes.
- Gear checklist by discipline.
- Event fueling plan across swim, bike, run, and transitions.

### Mobility, rehab, and general fitness athletes

Not every user is chasing PRs or race times. The app should also support consistency, pain-free movement, and general health.

Add support for:
- Mobility routines.
- Rehab plans.
- Pain scale trends.
- Range-of-motion notes.
- Habit streaks.
- Step goals.
- Low-impact substitutions.
- Return-to-training stages after injury.
- General fitness plans that combine strength, cardio, mobility, and nutrition.

---

## Section 12: Architecture & Quality

All improvements must preserve the app's architecture instead of bypassing it for speed.

### Layering rules

Maintain the existing dependency flow:

```text
app -> ui -> features -> data -> core -> shared
```

Rules to preserve:
- `ui/*` does not import `data/*`.
- `ui/*` does not import feature command internals directly; use bindings.
- Features do not import other features directly.
- Cross-feature communication uses domain events.
- View state is read through queries/viewStore keys, not projection internals.

### Route documentation

Add current route documentation to replace stale references:
- Active route table.
- Hidden/commented routes.
- GitHub Pages route limitations.
- Modal/addressable routes.
- Feature-to-tab mapping.

### Data status labels

All major screens should distinguish:
- Real user data.
- Imported data.
- Synced data.
- Estimated data.
- Mock/demo data.
- No data.

### Accessibility and responsive quality

Every implementation plan should include:
- Keyboard navigation.
- Focus states.
- Screen-reader labels for icon buttons.
- Chart alternatives or summaries.
- Empty/loading/error states.
- Mobile checks from 320px upward.
- Desktop checks for dense dashboards.

### Testing and graph maintenance

Future code changes derived from this spec should:
- Run `npm run build`.
- Add targeted Vitest coverage for pure domain logic.
- Add component tests for risky UI workflows.
- Rebuild Graphify after modifying code.

On Windows/PowerShell:

```powershell
$env:PYTHONIOENCODING='utf-8'; $env:PYTHONUTF8='1'; python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"
```

---

## Integration Points

### Home consumes cross-feature projections

Home should read readiness, sleep, training dashboard, nutrition, planning, progress, weather, and coaching projections through existing bindings/query patterns.

### Coaching consumes, then emits its own insights

Coaching remains a read-model consumer. It reads projections from other domains and emits insight events into its own projection. Other features should not depend on coaching.

### Planning connects templates and sessions

Planning owns saved templates, planned sessions, saved routes, and plan adherence. New-session and finish-session flows should connect to planning through commands and projections.

### Route planning and cardio import share GPS concepts

Planned routes and completed GPS tracks are different objects, but should share parser/export utilities, distance/elevation helpers, and provenance concepts where practical.

### Notifications subscribe to domain events

Notifications should react to events such as session finished, PR detected, plan missed, readiness dropped, achievement unlocked, and insight generated. Notification rules should not own unrelated feature logic.

### Health and readiness consume training context

Readiness should consume training load, sleep, subjective wellness, nutrition, and wearable imports. It should expose factor-level explanations rather than hiding its calculation.

### Training focus contextualizes features

Training focus should live in profile/preferences and be read by home, coaching, planning, progress, and notifications. It should change defaults and priority, not ownership boundaries.

---

## Out of Scope

| Feature | Reason |
|---|---|
| Implementing this entire backlog in one pass | This document is a product spec; implementation must be split into smaller plans. |
| Backend social infrastructure | Requires identity, privacy, moderation, and sync decisions first. |
| Real-time wearable sync | Requires platform-specific integration design and permissions. |
| AI-generated coaching without deterministic rules | Rule-based, explainable insights should come first. |
| Replacing the event-sourced architecture | Improvements should deepen the existing architecture, not bypass it. |
| One universal scoring formula for all athletes | Readiness/load models need user context and should remain explainable. |
