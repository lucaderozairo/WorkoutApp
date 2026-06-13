# Graph Report - .  (2026-06-13)

## Corpus Check
- 522 files � ~952,820 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1131 nodes � 1516 edges � 74 communities detected
- Extraction: 100% EXTRACTED � 0% INFERRED � 0% AMBIGUOUS
- Token cost: 0 input � 0 output

## God Nodes (most connected - your core abstractions)
1. `commit()` - 13 edges
2. `HybridEventStore` - 11 edges
3. `ProjectionBuilder` - 6 edges
4. `PaceControl()` - 6 edges
5. `isoDate()` - 6 edges
6. `useFinishSession()` - 6 edges
7. `fmtDuration()` - 5 edges
8. `distanceKm()` - 5 edges
9. `useRoutePlanner()` - 5 edges
10. `ConsoleLogger` - 4 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities

### Community 0 - "Community 0"
Cohesion: 0.02
Nodes (3): focusTab(), handleKeyDown(), tabId()

### Community 1 - "Community 1"
Cohesion: 0.02
Nodes (37): computeDashboard(), registerTrainingDashboardProjection(), closestPathIndex(), distanceKm(), distanceMarkers(), distanceMeters(), distToSegmentSq(), getAchievementById() (+29 more)

### Community 2 - "Community 2"
Cohesion: 0.03
Nodes (11): mealToCategory(), parseMfpCsv(), parseDuration(), parseGarminSleepYearCSV(), buildProgressions(), buildSleepHistory(), seedMockDataIfEmpty(), addDays() (+3 more)

### Community 3 - "Community 3"
Cohesion: 0.03
Nodes (2): EventBusImpl, EventRepository

### Community 4 - "Community 4"
Cohesion: 0.04
Nodes (11): buildDateMap(), toDateKey(), d(), minimalTrack(), run(), handleDrop(), handleFile(), categoryIcon() (+3 more)

### Community 5 - "Community 5"
Cohesion: 0.04
Nodes (4): getMode(), onPlateCalculator(), worstActiveCondition(), worstSev()

### Community 6 - "Community 6"
Cohesion: 0.05
Nodes (25): activeTemplates(), applyTemplateEvents(), commit(), commitTemplateEvents(), findTemplate(), handleAddToSuperset(), handleLeaveSuperset(), handleRemoveBlock() (+17 more)

### Community 7 - "Community 7"
Cohesion: 0.05
Nodes (14): computeTrackStats(), parseFit(), parseGpsFile(), parseGpx(), parseTcx(), Map(), useTheme(), scoreBadge() (+6 more)

### Community 8 - "Community 8"
Cohesion: 0.05
Nodes (7): appendInsight(), makeInsight(), mapBlock(), mapSession(), mapSet(), fold(), reduce()

### Community 9 - "Community 9"
Cohesion: 0.06
Nodes (21): CollapsedRail(), DesktopShell(), distanceMarkerPoints(), distToSegmentSq(), ExpandedSidebar(), fmtDuration(), fmtPace(), haversineKm() (+13 more)

### Community 10 - "Community 10"
Cohesion: 0.07
Nodes (23): downloadJson(), triggerDownload(), applyAndStoreCardio(), handleImportCardioSessions(), normalizeHeaders(), parseCsvForImport(), handleImportSessions(), parseExportRows() (+15 more)

### Community 11 - "Community 11"
Cohesion: 0.05
Nodes (9): routePhoto(), RoutePreview(), activityForRoute(), useRouteDetail(), clearRouteDraft(), estimateSurfaceMix(), formatMin(), loadRouteDraft() (+1 more)

### Community 12 - "Community 12"
Cohesion: 0.08
Nodes (0): 

### Community 13 - "Community 13"
Cohesion: 0.11
Nodes (5): clearEventDB(), loadAllEvents(), openEventDB(), persistEvent(), HybridEventStore

### Community 14 - "Community 14"
Cohesion: 0.13
Nodes (5): defineCommand(), hasProjections(), makeBus(), makeRepo(), makeStore()

### Community 15 - "Community 15"
Cohesion: 0.13
Nodes (0): 

### Community 16 - "Community 16"
Cohesion: 0.17
Nodes (2): ErrorBoundaryRoot, TelemetryLogger

### Community 17 - "Community 17"
Cohesion: 0.18
Nodes (2): ExploreTrailsPage(), rotate()

### Community 18 - "Community 18"
Cohesion: 0.22
Nodes (2): generateOverloadHint(), roundToNearest()

### Community 19 - "Community 19"
Cohesion: 0.32
Nodes (3): buildActivityView(), d(), s()

### Community 20 - "Community 20"
Cohesion: 0.25
Nodes (0): 

### Community 21 - "Community 21"
Cohesion: 0.48
Nodes (5): fetchWeather(), getApiKey(), getStubWeather(), parseOpenWeatherData(), weatherIcon()

