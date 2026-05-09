# Tab → Scaffold Mapping

How each app tab maps onto the architecture. Use this as the reference when adding screens.

## Dashboard

**Layout:** `ui/layouts/dashboard_screen`
**Composes:** widget patterns from `ui/patterns/widgets/`
**Reads from features:**

| Widget | Query | Feature |
|---|---|---|
| SleepWidget | `getLastNightSleep`, `getSleepHistory(7)` | readiness |
| ConditionsWidget | `getCurrentConditions`, `getSuitability(*)` | conditions |
| ScheduleWidget | `getScheduleForDay(today)` | scheduling |
| RecentActivityWidget | `getRecentLiftSessions`, `getRecentCardioSessions` | training_log + cardio |
| NewsAndDealsWidget | `getHeadlines`, `getDeals` | news_feed |

**Dispatches commands:** `JoinEvent`, `LeaveEvent`, `AddAppointment`, `UpdateAppointment`, `DeleteAppointment`, `ReorderAppointments`, `CopyToLog`

**Owns view state:** `selectedSession`, `openModal`, `calDayOpen` (all in `ui/view_state`)

---

## Log

**Layout:** `ui/layouts/log_screen`
**Reads from:** `training_log`, `cardio` (active session + recent for prefill)
**Dispatches:** `LogSet`, `UpdateSession`, `RecordCardioSession`, `StartSessionFromBlueprint`, `SaveAsBlueprint`

---

## Progress

**Layout:** `ui/layouts/progress_screen`
**Composes:** feed pattern + analyse pattern with mode toggle
**Reads from:** `training_log`, `cardio`, `progress_analysis`, `insights`
**Mode toggle** is local view state, not an event.

---

## Analytics

**Layout:** `ui/layouts/analytics_screen`
**Composes:** analyse pattern only — no toggle, no feed
**Reads from:** identical query set as Progress's analyse mode (`progress_analysis`, `insights`)

The "wrapper pattern" from the legacy code (`<ProgressTab forceAnalyse />`) is gone. Both screens now consume shared queries directly. Zero duplication, no flag-passing.

---

## Social

**Layout:** `ui/layouts/social_screen`
**Reads from:** `social`, `scheduling` (for joined events)
**Dispatches:** `ShareSession`, `CreateEvent`, `JoinEvent`, `LeaveEvent`, `PostComment`

---

## Profile

**Layout:** `ui/layouts/profile_screen`
**Reads from:** `profile`, `readiness`, `core/monitoring/health` (for diagnostics panel)
**Dispatches:** `UpdateProfile`, `SetUnitPreference`, `RecordInjury`, `ResolveInjury`

---

## Cross-cutting notes

**Modals are addressable** — every modal in the legacy code is now a route under its parent screen, so back-button and deep-linking work uniformly.

**The chartAnnotations context disappears** — annotations are now first-class events owned by `progress_analysis`. They sync, replay, and survive uninstalls.

**Activity flattening / session grouping is no longer in the UI** — those are projection builders in `data/projections/builders/`. The dashboard query returns pre-flattened, pre-sorted data.

**Appointment state is no longer local to Dashboard** — the entire CRUD path is event-sourced, so reorders sync across devices.
