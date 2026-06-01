import { HealthChartsList } from './HealthChartsList';
import { Column } from '@ui/layout';

export function HearingView() {
  return (
    <Column>
      <HealthChartsList slug="hearing" />
    </Column>
  );
}
