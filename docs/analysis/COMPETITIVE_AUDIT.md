# Competitive Audit — Workout App

> **Scope**: This is a critical gap analysis. Online/cross-user features (leaderboards, clubs, friends, live tracking) are noted but not held against the app since they are planned. Everything else is fair game.
>
> **Rating key**: ✅ Competitive · ⚠️ Partial / behind · ❌ Missing
>
> **Re-audited 2026-06-12** against current code. Status flips are marked **↑ (was X)**. Major progress since the original audit: in-session coaching tools (rest timer, plate calculator, 1RM, plateau detection), workout templates, home insight widgets (now default + drag-reorderable), and honest data-provenance labels on the route planner. The remaining hard gaps are platform-gated (native GPS, HealthKit) or need a real data source (DEM elevation, OSM surface, GPX export).

---

## 1. Home Screen

**Competitors**: Bevel, Apple Fitness, Whoop, Garmin Connect

### What the app has
- Greeting with date, workouts-this-week count, and streak badge
- **Insight-first widget grid** (`widgetRegistry.ts`): readiness, sleep, HRV, weather, body battery, resting HR, weekly volume, recent sessions, habits, macros, calories, plan adherence, monthly distance, insights, next workout, last session
- Widgets are **user-rearrangeable** (drag-to-reorder, resize, add/remove — `useWidgetGrid.ts`)
- First-run onboarding panel

### Gap analysis

| Feature | App | Bevel | Apple Fitness | Garmin Connect |
|---|---|---|---|---|
| Daily activity progress rings | ❌ | ✅ | ✅ | ✅ |
| Readiness/recovery score visible on home | ✅ **↑ (was ❌)** | ✅ | ✅ (via HK) | ✅ |
| Streak / gamification prominently displayed | ⚠️ badge only, no ring | ✅ | ✅ close-the-rings | ⚠️ |
| Smart workout recommendation | ⚠️ Next Workout widget **↑ (was ❌)** | ✅ | ✅ | ✅ Training Suggestion |
| Widgets user can rearrange | ✅ **↑ (was ❌)** | ❌ | ✅ | ⚠️ |
| Weather visible on home | ✅ **↑ (was hidden)** | ❌ | ⚠️ via Today view | ⚠️ |
| Sleep summary on home | ✅ **↑ (was hidden)** | ✅ | ✅ | ✅ |
| Recent workout summary card | ✅ **↑ (was ❌)** (Last Session / Recent Sessions) | ✅ | ✅ | ✅ |

### Critical issues

1. ~~**The home screen communicates almost nothing.**~~ **Resolved.** Readiness, sleep, weather, HRV, body battery, weekly volume and recent-session widgets are now first-class and shown by default. The utility-only home is gone.

2. ~~**Widgets are utility-first, not insight-first.**~~ **Resolved.** Data-management actions moved off the home grid; the registry now leads with readiness/sleep/training-load insight tiles.

3. **No daily progress visualisation.** Still open. Every major competitor uses an activity ring/bar/arc for at-a-glance status. The grid has numeric tiles but no close-the-rings equivalent.

4. **Streak is buried.** Still open. Only a small flame badge in the welcome widget, ≥ 2 days. Hevy, Duolingo, and Apple all make streak a primary motivational hook.

---

## 2. Session Logging & History

**Competitors**: Hevy, Strong, Strava, Garmin Connect

### What the app has
- Strength: sets, reps, weight, RPE 1–10, set types (normal/dropset/EMOM/AMRAP), warmup/PR/failure flags, per-set comments, supersets, circuits
- Cardio: GPX/TCX/FIT import, Strava import, pace, HR, elevation, KM splits, power
- Finish flow: RPE, tags, notes, photos
- Session history with charts (bar chart per exercise, pace/HR/elevation over distance)
- JSON and CSV export per session and globally
- Social feed auto-posting sessions

### Gap analysis

