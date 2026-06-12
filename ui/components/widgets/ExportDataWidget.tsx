import { useDataTransfer } from '@ui/components/transfer';
import { Row, Column } from '@ui/layout';
import { Surface, Text } from '@ui/atoms';
import { Button } from '@ui/molecules';

export function ExportDataWidget() {
  const { exportAllJson, exportAllCsv } = useDataTransfer();

  return (
    <Surface>
      <Column gap={1} justify="between" className="widget-1x1">
        <Text size="eyebrow">Export Data</Text>
        <Text size="detail">Download all your workout data as JSON or CSV.</Text>
        <Row gap={1}>
          <Button variant="secondary" size="sm" onClick={exportAllJson}>JSON</Button>
          <Button variant="secondary" size="sm" onClick={exportAllCsv}>CSV</Button>
        </Row>
      </Column>
    </Surface>
  );
}
