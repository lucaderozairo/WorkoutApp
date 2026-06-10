import { useEffect } from 'react';
import { useQuery, useCommand } from '@ui/bindings';
import type { TodayReadinessView } from '@features/readiness/contract';
import type { TrainingDashboardView } from '@features/training_log/contract';
import type { SleepTrendView } from '@features/readiness/contract';
import { handleRefreshConditions } from '@features/conditions';
import type { WeatherCondition, SuitabilityEntry } from '@features/conditions/contract';
import type { Appointment } from '@features/scheduling/contract';

export function useHomeScreen() {
  const readiness = useQuery<TodayReadinessView>('today_readiness');
  const dashboard = useQuery<TrainingDashboardView>('training_log_dashboard');
  const sleepTrend = useQuery<SleepTrendView>('sleep_trend');
  const allAppointments = (useQuery<Appointment[]>('appointments_by_date') ?? []) as Appointment[];
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

  return {
    workoutsThisWeek: dashboard?.workoutsThisWeek ?? 0,
    streak: dashboard?.streak ?? 0,
    scoreClass,
    lastNight: sleepTrend?.lastNight ?? null,
    weeklyTrend: sleepTrend?.weeklyTrend ?? [],
    scoreHistory: sleepTrend?.scoreHistory ?? [],
  };
}
