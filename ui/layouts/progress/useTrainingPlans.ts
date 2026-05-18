import { useState } from 'react';
import { useQuery } from '@ui/bindings';
import { getPlanAdherence } from '@features/training_plans';
import type { TrainingPlan, PlanAdherence } from '@features/training_plans';
import type { PlannedSession } from '@features/planning';
import type { SportType } from '@features/training_log/domain/types';
import type { Id } from '@shared/types';

export type CalView = 'month' | 'week' | 'day';

export const USER_ID = 'user-001' as Id<'User'>;

export const FILTERS = [
  { label: 'Strength', color: 'var(--c-strength)' },
  { label: 'Cardio', color: 'var(--c-cardio)' },
  { label: 'Mobility', color: 'var(--c-mind)' },
  { label: 'Recovery', color: 'var(--c-recovery)' },
];

export const LEGEND = [
  { label: 'Strength', color: 'var(--c-strength)' },
  { label: 'Cardio', color: 'var(--c-cardio)' },
  { label: 'Mobility', color: 'var(--c-mind)' },
  { label: 'Appt.', color: 'var(--ink-muted)' },
];

export const SPORT_COLOR: Partial<Record<SportType, string>> = {
  strength: 'var(--c-strength)',
  run: 'var(--c-cardio)',
  cycle: 'var(--c-nutrition)',
  swim: 'var(--c-water)',
  row: 'var(--c-recovery)',
};

export const SPORT_LABEL: Partial<Record<SportType, string>> = {
  strength: 'Strength', run: 'Cardio', cycle: 'Cardio', swim: 'Cardio', row: 'Cardio',
};

export const SPORT_TITLE: Partial<Record<SportType, string>> = {
  strength: 'Strength Session', run: 'Morning Run', cycle: 'Easy Ride', swim: 'Swim Session', row: 'Rowing',
};

export const DOW_SHORT = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export function weekStart(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - (d.getDay() + 6) % 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

export function getUpcoming(year: number, month: number, todayCutoff: number, workoutCalendar: Record<number, SportType[]>) {
  const isCurrentMonth = new Date().getFullYear() === year && new Date().getMonth() === month;
  const cutoff = isCurrentMonth ? todayCutoff : 0;
  const monthLabel = new Date(year, month, 1).toLocaleString('en-US', { month: 'short' }).toUpperCase();

  return Object.entries(workoutCalendar)
    .map(([d, sports]) => ({ day: Number(d), sport: sports[0] }))
    .filter(({ day }) => day > cutoff)
    .slice(0, 4)
    .map(({ day, sport }) => ({ day, monthLabel, sport, title: SPORT_TITLE[sport], time: '18:00 · ~55 min est.' }));
}

export function useTrainingPlans() {
  const [calView, setCalView] = useState<CalView>('month');
  const [activeFilters, setActiveFilters] = useState(new Set(['Strength', 'Cardio', 'Mobility', 'Recovery']));
  const [showPanel, setShowPanel] = useState(false);
  const [panelView, setPanelView] = useState<'plans' | 'builder'>('plans');
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const workoutCalendar = (useQuery<Record<number, SportType[]>>('workout_calendar') ?? {}) as Record<number, SportType[]>;
  const plans = (useQuery<TrainingPlan[]>('plan_list') ?? []) as TrainingPlan[];
  const adherence = (useQuery<PlanAdherence>('plan_adherence') ?? getPlanAdherence()) as PlanAdherence | null;
  const plannedSessions = (useQuery<PlannedSession[]>('planned_sessions') ?? []) as PlannedSession[];
  const upcomingPlanned = plannedSessions.filter(p => p.scheduledAt > Date.now()).slice(0, 10);

  const today = new Date();

  function prev() {
    if (calView === 'month') setCurrentDate(d => { const n = new Date(d); n.setMonth(n.getMonth() - 1); return n; });
    else if (calView === 'week') setCurrentDate(d => addDays(d, -7));
    else setCurrentDate(d => addDays(d, -1));
  }

  function next() {
    if (calView === 'month') setCurrentDate(d => { const n = new Date(d); n.setMonth(n.getMonth() + 1); return n; });
    else if (calView === 'week') setCurrentDate(d => addDays(d, 7));
    else setCurrentDate(d => addDays(d, 1));
  }

  let navLabel: string;
  if (calView === 'month') {
    navLabel = currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  } else if (calView === 'week') {
    const mon = weekStart(currentDate);
    const sun = addDays(mon, 6);
    const mo = mon.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const su = sun.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    navLabel = `${mo} – ${su}`;
  } else {
    navLabel = currentDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }

  const monthLabel = currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const upcoming = getUpcoming(currentDate.getFullYear(), currentDate.getMonth(), today.getDate(), workoutCalendar);

  function toggleFilter(label: string) {
    setActiveFilters(prev => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  }

  return {
    calView,
    setCalView,
    activeFilters,
    showPanel,
    setShowPanel,
    panelView,
    setPanelView,
    currentDate,
    workoutCalendar,
    plans,
    adherence,
    upcomingPlanned,
    today,
    navLabel,
    monthLabel,
    upcoming,
    prev,
    next,
    toggleFilter,
  };
}
