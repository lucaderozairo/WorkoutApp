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

export function HomeScreen() {
  const { workoutsThisWeek, scoreClass, lastNight, weeklyTrend, scoreHistory } = useHomeScreen();

  return (
    <div className="column">
      <WelcomeWidget workoutsThisWeek={workoutsThisWeek} scoreClass={scoreClass} />

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
