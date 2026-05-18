import { HealthChartsList } from './HealthChartsList';

export function VitalsView() {
  return (
    <div className="stack">
      <HealthChartsList slug="vitals" />
    </div>
  );
}
