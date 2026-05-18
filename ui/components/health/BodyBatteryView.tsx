import { HealthChartsList } from './HealthChartsList';

export function BodyBatteryView() {
  return (
    <div className="stack">
      <HealthChartsList slug="body-battery" />
    </div>
  );
}
