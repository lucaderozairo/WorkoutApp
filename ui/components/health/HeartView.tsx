import { HealthChartsList } from './HealthChartsList';
import { Column } from '@ui/layout';

export function HeartView() {
  return (
    <Column>
      <HealthChartsList slug="heart" />
    </Column>
  );
}
