import type { SleepSession } from '../domain/mock-types';

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
