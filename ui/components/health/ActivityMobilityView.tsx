import { CATEGORY_MOCK_CHARTS } from '../../../data/mock/health-categories'
import { ChartContainer } from '../../patterns/charts/charts'

export function ActivityMobilityView() {
  const charts = CATEGORY_MOCK_CHARTS['activity-mobility']
  return (
    <div className="stack">
      {charts.map(c => (
        <div key={c.label} className="surface compact stack compact">
          <div className="row space-between align-center">
            <span className="eyebrow">{c.label}</span>
            {c.currentValue && <span className="pill">{c.currentValue}</span>}
          </div>
          <ChartContainer
            chartType={c.chartType}
            data={c.data}
            height={120}
            axisShow={{ x: true, y: true }}
            color={c.color ?? 'var(--accent)'}
          />
        </div>
      ))}
    </div>
  )
}
