import { HealthChartsList } from './HealthChartsList';
import { Column } from '@ui/layout';

export function HealthRecordsView() {
  return (
    <Column>
      <HealthChartsList slug="health-records" />
    </Column>
  );
}
