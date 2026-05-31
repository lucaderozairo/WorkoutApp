import { HealthChartsList } from './HealthChartsList';

export function GoalsRecordsView() {
  return (
    <div className="column">
      <HealthChartsList slug="goals-records" height={100} />
    </div>
  );
}
