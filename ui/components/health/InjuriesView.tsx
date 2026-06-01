import { useQuery, useCommand } from '@ui/bindings';
import { handleResolveInjury } from '@features/profile';
import type { Id } from '@shared/types';
import { HealthChartsList } from './HealthChartsList';
import { Row, Column } from '@ui/layout';
import { Surface } from '@ui/atoms';

type InjuryView = { id: Id<'Injury'>; description: string; bodyPart: string; recordedAt: number };
const USER_ID = 'user-001' as Id<'User'>;

export function InjuriesView() {
  const injuries = (useQuery<InjuryView[]>('active_injuries') ?? []) as InjuryView[];
  const { dispatch } = useCommand(handleResolveInjury);

  return (
    <Column>
      <HealthChartsList slug="injuries" height={100} />

      {injuries.length === 0 ? (
        <p className="muted">No active injuries.</p>
      ) : (
        injuries.map(inj => (
          <Surface key={inj.id}>
            <Column>
              <Row justify="between" align="center">
                <span className="badge bad">Active</span>
                <span className="mono muted">{new Date(inj.recordedAt).toLocaleDateString()}</span>
              </Row>
              <Column>
                <h3>{inj.bodyPart}</h3>
                <p className="muted">{inj.description}</p>
              </Column>
              <button className="sm" onClick={() => dispatch({ type: 'ResolveInjury', userId: USER_ID, injuryId: inj.id })}>
                Mark resolved
              </button>
            </Column>
          </Surface>
        ))
      )}
    </Column>
  );
}
