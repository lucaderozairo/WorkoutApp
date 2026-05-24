export const PERSISTED_KEYS = [
  'sessions',
  'recent_exercises',
  'recent_cardio_sessions',
  'exercise_progressions',
  'planned_sessions',
  'saved_routes',
  'saved_templates',
  'wapp_recent_sports',
  'display_name',
] as const;
export type PersistedKey = typeof PERSISTED_KEYS[number];

const PREFIX = 'workout-app:';

export function saveToStorage(key: PersistedKey, value: unknown): boolean {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns a warning message if browser storage is critically full, null otherwise.
 * Safe to call on every app start — fails silently if the Storage API is unavailable.
 */
export async function checkStorageQuota(): Promise<string | null> {
  if (!navigator.storage?.estimate) return null;
  try {
    const { usage = 0, quota = 0 } = await navigator.storage.estimate();
    if (quota === 0) return null;
    const pct = Math.round((usage / quota) * 100);
    if (pct >= 90) return `Storage critically full (${pct}% used). Export your data now to avoid losing workouts.`;
    if (pct >= 75) return `Storage ${pct}% full. Consider exporting a backup of your data.`;
    return null;
  } catch {
    return null;
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

const CHECKPOINT_KEY = 'workout-app:events-checkpoint';

export function saveCheckpointTimestamp(ts: number): void {
  try { localStorage.setItem(CHECKPOINT_KEY, String(ts)); } catch { /* ignore */ }
}

export function loadCheckpointTimestamp(): number | null {
  try {
    const raw = localStorage.getItem(CHECKPOINT_KEY);
    if (raw === null) return null;
    const ts = Number(raw);
    return Number.isFinite(ts) ? ts : null;
  } catch {
    return null;
  }
}

export function clearStorage(): void {
  PERSISTED_KEYS.forEach(k => localStorage.removeItem(PREFIX + k));
  try { localStorage.removeItem(CHECKPOINT_KEY); } catch { /* ignore */ }
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
