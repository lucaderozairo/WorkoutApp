// Cross-feature CSV serialization for sessions. Lives at the feature-ui layer
// because it must reference BOTH training_log and cardio domain types — a
// combination that is only legal above the feature boundary. Pure CSV
// primitives (csvRow, triggerDownload) come from shared/utils.

import type { ActivityView, ActivityHistoryItem } from '@features/training_log';
import type { CardioSession } from '@features/cardio/domain/types';
import { csvRow, triggerDownload } from '@shared/utils/csv';

const EXPORT_HEADERS = [
  'Type', 'Session ID', 'Name', 'Date', 'Category/Sport',
  'Exercise', 'Block Type', 'Set #',
  'Weight (kg)', 'Reps', 'Distance (m)', 'Duration (s)',
  'Is Warmup', 'Is PR', 'RPE', 'Notes',
];

function isoDate(ts: number | string | null | undefined): string {
  const d = ts != null ? new Date(ts) : new Date();
  return d.toISOString().split('T')[0];
}

/** A finished, in-memory strength session (ActivityView) → its own CSV file. */
export function exportActivitySessionCsv(session: ActivityView): void {
  const date = isoDate(session.startedAt);
  const rows: string[] = [EXPORT_HEADERS.join(',')];

  for (const block of session.segments) {
    const blockType = block.blockType ?? 'straight';
    for (const set of block.sets) {
      const isCardio = set.distanceMeters !== undefined || set.durationSeconds !== undefined;
      rows.push(csvRow([
        isCardio ? 'Cardio' : 'Strength',
        session.id,
        session.name,
        date,
        isCardio ? 'cardio' : blockType,
        block.exerciseName,
        isCardio ? '' : blockType,
        String(set.setNumber),
        isCardio ? '' : String(set.weightKg ?? 0),
        isCardio ? '' : String(set.reps ?? 0),
        isCardio ? String(set.distanceMeters ?? 0) : '',
        isCardio ? String(set.durationSeconds ?? 0) : '',
        set.isWarmup ? 'true' : 'false',
        set.isPR ? 'true' : 'false',
        set.rpe != null ? String(set.rpe) : '',
        set.comment ?? '',
      ]));
    }
  }

  const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
  triggerDownload(blob, `session-${session.id}-${date}.csv`);
}

/** A history list-item (+ optional block detail) → its own CSV file. */
export function exportSessionCsv(
  session: ActivityHistoryItem,
  blocks?: Array<{
    exerciseName: string;
    blockType?: string;
    sets: Array<{
      setNumber: number; weightKg?: number; reps?: number; isWarmup?: boolean;
      isPR?: boolean; rpe?: number | null; distanceMeters?: number;
      durationSeconds?: number; avgPowerWatts?: number; resistance?: number; comment?: string;
    }>;
  }>,
): void {
  const date = isoDate(session.startedAt);
  const rows: string[] = [EXPORT_HEADERS.join(',')];

  if (blocks && blocks.length > 0) {
    for (const block of blocks) {
      const blockType = block.blockType ?? 'straight';
      for (const set of block.sets) {
        rows.push(csvRow([
          'Strength', session.id, session.name, date, session.category,
          block.exerciseName, blockType, String(set.setNumber),
          set.weightKg != null ? String(set.weightKg) : '',
          set.reps != null ? String(set.reps) : '',
          set.distanceMeters != null ? String(set.distanceMeters) : '',
          set.durationSeconds != null ? String(set.durationSeconds) : '',
          set.isWarmup ? 'true' : 'false',
          set.isPR ? 'true' : 'false',
          set.rpe != null ? String(set.rpe) : '',
          set.comment ?? '',
        ]));
      }
    }
  } else {
    rows.push(csvRow([
      'Strength', session.id, session.name, date, session.category,
      '', '', '', '', '', '', '', '', '', '', session.notes ?? '',
    ]));
  }

  const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
  triggerDownload(blob, `session-${session.id}-${date}.csv`);
}

function cardioRow(session: CardioSession): string {
  return csvRow([
    'Cardio', session.id, session.title ?? session.sport, isoDate(session.startedAt), session.sport,
    '', '', '', '', '',
    String(session.distanceMeters), String(session.durationSeconds),
    '', '', '', session.notes ?? '',
  ]);
}

/** A single cardio session → its own CSV file. */
export function exportCardioSessionCsv(session: CardioSession): void {
  const rows = [EXPORT_HEADERS.join(','), cardioRow(session)];
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
  triggerDownload(blob, `cardio-${session.id}-${isoDate(session.startedAt)}.csv`);
}

/** Every strength + cardio session → one combined CSV file. */
export function exportAllSessionsCsv(history: ActivityHistoryItem[], cardio: CardioSession[]): void {
  const rows = [EXPORT_HEADERS.join(',')];

  for (const session of history) {
    rows.push(csvRow([
      'Strength', session.id, session.name, isoDate(session.startedAt), session.category,
      '', '', '', '', '', '', '', '', '', '', session.notes ?? '',
    ]));
  }
  for (const session of cardio) {
    rows.push(cardioRow(session));
  }

  const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
  triggerDownload(blob, `workout-sessions-${isoDate(undefined)}.csv`);
}
