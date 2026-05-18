import { useQuery } from '@ui/bindings';
import { exportEnvelope } from '@data/sources/local/persistence';
import { triggerDownload } from '@shared/utils/csv';
import type { ActivitiesState } from '@features/training_log';
import { getActivityHistory } from '@features/training_log';
import type { CardioSession } from '@features/cardio/domain/types';
import { exportAllSessionsCsv } from '@shared/utils/exportCsv';

export function ExportDataWidget() {
  useQuery<ActivitiesState>('sessions');
  const history = getActivityHistory();
  const cardioView = useQuery<{ sessions: CardioSession[] }>('recent_cardio_sessions') ?? { sessions: [] };

  function handleExportJson() {
    const json = exportEnvelope();
    const date = new Date().toISOString().slice(0, 10);
    const blob = new Blob([json], { type: 'application/json' });
    triggerDownload(blob, `workout-data-${date}.json`);
  }

  function handleExportCsv() {
    exportAllSessionsCsv(history, cardioView.sessions);
  }

  return (
    <div className="surface column compact widget-1x1 space-between">
      <span className="label">Export Data</span>
      <p className="detail">Download all your workout data as JSON or CSV.</p>
      <div className="row compact">
        <button className='chip sm' onClick={handleExportJson}>JSON</button>
        <button className='chip sm' onClick={handleExportCsv}>CSV</button>
      </div>
    </div>
  );
}
