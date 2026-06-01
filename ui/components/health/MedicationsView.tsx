import { HealthChartsList } from './HealthChartsList';
import { Column } from '@ui/layout';

export function MedicationsView() {
  return (
    <Column>
      <HealthChartsList slug="medications" />
    </Column>
  );
}
