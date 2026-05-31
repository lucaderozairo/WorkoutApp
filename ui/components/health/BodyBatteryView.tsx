import { HealthChartsList } from './HealthChartsList';

export function BodyBatteryView() {
  return (
    <div className="column">
      <HealthChartsList slug="body-battery" />
    </div>
  );
}
