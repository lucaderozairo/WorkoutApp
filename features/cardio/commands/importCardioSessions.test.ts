import { describe, it, expect, beforeEach } from 'vitest';
import { handleImportCardioSessions } from './importCardioSessions';
import { viewStore } from '@data/projections/views';
import { recentCardioProjection } from '../projections';
import type { RecentCardioView } from '../projections';
import type { ParsedCsvData } from '@shared/utils/importCsv';

const CARDIO_DATA: ParsedCsvData = {
  format: 'export',
  headers: [
    'Type', 'Session ID', 'Name', 'Date', 'Category/Sport',
    'Exercise', 'Block Type', 'Set #', 'Weight (kg)', 'Reps',
    'Distance (m)', 'Duration (s)', 'Is Warmup', 'Is PR', 'RPE', 'Notes',
  ],
  rows: [
    ['cardio', 'sess-c1', 'Morning Run', '2024-01-15', 'running', '', '', '', '', '', '5000', '1800', '', '', '', 'felt good'],
  ],
};

beforeEach(() => {
  viewStore.set('recent_cardio_sessions', { sessions: [] });
  recentCardioProjection.setState({ sessions: [] });
});

describe('handleImportCardioSessions', () => {
  it('imports cardio session into viewStore via events', async () => {
    const result = await handleImportCardioSessions(CARDIO_DATA);

    expect(result.cardioCount).toBe(1);
    expect(result.errors).toHaveLength(0);

    const state = viewStore.get<RecentCardioView>('recent_cardio_sessions');
    expect(state?.sessions).toHaveLength(1);
    expect(state?.sessions[0].distanceMeters).toBe(5000);
    expect(state?.sessions[0].durationSeconds).toBe(1800);
  });

  it('skips strength rows', async () => {
    const strengthData: ParsedCsvData = {
      ...CARDIO_DATA,
      rows: [['strength', 'sess-s1', 'Lift', '2024-01-15', 'strength', 'Squat', '', '1', '100', '5', '', '', 'false', 'false', '', '']],
    };
    const result = await handleImportCardioSessions(strengthData);
    expect(result.cardioCount).toBe(0);
  });

  it('returns error for unknown format', async () => {
    const result = await handleImportCardioSessions({ format: 'unknown', error: 'bad csv' });
    expect(result.cardioCount).toBe(0);
    expect(result.errors).toContain('bad csv');
  });
});
