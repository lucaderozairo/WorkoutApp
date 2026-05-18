import { HealthChartsList } from './HealthChartsList';

export function MedicationsView() {
  return (
    <div className="stack">
      <HealthChartsList slug="medications" />
    </div>
  );
}
