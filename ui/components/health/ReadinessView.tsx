import { HealthChartsList } from './HealthChartsList';

export function ReadinessView() {
  return (
    <div className="column">
      <HealthChartsList slug="readiness" />
    </div>
  );
}
