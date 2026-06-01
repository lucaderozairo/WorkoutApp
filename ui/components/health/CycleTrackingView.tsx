import { HealthChartsList } from './HealthChartsList';
import { Column } from '@ui/layout';

export function CycleTrackingView() {
  return (
    <Column>
      <HealthChartsList slug="cycle-tracking" />
    </Column>
  );
}
