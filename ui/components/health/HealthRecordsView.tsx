import { HealthChartsList } from './HealthChartsList';

export function HealthRecordsView() {
  return (
    <div className="stack">
      <HealthChartsList slug="health-records" />
    </div>
  );
}
