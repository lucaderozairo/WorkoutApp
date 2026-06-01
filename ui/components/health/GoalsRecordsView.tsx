import { HealthChartsList } from './HealthChartsList';
import { Column } from '@ui/layout';

export function GoalsRecordsView() {
  return (
    <Column>
      <HealthChartsList slug="goals-records" height={100} />
    </Column>
  );
}
