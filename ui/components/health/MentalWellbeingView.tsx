import { HealthChartsList } from './HealthChartsList';
import { Column } from '@ui/layout';

export function MentalWellbeingView() {
  return (
    <Column>
      <HealthChartsList slug="mental-wellbeing" />
    </Column>
  );
}
