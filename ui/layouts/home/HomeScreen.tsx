import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ImportDataWidget } from '@ui/components/widgets/ImportDataWidget';
import { ExportDataWidget } from '@ui/components/widgets/ExportDataWidget';
import { SleepLarge } from '@ui/components/widgets/SleepWidgets';
import { CalendarLarge } from '@ui/components/widgets/CalendarWidgets';
import { WelcomeWidget } from '@ui/components/widgets/WelcomeWidget';
import { WeatherWidget } from '@ui/components/widgets/WeatherWidget';
import { GOAL_MINUTES } from '@ui/components/dashboard/dashboardUtils';
import { PlanRouteWidget } from '@ui/components/widgets/PlanRouteWidget';
import { EditDisplayNameWidget } from '@ui/components/widgets/EditDisplayNameWidget';
import { registerTrainingPlanProjections, registerAdherencePolicy } from '@features/training_plans';
import { registerGoalProjections } from '@features/goals';
import { registerHabitProjections, registerStreakMilestonePolicy } from '@features/habits';
import { registerAchievementPolicies, ACHIEVEMENT_DEFINITIONS } from '@features/achievements';
import type { AchievementUnlockedPayload } from '@features/achievements';
import { eventBus } from '@core/events/bus';
import { useHomeScreen } from './useHomeScreen';

import '@features/training_log';
import '@features/readiness';
import '@features/conditions';
import '@features/scheduling';
import '@features/news_feed';
import '@features/training_plans';
import '@features/goals';
import '@features/habits';

registerTrainingPlanProjections();
registerAdherencePolicy();
registerGoalProjections();
registerHabitProjections();
registerStreakMilestonePolicy();
registerAchievementPolicies();

interface UnlockedToast {
  name: string;
  rarity: string;
  description: string;
}

const RARITY_EMOJI: Record<string, string> = {
  common: '🥉',
  rare: '🥈',
  epic: '🥇',
  legendary: '🏆',
};

export function HomeScreen() {
  const { workoutsThisWeek, streak, scoreClass, lastNight, weeklyTrend, scoreHistory, isFirstRun } = useHomeScreen();
  const [toast, setToast] = useState<UnlockedToast | null>(null);

  useEffect(() => {
    const token = eventBus.subscribe('AchievementUnlocked', (event) => {
      const payload = event.payload as AchievementUnlockedPayload;
      const def = ACHIEVEMENT_DEFINITIONS.find(d => d.id === payload.achievementId);
      if (def) {
        setToast({ name: def.name, rarity: def.rarity, description: def.description });
      }
    });
    return () => token.unsubscribe();
  }, []);

  return (
    <div className="column">
      <WelcomeWidget workoutsThisWeek={workoutsThisWeek} streak={streak} scoreClass={scoreClass} />

      {toast && (
        <div className="surface row align-center" role="status" aria-live="polite">
          <span aria-hidden="true">{RARITY_EMOJI[toast.rarity] ?? '🏅'}</span>
          <div className="column grow compact">
            <strong className="caption">Achievement unlocked — {toast.name}</strong>
            <span className="detail">{toast.description}</span>
          </div>
          <button
            type="button"
            className="ghost sm"
            onClick={() => setToast(null)}
            aria-label="Dismiss"
          >✕</button>
        </div>
      )}

      {isFirstRun && (
        <div className="surface column">
          <strong>Get started — three things to try</strong>
          <div className="column">
            <div className="row align-center">
              <div className="column grow compact">
                <span className="caption">Log your first workout</span>
                <span className="detail">Track exercises, sets, reps, and weight</span>
              </div>
              <Link to="/sessions/new" className="secondary sm">Start session</Link>
            </div>
            <div className="row align-center">
              <div className="column grow compact">
                <span className="caption">Plan a route</span>
                <span className="detail">Map out a run or ride before you head out</span>
              </div>
              <Link to="/plan-route" className="secondary sm">Open map</Link>
            </div>
            <div className="row align-center">
              <div className="column grow compact">
                <span className="caption">Track your health</span>
                <span className="detail">Log sleep, nutrition, body metrics and more</span>
              </div>
              <Link to="/profile" className="secondary sm">View profile</Link>
            </div>
          </div>
        </div>
      )}

      <div className="widget-grid">
        <EditDisplayNameWidget />
        <ImportDataWidget />
        <ExportDataWidget />
        <PlanRouteWidget />
      </div>

      <div className="auto-grid" hidden={true}>
        {lastNight && (
          <SleepLarge
            session={lastNight}
            goalMinutes={GOAL_MINUTES}
            weeklyTrend={weeklyTrend}
            scoreHistory={scoreHistory}
          />
        )}
        <WeatherWidget />
        <CalendarLarge />
      </div>
    </div>
  );
}
