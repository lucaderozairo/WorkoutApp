export function generateId<T>(): import('@shared/types').Id<T> {
  return crypto.randomUUID() as import('@shared/types').Id<T>;
}

export const constants = {
  APP_NAME: 'Workout App',
  VERSION: '0.1.0',
} as const;

export { timeAgo } from './timeAgo';
export {
  formatDuration,
  formatDurationMs,
  paceSecPerKm,
  formatPace,
  toIsoDate,
  type DurationOptions,
  type PaceOptions,
} from './format';
