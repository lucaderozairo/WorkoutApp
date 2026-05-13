export const PERSISTED_KEYS = [
  'session_history',
  'recent_cardio_sessions',
  'exercise_progressions',
  'editing_session',
  'planned_sessions',
  'saved_routes',
  'wapp_recent_sports',
  'display_name',
] as const;
export type PersistedKey = typeof PERSISTED_KEYS[number];

const PREFIX = 'workout-app:';

export function saveToStorage(key: PersistedKey, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // storage full or unavailable — silently skip
  }
}

export function loadFromStorage<T>(key: PersistedKey): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function clearStorage(): void {
  PERSISTED_KEYS.forEach(k => localStorage.removeItem(PREFIX + k));
}

export function exportEnvelope(): string {
  const data: Record<string, unknown> = {};
  for (const key of PERSISTED_KEYS) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (raw) data[key] = JSON.parse(raw);
    } catch {
      // skip malformed key
    }
  }
  return JSON.stringify({ version: 1, exportedAt: Date.now(), data }, null, 2);
}

export function exportSessionEnvelope(sessions: unknown[]): string {
  return JSON.stringify(
    { version: 1, exportedAt: Date.now(), data: { session_history: sessions } },
    null,
    2,
  );
}
