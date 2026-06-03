import { useQuery } from '@ui/bindings';
import { exportEnvelope } from '@data/sources/local/persistence';
import { triggerDownload } from '@shared/utils/csv';
import type { ActivitiesState } from '@features/training_log';
import { getActivityHistory } from '@features/training_log';
import type { CardioSession } from '@features/cardio/domain/types';
import { exportAllSessionsCsv } from '@shared/utils/exportCsv';
import { Row, Column } from '@ui/layout';
import { Surface, Text } from '@ui/atoms';
import { Button } from '@ui/molecules';

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
    <Surface>
      <Column gap={1} justify="between" className="widget-1x1">
        <Text size="eyebrow">Export Data</Text>
        <Text size="detail">Download all your workout data as JSON or CSV.</Text>
        <Row gap={1}>
          <Button variant="secondary" size="sm" onClick={handleExportJson}>JSON</Button>
          <Button variant="secondary" size="sm" onClick={handleExportCsv}>CSV</Button>
        </Row>
      </Column>
    </Surface>
  );
}
