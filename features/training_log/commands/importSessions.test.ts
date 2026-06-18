import { describe, it, expect, beforeEach } from 'vitest';
import { handleImportSessions } from './importSessions';
import { viewStore } from '@data/projections/views';
import { sessionProjection } from '../projections';
import type { ActivitiesState } from '../projections';
import type { ParsedCsvData } from '@shared/utils/importCsv';

const EXPORT_DATA: ParsedCsvData = {
  format: 'export',
  headers: [
    'Type', 'Session ID', 'Name', 'Date', 'Category/Sport',
    'Exercise', 'Block Type', 'Set #',
    'Weight (kg)', 'Reps', 'Distance (m)', 'Duration (s)',
    'Is Warmup', 'Is PR', 'RPE', 'Notes',
  ],
  rows: [
    ['strength', 'sess-1', 'Morning Lift', '2024-01-15', 'strength', 'Squat', '', '1', '100', '5', '0', '0', 'false', 'false', '7', ''],
    ['strength', 'sess-1', 'Morning Lift', '2024-01-15', 'strength', 'Squat', '', '2', '105', '5', '0', '0', 'false', 'false', '7', ''],
    ['strength', 'sess-1', 'Morning Lift', '2024-01-15', 'strength', 'Bench Press', '', '1', '80', '8', '0', '0', 'false', 'false', '', ''],
  ],
};

beforeEach(() => {
  viewStore.set('sessions', { byId: {}, activeId: null });
  sessionProjection.setState({ byId: {}, activeId: null });
});

describe('handleImportSessions', () => {
  it('imports strength session into viewStore via events', async () => {
    const result = await handleImportSessions(EXPORT_DATA);

    expect(result.sessionCount).toBe(1);
    expect(result.errors).toHaveLength(0);

    const state = viewStore.get('sessions');
    const sessions = Object.values(state?.byId ?? {});
    expect(sessions).toHaveLength(1);
    expect(sessions[0].name).toBe('Morning Lift');
    expect(sessions[0].segments).toHaveLength(2);
    expect(sessions[0].segments[0].exerciseName).toBe('Squat');
    expect(sessions[0].segments[0].sets).toHaveLength(2);
  });

  it('skips cardio rows', async () => {
    const cardioData: ParsedCsvData = {
      format: 'export',
      headers: EXPORT_DATA.headers,
      rows: [['cardio', 'sess-c', 'Run', '2024-01-16', 'running', '', '', '', '', '', '5000', '1800', '', '', '', '']],
    };
    const result = await handleImportSessions(cardioData);
    expect(result.sessionCount).toBe(0);
  });

  it('returns error for unknown format', async () => {
    const result = await handleImportSessions({ format: 'unknown', error: 'bad file' });
    expect(result.sessionCount).toBe(0);
    expect(result.errors).toContain('bad file');
  });

  it('handles simple format', async () => {
    const simpleData: ParsedCsvData = {
      format: 'simple',
      headers: ['Date', 'Exercise', 'Sets', 'Reps', 'Weight', 'Notes'],
      rows: [['2024-01-20', 'Deadlift', '3', '5', '140', '']],
    };
    const result = await handleImportSessions(simpleData);
    expect(result.sessionCount).toBe(1);
    const state = viewStore.get('sessions');
    const sessions = Object.values(state?.byId ?? {});
    expect(sessions[0].segments[0].exerciseName).toBe('Deadlift');
  });
});
