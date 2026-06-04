import { parseCsv } from './csv';
// eslint-disable-next-line boundaries/element-types -- TODO(arch): cross-layer import baselined; see docs/superpowers/plans/2026-06-03-architecture-rule-enforcement.md
import { viewStore } from '@data/projections/views';
// eslint-disable-next-line boundaries/element-types -- TODO(arch): cross-layer import baselined; see docs/superpowers/plans/2026-06-03-architecture-rule-enforcement.md
import type { ActivityView, ActivitiesState, SegmentView } from '@features/training_log/contract';
// eslint-disable-next-line boundaries/element-types -- TODO(arch): cross-layer import baselined; see docs/superpowers/plans/2026-06-03-architecture-rule-enforcement.md
import type { SetEntry } from '@features/training_log/contract';
// eslint-disable-next-line boundaries/element-types -- TODO(arch): cross-layer import baselined; see docs/superpowers/plans/2026-06-03-architecture-rule-enforcement.md
import type { CardioSession } from '@features/cardio/contract';
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
  sessions: ActivityView[];
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
  const cardioSessions: CardioSession[] = [];
  const errors: string[] = [];

  const typeIdx = headerIndex(headers, 'Type');
  const idIdx = headerIndex(headers, 'Session ID');
  const nameIdx = headerIndex(headers, 'Name');
  const dateIdx = headerIndex(headers, 'Date');
  const catIdx = headerIndex(headers, 'Category/Sport');
  const exerciseIdx = headerIndex(headers, 'Exercise');
  const setIdx = headerIndex(headers, 'Set #');
  const weightIdx = headerIndex(headers, 'Weight (kg)');
  const repsIdx = headerIndex(headers, 'Reps');
  const distanceIdx = headerIndex(headers, 'Distance (m)');
  const durationIdx = headerIndex(headers, 'Duration (s)');
  const warmupIdx = headerIndex(headers, 'Is Warmup');
  const isPRIdx = headerIndex(headers, 'Is PR');
  const rpeIdx = headerIndex(headers, 'RPE');
  const notesIdx = headerIndex(headers, 'Notes');

  // First pass: group rows by session ID
  const sessionGroups = new Map<string, string[][]>();
  for (const row of rows) {
    const id = safeStr(row, idIdx) || `imported-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const g = sessionGroups.get(id);
    if (g) g.push(row);
    else sessionGroups.set(id, [row]);
  }

  const sessions: ActivityView[] = [];

  for (const [sessionId, groupRows] of sessionGroups) {
    try {
      const firstRow = groupRows[0];
      const type = safeStr(firstRow, typeIdx);
      const name = safeStr(firstRow, nameIdx) || 'Imported Session';
      const dateStr = safeStr(firstRow, dateIdx);
      const startedAt = dateStr ? new Date(dateStr).getTime() : Date.now();
      const notes = safeStr(firstRow, notesIdx);

      if (type.toLowerCase() === 'cardio') {
        const sport = safeStr(firstRow, catIdx) || 'other';
        const distanceMeters = safeNum(firstRow, distanceIdx);
        const durationSeconds = safeNum(firstRow, durationIdx);

        cardioSessions.push({
          id: sessionId as Id<'CardioSession'>,
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
        // Second pass within session: group rows by exercise name
        const exerciseGroups = new Map<string, string[][]>();
        for (const row of groupRows) {
          const exName = safeStr(row, exerciseIdx);
          const g = exerciseGroups.get(exName);
          if (g) g.push(row);
          else exerciseGroups.set(exName, [row]);
        }

        const segments: SegmentView[] = [];
        let order = 0;
        for (const [exName, exRows] of exerciseGroups) {
          const sets: SetEntry[] = [];
          for (const row of exRows) {
            const setNumber = safeNum(row, setIdx);
            const isWarmup = safeStr(row, warmupIdx).toLowerCase() === 'true';
            const isPR = safeStr(row, isPRIdx).toLowerCase() === 'true';
            const weightKg = safeNum(row, weightIdx);
            const reps = safeNum(row, repsIdx);
            const distanceMeters = safeNum(row, distanceIdx);
            const durationSeconds = safeNum(row, durationIdx);
            const rpeVal = safeNum(row, rpeIdx);
            const setNotes = safeStr(row, notesIdx);

            if (distanceMeters > 0 || durationSeconds > 0) {
              sets.push({
                setNumber,
                distanceMeters,
                durationSeconds,
                completedAt: startedAt,
              });
            } else {
              sets.push({
                setNumber,
                weightKg,
                reps,
                isWarmup,
                isPR,
                completedAt: startedAt,
                rpe: rpeVal || null,
                comment: setNotes || undefined,
              });
            }
          }

          segments.push({
            id: `imported-block-${sessionId}-${order}` as Id<'Segment'>,
            exerciseName: exName,
            exerciseCategory: 'strength',
            sets,
            notes: '',
            order,
          });
          order++;
        }

        sessions.push({
          id: sessionId as Id<'Activity'>,
          name,
          primarySport: 'strength',
          status: 'finished',
          startedAt,
          finishedAt: startedAt + 3600000,
          segments,
          notes,
          sources: [],
        });
      }
    } catch (e) {
      errors.push(`Session ${sessionId}: ${e instanceof Error ? e.message : 'Parse error'}`);
    }
  }

  return { sessions, cardioSessions, errors };
}

function parseSimpleFormat(headers: string[], rows: string[][]): CsvImportResult {
  const errors: string[] = [];

  const dateIdx = headerIndex(headers, 'Date');
  const exerciseIdx = headerIndex(headers, 'Exercise');
  const setsIdx = headerIndex(headers, 'Sets');
  const repsIdx = headerIndex(headers, 'Reps');
  const weightIdx = headerIndex(headers, 'Weight');
  const notesIdx = headers.includes('Notes') ? headers.indexOf('Notes') : -1;

  // Group rows by date
  const dateGroups = new Map<string, string[][]>();
  for (const row of rows) {
    const dateStr = safeStr(row, dateIdx);
    const g = dateGroups.get(dateStr);
    if (g) g.push(row);
    else dateGroups.set(dateStr, [row]);
  }

  const sessions: ActivityView[] = [];

  for (const [dateStr, groupRows] of dateGroups) {
    try {
      const startedAt = dateStr ? new Date(dateStr).getTime() : Date.now();
      const id = `imported-${startedAt}-${Math.random().toString(36).slice(2, 6)}` as Id<'Session'>;

      const segments: SegmentView[] = [];
      let order = 0;

      for (const row of groupRows) {
        const exercise = safeStr(row, exerciseIdx);
        const setCount = parseInt(row[setsIdx]) || 1;
        const reps = parseInt(row[repsIdx]) || 10;
        const weightKg = parseFloat(row[weightIdx]) || 0;
        const rowNotes = notesIdx >= 0 ? safeStr(row, notesIdx) : '';

        const sets: SetEntry[] = [];
        for (let s = 1; s <= setCount; s++) {
          sets.push({
            setNumber: s,
            weightKg,
            reps,
            isWarmup: false,
            isPR: false,
            completedAt: startedAt,
          });
        }

        segments.push({
          id: `imported-block-${id}-${order}` as Id<'Segment'>,
          exerciseName: exercise,
          exerciseCategory: 'strength',
          sets,
          notes: rowNotes,
          order,
        });
        order++;
      }

      sessions.push({
        id,
        name: 'Imported Workout',
        primarySport: 'strength',
        status: 'finished',
        startedAt,
        finishedAt: startedAt + 3600000,
        segments,
        notes: '',
        sources: [],
      });
    } catch (e) {
      errors.push(`Date ${dateStr}: ${e instanceof Error ? e.message : 'Parse error'}`);
    }
  }

  return { sessions, cardioSessions: [], errors };
}

export function writeImportToStore(result: CsvImportResult): { sessionCount: number; cardioCount: number; errorCount: number } {
  if (result.sessions.length > 0) {
    const existing = viewStore.get<ActivitiesState>('sessions') ?? { byId: {}, activeId: null };
    const importedById: ActivitiesState['byId'] = {};
    for (const session of result.sessions) {
      importedById[session.id] = session;
    }
    viewStore.set('sessions', { ...existing, byId: { ...importedById, ...existing.byId } });
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
