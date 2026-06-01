import { HealthChartsList } from './HealthChartsList';
import { Column } from '@ui/layout';

export function BodyBatteryView() {
  return (
    <Column>
      <HealthChartsList slug="body-battery" />
    </Column>
  );
}
