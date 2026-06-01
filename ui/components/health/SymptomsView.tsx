import { HealthChartsList } from './HealthChartsList';
import { Column } from '@ui/layout';

export function SymptomsView() {
  return (
    <Column>
      <HealthChartsList slug="symptoms" />
    </Column>
  );
}
