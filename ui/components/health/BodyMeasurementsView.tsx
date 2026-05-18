import { HealthChartsList } from './HealthChartsList';

export function BodyMeasurementsView() {
  return (
    <div className="stack">
      <HealthChartsList slug="body-measurements" />
    </div>
  );
}
