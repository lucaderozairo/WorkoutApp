import { HealthChartsList } from './HealthChartsList';

export function ReadinessView() {
  return (
    <div className="stack">
      <HealthChartsList slug="readiness" />
    </div>
  );
}