| Feature | App | Hevy | Strong | Strava |
|---|---|---|---|---|
| Exercise video / technique library | ❌ | ✅ | ✅ | N/A |
| 1RM calculator | ✅ **↑ (was ❌)** (Epley, `compute.ts`) | ✅ | ✅ | N/A |
| Plate calculator | ✅ **↑ (was ❌)** (`PlateCalculatorModal`) | ✅ | ✅ | N/A |
| Progressive overload suggestions | ⚠️ plateau detection **↑ (was ❌)** | ✅ | ⚠️ | N/A |
| Workout templates (shareable) | ⚠️ save/reuse, not shareable **↑ (was ❌)** | ✅ | ✅ | N/A |
| Rest timer with auto-advance | ✅ **↑ (was ❌)** (`RestTimerAlert`) | ✅ | ✅ | N/A |
| Muscle group heatmap per session | ❌ | ✅ | ❌ | N/A |
| Volume/frequency analytics | ✅ **↑ (was ❌)** (`computeVolumeEntry`, Weekly Volume widget) | ✅ | ⚠️ | ✅ |
| Training load (TSS / CTL / ATL) | ❌ | ❌ | ❌ | ✅ (premium) |
| Segment leaderboards | ❌ | N/A | N/A | ✅ |
| Live segment alerts during activity | ❌ | N/A | N/A | ✅ |
| GPS record during activity | ❌ | N/A | N/A | ✅ |
| Share as link (not just image) | ❌ | ✅ | ❌ | ✅ |
| PR notification + history trend | ✅ trend **↑ (was ⚠️)** (Exercise History, est. 1RM trend) | ✅ | ✅ | ✅ |

### Critical issues

1. **No live GPS recording.** Still open. The app imports GPS from files or Strava but cannot record a run/ride itself. Fundamental cardio gap — users record elsewhere and import. Every cardio competitor (Strava, Garmin, Komoot, AllTrails) records natively. Platform-gated.

2. ~~**Strength side is missing the coaching layer.**~~ **Largely resolved.** Rest timer, plate calculator, 1RM estimator (Epley), and plateau detection now ship in `features/progression` + session UI. The remaining coaching gap is auto-generated programming (Fitbod-style).

3. **No exercise library.** Still open. No technique videos, muscle-group diagrams, or exercise descriptions. New users cannot learn correct form in-app.

4. ~~**No workout templates.**~~ **Resolved (local).** `features/templates` saves and reloads workout structures. Not yet shareable across users.

5. ~~**PR tracking is a per-set flag, not a tracked trend.**~~ **Resolved.** Estimated-1RM and PR-history trends now render in the Exercise History screen.

6. **No training load calculation.** Still open. A `trainingLoad` field exists on health metrics but there is no CTL/ATL/TSS synthesis. Strava, Garmin, and TrainingPeaks all compute these to tell the user whether they are building fitness or accumulating fatigue.

---

## 3. Route Planning

**Competitors**: Komoot, AllTrails, Strava Route Builder, Plotaroute, RideWithGPS

### What the app has
- Click-to-place waypoints on map
- Road/path snapping (OSRM foot + bike profiles)
- 4 activities: run, hike, ride, walk
- Undo/redo, waypoint list, delete
- Address/place search (Nominatim)
- 4 map layers: plain, dark, topo, satellite
- Elevation panel (mini + full chart)
- Surface mix breakdown
- Per-segment pace, time and calorie estimates
- Save and reload routes

### Critical issues — data integrity

**The original audit flagged this as the most serious area. Provenance is now handled honestly; accuracy is still pending a real data source.**

1. ~~**Elevation data is synthetic.**~~ **Resolved (honesty, not accuracy).** The sine-wave elevation profile is no longer presented as measurement. `useRoutePlanner.ts` now exposes `routeDataStatus.elevationGain`/`elevationProfile = 'unavailable'`, and the UI hides the gain/loss numbers and the profile chart rather than showing fabricated values. A real DEM lookup (OpenTopoData/SRTM) is still not integrated — accurate elevation remains absent, but the trust-destroying fake chart is gone.

2. **Surface mix is still estimated.** The breakdown is still the hardcoded per-activity ratio plus deterministic noise (`estimateSurfaceMix`, `useRoutePlanner.ts:114`), so an Alps ride and a central-London ride still read the same. It is now **labeled** `routeDataStatus.surfaceMix = 'estimated'` so it is no longer passed off as real, but Komoot-grade OSM `surface=*` derivation is not implemented.

3. **Calorie estimate still ignores elevation.** `estimateCalories` (`useRoutePlanner.ts:109`) remains a flat per-km multiplier (60 kcal/km run, 50 walk, 30 ride). A 10km route with 500m gain shows the same number as a flat 10km.

### Feature gap analysis

