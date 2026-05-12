import { useEffect } from 'react';
import { useQuery, useCommand } from '@ui/bindings';
import { ImportDataWidget } from '@ui/components/widgets/ImportDataWidget';
import { ExportDataWidget } from '@ui/components/widgets/ExportDataWidget';
import type { TodayReadinessView } from '@features/readiness';
import type { SessionHistoryItem } from '@features/training_log';
import type { SleepEntryView } from '@features/readiness';
import { handleRefreshConditions } from '@features/conditions';
import type { WeatherCondition, SuitabilityEntry } from '@features/conditions';
import type { Appointment } from '@features/scheduling';
import { registerTrainingPlanProjections, registerAdherencePolicy } from '@features/training_plans';
import { registerGoalProjections } from '@features/goals';
import { registerHabitProjections, registerStreakMilestonePolicy } from '@features/habits';
import { SleepLarge } from '@ui/components/widgets/SleepWidgets';
import { CalendarLarge } from '@ui/components/widgets/CalendarWidgets';
import { WelcomeWidget } from '@ui/components/widgets/WelcomeWidget';
import { ScheduleWidget } from '@ui/components/widgets/ScheduleWidget';
import { WeatherWidget } from '@ui/components/widgets/WeatherWidget';
import { SleepCard } from '@ui/components/dashboard/SleepCard';
import { sleepEntryToSession, GOAL_MINUTES, DAY_LABELS } from '@ui/components/dashboard/dashboardUtils';

import '@features/training_log';
import '@features/readiness';
import '@features/conditions';
import '@features/scheduling';
import '@features/news_feed';
import '@features/training_plans';
import '@features/goals';
import '@features/habits';
import { PlanRouteWidget } from '@ui/components/widgets/PlanRouteWidget';
import { EditDisplayNameWidget } from '@ui/components/widgets/EditDisplayNameWidget';

registerTrainingPlanProjections();
registerAdherencePolicy();
registerGoalProjections();
registerHabitProjections();
registerStreakMilestonePolicy();

export function DashboardScreen() {
  const readiness = useQuery<TodayReadinessView>('today_readiness');
  const history = (useQuery<SessionHistoryItem[]>('session_history') ?? []) as SessionHistoryItem[];
  const conditions = useQuery<WeatherCondition>('current_conditions');
  const suitability = (useQuery<SuitabilityEntry[]>('suitability_by_sport') ?? []) as SuitabilityEntry[];
  const allAppointments = (useQuery<Appointment[]>('appointments_by_date') ?? []) as Appointment[];
  const { dispatch: refreshConditions } = useCommand(handleRefreshConditions);

  useEffect(() => {
    refreshConditions({ type: 'RefreshConditions' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const SCORE = readiness?.hasEntry ? readiness.score : 82;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  const todayAppointments = allAppointments.filter(
    a => a.scheduledAt >= startOfToday.getTime() && a.scheduledAt <= endOfToday.getTime()
  );

  const scoreClass = SCORE >= 80 ? 'good' as const : SCORE >= 60 ? 'warning' as const : 'poor' as const;

  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const workoutsThisWeek = history.filter(s => new Date(s.startedAt) >= startOfWeek).length;

  const sleepHistory = (useQuery<SleepEntryView[]>('sleep_history') ?? []) as SleepEntryView[];
  const sleepWeek = sleepHistory.slice(0, 7).reverse().map(sleepEntryToSession);
  const lastNight = sleepWeek.length > 0 ? sleepWeek[sleepWeek.length - 1] : null;
  const weeklyTrend = sleepWeek.map(session => {
    const totalMinutes = Math.floor((session.end.getTime() - session.start.getTime()) / 60_000);
    return {
      day: DAY_LABELS[session.end.getDay()],
      value: Math.round(((totalMinutes - GOAL_MINUTES) / 60) * 10) / 10,
    };
  });

  const scoreHistory = sleepWeek.map((s) => ({
    x: s.end.toLocaleDateString(undefined, { weekday: 'short' }),
    y: s.score,
  }));

  return (<>
    <div className="column">
      <WelcomeWidget workoutsThisWeek={workoutsThisWeek} scoreClass={scoreClass} />
      <div className="widget-grid">
        <EditDisplayNameWidget />
          <ImportDataWidget />
          <ExportDataWidget />
        <PlanRouteWidget />
      </div>
      <div className="auto-grid" hidden={true}>
        {/* <SleepCard score={SCORE} scoreClass={scoreClass} readiness={readiness ?? null} /> */}
        {lastNight && <SleepLarge session={lastNight} goalMinutes={GOAL_MINUTES} weeklyTrend={weeklyTrend} scoreHistory={scoreHistory} />}
        <WeatherWidget />
        {/* <ScheduleWidget appointments={todayAppointments} /> */}
        <CalendarLarge />
      </div>
    </div>
  </>
  );
}
