import { useQuery, useCommand } from '@ui/bindings';
import { handleResolveInjury } from '@features/profile';
import type { Id } from '@shared/types';
import { HealthChartsList } from './HealthChartsList';
import { Row, Column } from '@ui/layout';
import { Surface, Text } from '@ui/atoms';
import { Badge, Button } from '@ui/molecules';

type InjuryView = { id: Id<'Injury'>; description: string; bodyPart: string; recordedAt: number };
const USER_ID = 'user-001' as Id<'User'>;

export function InjuriesView() {
  const injuries = (useQuery<InjuryView[]>('active_injuries') ?? []) as InjuryView[];
  const { dispatch } = useCommand(handleResolveInjury);

  return (
    <Column>
      <HealthChartsList slug="injuries" height={100} />

      {injuries.length === 0 ? (
        <Text color="muted">No active injuries.</Text>
      ) : (
        injuries.map(inj => (
          <Surface key={inj.id}>
            <Column>
              <Row justify="between" align="center">
                <Badge tone="bad">Active</Badge>
                <Text mono color="muted">{new Date(inj.recordedAt).toLocaleDateString()}</Text>
              </Row>
              <Column>
                <Text as="h3">{inj.bodyPart}</Text>
                <Text color="muted">{inj.description}</Text>
              </Column>
              <Button size="sm" onClick={() => dispatch({ type: 'ResolveInjury', userId: USER_ID, injuryId: inj.id })}>
                Mark resolved
              </Button>
            </Column>
          </Surface>
        ))
      )}
    </Column>
  );
}
