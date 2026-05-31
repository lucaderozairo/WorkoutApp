# Graph Report - .  (2026-05-31)

## Corpus Check
- 406 files · ~321,330 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 999 nodes · 1342 edges · 63 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## God Nodes (most connected - your core abstractions)
1. `applyAndStore()` - 26 edges
2. `applyAll()` - 14 edges
3. `commit()` - 14 edges
4. `HybridEventStore` - 9 edges
5. `ProjectionBuilder` - 6 edges
6. `PaceControl()` - 6 edges
7. `checkAchievement()` - 6 edges
8. `makeInsight()` - 6 edges
9. `useFinishSession()` - 6 edges
10. `AggregateRepository` - 5 edges

## Surprising Connections (you probably didn't know these)
- `handleRecordCardioSession()` --calls--> `applyAndStore()`  [EXTRACTED]
  features\cardio\commands\handlers.ts → features\scheduling\commands\handlers.ts
- `handleUpdateCardioSession()` --calls--> `applyAndStore()`  [EXTRACTED]
  features\cardio\commands\handlers.ts → features\scheduling\commands\handlers.ts
- `handleDeleteCardioSession()` --calls--> `applyAndStore()`  [EXTRACTED]
  features\cardio\commands\handlers.ts → features\scheduling\commands\handlers.ts
- `handleImportGpsTrack()` --calls--> `applyAndStore()`  [EXTRACTED]
  features\cardio\commands\handlers.ts → features\scheduling\commands\handlers.ts
- `handleRefreshConditions()` --calls--> `applyAndStore()`  [EXTRACTED]
  features\conditions\commands\handlers.ts → features\scheduling\commands\handlers.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.02
Nodes (29): AggregateRepository, EventBus, getAchievementById(), getAchievements(), getActiveGoals(), getAppointments(), getCompletedGoals(), getGoalById() (+21 more)

### Community 1 - "Community 1"
Cohesion: 0.03
Nodes (68): applyAll(), applyAndStore(), buildInitialWeeks(), checkAchievement(), checkCardioDistance(), checkConsecutiveDays(), checkPRWeight(), checkSessionCount() (+60 more)

### Community 2 - "Community 2"
Cohesion: 0.03
Nodes (12): EventBusImpl, parseDuration(), parseGarminSleepYearCSV(), insight(), makeDeloadInsight(), makeId(), makePlateauInsight(), makeTrainingLoadInsight() (+4 more)

### Community 3 - "Community 3"
Cohesion: 0.03
Nodes (0): 

### Community 4 - "Community 4"
Cohesion: 0.04
Nodes (15): d(), minimalTrack(), run(), computeTrackStats(), haversineDistanceMeters(), parseFit(), parseGpsFile(), parseGpx() (+7 more)

### Community 5 - "Community 5"
Cohesion: 0.05
Nodes (2): worstActiveCondition(), worstSev()

### Community 6 - "Community 6"
Cohesion: 0.06
Nodes (0): 

### Community 7 - "Community 7"
Cohesion: 0.05
Nodes (5): scoreBadge(), SleepSmall(), buildFlatData(), formatDate(), useExerciseHistory()

### Community 8 - "Community 8"
Cohesion: 0.05
Nodes (11): applyFrequencyDrop(), applyOvertrainingRisk(), applyPlateauDetected(), applyPRAchieved(), applyVolumeSpike(), makeInsight(), mapBlock(), mapSession() (+3 more)

### Community 9 - "Community 9"
Cohesion: 0.06
Nodes (21): CollapsedRail(), DesktopShell(), distanceMarkerPoints(), distToSegmentSq(), ExpandedSidebar(), fmtDuration(), fmtPace(), haversineKm() (+13 more)

### Community 10 - "Community 10"
Cohesion: 0.07
Nodes (10): cardioDate(), exportAllSessionsCsv(), exportCardioSessionCsv(), headerIndex(), importCsv(), normalizeHeaders(), parseExportFormat(), parseSimpleFormat() (+2 more)

