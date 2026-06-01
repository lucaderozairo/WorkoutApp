import { HealthChartsList } from './HealthChartsList';
import { Column } from '@ui/layout';

export function SkinTemperatureView() {
  return (
    <Column>
      <HealthChartsList slug="skin-temperature" />
    </Column>
  );
}
