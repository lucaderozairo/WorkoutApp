import { describe, it, expect } from 'vitest';
import { viewStore } from '@data/projections/views';
import { restoreBackup, exportSessionBackup, type RestoreResult } from './index';

function envelope(data: Record<string, unknown>): string {
  return JSON.stringify({ version: 1, exportedAt: 0, data });
}

describe('restoreBackup', () => {
  it('rejects malformed JSON', () => {
    expect(restoreBackup('not json')).toEqual<RestoreResult>({ ok: false, error: 'Could not read file.' });
  });

  it('rejects a wrong version', () => {
    const json = JSON.stringify({ version: 2, data: {} });
    expect(restoreBackup(json)).toEqual<RestoreResult>({ ok: false, error: 'Invalid file format.' });
  });

  it('writes known keys and ignores unknown ones', () => {
    const json = envelope({
      recent_exercises: [{ name: 'Bench' }],
      not_a_real_key: [1, 2, 3],
    });
    const result = restoreBackup(json);
    expect(result).toEqual<RestoreResult>({ ok: true, sessionCount: 0 });
    expect(viewStore.get('recent_exercises')).toEqual([{ name: 'Bench' }]);
    expect(viewStore.get('not_a_real_key')).toBeUndefined();
  });

  it('counts restored sessions from sessions.byId', () => {
    const json = envelope({ sessions: { byId: { a: {}, b: {} }, activeId: null } });
    expect(restoreBackup(json)).toEqual<RestoreResult>({ ok: true, sessionCount: 2 });
  });
});

describe('exportSessionBackup', () => {
  it('wraps sessions in a version-1 envelope', () => {
    const json = exportSessionBackup([{ id: 's1' }]);
    const parsed = JSON.parse(json);
    expect(parsed.version).toBe(1);
    expect(parsed.data.session_history).toEqual([{ id: 's1' }]);
  });
});
