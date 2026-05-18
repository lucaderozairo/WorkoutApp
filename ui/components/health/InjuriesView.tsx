import { useQuery, useCommand } from '@ui/bindings';
import { handleResolveInjury } from '@features/profile';
import type { Id } from '@shared/types';
import { HealthChartsList } from './HealthChartsList';

type InjuryView = { id: Id<'Injury'>; description: string; bodyPart: string; recordedAt: number };
const USER_ID = 'user-001' as Id<'User'>;

export function InjuriesView() {
  const injuries = (useQuery<InjuryView[]>('active_injuries') ?? []) as InjuryView[];
  const { dispatch } = useCommand(handleResolveInjury);

  return (
    <div className="stack">
      <HealthChartsList slug="injuries" height={100} />

      {injuries.length === 0 ? (
        <p className="muted">No active injuries.</p>
      ) : (
        injuries.map(inj => (
          <div key={inj.id} className="surface">
            <div className="row space-between align-center">
              <span className="pill pill--bad">Active</span>
              <span className="mono muted">{new Date(inj.recordedAt).toLocaleDateString()}</span>
            </div>
            <div className="stack">
              <h3>{inj.bodyPart}</h3>
              <p className="muted">{inj.description}</p>
            </div>
            <button className="sm" onClick={() => dispatch({ type: 'ResolveInjury', userId: USER_ID, injuryId: inj.id })}>
              Mark resolved
            </button>
          </div>
        ))
      )}
    </div>
  );
}
