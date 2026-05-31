import { HealthChartsList } from './HealthChartsList';

export function HealthRecordsView() {
  return (
    <div className="column">
      <HealthChartsList slug="health-records" />
    </div>
  );
}
