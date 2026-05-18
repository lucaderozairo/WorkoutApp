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
