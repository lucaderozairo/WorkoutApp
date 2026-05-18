import { HealthChartsList } from './HealthChartsList';

export function GoalsRecordsView() {
  return (
    <div className="stack">
      <HealthChartsList slug="goals-records" height={100} />
    </div>
  );
}
