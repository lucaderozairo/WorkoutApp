> **Superseded.** This document reflects the original architecture. See `../analysis/architecture_suggested.md` for the target captured at the time and `../analysis/architecture_migration_plan.md` for the migration status.

# Fitness App — Full Architecture

This document defines the complete UI and system architecture for a local-first fitness platform spanning mobile and desktop. The structure is expressed in a component-tree style (JSX-like pseudocode) to map directly to implementation in React or Flutter.

---

# 1. Application Shell

## Global App Structure

```jsx
<App>
  <AuthGate />

  <AppShell>
    <TopBar />
    <Navigation />
    <RouteOutlet />
  </AppShell>

  <GlobalOverlays>
    <CommandPalette />
    <QuickActions />
    <NotificationsDrawer />
    <ModalHost />
  </GlobalOverlays>

  <DataLayer>
    <LocalDatabase />
    <SyncEngine />
    <ImportExportEngine />
  </DataLayer>
</App>
```

---

# 2. Navigation Model

## Mobile Navigation

```jsx
<BottomTabs>
  <HomeTab />
  <WorkoutTab />
  <SocialTab />
  <MessagesTab />
  <ProfileTab />
</BottomTabs>
```

## Desktop Navigation

```jsx
<DesktopShell>
  <SidebarNav />
  <TopBar />

  <MainContent>
    <RouteOutlet />
  </MainContent>

  <RightContextPanel />
</DesktopShell>
```

Desktop includes additional modules:

* Schedule
* Progress
* Full Nutrition system

---

# 3. Home Tab (Dashboard)

Purpose: daily orientation and system overview

```jsx
<HomeTab>
  <DashboardHeader />

  <DashboardHero>
    <SleepReviewWidget />
  </DashboardHero>

  <WidgetGrid>
    <WeatherWidget />
    <CalendarWidget />
    <RecoveryWidget />
    <TrainingReadinessWidget />
    <NutritionSummaryWidget />
  </WidgetGrid>

  <TodayTimeline />

  <QuickLogBar>
    <LogWorkoutButton />
    <LogFoodButton />
    <LogWaterButton />
  </QuickLogBar>
</HomeTab>
```

---

# 4. Workout Tab (Core System)

Purpose: session management, planning, execution

```jsx
<WorkoutTab>
  <WorkoutHeader>
    <AddWorkoutButton />
    <ViewToggle />
    <FilterBar />
    <SortMenu />
  </WorkoutHeader>

  <WorkoutViews>
    <WorkoutListView />
    <WorkoutWeekCalendar />
    <WorkoutMonthCalendar />
  </WorkoutViews>

  <WorkoutSessionList />
</WorkoutTab>
```

---

## Workout Creation Flow

```jsx
<AddWorkoutFlow>
  <WorkoutTypeSelector />

  <GymWorkoutBuilder>
    <ExercisePlanner />
    <SupersetBuilder />
    <CircuitBuilder />
  </GymWorkoutBuilder>

  <EnduranceRouteBuilder>
    <MapRouteEditor />
    <PaceTargets />
    <HRTargets />
  </EnduranceRouteBuilder>

  <ScheduleSelector />
  <SaveTemplate />
</AddWorkoutFlow>
```

---

## Session Detail View

```jsx
<SessionView>
  <SessionHeader>
    <SessionName />
    <Timestamp />
    <Duration />
  </SessionHeader>

  <SessionMeta>
    <SessionComments />
    <EditButton />
    <ShareButton />
    <SocialReactions />
  </SessionMeta>

  <SessionContent>
    <ExerciseBlockList />
    <EnduranceMapBlock />
    <MachineActivityBlock />
  </SessionContent>
</SessionView>
```

---

## Exercise System

```jsx
<ExerciseBlock>
  <ExerciseHeader />
  <ExerciseNotes />
  <PerformanceChart />

  <SetList>
    <SetRow />
  </SetList>
</ExerciseBlock>
```

### Set Row

```jsx
<SetRow>
  <PrimaryLine>
    <SetNumber />
    <LoadOrTime />
    <RepsOrDistance />
    <SetType />
    <PRBadge />
  </PrimaryLine>

  <SecondaryLine>
    <RPE />
    <SetNotes />
  </SecondaryLine>
</SetRow>
```