### Community 11 - "Community 11"
Cohesion: 0.09
Nodes (4): deriveHistory(), FeedTab(), todayDateString(), useNewSession()

### Community 12 - "Community 12"
Cohesion: 0.09
Nodes (8): mealToCategory(), parseMfpCsv(), buildProgressions(), buildSleepHistory(), seedMockDataIfEmpty(), buildActivityView(), d(), s()

### Community 13 - "Community 13"
Cohesion: 0.11
Nodes (4): buildDateMap(), toDateKey(), formatRelativeTime(), formatTime()

### Community 14 - "Community 14"
Cohesion: 0.14
Nodes (12): closestPathIndex(), distanceMarkerPoints(), distToSegmentSq(), haversineKm(), interpolateLatLng(), latLngToXY(), totalDistanceKm(), clearRouteDraft() (+4 more)

### Community 15 - "Community 15"
Cohesion: 0.13
Nodes (5): clearEventDB(), loadAllEvents(), openEventDB(), persistEvent(), HybridEventStore

### Community 16 - "Community 16"
Cohesion: 0.16
Nodes (9): csvRow(), exportSessionCsv(), triggerDownload(), msToTimeInput(), nowDate(), nowTime(), toDateInput(), toTimeInput() (+1 more)

### Community 17 - "Community 17"
Cohesion: 0.13
Nodes (0): 

### Community 18 - "Community 18"
Cohesion: 0.17
Nodes (9): BlueprintNotFoundError, EventConflictError, InvalidSetWeightError, MigrationRequiredError, NetworkOfflineError, RemoteUnavailableError, SessionAlreadyDeletedError, StorageFullError (+1 more)

### Community 19 - "Community 19"
Cohesion: 0.17
Nodes (2): ErrorBoundaryRoot, TelemetryLogger

### Community 20 - "Community 20"
Cohesion: 0.48
Nodes (5): fetchWeather(), getApiKey(), getStubWeather(), parseOpenWeatherData(), weatherIcon()

### Community 21 - "Community 21"
Cohesion: 0.4
Nodes (1): ConsoleLogger

### Community 22 - "Community 22"
Cohesion: 0.7
Nodes (4): fetchNews(), getNewsApiKey(), getStubNews(), parseNewsArticles()

### Community 23 - "Community 23"
Cohesion: 0.4
Nodes (1): NotificationCenter

### Community 24 - "Community 24"
Cohesion: 0.4
Nodes (1): NotificationRulesEngine

### Community 25 - "Community 25"
Cohesion: 0.6
Nodes (3): parseDuration(), parseGarminSleepCSV(), parseValue()

### Community 26 - "Community 26"
Cohesion: 0.4
Nodes (0): 

### Community 27 - "Community 27"
Cohesion: 0.5
Nodes (0): 

### Community 28 - "Community 28"
Cohesion: 0.5
Nodes (0): 

### Community 29 - "Community 29"
Cohesion: 1.0
Nodes (2): Avatar(), initials()

### Community 30 - "Community 30"
Cohesion: 0.67
Nodes (0): 

### Community 31 - "Community 31"
Cohesion: 0.67
Nodes (0): 

### Community 32 - "Community 32"
Cohesion: 0.67
Nodes (0): 

### Community 33 - "Community 33"
Cohesion: 1.0
Nodes (0): 

### Community 34 - "Community 34"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "Community 35"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "Community 36"
Cohesion: 1.0
Nodes (0): 

### Community 37 - "Community 37"
Cohesion: 1.0
Nodes (0): 

### Community 38 - "Community 38"
Cohesion: 1.0
Nodes (0): 

### Community 39 - "Community 39"
Cohesion: 1.0
Nodes (0): 

### Community 40 - "Community 40"
Cohesion: 1.0
Nodes (0): 

### Community 41 - "Community 41"
Cohesion: 1.0
Nodes (0): 