| Feature | App | Komoot | AllTrails | Plotaroute | RideWithGPS |
|---|---|---|---|---|---|
| Real elevation from DEM | ⚠️ labeled unavailable **↑ (was fake)** | ✅ | ✅ | ✅ SRTM | ✅ |
| Real surface from OSM tags | ⚠️ labeled estimated **↑ (was fake)** | ✅ | ✅ | ⚠️ | ✅ |
| Difficulty rating | ❌ | ✅ | ✅ | ⚠️ | ✅ |
| POI / highlights on route | ❌ | ✅ | ✅ | ❌ | ⚠️ |
| Trail conditions (crowdsourced) | ❌ | ✅ | ✅ | ❌ | ❌ |
| GPX / TCX export | ❌ | ✅ | ✅ | ✅ | ✅ |
| Export to Garmin / Wahoo | ❌ | ✅ | ✅ | ❌ | ✅ |
| Offline maps | ❌ | ✅ (premium) | ✅ (premium) | ❌ | ✅ |
| Share route as public link | ❌ | ✅ | ✅ | ✅ | ✅ |
| Turn-by-turn navigation | ❌ | ✅ | ✅ | ❌ | ✅ |
| Heatmap routing (popular paths) | ❌ | ❌ | ❌ | ❌ | ✅ |
| Weather forecast for route date | ❌ | ✅ | ⚠️ | ❌ | ❌ |
| Gradient colour on map | ❌ | ✅ | ❌ | ✅ | ✅ |
| Route splitting / multi-stage | ❌ | ✅ | ❌ | ✅ | ✅ |
| Distance markers on map | ⚠️ toggle exists, off by default | ✅ | ✅ | ✅ | ✅ |

---

## 4. Health Tracking

**Competitors**: Apple Health, Bevel, Whoop, Oura Ring

### What the app has
- HRV, RHR, VO2Max, SpO2, body battery in domain types
- Garmin API: daily summaries, HR, stress, HRV intervals
- Sleep stages from Garmin CSV (deep/light/REM/awake minutes)
- Subjective readiness: sleep quality, energy, soreness, mood (1–10)
- Readiness score computed from inputs; **no data → score 0, `hasEntry: false`** (no fake default)
- Strava activity import

### Gap analysis

| Feature | App | Apple Health | Whoop | Oura | Bevel |
|---|---|---|---|---|---|
| HRV trend chart | ✅ HRV home widget **↑ (was ⚠️)** | ✅ | ✅ | ✅ | ✅ |
| Recovery score with factor breakdown | ⚠️ score only, no breakdown | ✅ | ✅ | ✅ | ✅ |
| Sleep stage visualisation | ✅ (if Garmin data present) | ✅ | ✅ | ✅ | ✅ |
| Sleep coaching / optimal bedtime | ❌ | ⚠️ | ✅ | ✅ | ✅ |
| Strain / training load score | ❌ | ❌ | ✅ | ⚠️ | ✅ |
| Behaviour journal & correlations | ❌ | ❌ | ✅ | ✅ | ⚠️ |
| AI insights ("your HRV is trending down") | ❌ | ⚠️ | ✅ | ✅ | ✅ |
| Cross-metric correlations | ❌ | ⚠️ | ✅ | ✅ | ⚠️ |
| Continuous daytime HRV / stress | ❌ | ❌ | ✅ | ✅ | ❌ |
| HealthKit read/write | ❌ | N/A | ✅ | ✅ | ✅ |
| Medication / supplement tracking | ❌ | ✅ | ✅ (journal) | ✅ (journal) | ❌ |
| Cardiovascular age / fitness age | ❌ | ✅ | ❌ | ✅ | ❌ |
| Period / cycle tracking | ❌ | ✅ | ✅ | ✅ | ❌ |
| 5-day health projection | ❌ | ❌ | ✅ | ❌ | ❌ |

### Critical issues

1. ~~**The readiness score defaults to 82.**~~ **Resolved.** The projection now seeds an empty state with `score: 0, hasEntry: false` (`features/readiness/domain/reducers.ts` / `projections/index.ts`). No fabricated default is shown before data exists.

2. **No explanation of how the readiness score is calculated.** Even when real Garmin data is present, the score is opaque. Oura and Whoop show every contributing factor (HRV, sleep, resting HR, recovery trend) with individual weights. Users cannot act on a number they cannot interpret.

