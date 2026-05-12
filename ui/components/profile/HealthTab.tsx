// ui/components/profile/HealthTab.tsx
import { useQuery, useCommand } from '@ui/bindings';
import { handleResolveInjury, getBodyweightLog } from '@features/profile';
import type { HealthMetricsView } from '@features/readiness';
import type { Id } from '@shared/types';

import '@features/readiness';

type InjuryView = { id: Id<'Injury'>; description: string; bodyPart: string; recordedAt: number };

const USER_ID = 'user-001' as Id<'User'>;

export function HealthTab() {
  const injuries = (useQuery<InjuryView[]>('active_injuries') ?? []) as InjuryView[];
  const bwEntries = getBodyweightLog().slice(0, 2);
  const healthMetrics = (useQuery<HealthMetricsView[]>('health_metrics') ?? []) as HealthMetricsView[];
  const { dispatch: dispatchResolveInjury } = useCommand(handleResolveInjury);

  const latestHm = healthMetrics[0] ?? null;
  const latestBw = bwEntries[0] ?? null;
  const prevBw   = bwEntries[1] ?? null;
  const bwDelta  = latestBw && prevBw ? latestBw.weightKg - prevBw.weightKg : null;

  return (
    <div className="stack">

      {/* ── Body Metrics ── */}
      <h2 className="eyebrow">Body metrics</h2>
      <div className="grid-4">
        <div className="surface">
          <span className="eyebrow">Weight</span>
          <span>
            {latestBw?.weightKg ?? '—'}<span className="faint">kg</span>
          </span>
          {bwDelta !== null && (
            <span className={`stat__trend ${bwDelta <= 0 ? 'stat__trend--down' : 'stat__trend--up'} mono`}>
              {bwDelta <= 0 ? '↓' : '↑'} {Math.abs(bwDelta).toFixed(1)} since last
            </span>
          )}
        </div>
        <div className="surface">
          <span className="eyebrow">Resting HR</span>
          <span>
            {latestHm?.restingHr ?? '—'}<span className="faint">bpm</span>
          </span>
        </div>
        <div className="surface">
          <span className="eyebrow">HRV</span>
          <span>
            {latestHm?.hrv ?? '—'}<span className="faint">ms</span>
          </span>
        </div>
        <div className="surface">
          <span className="eyebrow">VO₂ Max</span>
          <span>
            {latestHm?.vo2max ?? '—'}<span className="faint">ml/kg</span>
          </span>
        </div>
      </div>

      {/* ── Sleep ── */}
      <h2 className="eyebrow">Sleep</h2>
      <div className="surface">
        <p className="muted">Sleep data will appear here once connected.</p>
      </div>

      {/* ── Injuries ── */}
      <h2 className="eyebrow">Injuries</h2>
      {injuries.length === 0 ? (
        <p className="muted">No active injuries.</p>
      ) : injuries.map(inj => (
        <div key={inj.id} className="surface">
          <div className="row space-between align-center">
            <span className="pill bad">Active</span>
            <span className="mono muted">{new Date(inj.recordedAt).toLocaleDateString()}</span>
          </div>
          <div className="stack">
            <h3>{inj.bodyPart}</h3>
            <p className="muted">{inj.description}</p>
          </div>
          <button
            className="sm"
            onClick={() => dispatchResolveInjury({ type: 'ResolveInjury', userId: USER_ID, injuryId: inj.id })}
          >
            Mark resolved
          </button>
        </div>
      ))}

    </div>
  );
}
