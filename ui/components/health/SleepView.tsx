import { HealthChartsList } from './HealthChartsList';

export function SleepView() {
  return (
    <div className="column">
      <HealthChartsList slug="sleep" />
    </div>
  );
}
