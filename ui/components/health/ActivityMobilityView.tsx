import { HealthChartsList } from './HealthChartsList';
import { Column } from '@ui/layout';

export function ActivityMobilityView() {
  return (
    <Column>
      <HealthChartsList slug="activity-mobility" />
    </Column>
  );
}
