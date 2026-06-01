import { HealthChartsList } from './HealthChartsList';
import { Column } from '@ui/layout';

export function RoutesView() {
  return (
    <Column>
      <HealthChartsList slug="routes" />
    </Column>
  );
}
