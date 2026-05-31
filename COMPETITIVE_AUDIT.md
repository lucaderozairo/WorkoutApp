# Competitive Audit — Workout App

> **Scope**: This is a critical gap analysis. Online/cross-user features (leaderboards, clubs, friends, live tracking) are noted but not held against the app since they are planned. Everything else is fair game.
>
> **Rating key**: ✅ Competitive · ⚠️ Partial / behind · ❌ Missing

---

## 1. Home Screen

**Competitors**: Bevel, Apple Fitness, Whoop, Garmin Connect

### What the app has
- Greeting with date, workouts-this-week count, and streak badge
- 4 utility widgets: edit display name, import data, export data, plan route link
- First-run onboarding panel
- Sleep, weather, and calendar widgets exist in code but are **hidden**
- Readiness score loaded from store but **not rendered on the home screen**

### Gap analysis

| Feature | App | Bevel | Apple Fitness | Garmin Connect |
|---|---|---|---|---|
| Daily activity progress rings | ❌ | ✅ | ✅ | ✅ |
| Readiness/recovery score visible on home | ❌ (loaded, not shown) | ✅ | ✅ (via HK) | ✅ |
| Streak / gamification prominently displayed | ⚠️ badge only, no ring | ✅ | ✅ close-the-rings | ⚠️ |
| Smart workout recommendation | ❌ | ✅ | ✅ | ✅ Training Suggestion |
| Widgets user can rearrange | ❌ | ❌ | ✅ | ⚠️ |
| Weather visible on home | ❌ (hidden) | ❌ | ⚠️ via Today view | ⚠️ |
| Sleep summary on home | ❌ (hidden) | ✅ | ✅ | ✅ |
| Recent workout summary card | ❌ | ✅ | ✅ | ✅ |

### Critical issues

1. **The home screen communicates almost nothing.** The readiness score is computed and available but not shown. The sleep widget is implemented but disabled. The weather widget is implemented but disabled. The result is a screen that greets the user with a date stamp and four admin-style utility tiles. This is below MVP for a health app home screen in 2025.

2. **Widgets are utility-first, not insight-first.** "Import Data", "Export Data", and "Edit Display Name" are settings-panel features masquerading as home screen widgets. Real competitors lead with **what you should do today** (readiness score, sleep debt, training load), not data management.

3. **No daily progress visualisation.** Every major competitor uses some form of activity ring, bar, or progress arc to give the user an at-a-glance status. This app has none.

4. **Streak is buried.** It only appears as a small flame badge inside the welcome widget, and only when ≥ 2 days. Hevy, Duolingo, and Apple all make streak a primary motivational hook.

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
| 1RM calculator | ❌ | ✅ | ✅ | N/A |
| Plate calculator | ❌ | ✅ | ✅ | N/A |
| Progressive overload suggestions | ❌ | ✅ | ⚠️ | N/A |
| Workout templates (shareable) | ❌ | ✅ | ✅ | N/A |
| Rest timer with auto-advance | ❌ | ✅ | ✅ | N/A |
| Muscle group heatmap per session | ❌ | ✅ | ❌ | N/A |
| Volume/frequency analytics | ❌ | ✅ | ⚠️ | ✅ |
| Training load (TSS / CTL / ATL) | ❌ | ❌ | ❌ | ✅ (premium) |
| Segment leaderboards | ❌ | N/A | N/A | ✅ |
| Live segment alerts during activity | ❌ | N/A | N/A | ✅ |
| GPS record during activity | ❌ | N/A | N/A | ✅ |
| Share as link (not just image) | ❌ | ✅ | ❌ | ✅ |
| PR notification + history trend | ⚠️ flag per set, no trend | ✅ | ✅ | ✅ |

### Critical issues

1. **No live GPS recording.** The app can import GPS data from files or Strava, but cannot record a run or ride itself. This is a fundamental gap for the cardio side — users must record elsewhere and import. Every cardio competitor (Strava, Garmin, Komoot, AllTrails) records natively.

2. **Strength side is missing the coaching layer.** Sets, reps, and weight are logged correctly, but there is no: rest timer, plate calculator, 1RM estimator, or progressive overload suggestion. Hevy and Strong make these table stakes. Without them, the strength logging is a spreadsheet, not a coaching tool.

