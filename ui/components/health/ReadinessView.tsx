import { HealthChartsList } from './HealthChartsList';
import { Column } from '@ui/layout';

export function ReadinessView() {
  return (
    <Column>
      <HealthChartsList slug="readiness" />
    </Column>
  );
}