### Community 22 - "Community 22"
Cohesion: 0.29
Nodes (0): 

### Community 23 - "Community 23"
Cohesion: 0.33
Nodes (1): ProjectionBuilder

### Community 24 - "Community 24"
Cohesion: 0.4
Nodes (2): todayDateString(), useNewSession()

### Community 25 - "Community 25"
Cohesion: 0.4
Nodes (1): ConsoleLogger

### Community 26 - "Community 26"
Cohesion: 0.4
Nodes (1): NotificationCenter

### Community 27 - "Community 27"
Cohesion: 0.4
Nodes (1): NotificationRulesEngine

### Community 28 - "Community 28"
Cohesion: 0.4
Nodes (0): 

### Community 29 - "Community 29"
Cohesion: 1.0
Nodes (1): ViewStore

### Community 30 - "Community 30"
Cohesion: 0.5
Nodes (0): 

### Community 31 - "Community 31"
Cohesion: 0.5
Nodes (0): 

### Community 32 - "Community 32"
Cohesion: 0.67
Nodes (0): 

### Community 33 - "Community 33"
Cohesion: 1.0
Nodes (2): Avatar(), initials()

### Community 34 - "Community 34"
Cohesion: 0.67
Nodes (0): 

### Community 35 - "Community 35"
Cohesion: 0.67
Nodes (0): 

### Community 36 - "Community 36"
Cohesion: 0.67
Nodes (0): 

### Community 37 - "Community 37"
Cohesion: 0.67
Nodes (0): 

### Community 38 - "Community 38"
Cohesion: 0.67
Nodes (0): 

### Community 39 - "Community 39"
Cohesion: 0.67
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

### Community 63 - "Community 63"
Cohesion: 1.0
Nodes (0): 

### Community 64 - "Community 64"
Cohesion: 1.0
Nodes (0): 

### Community 65 - "Community 65"
Cohesion: 1.0
Nodes (0): 

### Community 66 - "Community 66"
Cohesion: 1.0
Nodes (0): 

### Community 67 - "Community 67"
Cohesion: 1.0
Nodes (0): 

### Community 68 - "Community 68"
Cohesion: 1.0
Nodes (0): 

### Community 69 - "Community 69"
Cohesion: 1.0
Nodes (0): 

### Community 70 - "Community 70"
Cohesion: 1.0
Nodes (0): 

### Community 71 - "Community 71"
Cohesion: 1.0
Nodes (0): 

### Community 72 - "Community 72"
Cohesion: 1.0
Nodes (0): 

### Community 73 - "Community 73"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **Thin community `Community 40`** (2 nodes): `eslint.config.js`, `el()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (2 nodes): `Checkbox.tsx`, `Checkbox()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (2 nodes): `Divider.tsx`, `Divider()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (2 nodes): `ProgressBar.tsx`, `ProgressBar()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (2 nodes): `SegmentBar.tsx`, `SegmentBar()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 45`** (2 nodes): `useConfirmPress.ts`, `useConfirmPress()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (2 nodes): `useSessionTimer.ts`, `useSessionTimer()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (2 nodes): `ExportDataWidget.tsx`, `ExportDataWidget()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (2 nodes): `ImportDataWidget.tsx`, `ImportDataWidget()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (2 nodes): `PlanRouteWidget.tsx`, `PlanRouteWidget()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (2 nodes): `GridItem.tsx`, `GridItem()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 51`** (2 nodes): `ScrollRow.tsx`, `ScrollRow()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (2 nodes): `Command.tsx`, `Command()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 53`** (2 nodes): `Label.tsx`, `Label()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 54`** (2 nodes): `NavItem.tsx`, `NavItem()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 55`** (2 nodes): `Tooltip.tsx`, `Tooltip()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 56`** (2 nodes): `BottomSheet.tsx`, `BottomSheet()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 57`** (2 nodes): `Sidebar.tsx`, `Sidebar()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 58`** (1 nodes): `stylelint.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 59`** (1 nodes): `vite-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 60`** (1 nodes): `vite.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 61`** (1 nodes): `vitest.setup.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 62`** (1 nodes): `garmin.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 63`** (1 nodes): `NotificationPreferences.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 64`** (1 nodes): `BodyMetrics.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 65`** (1 nodes): `InjuryTracking.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 66`** (1 nodes): `NutritionTracking.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 67`** (1 nodes): `SleepTracking.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 68`** (1 nodes): `provenance.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 69`** (1 nodes): `strength.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 70`** (1 nodes): `Breadcrumb.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 71`** (1 nodes): `AppNav.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 72`** (1 nodes): `SplitTabs.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 73`** (1 nodes): `dashboardUtils.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ProjectionBuilder` connect `Community 23` to `Community 1`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.02 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.02 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.03 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.03 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.04 - nodes in this community are weakly interconnected._
- **Should `Community 5` be split into smaller, more focused modules?**
  _Cohesion score 0.04 - nodes in this community are weakly interconnected._