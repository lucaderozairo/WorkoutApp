import { SparklineArea } from '@ui/patterns/charts/domain-charts';
import type { RestingHREntry, HRVEntry } from '@features/health';

export function RestingHRWidget({ history }: { history: RestingHREntry[] }) {
  if (history.length === 0) return null;
  const latest = history[history.length - 1];
  const data = history.map((e) => ({ x: e.date.slice(5), y: e.bpm }));
  return (
    <div className="surface column compact">
      <div className="row space-between align-center">
        <span className="caption">Resting HR</span>
        <span className="value">{latest.bpm} bpm</span>
      </div>
      <SparklineArea
        data={data}
        color="var(--color-warning)"
        height={50}
        id="resting-hr"
        yDomain={[35, 70]}
        showTooltip
        tooltipFormatter={(v) => `${v} bpm`}
      />
    </div>
  );
}

export function HRVWidget({ history }: { history: HRVEntry[] }) {
  if (history.length === 0) return null;
  const latest = history[history.length - 1];
  const data = history.map((e) => ({ x: e.date.slice(5), y: e.hrv }));
  return (
    <div className="surface column compact">
      <div className="row space-between align-center">
        <span className="caption">HRV</span>
        <span className="value">{latest.hrv} ms</span>
      </div>
      <SparklineArea
        data={data}
        color="var(--color-primary)"
        height={50}
        id="hrv"
        yDomain={[30, 140]}
        showTooltip
        tooltipFormatter={(v) => `${v} ms`}
      />
    </div>
  );
}