### Community 42 - "Community 42"
Cohesion: 1.0
Nodes (0): 

### Community 43 - "Community 43"
Cohesion: 1.0
Nodes (0): 

### Community 44 - "Community 44"
Cohesion: 1.0
Nodes (0): 

### Community 45 - "Community 45"
Cohesion: 1.0
Nodes (0): 

### Community 46 - "Community 46"
Cohesion: 1.0
Nodes (0): 

### Community 47 - "Community 47"
Cohesion: 1.0
Nodes (0): 

### Community 48 - "Community 48"
Cohesion: 1.0
Nodes (0): 

### Community 49 - "Community 49"
Cohesion: 1.0
Nodes (0): 

### Community 50 - "Community 50"
Cohesion: 1.0
Nodes (0): 

### Community 51 - "Community 51"
Cohesion: 1.0
Nodes (0): 

### Community 52 - "Community 52"
Cohesion: 1.0
Nodes (0): 

### Community 53 - "Community 53"
Cohesion: 1.0
Nodes (0): 

### Community 54 - "Community 54"
Cohesion: 1.0
Nodes (0): 

### Community 55 - "Community 55"
Cohesion: 1.0
Nodes (0): 

### Community 56 - "Community 56"
Cohesion: 1.0
Nodes (0): 

### Community 57 - "Community 57"
Cohesion: 1.0
Nodes (0): 

### Community 58 - "Community 58"
Cohesion: 1.0
Nodes (0): 

### Community 59 - "Community 59"
Cohesion: 1.0
Nodes (0): 

### Community 60 - "Community 60"
Cohesion: 1.0
Nodes (0): 

### Community 61 - "Community 61"
Cohesion: 1.0
Nodes (0): 

### Community 62 - "Community 62"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **9 isolated node(s):** `InvalidSetWeightError`, `SessionAlreadyDeletedError`, `EventConflictError`, `BlueprintNotFoundError`, `NetworkOfflineError` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 33`** (2 nodes): `Checkbox.tsx`, `Checkbox()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (2 nodes): `Divider.tsx`, `Divider()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (2 nodes): `List.tsx`, `List()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (2 nodes): `ProgressBar.tsx`, `ProgressBar()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (2 nodes): `Text.tsx`, `Text()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (2 nodes): `useConfirmPress.ts`, `useConfirmPress()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (2 nodes): `useSessionTimer.ts`, `useSessionTimer()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (2 nodes): `ChartContainer.tsx`, `ChartContainer()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (2 nodes): `GridItem.tsx`, `GridItem()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (2 nodes): `ScrollRow.tsx`, `ScrollRow()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (2 nodes): `NavItem.tsx`, `NavItem()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (2 nodes): `Popover.tsx`, `Popover()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 45`** (2 nodes): `Tabs.tsx`, `Tabs()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (2 nodes): `Tooltip.tsx`, `Tooltip()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (2 nodes): `BottomSheet.tsx`, `BottomSheet()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (2 nodes): `SegmentedControl.tsx`, `SegmentedControl()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (2 nodes): `Sidebar.tsx`, `Sidebar()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (1 nodes): `vite-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 51`** (1 nodes): `vite.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (1 nodes): `vitest.setup.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 53`** (1 nodes): `garmin.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 54`** (1 nodes): `NotificationPreferences.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 55`** (1 nodes): `BodyMetrics.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 56`** (1 nodes): `InjuryTracking.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 57`** (1 nodes): `NutritionTracking.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 58`** (1 nodes): `SleepTracking.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 59`** (1 nodes): `SegmentBar.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 60`** (1 nodes): `Slider.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 61`** (1 nodes): `Switch.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 62`** (1 nodes): `AppNav.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `InvalidSetWeightError`, `SessionAlreadyDeletedError`, `EventConflictError` to the rest of the system?**
  _9 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.02 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.03 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.03 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.03 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.04 - nodes in this community are weakly interconnected._
- **Should `Community 5` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._