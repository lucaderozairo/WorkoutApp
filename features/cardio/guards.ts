import type { CardioSession } from './domain/types';

/** Structural guard: recognises a persisted cardio session by its shape. */
export function isCardioSession(s: unknown): s is CardioSession {
  const obj = s as Record<string, unknown>;
  return typeof obj.sport === 'string' && 'distanceMeters' in obj && 'userId' in obj;
}
