// eslint-disable-next-line boundaries/element-types -- TODO(arch): cross-layer import baselined; see docs/superpowers/plans/2026-06-03-architecture-rule-enforcement.md
import type { ActivityView } from '@features/training_log/contract';

const CSV_HEADERS = [
  'Session Name', 'Date', 'Exercise', 'Block Type',
  'Set #', 'Weight (kg)', 'Reps', 'Is Warmup', 'Is PR',
  'RPE', 'Comment', 'Distance (m)', 'Duration (s)', 'Avg Power (W)', 'Resistance',
];

export function exportSessionCsv(session: ActivityView): void {
  const date = session.startedAt
    ? new Date(session.startedAt).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  const rows: string[] = [CSV_HEADERS.join(',')];

  for (const block of session.segments) {
    const blockType = block.blockType ?? 'straight';
    for (const set of block.sets) {
      if (set.distanceMeters !== undefined || set.durationSeconds !== undefined) {
        rows.push(csvRow([
          session.name, date, block.exerciseName, 'cardio',
          String(set.setNumber), '', '', '', '',
          '', '',
          String(set.distanceMeters ?? 0), String(set.durationSeconds ?? 0),
          set.avgPowerWatts != null ? String(set.avgPowerWatts) : '',
          set.resistance != null ? String(set.resistance) : '',
        ]));
      } else {
        rows.push(csvRow([
          session.name, date, block.exerciseName, blockType,
          String(set.setNumber), String(set.weightKg ?? 0), String(set.reps ?? 0),
          set.isWarmup ? 'true' : 'false',
          set.isPR ? 'true' : 'false',
          set.rpe != null ? String(set.rpe) : '',
          set.comment ?? '',
          '', '', '',
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
