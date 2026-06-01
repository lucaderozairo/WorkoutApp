import { HealthChartsList } from './HealthChartsList';
import { Column } from '@ui/layout';

export function NutritionView() {
  return (
    <Column>
      <HealthChartsList slug="nutrition" />
    </Column>
  );
}
