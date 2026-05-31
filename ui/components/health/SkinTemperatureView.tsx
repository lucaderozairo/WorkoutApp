import { HealthChartsList } from './HealthChartsList';

export function SkinTemperatureView() {
  return (
    <div className="column">
      <HealthChartsList slug="skin-temperature" />
    </div>
  );
}
