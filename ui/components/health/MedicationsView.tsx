import { HealthChartsList } from './HealthChartsList';

export function MedicationsView() {
  return (
    <div className="column">
      <HealthChartsList slug="medications" />
    </div>
  );
}
