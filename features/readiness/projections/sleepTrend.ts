import { viewStore } from '@data/projections/views';
import type { SleepEntryView } from './index';
import { sleepEntryToSession } from '../queries';
import type { SleepSession } from '../domain/mock-types';

// ─── Constants ────────────────────────────────────────────────

const GOAL_MINUTES = 480; // 8h
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

// ─── View types ───────────────────────────────────────────────

export interface WeeklyTrendEntry {
  day: string;
  value: number;
  goal: number;
}

export interface SleepScorePoint {
  x: string;
  y: number;
}

export interface SleepTrendView {
  weeklyTrend: WeeklyTrendEntry[];
  scoreHistory: SleepScorePoint[];
  lastNight: SleepSession | null;
}

// ─── Computation ──────────────────────────────────────────────

function computeSleepTrend(history: SleepEntryView[] | undefined): SleepTrendView {
  if (!history || history.length === 0) {
    return { weeklyTrend: [], scoreHistory: [], lastNight: null };
  }

  const sleepWeek = history.slice(0, 7).reverse().map(sleepEntryToSession);
  const lastNight = sleepWeek.length > 0 ? sleepWeek[sleepWeek.length - 1] : null;

  const weeklyTrend: WeeklyTrendEntry[] = sleepWeek.map(session => {
    const totalMinutes = Math.floor((session.end.getTime() - session.start.getTime()) / 60_000);
    return {
      day: DAY_LABELS[session.end.getDay()],
      value: Math.round(((totalMinutes - GOAL_MINUTES) / 60) * 10) / 10,
      goal: GOAL_MINUTES / 60,
    };
  });

  const scoreHistory: SleepScorePoint[] = sleepWeek.map(s => ({
    x: s.end.toLocaleDateString(undefined, { weekday: 'short' }),
    y: s.score,
  }));

  return { weeklyTrend, scoreHistory, lastNight };
}

// ─── Registration ─────────────────────────────────────────────

let registered = false;

export function registerSleepTrendProjection(): void {
  if (registered) return;
  registered = true;

  const initial = computeSleepTrend(viewStore.get('sleep_history'));
  viewStore.set('sleep_trend', initial);

  viewStore.subscribe('sleep_history', (history) => {
    viewStore.set('sleep_trend', computeSleepTrend(history as SleepEntryView[]));
  });
}
