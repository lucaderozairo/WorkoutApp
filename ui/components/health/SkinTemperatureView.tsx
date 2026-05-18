import { HealthChartsList } from './HealthChartsList';

export function SkinTemperatureView() {
  return (
    <div className="stack">
      <HealthChartsList slug="skin-temperature" />
    </div>
  );
}
