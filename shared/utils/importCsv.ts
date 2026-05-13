import { parseCsv } from './csv';
import { viewStore } from '@data/projections/views';
import type { SessionHistoryItem } from '@features/training_log';
import type { CardioSession } from '@features/cardio/domain/types';
import type { Id } from '@shared/types';

const EXPORT_HEADERS = [
  'Type', 'Session ID', 'Name', 'Date', 'Category/Sport',
  'Exercise', 'Block Type', 'Set #',
  'Weight (kg)', 'Reps', 'Distance (m)', 'Duration (s)',
  'Is Warmup', 'Is PR', 'RPE', 'Notes',
];

const SIMPLE_HEADERS = ['Date', 'Exercise', 'Sets', 'Reps', 'Weight', 'Notes'];

function normalizeHeaders(headers: string[]): string[] {
  return headers.map(h => h.trim().replace(/\s+/g, ' '));
}

function headerIndex(headers: string[], name: string): number {
  const idx = headers.indexOf(name);
  if (idx === -1) throw new Error(`Missing column: ${name}`);
  return idx;
}

function safeStr(row: string[], i: number): string {
  return (row[i] ?? '').trim();
}

function safeNum(row: string[], i: number): number {
  const v = parseFloat(row[i]);
  return isNaN(v) ? 0 : v;
}

export interface CsvImportResult {
  sessions: SessionHistoryItem[];
  cardioSessions: CardioSession[];
  errors: string[];
}

export function importCsv(text: string): CsvImportResult {
  const parsed = parseCsv(text);
  if (parsed.length < 2) {
    return { sessions: [], cardioSessions: [], errors: ['CSV file has no data rows.'] };
  }

  const headers = normalizeHeaders(parsed[0]);
  const rows = parsed.slice(1);

  const w1 = (n: string) => EXPORT_HEADERS.includes(n);
  const w2 = (n: string) => SIMPLE_HEADERS.includes(n);

  if (rows.length > 0 && headers.some(w1)) {
    return parseExportFormat(headers, rows);
  }
  if (rows.length > 0 && headers.some(w2)) {
    return parseSimpleFormat(headers, rows);
  }

  return {
    sessions: [], cardioSessions: [],
    errors: ['Unrecognized CSV format. Expected export format or: Date, Exercise, Sets, Reps, Weight, Notes'],
  };
}

function parseExportFormat(headers: string[], rows: string[][]): CsvImportResult {
  const sessions: SessionHistoryItem[] = [];
  const cardioSessions: CardioSession[] = [];
  const errors: string[] = [];

  const typeIdx = headerIndex(headers, 'Type');
  const idIdx = headerIndex(headers, 'Session ID');
  const nameIdx = headerIndex(headers, 'Name');
  const dateIdx = headerIndex(headers, 'Date');
  const catIdx = headerIndex(headers, 'Category/Sport');
  const notesIdx = headerIndex(headers, 'Notes');

  const seenIds = new Set<string>();

  for (const row of rows) {
    try {
      const type = safeStr(row, typeIdx);
      const id = safeStr(row, idIdx) || `imported-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const name = safeStr(row, nameIdx) || 'Imported Session';
      const dateStr = safeStr(row, dateIdx);
      const startedAt = dateStr ? new Date(dateStr).getTime() : Date.now();
      const notes = safeStr(row, notesIdx);

      if (seenIds.has(id)) continue;
      seenIds.add(id);

      if (type.toLowerCase() === 'cardio') {
        const sport = safeStr(row, catIdx) || 'other';
        const distanceMeters = safeNum(row, headerIndex(headers, 'Distance (m)'));
        const durationSeconds = safeNum(row, headerIndex(headers, 'Duration (s)'));

        cardioSessions.push({
          id: id as Id<'CardioSession'>,
          userId: 'imported' as Id<'User'>,
          sport: sport as CardioSession['sport'],
          title: name,
          startedAt,
          durationSeconds,
          distanceMeters,
          notes,
          comments: [],
          media: [],
          location: undefined,
          routeId: null,
        } as CardioSession);
      } else {
        const category = safeStr(row, catIdx) || 'strength';
        sessions.push({
          id: id as Id<'Session'>,
          name,
          startedAt: dateStr ? new Date(dateStr).getTime() : Date.now(),
          finishedAt: dateStr ? new Date(dateStr).getTime() + 3600000 : Date.now(),
          durationSeconds: 3600,
          totalSets: 0,
          exerciseCount: 0,
          hasPR: false,
          category: (category === 'cardio' ? 'cardio' : category === 'mobility' ? 'mobility' : 'strength') as 'strength' | 'cardio' | 'mobility',
          notes,
          comments: [],
          media: [],
        });
      }
    } catch (e) {
      errors.push(`Row ${rows.indexOf(row) + 2}: ${e instanceof Error ? e.message : 'Parse error'}`);
    }
  }

  return { sessions, cardioSessions, errors };
}

function parseSimpleFormat(headers: string[], rows: string[][]): CsvImportResult {
  const sessions: SessionHistoryItem[] = [];
  const errors: string[] = [];

  const dateIdx = headerIndex(headers, 'Date');
  const exerciseIdx = headerIndex(headers, 'Exercise');
  const setsIdx = headerIndex(headers, 'Sets');
  const repsIdx = headerIndex(headers, 'Reps');
  const weightIdx = headerIndex(headers, 'Weight');
  const notesIdx = headers.includes('Notes') ? headers.indexOf('Notes') : -1;

  for (const row of rows) {
    try {
      const dateStr = safeStr(row, dateIdx);
      const exercise = safeStr(row, exerciseIdx);
      const setCount = parseInt(row[setsIdx]) || 1;
      const reps = parseInt(row[repsIdx]) || 10;
      const weightKg = parseFloat(row[weightIdx]) || 0;
      const notes = notesIdx >= 0 ? safeStr(row, notesIdx) : '';

      const startedAt = dateStr ? new Date(dateStr).getTime() : Date.now();
      const id = `imported-${startedAt}-${Math.random().toString(36).slice(2, 6)}` as Id<'Session'>;

      sessions.push({
        id,
        name: exercise,
        startedAt,
        finishedAt: startedAt + 3600000,
        durationSeconds: 3600,
        totalSets: setCount,
        exerciseCount: 1,
        hasPR: false,
        category: 'strength',
        notes: `${setCount}×${reps} @ ${weightKg}kg ${notes ? '· ' + notes : ''}`,
        comments: [],
        media: [],
      });
    } catch (e) {
      errors.push(`Row ${rows.indexOf(row) + 2}: ${e instanceof Error ? e.message : 'Parse error'}`);
    }
  }

  return { sessions, cardioSessions: [], errors };
}

export function writeImportToStore(result: CsvImportResult): { sessionCount: number; cardioCount: number; errorCount: number } {
  if (result.sessions.length > 0) {
    const existing = viewStore.get<SessionHistoryItem[]>('session_history') ?? [];
    viewStore.set('session_history', [...result.sessions, ...existing]);
  }

  if (result.cardioSessions.length > 0) {
    const existing = viewStore.get<{ sessions: CardioSession[] }>('recent_cardio_sessions') ?? { sessions: [] };
    viewStore.set('recent_cardio_sessions', {
      sessions: [...result.cardioSessions, ...existing.sessions],
    });
  }

  return {
    sessionCount: result.sessions.length,
    cardioCount: result.cardioSessions.length,
    errorCount: result.errors.length,
  };
}
