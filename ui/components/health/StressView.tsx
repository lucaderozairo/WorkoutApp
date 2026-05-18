import { HealthChartsList } from './HealthChartsList';

export function StressView() {
  return (
    <div className="stack">
      <HealthChartsList slug="stress" />
    </div>
  );
}
