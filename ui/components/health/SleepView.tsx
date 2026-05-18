import { HealthChartsList } from './HealthChartsList';

export function SleepView() {
  return (
    <div className="stack">
      <HealthChartsList slug="sleep" />
    </div>
  );
}
