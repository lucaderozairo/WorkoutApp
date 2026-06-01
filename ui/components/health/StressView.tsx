import { HealthChartsList } from './HealthChartsList';
import { Column } from '@ui/layout';

export function StressView() {
  return (
    <Column>
      <HealthChartsList slug="stress" />
    </Column>
  );
}
