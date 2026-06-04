// eslint-disable-next-line boundaries/element-types -- TODO(arch): cross-layer import baselined; see docs/superpowers/plans/2026-06-03-architecture-rule-enforcement.md
import type { ActivityHistoryItem } from '@features/training_log/contract';
// eslint-disable-next-line boundaries/element-types -- TODO(arch): cross-layer import baselined; see docs/superpowers/plans/2026-06-03-architecture-rule-enforcement.md
import type { CardioSession } from '@features/cardio/contract';
import { csvRow, triggerDownload } from './csv';

const EXPORT_HEADERS = [
  'Type', 'Session ID', 'Name', 'Date', 'Category/Sport',
  'Exercise', 'Block Type', 'Set #',
  'Weight (kg)', 'Reps', 'Distance (m)', 'Duration (s)',
  'Is Warmup', 'Is PR', 'RPE', 'Notes',
];

export function exportSessionCsv(
  session: ActivityHistoryItem,
  blocks?: Array<{ exerciseName: string; blockType?: string; sets: Array<{ setNumber: number; weightKg?: number; reps?: number; isWarmup?: boolean; isPR?: boolean; rpe?: number | null; distanceMeters?: number; durationSeconds?: number; avgPowerWatts?: number; resistance?: number; comment?: string }> }>,
): void {
  const date = new Date(session.startedAt).toISOString().split('T')[0];
  const rows: string[] = [EXPORT_HEADERS.join(',')];

  if (blocks && blocks.length > 0) {
    for (const block of blocks) {
      const blockType = block.blockType ?? 'straight';
      for (const set of block.sets) {
        rows.push(csvRow([
          'Strength',
          session.id,
          session.name,
          date,
          session.category,
          block.exerciseName,
          blockType,
          String(set.setNumber),
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
      'Strength',
      session.id,
      session.name,
      date,
      session.category,
      '', '', '', '', '', '', '',
      '', '', '', session.notes ?? '',
    ]));
  }

  const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
  triggerDownload(blob, `session-${session.id}-${date}.csv`);
}

function cardioDate(session: CardioSession): string {
  return new Date(session.startedAt).toISOString().split('T')[0];
}

export function exportCardioSessionCsv(session: CardioSession): void {
  const date = cardioDate(session);
  const rows = [EXPORT_HEADERS.join(',')];

  rows.push(csvRow([
    'Cardio',
    session.id,
    session.title ?? session.sport,
    date,
    session.sport,
    '', '', '',
    '', '',
    String(session.distanceMeters),
    String(session.durationSeconds),
    '', '', '',
    session.notes ?? '',
  ]));

  const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
  triggerDownload(blob, `cardio-${session.id}-${date}.csv`);
}

export function exportAllSessionsCsv(
  history: ActivityHistoryItem[],
  cardio: CardioSession[],
): void {
  const rows = [EXPORT_HEADERS.join(',')];
  const date = new Date().toISOString().split('T')[0];

  for (const session of history) {
    const sDate = new Date(session.startedAt).toISOString().split('T')[0];
    rows.push(csvRow([
      'Strength',
      session.id,
      session.name,
      sDate,
      session.category,
      '', '', '', '', '', '', '',
      '', '', '', session.notes ?? '',
    ]));
  }

  for (const session of cardio) {
    const sDate = cardioDate(session);
    rows.push(csvRow([
      'Cardio',
      session.id,
      session.title ?? session.sport,
      sDate,
      session.sport,
      '', '', '',
      '', '',
      String(session.distanceMeters),
      String(session.durationSeconds),
      '', '', '',
      session.notes ?? '',
    ]));
  }

  const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
  triggerDownload(blob, `workout-sessions-${date}.csv`);
}
