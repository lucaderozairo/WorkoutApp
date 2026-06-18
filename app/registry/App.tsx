import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState, lazy, Suspense } from "react";
import { ErrorBoundaryRoot } from "@core/errors";
import { Shell } from "@ui/layout";
import { TabNavigation } from "@ui/navigation/TabNavigation";
import { SettingsModal } from "@ui/components/modals/SettingsModal";
import { StorageWarningBanner } from "@ui/components/ux/StorageWarningBanner";
import { Toaster } from "@ui/molecules";
import { APP_MODE } from "@config/app-mode";
import "@features/training_log";
import "@features/planning";
import "@features/health";

// Direct imports let Vite split each screen into its own chunk.
// Heavy libraries (Leaflet, Recharts, Garmin FIT SDK) only load when their route is visited.
const HomeScreen = lazy(() =>
  import("@ui/screens/home/HomeScreen").then((m) => ({
    default: m.HomeScreen,
  })),
);
const LogScreen = lazy(() =>
  import("@ui/screens/session/LogScreen").then((m) => ({
    default: m.LogScreen,
  })),
);
const NewSessionScreen = lazy(() =>
  import("@ui/screens/session/NewSessionScreen").then((m) => ({
    default: m.NewSessionScreen,
  })),
);
const FinishSessionScreen = lazy(() =>
  import("@ui/screens/session/FinishSessionScreen").then((m) => ({
    default: m.FinishSessionScreen,
  })),
);
const EditSessionScreen = lazy(() =>
  import("@ui/screens/session/EditSessionScreen").then((m) => ({
    default: m.EditSessionScreen,
  })),
);
const ExerciseHistoryScreen = lazy(() =>
  import("@ui/screens/progress/ExerciseHistoryScreen").then((m) => ({
    default: m.ExerciseHistoryScreen,
  })),
);
const SocialScreen = lazy(() =>
  import("@ui/screens/social/SocialScreen").then((m) => ({
    default: m.SocialScreen,
  })),
);
const MessageScreen = lazy(() =>
  import("@ui/screens/social/MessageScreen").then((m) => ({
    default: m.MessageScreen,
  })),
);
const ProfileScreen = lazy(() =>
  import("@ui/screens/profile/ProfileScreen").then((m) => ({
    default: m.ProfileScreen,
  })),
);
const SettingsScreen = lazy(() =>
  import("@ui/screens/settings/SettingsScreen").then((m) => ({
    default: m.SettingsScreen,
  })),
);
const NotificationsScreen = lazy(() =>
  import("@ui/screens/notifications").then((m) => ({
    default: m.NotificationsScreen,
  })),
);
const HealthCategoryScreen = lazy(() =>
  import("@ui/screens/health/HealthCategoryScreen").then((m) => ({
    default: m.HealthCategoryScreen,
  })),
);
const WeatherScreen = lazy(() =>
  import("@ui/screens/weather").then((m) => ({
    default: m.WeatherScreen,
  })),
);
const WidgetPrototypeScreen = lazy(() =>
  import("@ui/screens/_proto/WidgetPrototypeScreen").then((m) => ({
    default: m.WidgetPrototypeScreen,
  })),
);
const ResponsivePrototype = lazy(() =>
  import("../../docs/prototypes/responsiveapp")
);
const RoutesScreen = lazy(() =>
  import("@ui/screens/routes/RoutesScreen").then((m) => ({
    default: m.RoutesScreen,
  })),
);
const RouteBuilderScreen = lazy(() =>
  import("@ui/screens/routes/RouteBuilderScreen").then((m) => ({
    default: m.RouteBuilderScreen,
  })),
);
const RouteOverviewScreen = lazy(() =>
  import("@ui/screens/routes/RouteOverviewScreen").then((m) => ({
    default: m.RouteOverviewScreen,
  })),
);

export function App() {
  const location = useLocation();
  const [showSettings, setShowSettings] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  if (location.pathname === '/prototype') {
    return (
      <Suspense fallback={null}>
        <ResponsivePrototype />
      </Suspense>
    );
  }

  const openSettings = () => setShowSettings(true);
  return (
    <Toaster>
      <ErrorBoundaryRoot>
        <Shell
          mode="web"
          menu={(
            <TabNavigation
              onOpenSettings={openSettings}
              menuOpen={menuOpen}
              onMenuToggle={() => setMenuOpen((v) => !v)}
              onMenuClose={() => setMenuOpen(false)}
            />
          )}
        >
          <StorageWarningBanner />
          {showSettings && (
            <SettingsModal onClose={() => setShowSettings(false)} />
          )}
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<HomeScreen />} />
              <Route path="/sessions" element={<LogScreen />} />
              <Route path="/sessions/:sessionId" element={<LogScreen />} />
              <Route
                path="/sessions/:sessionId/summary"
                element={<FinishSessionScreen />}
              />
              <Route
                path="/sessions/:sessionId/edit"
                element={<EditSessionScreen />}
              />
              <Route path="/sessions/new" element={<NewSessionScreen />} />
              <Route
                path="/log"
                element={<Navigate to="/sessions" replace />}
              />
              <Route
                path="/log/:sessionId"
                element={<Navigate to="/sessions/:sessionId" replace />}
              />
              <Route
                path="/new-session"
                element={<Navigate to="/sessions/new" replace />}
              />
              {APP_MODE !== "github-pages" && (
                <>
                  {/* <Route path="/schedule" element={<TrainingPlansScreen />} /> */}
                  {/* <Route path="/progress" element={<ProgressScreen onOpenSettings={openSettings} />} /> */}
                  <Route path="/social" element={<SocialScreen />} />
                  <Route path="/messages" element={<MessageScreen />} />
                  <Route path="/widgets" element={<WidgetPrototypeScreen />} />
                </>
              )}
              <Route
                path="/exercise/:exerciseName"
                element={<ExerciseHistoryScreen />}
              />
              <Route path="/weather" element={<WeatherScreen />} />
              <Route path="/profile" element={<ProfileScreen />} />
              <Route
                path="/profile/health/:category"
                element={<HealthCategoryScreen />}
              />
              <Route path="/settings" element={<SettingsScreen />} />
              <Route path="/notifications" element={<NotificationsScreen />} />
              <Route path="/routes" element={<RoutesScreen />} />
              <Route path="/routes/new" element={<RouteBuilderScreen />} />
              <Route path="/routes/:routeId" element={<RouteOverviewScreen />} />
              <Route path="/routes/:routeId/edit" element={<RouteBuilderScreen />} />
              <Route path="/plan-route" element={<Navigate to="/routes/new" replace />} />
              <Route path="/saved-routes" element={<Navigate to="/routes" replace />} />
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </Suspense>
        </Shell>
      </ErrorBoundaryRoot>
    </Toaster>
  );
}