---

## Special Training Types

```jsx
<SupersetBlock>
  <ExerciseA />
  <ExerciseB />
</SupersetBlock>

<CircuitBlock>
  <ExerciseList />
</CircuitBlock>

<ErgMachineBlock>
  <MetricsChart />
  <Intervals />
</ErgMachineBlock>

<EnduranceBlock>
  <MapView />
  <ElevationProfile />
  <HRGraph />
  <PaceGraph />
  <CadenceGraph />
</EnduranceBlock>
```

---

# 5. Schedule Tab (Desktop Only)

```jsx
<ScheduleTab>
  <CalendarHeader />

  <CalendarView>
    <MonthView />
    <WeekView />
    <DayView />
  </CalendarView>

  <UpcomingEventsList />
</ScheduleTab>
```

---

# 6. Progress Tab (Desktop Only)

```jsx
<ProgressTab>
  <ProgressOverview />

  <AnalysisSelector>
    <SessionTypeAnalysis />
    <ExerciseAnalysis />
  </AnalysisSelector>

  <TrendCharts />
  <DrilldownPanel />
</ProgressTab>
```

---

# 7. Social Tab

```jsx
<SocialTab>
  <SocialTabs>
    <FeedTab />
    <EventsTab />
    <GroupsTab />
  </SocialTabs>
</SocialTab>
```

---

## Feed

```jsx
<FeedTab>
  <PostList />
  <ActivityCards />
</FeedTab>
```

## Events

```jsx
<EventsTab>
  <EventList />
  <EventDetails />
</EventsTab>
```

## Groups

```jsx
<GroupsTab>
  <GroupList />
  <GroupPage />
</GroupsTab>
```

---

# 8. Messages Tab

```jsx
<MessagesTab>
  <ChatList />

  <ChatView>
    <MessageThread />
    <MessageComposer />
  </ChatView>

  <CallSystem>
    <AudioCall />
    <VideoCall />
  </CallSystem>
</MessagesTab>
```

---

# 9. Profile Tab

```jsx
<ProfileTab>
  <ProfileTabs>
    <OverviewTab />
    <SharedSessionsTab />
    <HealthTab />
    <NutritionTab />
  </ProfileTabs>
</ProfileTab>
```

---

## Overview

```jsx
<OverviewTab>
  <Achievements />
  <PersonalRecords />
  <Goals />
</OverviewTab>
```

---

## Shared Sessions

```jsx
<SharedSessionsTab>
  <SharedSessionFeed />
</SharedSessionsTab>
```

---

## Health

```jsx
<HealthTab>
  <WeightTracker />
  <SleepTracker />
  <InjuryLog />
  <BiometricIntegration />
</HealthTab>
```

Integrations:

* Apple HealthKit
* Garmin
* Whoop

---

## Nutrition (Mobile Summary)

```jsx
<NutritionTab>
  <MacroSummary />
  <CalorieSummary />
  <HydrationSummary />
</NutritionTab>
```

---

# 10. Desktop Nutrition System

```jsx
<DesktopNutritionTab>
  <FoodLogger />
  <MacroDashboard />
  <CalorieAnalytics />
  <MicronutrientPanel />
  <SupplementTracker />
  <CaffeineTracker />
  <WaterTracker />
</DesktopNutritionTab>
```

---

# 11. Settings & Utilities

```jsx
<Settings>
  <ThemeSettings />
  <UnitSettings />

  <DataManagement>
    <ExportData />
    <ImportData />
    <ClearMockData />
  </DataManagement>

  <NotificationSettings />
</Settings>
```

---

## Mobile Header Utilities

```jsx
<MobileHeader>
  <NotificationsButton />
  <SettingsShortcut />
</MobileHeader>
```

---

# 12. Global Systems

```jsx
<GlobalSystem>
  <LocalDatabase />
  <SyncEngine />
  <NotificationEngine />
  <HealthAggregationLayer />
  <ExportImportEngine />
</GlobalSystem>
```

---

# Summary

This architecture defines a unified fitness operating system with:

* session-centric data model
* multi-modal training support
* dual-layer UX (mobile execution + desktop analysis)
* local-first storage and exportability
* integrated health + nutrition + social systems
