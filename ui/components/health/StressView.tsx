import { HealthChartsList } from './HealthChartsList';

export function StressView() {
  return (
    <div className="column">
      <HealthChartsList slug="stress" />
    </div>
  );
}
