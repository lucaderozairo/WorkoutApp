import { useEffect, useMemo } from 'react';
import { useQuery, useCommand } from '@ui/bindings';
import type { TodayReadinessView, SleepEntryView } from '@features/readiness';
import type { ActivitiesState } from '@features/training_log';
import { getActivityHistory } from '@features/training_log';
import { handleRefreshConditions } from '@features/conditions';
import type { WeatherCondition, SuitabilityEntry } from '@features/conditions';
import type { Appointment } from '@features/scheduling';
import { sleepEntryToSession } from '@features/readiness/queries';
import { GOAL_MINUTES, DAY_LABELS } from '@ui/components/dashboard/dashboardUtils';

export function useHomeScreen() {
  const readiness = useQuery<TodayReadinessView>('today_readiness');
  const sessionsState = useQuery<ActivitiesState>('sessions');
  const history = useMemo(() => getActivityHistory(), [sessionsState]);
  const allAppointments = (useQuery<Appointment[]>('appointments_by_date') ?? []) as Appointment[];
  const sleepHistory = (useQuery<SleepEntryView[]>('sleep_history') ?? []) as SleepEntryView[];
  const _conditions = useQuery<WeatherCondition>('current_conditions');
  const _suitability = (useQuery<SuitabilityEntry[]>('suitability_by_sport') ?? []) as SuitabilityEntry[];
  const { dispatch: refreshConditions } = useCommand(handleRefreshConditions);

  useEffect(() => {
    refreshConditions({ type: 'RefreshConditions' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const score = readiness?.hasEntry ? readiness.score : 82;
  const scoreClass = score >= 80 ? 'good' as const : score >= 60 ? 'warning' as const : 'poor' as const;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  const _todayAppointments = allAppointments.filter(
    a => a.scheduledAt >= startOfToday.getTime() && a.scheduledAt <= endOfToday.getTime()
  );

  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const workoutsThisWeek = history.filter(s => new Date(s.startedAt) >= startOfWeek).length;

  // Consecutive training days ending today (or yesterday if not yet trained today)
  const streak = useMemo(() => {
    const trained = new Set(history.map(s => new Date(s.startedAt).toLocaleDateString()));
    const cursor = new Date();
    if (!trained.has(cursor.toLocaleDateString())) cursor.setDate(cursor.getDate() - 1);
    let count = 0;
    while (trained.has(cursor.toLocaleDateString())) {
      count++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  }, [history]);

  const sleepWeek = sleepHistory.slice(0, 7).reverse().map(sleepEntryToSession);
  const lastNight = sleepWeek.length > 0 ? sleepWeek[sleepWeek.length - 1] : null;
  const weeklyTrend = sleepWeek.map(session => {
    const totalMinutes = Math.floor((session.end.getTime() - session.start.getTime()) / 60_000);
    return {
      day: DAY_LABELS[session.end.getDay()],
      value: Math.round(((totalMinutes - GOAL_MINUTES) / 60) * 10) / 10,
    };
  });
  const scoreHistory = sleepWeek.map(s => ({
    x: s.end.toLocaleDateString(undefined, { weekday: 'short' }),
    y: s.score,
  }));

  return {
    workoutsThisWeek,
    streak,
    scoreClass,
    lastNight,
    weeklyTrend,
    scoreHistory,
    isFirstRun: history.length === 0,
  };
}
