import type { WizardData } from './PlanWizard';
import { formatPace, buildMarkers } from '@features/planning';
import type { DistanceMarker } from '@features/planning';

const TYPE_EMOJI: Record<string, string> = {
  gym: '🏋️', run: '🏃', cycle: '🚴', swim: '🏊',
};

function formatScheduledAt(scheduledAt: number): string {
  return new Date(scheduledAt).toLocaleString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

interface StepReviewProps {
  data: WizardData;
  scheduledAt: number;  // pre-computed Unix ms
  onSave: () => void;
  saving: boolean;
}

export function StepReview({ data, scheduledAt, onSave, saving }: StepReviewProps) {
  const { type } = data;
  if (!type) return null;

  let markers: DistanceMarker[] = [];
  let distKm = 0;
  if ((type === 'run' || type === 'cycle') && data.distanceKm && data.paceSecPerKm) {
    distKm = data.distanceKm;
    const intervalKm = type === 'cycle' ? 5 : 1;
    markers = buildMarkers(distKm, data.paceSecPerKm, intervalKm);
  }
  if (type === 'swim' && data.targetDistanceM && data.paceSecPer100m) {
    distKm = data.targetDistanceM / 1000;
    markers = buildMarkers(distKm, data.paceSecPer100m * 10, 0.1);
  }

  return (
    <div className="column">
      <div className="surface column compact">
        <div className="row compact align-center">
          <span>{TYPE_EMOJI[type]}</span>
          <span className="caption">{type.toUpperCase()}</span>
        </div>
        <span className="detail">{data.sessionName || '(Untitled)'}</span>
        <span className="caption muted">{formatScheduledAt(scheduledAt)}</span>

        {type === 'gym' && data.exercises && data.exercises.length > 0 && (
          <div className="column compact">
            {data.exercises.map((ex: any, i: number) => (
              <span key={i} className="caption">
                {ex.name} — {ex.sets}×{ex.reps}
                {ex.weightKg > 0 ? ` · ${ex.weightKg} kg` : ''}
              </span>
            ))}
          </div>
        )}

        {(type === 'run' || type === 'cycle') && distKm > 0 && (
          <span className="caption muted">
            {distKm} km · {formatPace(data.paceSecPerKm ?? 300)}/km ·{' '}
            ~{Math.round((distKm * (data.paceSecPerKm ?? 300)) / 60)} min
          </span>
        )}

        {type === 'swim' && data.targetDistanceM && (
          <span className="caption muted">
            {data.targetDistanceM} m · {formatPace(data.paceSecPer100m ?? 120)}/100m ·{' '}
            ~{Math.round((data.targetDistanceM / 100) * (data.paceSecPer100m ?? 120) / 60)} min
          </span>
        )}
      </div>

      {markers.length > 0 && (
        <div className="column compact">
          <span className="caption">Markers (first and last)</span>
          <div className="surface column compact">
            {[markers[0], markers[markers.length - 1]]
              .filter(Boolean)
              .map((m, i) => (
                <div key={i} className="row space-between">
                  <span className="caption muted">
                    {type === 'swim'
                      ? `${Math.round(m.distanceKm * 1000)} m`
                      : `${m.distanceKm} km`}
                  </span>
                  <span className="caption mono">{m.cumulativeTime}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {data.notes && (
        <div className="surface compact">
          <span className="caption muted">{data.notes}</span>
        </div>
      )}

      <button type="button" className="primary" onClick={onSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save plan'}
      </button>
      <span className="caption muted center">Appears in Workout tab and Schedule</span>
    </div>
  );
}
