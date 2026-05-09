import { useQuery } from '@ui/bindings';
import type { PlannedSession } from '@features/planning';
import type { Id } from '@shared/types';

const TYPE_EMOJI: Record<string, string> = {
  gym: '🏋️', run: '🏃', cycle: '🚴', swim: '🏊',
};

function formatWhen(scheduledAt: number): string {
  return new Date(scheduledAt).toLocaleString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

interface UpcomingPlansProps {
  type?: string;
  onSelect?: (id: Id<'PlannedSession'>) => void;
}

export function UpcomingPlans({ type, onSelect }: UpcomingPlansProps) {
  const all = (useQuery<PlannedSession[]>('planned_sessions') ?? []) as PlannedSession[];
  const upcoming = all
    .filter(p => p.scheduledAt > Date.now() && (!type || p.type === type))
    .slice(0, 5);

  if (upcoming.length === 0) return null;

  return (
    <div className="surface column compact">
      <span className="eyebrow">Upcoming</span>
      <div className="column compact">
        {upcoming.map(plan => (
          <button
            key={plan.id}
            type="button"
            className="row align-center interactive"
            onClick={() => onSelect?.(plan.id)}
          >
            <span aria-hidden>{TYPE_EMOJI[plan.type] ?? '📋'}</span>
            <div className="column compact grow">
              <span className="detail">{plan.name}</span>
              <span className="caption muted">{formatWhen(plan.scheduledAt)}</span>
            </div>
            <span className="caption muted">›</span>
          </button>
        ))}
      </div>
    </div>
  );
}
