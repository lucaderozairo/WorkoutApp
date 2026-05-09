// ui/components/workout/PlannedSessionDetail.tsx
import { useQuery } from '@ui/bindings';
import type { PlannedSession } from '@features/planning';
import type { Id } from '@shared/types';

interface PlannedSessionDetailProps {
  planId: Id<'PlannedSession'>;
  onClose: () => void;
  onStartNow: (plan: PlannedSession) => void;
}

function formatWhen(ts: number): string {
  return new Date(ts).toLocaleString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

function GymDetail({ plan }: { plan: PlannedSession }) {
  const exercises = plan.exercises ?? [];
  if (exercises.length === 0) return <p className="caption muted">No exercises planned.</p>;
  return (
    <div className="column compact">
      {exercises.map((ex, i) => (
        <div key={i} className="surface column compact">
          <span className="detail">{ex.name}</span>
          <div className="row compact align-center">
            <span className="caption muted">{ex.sets} sets</span>
            <span className="caption muted">×</span>
            <span className="caption muted">{ex.reps} reps</span>
            {ex.weightKg > 0 && (
              <>
                <span className="caption muted">@</span>
                <span className="caption muted">{ex.weightKg} kg</span>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function CardioDetail({ plan }: { plan: PlannedSession }) {
  const paceLabel = plan.paceSecPerKm
    ? `${Math.floor(plan.paceSecPerKm / 60)}:${String(plan.paceSecPerKm % 60).padStart(2, '0')} /km`
    : null;
  const estMin = plan.distanceKm && plan.paceSecPerKm
    ? Math.round((plan.distanceKm * plan.paceSecPerKm) / 60)
    : null;
  return (
    <div className="surface column compact">
      {plan.distanceKm && (
        <div className="row space-between">
          <span className="caption muted">Distance</span>
          <span className="detail">{plan.distanceKm} km</span>
        </div>
      )}
      {paceLabel && (
        <div className="row space-between">
          <span className="caption muted">Target pace</span>
          <span className="detail">{paceLabel}</span>
        </div>
      )}
      {estMin && (
        <div className="row space-between">
          <span className="caption muted">Est. duration</span>
          <span className="detail">{estMin} min</span>
        </div>
      )}
    </div>
  );
}

function SwimDetail({ plan }: { plan: PlannedSession }) {
  const paceLabel = plan.paceSecPer100m
    ? `${Math.floor(plan.paceSecPer100m / 60)}:${String(plan.paceSecPer100m % 60).padStart(2, '0')} /100m`
    : null;
  return (
    <div className="surface column compact">
      {plan.targetDistanceM && (
        <div className="row space-between">
          <span className="caption muted">Distance</span>
          <span className="detail">{plan.targetDistanceM} m</span>
        </div>
      )}
      {plan.poolLengthM && (
        <div className="row space-between">
          <span className="caption muted">Pool</span>
          <span className="detail">{plan.poolLengthM} m</span>
        </div>
      )}
      {paceLabel && (
        <div className="row space-between">
          <span className="caption muted">Target pace</span>
          <span className="detail">{paceLabel}</span>
        </div>
      )}
    </div>
  );
}

export function PlannedSessionDetail({ planId, onClose, onStartNow }: PlannedSessionDetailProps) {
  const all = (useQuery<PlannedSession[]>('planned_sessions') ?? []) as PlannedSession[];
  const plan = all.find(p => p.id === planId);

  if (!plan) return null;

  return (
    <div className="surface column">
      <div className="row space-between align-center">
        <div className="column compact">
          <span className="detail">{plan.name}</span>
          <span className="caption muted">{formatWhen(plan.scheduledAt)}</span>
        </div>
        <button type="button" className="ghost" onClick={onClose}>✕</button>
      </div>

      {plan.type === 'gym' && <GymDetail plan={plan} />}
      {(plan.type === 'run' || plan.type === 'cycle') && <CardioDetail plan={plan} />}
      {plan.type === 'swim' && <SwimDetail plan={plan} />}

      {plan.notes ? (
        <div className="surface flat">
          <p className="caption muted">{plan.notes}</p>
        </div>
      ) : null}

      <button type="button" className="primary" onClick={() => onStartNow(plan)}>
        ▶ Start now
      </button>
    </div>
  );
}