3. **Health data is not correlated.** The app collects sleep, HRV, RHR, subjective mood, and session RPE — enough raw material for useful insights. But no correlation is surfaced: "your soreness score of 8 this morning follows your two hardest sessions this week" or "your HRV is 12% below your 30-day baseline." This synthesis is where premium health apps create retention.

4. **No behaviour journal.** Whoop and Oura allow users to log nightly behaviours (alcohol, screen time, supplements, stress) and then show statistically which behaviours improve or worsen recovery. The app has notes per session but nothing equivalent for daily lifestyle inputs.

5. **HealthKit integration absent.** On iOS, every serious health app integrates with HealthKit as a data hub. Without it, the app is an island — it cannot pull passive data (steps, resting HR, sleep from the Watch) or contribute session data to Apple Health's unified history.

---

## 5. Additional Competitors

### TrainingPeaks / Intervals.icu
Used by serious endurance athletes. Key differentiators: **TSB (Training Stress Balance / "form")**, **CTL (chronic training load / "fitness")**, **ATL (acute training load / "fatigue")**, **Performance Management Chart**, workout compliance tracking against a training plan. If the app targets serious athletes, this is the ceiling to aim for. If it targets casual users, these are safely deprioritised.

### Strong / Fitbod
Strong is the incumbent for no-nonsense barbell lifting: timer, plate calculator, exercise history per lift. Fitbod adds AI-generated workouts based on muscle recovery state. The app is missing the core features of both: rest timer, plate calculator, and auto-generated workout options.

### MyFitnessPal / Cronometer
Nutrition is entirely absent. For health tracking to be complete, calorie intake context matters — training load relative to nutrition is how Whoop and Oura derive meaningful recovery insights. Large scope addition but a long-term gap worth noting.

### Runkeeper / MapMyRun
Mid-tier running apps with live GPS recording, audio cues for km splits, and pace zone alerts during a run. Both are directly in this app's target territory and both record natively. The app cannot currently record a GPS activity.

---

## 6. Summary Scorecard

| Area | Score | Primary gap |
|---|---|---|
| Home screen | 7/10 **↑ (was 2)** | Insight widgets now default + rearrangeable; still no progress rings or prominent streak |
| Strength logging | 8/10 **↑ (was 6)** | Rest timer, templates, plate calc, 1RM, plateau & PR trends shipped; still no exercise library |
| Cardio logging | 4/10 | No native GPS recording; must import from elsewhere |
| Route planning | 5/10 **↑ (was 3)** | Fabricated stats now honestly labeled, but real DEM/OSM/GPX export still absent |
| Health tracking | 6/10 **↑ (was 5)** | Fake default score removed; HRV trend shown; no factor breakdown, cross-metric insights, or HealthKit |
| Social / sharing | 3/10 | Image-only share; no link sharing; no cross-user features yet |

---

## 7. Priority Fixes

**✅ Done since original audit:**
- ~~Remove the default readiness score of 82~~ — empty state now `score 0 / hasEntry false`
- ~~Replace synthetic elevation presented as real~~ — now hidden, labeled `unavailable` (real DEM still pending, below)
- ~~Label estimated surface mix~~ — now labeled `estimated` (OSM derivation still pending, below)
- ~~Unhide sleep, weather, and readiness widgets~~ — now default + rearrangeable
- ~~Add rest timer~~, ~~workout template save/load~~, ~~1RM calculator~~, ~~plate calculator~~, ~~PR history trend~~

**Urgent (data integrity — accuracy, not just honesty):**
- Integrate real DEM lookup (OpenTopoData/SRTM) so elevation can move from `unavailable` to `real`
- Derive surface mix from OSM `surface=*` way tags instead of the hardcoded `estimateSurfaceMix` formula
- Replace flat `estimateCalories` with an elevation-adjusted formula (depends on real elevation)

**High impact:**
- Add GPX export from route planner (still absent — only GPS *import* exists)
- Show readiness score contributing factors, not just a number
- Daily progress visualisation (activity rings/arc) and prominent streak on home

**Medium term:**
- Native GPS activity recording (run/ride) — platform-gated
- Exercise library with at minimum muscle-group tags and technique references
- Auto-generated programming (Fitbod-style) and training-load (CTL/ATL/TSS) synthesis
- Behaviour journal for daily lifestyle inputs
- HealthKit integration (iOS)
