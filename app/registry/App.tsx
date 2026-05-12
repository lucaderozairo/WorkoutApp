import { Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { ErrorBoundaryRoot } from '@core/errors';
import { TabNavigation } from '@ui/layouts';
import { DashboardScreen } from '@ui/layouts';
import { LogScreen } from '@ui/layouts';
import { ProgressScreen } from '@ui/layouts';
import { SessionDetailScreen } from '@ui/layouts';
import { ExerciseHistoryScreen } from '@ui/layouts';
import { SocialScreen } from '@ui/layouts';
import { MessageScreen } from '@ui/layouts';
import { ProfileScreen } from '@ui/layouts';
import { TrainingPlansScreen } from '@ui/layouts';
import { SettingsScreen } from '@ui/layouts';
import { NotificationsScreen } from '@ui/layouts';
import { NewSessionScreen } from '@ui/layouts';
import { HealthCategoryScreen } from '@ui/layouts';
import { WeatherScreen } from '@ui/layouts';
import { WidgetPrototypeScreen } from '@ui/layouts';
import { SettingsModal } from '@ui/components/modals/SettingsModal';
import { APP_MODE } from '@config/app-mode';
import '@features/training_log';
import '@features/planning';

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
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardScreen />} />
            <Route path="/log" element={<LogScreen />} />
            <Route path="/log/:sessionId" element={<LogScreen />} />
            {APP_MODE !== 'github-pages' && (
              <>
                <Route path="/schedule" element={<TrainingPlansScreen />} />
                <Route path="/progress" element={<ProgressScreen onOpenSettings={openSettings} />} />
<Route path="/social" element={<SocialScreen />} />
                <Route path="/messages" element={<MessageScreen />} />
              </>
            )}
            <Route path="/sessions/:sessionId" element={<SessionDetailScreen />} />
            <Route path="/new-session" element={<NewSessionScreen />} />
            <Route path="/exercise/:exerciseName" element={<ExerciseHistoryScreen />} />
            <Route path="/weather" element={<WeatherScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
            <Route path="/profile/health/:category" element={<HealthCategoryScreen />} />
            <Route path="/settings" element={<SettingsScreen />} />
            <Route path="/notifications" element={<NotificationsScreen />} />
            <Route path="/widgets" element={<WidgetPrototypeScreen />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </ErrorBoundaryRoot>
  );
}
