import type { SleepEntryView } from '@features/readiness';
import type { SleepSession } from '@data/mock/sleep';

export const GOAL_MINUTES = 480; // 8h
export const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

export const RING_COLORS = {
  good: 'var(--color-success)',
  warning: 'var(--color-warning)',
  poor: 'var(--color-danger)',
} as const;

export const SPORT_ICONS: Record<string, string> = {
  run: '🏃', cycle: '🚴', swim: '🏊', row: '🚣', hike: '🥾', ski: '⛷️',
};

export function sleepEntryToSession(entry: SleepEntryView): SleepSession {
  const end = new Date(entry.date);
  end.setHours(6, 30, 0, 0);
  const durationMs = (entry.durationMin ?? 0) * 60_000;
  return {
    start: new Date(end.getTime() - durationMs),
    end,
    score: entry.score,
    stages: {
      deep: entry.deepMin ?? 0,
      light: entry.lightMin ?? 0,
      rem: entry.remMin ?? 0,
      awake: entry.awakeMin ?? 0,
    },
  };
}
