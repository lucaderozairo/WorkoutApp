import { HealthChartsList } from './HealthChartsList';

export function VitalsView() {
  return (
    <div className="column">
      <HealthChartsList slug="vitals" />
    </div>
  );
}
