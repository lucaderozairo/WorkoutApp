import { HealthChartsList } from './HealthChartsList';
import { Column } from '@ui/layout';

export function SleepView() {
  return (
    <Column>
      <HealthChartsList slug="sleep" />
    </Column>
  );
}
