import { HealthChartsList } from './HealthChartsList';
import { Column } from '@ui/layout';

export function VitalsView() {
  return (
    <Column>
      <HealthChartsList slug="vitals" />
    </Column>
  );
}
