// data_transfer — application service for whole-app backup / restore.
//
// This is the one legitimate home for the JSON backup path: as feature-logic it
// may import data-io (persistence) and read-models (viewStore), so UI never has
// to reach across those boundaries itself. Cross-feature CSV serialization lives
// in the UI transfer module instead (UI may legally see multiple features).

import { viewStore } from '@data/projections/views';
import {
  exportEnvelope,
  exportSessionEnvelope,
  clearStorage,
  PERSISTED_KEYS,
  type PersistedKey,
} from '@data/sources/local/persistence';

/** Full-backup JSON envelope of every persisted view key. */
export { exportEnvelope as exportBackup };

/** JSON envelope wrapping an explicit list of sessions (single-session export). */
export { exportSessionEnvelope as exportSessionBackup };

/** Wipe all persisted data. Irreversible. */
export { clearStorage as clearAllData };

export type RestoreResult =
  | { ok: true; sessionCount: number }
  | { ok: false; error: string };

/**
 * Restore a backup envelope produced by {@link exportBackup}. Only known
 * persisted keys are written; unknown keys are ignored. Returns the number of
 * sessions loaded so callers can surface a confirmation message.
 */
export function restoreBackup(json: string): RestoreResult {
  let parsed: { version?: number; data?: Record<string, unknown> };
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, error: 'Could not read file.' };
  }

  if (parsed.version !== 1 || !parsed.data || typeof parsed.data !== 'object') {
    return { ok: false, error: 'Invalid file format.' };
  }

  const valid = new Set<string>(PERSISTED_KEYS);
  for (const [key, value] of Object.entries(parsed.data)) {
    if (valid.has(key)) viewStore.set(key as PersistedKey, value);
  }

  const sessionsData = parsed.data.sessions as { byId?: Record<string, unknown> } | undefined;
  const sessionCount = sessionsData?.byId ? Object.keys(sessionsData.byId).length : 0;
  return { ok: true, sessionCount };
}
