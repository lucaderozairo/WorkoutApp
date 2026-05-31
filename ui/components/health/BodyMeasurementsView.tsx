import { HealthChartsList } from './HealthChartsList';

export function BodyMeasurementsView() {
  return (
    <div className="column">
      <HealthChartsList slug="body-measurements" />
    </div>
  );
}
