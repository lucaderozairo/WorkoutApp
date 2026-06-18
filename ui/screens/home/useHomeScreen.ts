import { useEffect } from 'react';
import { useQuery, useCommand } from '@ui/bindings';
import type { TodayReadinessView } from '@features/readiness/contract';
import type { TrainingDashboardView, ActivityHistoryItem } from '@features/training_log/contract';
import type { SleepTrendView } from '@features/readiness/contract';
import { handleRefreshConditions } from '@features/conditions';
import type { WeatherCondition, SuitabilityEntry } from '@features/conditions/contract';
import type { Appointment } from '@features/scheduling/contract';

export function useHomeScreen() {
  const readiness = useQuery('today_readiness');
  const dashboard = useQuery('training_log_dashboard');
  const sleepTrend = useQuery('sleep_trend');
  const allAppointments = (useQuery('appointments_by_date') ?? []) as Appointment[];
  const _conditions = useQuery('current_conditions');
  const _suitability = (useQuery('suitability_by_sport') ?? []) as SuitabilityEntry[];
  const { dispatch: refreshConditions } = useCommand(handleRefreshConditions);

  useEffect(() => {
    refreshConditions({ type: 'RefreshConditions' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasReadinessEntry = readiness?.hasEntry ?? false;
  const score = readiness?.score ?? 0;
  const scoreClass = !hasReadinessEntry
    ? 'none' as const
    : score >= 80 ? 'good' as const
    : score >= 60 ? 'warning' as const
    : 'poor' as const;

  const history = (useQuery('activity_history') ?? []) as ActivityHistoryItem[];

  // This-week day breakdown (Mon-indexed)
  const now = new Date();
  const daysFromMon = (now.getDay() + 6) % 7;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - daysFromMon);
  weekStart.setHours(0, 0, 0, 0);
  const trainedDays = new Set(
    history
      .filter(s => new Date(s.startedAt) >= weekStart)
      .map(s => new Date(s.startedAt).getDay())
  );
  const WEEK_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const weekDays = WEEK_LABELS.map((label, i) => ({
    label,
    done: trainedDays.has((i + 1) % 7),
    isToday: i === daysFromMon,
    isFuture: i > daysFromMon,
  }));

  const upcomingAppointments = allAppointments
    .filter(a => a.scheduledAt > Date.now())
    .sort((a, b) => a.scheduledAt - b.scheduledAt)
    .slice(0, 3);

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayEnd   = new Date(todayStart); todayEnd.setDate(todayStart.getDate() + 1);
  const todayAppointments = allAppointments
    .filter(a => a.scheduledAt >= todayStart.getTime() && a.scheduledAt < todayEnd.getTime())
    .sort((a, b) => a.scheduledAt - b.scheduledAt)
    .slice(0, 5);

  const lastSessions = [...history]
    .sort((a, b) => b.startedAt - a.startedAt)
    .slice(0, 2);

  return {
    workoutsThisWeek: dashboard?.workoutsThisWeek ?? 0,
    streak: dashboard?.streak ?? 0,
    scoreClass,
    hasReadinessEntry,
    score,
    lastNight: sleepTrend?.lastNight ?? null,
    weeklyTrend: sleepTrend?.weeklyTrend ?? [],
    scoreHistory: sleepTrend?.scoreHistory ?? [],
    weekDays,
    upcomingAppointments,
    todayAppointments,
    lastSessions,
  };
}
