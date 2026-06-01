import { HealthChartsList } from './HealthChartsList';
import { Column } from '@ui/layout';

export function BodyMeasurementsView() {
  return (
    <Column>
      <HealthChartsList slug="body-measurements" />
    </Column>
  );
}
