import type { ActiveSessionView } from '@features/training_log/projections';
import type { StrengthSet, CardioSet } from '@features/training_log/domain/types';

const CSV_HEADERS = [
  'Session Name', 'Date', 'Exercise', 'Block Type',
  'Set #', 'Weight (kg)', 'Reps', 'Is Warmup', 'Is PR',
  'RPE', 'Comment', 'Distance (m)', 'Duration (s)', 'Avg Power (W)', 'Resistance',
];

export function exportSessionCsv(session: ActiveSessionView): void {
  const date = session.startedAt
    ? new Date(session.startedAt).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  const rows: string[] = [CSV_HEADERS.join(',')];

  for (const block of session.blocks) {
    const blockType = block.blockType ?? 'straight';
    for (const set of block.sets) {
      if (set.type === 'strength') {
        const s = set as StrengthSet;
        rows.push(csvRow([
          session.name, date, block.exerciseName, blockType,
          String(s.setNumber), String(s.weightKg), String(s.reps),
          s.isWarmup ? 'true' : 'false',
          s.isPR ? 'true' : 'false',
          s.rpe != null ? String(s.rpe) : '',
          s.comment ?? '',
          '', '', '',
        ]));
      } else {
        const s = set as CardioSet;
        rows.push(csvRow([
          session.name, date, block.exerciseName, 'cardio',
          String(s.setNumber), '', '', '', '',
          '', '',
          String(s.distanceMeters), String(s.durationSeconds),
          s.avgPowerWatts != null ? String(s.avgPowerWatts) : '',
          s.resistance != null ? String(s.resistance) : '',
        ]));
      }
    }
  }

  const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
  triggerDownload(blob, `session-${session.id}-${date}.csv`);
}

function csvRow(fields: string[]): string {
  return fields.map(f => {
    if (f.includes(',') || f.includes('"') || f.includes('\n')) {
      return `"${f.replace(/"/g, '""')}"`;
    }
    return f;
  }).join(',');
}

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
