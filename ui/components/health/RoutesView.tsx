import { HealthChartsList } from './HealthChartsList';

export function RoutesView() {
  return (
    <div className="column">
      <HealthChartsList slug="routes" />
    </div>
  );
}
