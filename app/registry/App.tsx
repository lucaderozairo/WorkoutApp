import { Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { ErrorBoundaryRoot } from '@core/errors';
import { TabNavigation } from '@ui/layouts';
import { HomeScreen } from '@ui/layouts';
import { LogScreen } from '@ui/layouts';
// import { ProgressScreen } from '@ui/layouts';
import { ExerciseHistoryScreen } from '@ui/layouts';
import { SocialScreen } from '@ui/layouts';
import { MessageScreen } from '@ui/layouts';
import { ProfileScreen } from '@ui/layouts';
// import { TrainingPlansScreen } from '@ui/layouts';
import { SettingsScreen } from '@ui/layouts';
import { NotificationsScreen } from '@ui/layouts';
import { NewSessionScreen } from '@ui/layouts';
import { HealthCategoryScreen } from '@ui/layouts';
import { WeatherScreen } from '@ui/layouts';
import { WidgetPrototypeScreen } from '@ui/layouts';
import { RoutePlannerScreen, SavedRoutesScreen, FinishSessionScreen, EditSessionScreen } from '@ui/layouts';
import { SettingsModal } from '@ui/components/modals/SettingsModal';
import { APP_MODE } from '@config/app-mode';
import '@features/training_log';
import '@features/planning';
import '@features/health';

export function App() {
  const [showSettings, setShowSettings] = useState(false);
  const openSettings = () => setShowSettings(true);

  return (
    <ErrorBoundaryRoot>
      <div className="app-shell">
        <TabNavigation onOpenSettings={openSettings} />
        <main>
          {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<HomeScreen />} />
            <Route path="/dashboard" element={<Navigate to="/home" replace />} />
            <Route path="/sessions" element={<LogScreen />} />
            <Route path="/sessions/:sessionId" element={<LogScreen />} />
            <Route path="/sessions/:sessionId/summary" element={<FinishSessionScreen />} />
            <Route path="/sessions/:sessionId/edit" element={<EditSessionScreen />} />
            <Route path="/sessions/new" element={<NewSessionScreen />} />
            <Route path="/log" element={<Navigate to="/sessions" replace />} />
            <Route path="/log/:sessionId" element={<Navigate to="/sessions/:sessionId" replace />} />
            <Route path="/new-session" element={<Navigate to="/sessions/new" replace />} />
            {APP_MODE !== 'github-pages' && (
              <>
                {/* <Route path="/schedule" element={<TrainingPlansScreen />} /> */}
                {/* <Route path="/progress" element={<ProgressScreen onOpenSettings={openSettings} />} /> */}
                <Route path="/social" element={<SocialScreen />} />
                <Route path="/messages" element={<MessageScreen />} />
            <Route path="/widgets" element={<WidgetPrototypeScreen />} />
              </>
            )}
            <Route path="/exercise/:exerciseName" element={<ExerciseHistoryScreen />} />
            <Route path="/weather" element={<WeatherScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
            <Route path="/profile/health/:category" element={<HealthCategoryScreen />} />
            <Route path="/settings" element={<SettingsScreen />} />
            <Route path="/notifications" element={<NotificationsScreen />} />
            <Route path="/plan-route" element={<RoutePlannerScreen />} />
            <Route path="/saved-routes" element={<SavedRoutesScreen />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </main>
      </div>
    </ErrorBoundaryRoot>
  );
}
