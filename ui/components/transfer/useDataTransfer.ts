// useDataTransfer — the single seam for whole-app import / export / clear.
// Collapses logic that was copy-pasted across SettingsModal, ImportDataWidget,
// ExportDataWidget and the session screens. All persistence access goes through
// the data_transfer feature, so this hook never touches the data-io layer.

import { viewStore } from '@data/projections/views';
import { getActivityHistory } from '@features/training_log';
import type { CardioSession } from '@features/cardio/domain/types';
import { handleImportSessions } from '@features/training_log/commands/importSessions';
import { handleImportCardioSessions } from '@features/cardio/commands/importCardioSessions';
import { exportBackup, restoreBackup, clearAllData } from '@features/data_transfer';
import { parseCsvForImport } from '@shared/utils/importCsv';
import { downloadJson } from '@shared/utils/csv';
import { exportAllSessionsCsv } from './sessionCsv';

export type ImportStatus = 'ok' | 'error' | 'empty';
export interface ImportSummary {
  status: ImportStatus;
  message: string;
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

export function useDataTransfer() {
  async function importFile(file: File): Promise<ImportSummary> {
    let text: string;
    try {
      text = await file.text();
    } catch {
      return { status: 'error', message: 'Could not read file.' };
    }

    if (file.name.endsWith('.csv')) {
      const data = parseCsvForImport(text);
      const [training, cardio] = await Promise.all([
        handleImportSessions(data),
        handleImportCardioSessions(data),
      ]);
      if (training.sessionCount > 0 || cardio.cardioCount > 0) {
        return {
          status: 'ok',
          message: `Imported ${training.sessionCount} strength + ${cardio.cardioCount} cardio sessions.`,
        };
      }
      const errors = [...training.errors, ...cardio.errors];
      if (errors.length > 0) return { status: 'error', message: errors[0] };
      return { status: 'empty', message: 'No sessions found in CSV.' };
    }

    const result = restoreBackup(text);
    if (!result.ok) return { status: 'error', message: result.error };
    const n = result.sessionCount;
    return { status: 'ok', message: `Imported — ${n} session${n !== 1 ? 's' : ''} loaded.` };
  }

  function exportAllJson(): void {
    downloadJson(exportBackup(), `workout-data-${today()}.json`);
  }

  function exportAllCsv(): void {
    const history = getActivityHistory();
    const cardio = viewStore.get<{ sessions: CardioSession[] }>('recent_cardio_sessions')?.sessions ?? [];
    exportAllSessionsCsv(history, cardio);
  }

  function clearAll(): void {
    clearAllData();
  }

  return { importFile, exportAllJson, exportAllCsv, clearAll };
}
