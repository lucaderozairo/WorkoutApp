import type { ParsedCsvData } from '@shared/utils/importCsv';
import type { TrainingLogEvent, SessionImportedPayload, SetEntry } from '../domain/types';
import { applyAll } from './handlers';
import { eventRepository } from '@data/event-repository';
import { systemClock } from '@core/clock';
import type { Id } from '@shared/types';

export interface ImportSessionsResult {
  sessionCount: number;
  errors: string[];
}

function safeStr(row: string[], i: number): string {
  return i >= 0 ? (row[i] ?? '').trim() : '';
}

function safeNum(row: string[], i: number): number {
  if (i < 0) return 0;
  const v = parseFloat(row[i]);
  return isNaN(v) ? 0 : v;
}

function parseExportRows(headers: string[], rows: string[][]): { events: TrainingLogEvent[]; errors: string[] } {
  const errors: string[] = [];
  const events: TrainingLogEvent[] = [];

  const col = (name: string) => headers.indexOf(name);
  const typeIdx = col('Type');
  const idIdx = col('Session ID');
  const nameIdx = col('Name');
  const dateIdx = col('Date');
  const catIdx = col('Category/Sport');
  const exerciseIdx = col('Exercise');
  const setNumIdx = col('Set #');
  const weightIdx = col('Weight (kg)');
  const repsIdx = col('Reps');
  const distIdx = col('Distance (m)');
  const durIdx = col('Duration (s)');
  const warmupIdx = col('Is Warmup');
  const isPRIdx = col('Is PR');
  const rpeIdx = col('RPE');
  const notesIdx = col('Notes');

  if (typeIdx < 0 || idIdx < 0) return { events, errors: ['Missing Type or Session ID columns'] };

  const sessionGroups = new Map<string, string[][]>();
  for (const row of rows) {
    if (safeStr(row, typeIdx).toLowerCase() === 'cardio') continue;
    const id = safeStr(row, idIdx) || `imported-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const g = sessionGroups.get(id);
    if (g) g.push(row);
    else sessionGroups.set(id, [row]);
  }

  for (const [sessionId, groupRows] of sessionGroups) {
    try {
      const firstRow = groupRows[0];
      const name = safeStr(firstRow, nameIdx) || 'Imported Session';
      const dateStr = safeStr(firstRow, dateIdx);
      const startedAt = dateStr ? new Date(dateStr).getTime() : Date.now();
      const notes = safeStr(firstRow, notesIdx);
      const primarySport = catIdx >= 0 ? safeStr(firstRow, catIdx) || 'strength' : 'strength';

      const exerciseGroups = new Map<string, string[][]>();
      for (const row of groupRows) {
        const exName = safeStr(row, exerciseIdx);
        const g = exerciseGroups.get(exName);
        if (g) g.push(row);
        else exerciseGroups.set(exName, [row]);
      }

      const segments: SessionImportedPayload['segments'] = [];
      let order = 0;
      for (const [exName, exRows] of exerciseGroups) {
        const sets: SetEntry[] = [];
        for (const exRow of exRows) {
          const dm = safeNum(exRow, distIdx);
          const ds = safeNum(exRow, durIdx);
          if (dm > 0 || ds > 0) {
            sets.push({ setNumber: sets.length + 1, distanceMeters: dm, durationSeconds: ds, completedAt: startedAt });
          } else {
            sets.push({
              setNumber: safeNum(exRow, setNumIdx) || sets.length + 1,
              weightKg: safeNum(exRow, weightIdx),
              reps: safeNum(exRow, repsIdx),
              isWarmup: safeStr(exRow, warmupIdx).toLowerCase() === 'true',
              isPR: safeStr(exRow, isPRIdx).toLowerCase() === 'true',
              completedAt: startedAt,
              rpe: safeNum(exRow, rpeIdx) || null,
            });
          }
        }
        segments.push({
          id: `imported-block-${sessionId}-${order}` as Id<'Segment'>,
          exerciseName: exName,
          exerciseCategory: 'strength',
          sets,
          order,
        });
        order++;
      }

      events.push({
        type: 'SessionImported',
        aggregateId: sessionId as Id<'Activity'>,
        aggregateType: 'Session',
        timestamp: systemClock.now(),
        version: 1,
        payload: { sessionId: sessionId as Id<'Activity'>, name, startedAt, finishedAt: startedAt + 3600000, notes, primarySport, segments },
      });
    } catch (e) {
      errors.push(`Session ${sessionId}: ${e instanceof Error ? e.message : 'Parse error'}`);
    }
  }

  return { events, errors };
}

function parseSimpleRows(headers: string[], rows: string[][]): { events: TrainingLogEvent[]; errors: string[] } {
  const errors: string[] = [];
  const events: TrainingLogEvent[] = [];

  const dateIdx = headers.indexOf('Date');
  const exerciseIdx = headers.indexOf('Exercise');
  const setsIdx = headers.indexOf('Sets');
  const repsIdx = headers.indexOf('Reps');
  const weightIdx = headers.indexOf('Weight');
  const notesIdx = headers.indexOf('Notes');

  if (dateIdx < 0 || exerciseIdx < 0) return { events, errors: ['Missing Date or Exercise columns'] };

  const dateGroups = new Map<string, string[][]>();
  for (const row of rows) {
    const d = (row[dateIdx] ?? '').trim();
    const g = dateGroups.get(d);
    if (g) g.push(row);
    else dateGroups.set(d, [row]);
  }

  for (const [dateStr, groupRows] of dateGroups) {
    try {
      const startedAt = dateStr ? new Date(dateStr).getTime() : Date.now();
      const sessionId = `imported-${startedAt}-${Math.random().toString(36).slice(2, 6)}`;
      const segments: SessionImportedPayload['segments'] = [];
      let order = 0;

      for (const row of groupRows) {
        const exercise = (row[exerciseIdx] ?? '').trim();
        const setCount = parseInt(row[setsIdx] ?? '1') || 1;
        const reps = parseInt(row[repsIdx] ?? '10') || 10;
        const weightKg = parseFloat(row[weightIdx] ?? '0') || 0;
        const sets: SetEntry[] = Array.from({ length: setCount }, (_, i) => ({
          setNumber: i + 1,
          weightKg,
          reps,
          isWarmup: false,
          isPR: false,
          completedAt: startedAt,
        }));

        segments.push({
          id: `imported-block-${sessionId}-${order}` as Id<'Segment'>,
          exerciseName: exercise,
          exerciseCategory: 'strength',
          sets,
          notes: notesIdx >= 0 ? (row[notesIdx] ?? '').trim() : '',
          order,
        });
        order++;
      }

      events.push({
        type: 'SessionImported',
        aggregateId: sessionId as Id<'Activity'>,
        aggregateType: 'Session',
        timestamp: systemClock.now(),
        version: 1,
        payload: { sessionId: sessionId as Id<'Activity'>, name: 'Imported Workout', startedAt, finishedAt: startedAt + 3600000, notes: '', primarySport: 'strength', segments },
      });
    } catch (e) {
      errors.push(`Date ${dateStr}: ${e instanceof Error ? e.message : 'Parse error'}`);
    }
  }

  return { events, errors };
}

export async function handleImportSessions(data: ParsedCsvData): Promise<ImportSessionsResult> {
  if (data.format === 'unknown') return { sessionCount: 0, errors: [data.error] };

  const { events, errors } = data.format === 'export'
    ? parseExportRows(data.headers, data.rows)
    : parseSimpleRows(data.headers, data.rows);

  if (events.length > 0) {
    applyAll(events);
    await eventRepository.commit(events);
  }

  return { sessionCount: events.length, errors };
}