3. **No exercise library.** No technique videos, no muscle group diagrams, no exercise descriptions. New users cannot learn correct form from inside the app.

4. **No workout templates.** Users cannot save and reuse a push/pull/legs structure. This is one of the highest-frequency actions in strength apps — every session, users rebuild the same workout from scratch.

5. **PR tracking is a per-set flag, not a tracked trend.** The app marks a set as a PR, but there is no 1RM trend graph, no "your squat has progressed +12kg in 90 days" insight. The data exists; the synthesis doesn't.

6. **No training load calculation.** Strava, Garmin, and TrainingPeaks all compute chronic training load (CTL), acute training load (ATL), and Training Stress Score (TSS/TRIMP) to tell the user whether they are building fitness or accumulating fatigue. The app has no equivalent.

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

**This section contains the most serious issues in the entire app.**

1. **Elevation data is synthetic.** The elevation profile is generated by a sine-wave formula (`70 - 50 * (0.3 * sin(t * π) + …)`) seeded by distance. It bears no relationship to the actual terrain of the planned route. Users planning a hilly run will see a convincing-looking elevation chart that is completely fabricated. This is a **data integrity failure** and would destroy user trust if discovered.

2. **Surface mix is fabricated.** The surface breakdown (paved/gravel/trail/unpaved) is a hardcoded ratio per activity type plus a deterministic noise term (`(waypointCount * 7 + distanceKm * 13) % 11 - 5`). A cycling route in the Alps and a cycling route through central London show the same surface mix. Komoot derives this from OSM `surface=*` tags on every way segment.

3. **Calorie estimate ignores elevation.** The formula is a flat per-km multiplier (60 kcal/km running). A 10km route with 500m gain burns roughly 40% more than a flat 10km — the app shows the same number for both.

### Feature gap analysis

| Feature | App | Komoot | AllTrails | Plotaroute | RideWithGPS |
|---|---|---|---|---|---|
| Real elevation from DEM | ❌ (fake) | ✅ | ✅ | ✅ SRTM | ✅ |
| Real surface from OSM tags | ❌ (fake) | ✅ | ✅ | ⚠️ | ✅ |
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
- Readiness score (shown as a number; defaults to 82 with no data)
- Strava activity import

### Gap analysis

| Feature | App | Apple Health | Whoop | Oura | Bevel |
|---|---|---|---|---|---|
| HRV trend chart | ⚠️ data stored, unclear if shown | ✅ | ✅ | ✅ | ✅ |
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

1. **The readiness score defaults to 82.** When a new user opens the app, their readiness is shown as 82 out of 100 — a number that means nothing and was not earned. This is worse than showing no score, because it misrepresents the app's capabilities and erodes trust the moment the user realises there is no data behind it.

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
| Home screen | 2/10 | Insight widgets hidden; utility widgets dominate |
| Strength logging | 6/10 | No rest timer, templates, exercise library, or 1RM tools |
| Cardio logging | 4/10 | No native GPS recording; must import from elsewhere |
| Route planning | 3/10 | Elevation and surface data are fabricated |
| Health tracking | 5/10 | Score defaults to 82; no cross-metric insights; no HealthKit |
| Social / sharing | 3/10 | Image-only share; no link sharing; no cross-user features yet |

---

## 7. Priority Fixes

**Urgent (data integrity):**
- Replace synthetic elevation with real DEM lookup (OpenTopoData API is free)
- Replace estimated surface mix with OSM way-tag query or remove the stat entirely
- Remove the default readiness score of 82; show "—" until data exists

**High impact:**
- Unhide sleep, weather, and readiness widgets on home screen
- Add rest timer to strength sessions
- Add workout template save/load
- Add GPX export from route planner
- Show readiness score contributing factors, not just a number
- Replace flat calorie estimate with elevation-adjusted formula

**Medium term:**
- Native GPS activity recording (run/ride)
- Exercise library with at minimum muscle group tags and PR history trend charts
- 1RM calculator per lift
- Behaviour journal for daily lifestyle inputs
- HealthKit integration (iOS)
