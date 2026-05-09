# Fitness App — Full Architecture (With Error Handling)

This document defines the complete system architecture for a local-first fitness platform spanning mobile and desktop. It includes UI structure, data systems, and a comprehensive error-handling framework.

Architecture is expressed in a component-tree (JSX-style pseudocode) format.

---

# 1. Application Shell

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

  <SystemLayer>
    <DataLayer />
    <SyncEngine />
    <ErrorBoundaryRoot />
    <TelemetryLogger />
  </SystemLayer>
</App>
```

---

# 2. Navigation Model

## Mobile

```jsx
<BottomTabs>
  <HomeTab />
  <WorkoutTab />
  <SocialTab />
  <MessagesTab />
  <ProfileTab />
</BottomTabs>
```

## Desktop (UPDATED LAYOUT)

Desktop uses a **left navigation rail + right content area** model.

```jsx
<DesktopShell>
  <LeftNavBar>
    <NavItem />
  </LeftNavBar>

  <RightContent>
    <TopBar />
    <RouteOutlet />
  </RightContent>
</DesktopShell>
```

Desktop-only analytical surfaces:

* Schedule
* Progress

---

# 3. Home Tab

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
    <HealthSnapshotWidget />
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

# 4. Workout System (UPDATED STRUCTURE)

The Workout tab separates:

* **Calendar navigation (date selection layer)**
* **Filtered session results (data layer)**

Calendar views do NOT duplicate lists.
They only control the active date context.

```jsx
<WorkoutTab>
  <WorkoutHeader>
    <AddWorkoutButton />
    <ViewToggle />
    <FilterBar />
    <SortMenu />
  </WorkoutHeader>

  <WorkoutNavigationLayer>
    <DateNavigator>
      <WorkoutListView />
      <WorkoutWeekCalendar />
      <WorkoutMonthCalendar />
    </DateNavigator>
  </WorkoutNavigationLayer>

  <WorkoutFilterLayer>
    <ActiveDateFilter />
    <SessionTypeFilter />
    <ExerciseFilter />
  </WorkoutFilterLayer>

  <WorkoutSessionList />
</WorkoutTab>
```

---

## Session View

```jsx
<SessionView>
  <SessionHeader />
  <SessionMeta />

  <SessionContent>
    <ExerciseBlockList />
    <EnduranceBlock />
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

---

# 5. Social Tab

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

# 6. Messages Tab

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

# 7. Profile Tab (Unified Health System)

```jsx
<ProfileTab>
  <ProfileTabs>
    <OverviewTab />
    <SharedSessionsTab />
    <HealthTab />
  </ProfileTabs>
</ProfileTab>
```

---

## Unified Health Domain

```jsx
<HealthTab>
  <HealthDashboard />

  <HealthModules>
    <BodyMetrics />
    <SleepTracking />
    <InjuryTracking />

    <NutritionTracking>
      <MacroTracking />
      <CalorieTracking />
      <HydrationTracking />
      <CaffeineTracking />
      <SupplementTracking />
    </NutritionTracking>
  </HealthModules>

  <HealthIntegrations>
    <AppleHealthKit />
    <Garmin />
    <Whoop />
  </HealthIntegrations>
</HealthTab>
```

---

# 8. Desktop Systems

## Schedule

```jsx
<ScheduleTab>
  <CalendarView />
  <UpcomingEventsList />
</ScheduleTab>
```

## Progress

```jsx
<ProgressTab>
  <ProgressOverview />
  <AnalysisSelector />
  <TrendCharts />
</ProgressTab>
```

---

# 9. Settings & Notifications (SEPARATED SYSTEMS)

Settings and Notifications are no longer grouped.
They represent distinct interaction systems.

## Settings

```jsx
<Settings>
  <ThemeSettings />
  <UnitSettings />

  <DataManagement>
    <ExportData />
    <ImportData />
    <ClearMockData />
  </DataManagement>
</Settings>
```

## Notifications System

```jsx
<NotificationSystem>
  <NotificationCenter />
  <NotificationPreferences />
  <NotificationRulesEngine />
</NotificationSystem>
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

# 10. Global System Layer

```jsx
<GlobalSystem>
  <LocalDatabase />
  <SyncEngine />
  <NotificationEngine />
  <SearchEngine />
  <ExportImportEngine />
  <HealthAggregationLayer />
</GlobalSystem>
```

---

# 11. ERROR HANDLING ARCHITECTURE

This system uses layered error handling with isolation per domain.

---

## 11.1 Error Boundary Structure

```jsx
<ErrorBoundaryRoot>
  <DomainErrorBoundary>
    <UI />
  </DomainErrorBoundary>
</ErrorBoundaryRoot>
```

Domain isolation:

* WorkoutBoundary
* SocialBoundary
* MessagesBoundary
* HealthBoundary
* AnalyticsBoundary

---

## 11.2 Validation Layer

```jsx
<ValidationLayer>
  <WorkoutInputValidation />
  <NutritionInputValidation />
  <HealthInputValidation />
  <SessionValidation />
</ValidationLayer>
```

---

## 11.3 Sync Layer Errors

```jsx
<SyncEngine>
  <ConflictResolver />
  <RetryQueue />
  <OfflineBuffer />
</SyncEngine>
```

---

## 11.4 UX Error Handling

```jsx
<UXErrorSystem>
  <LoadingStates />
  <EmptyStates />
  <RetryActions />
  <OfflineIndicators />
</UXErrorSystem>
```

---

# Summary

This architecture now reflects:

* corrected desktop layout (left nav + right content)
* clarified Workout calendar as navigation layer (not duplicate views)
* separated Settings and Notifications into distinct systems
* unified Health + Nutrition domain
* strict separation between data layers, UI layers, and error handling
