import { useQuery } from '@ui/bindings';
import type { MockSuggestedGroup } from '@features/social';
import { SPORT_MAP } from '@features/social/domain/constants';
import { Row, Column } from '@ui/layout';
import { Surface, Avatar, Button, Text } from '@ui/atoms';

export function GroupsTab() {
  const mockGroups = (useQuery<MockSuggestedGroup[]>('social_groups_mock') ?? []) as MockSuggestedGroup[];

  return (
    <Surface>
      <Column>
        <Text as="h3">Suggested Groups</Text>
        {mockGroups.map(g => {
          const sport = SPORT_MAP[g.sport];
          return (
            <Row key={g.id} justify="between">
              <Row>
                <Avatar name={g.initials} className={sport?.avatar ?? 'lift'} />
                <Column>
                  <Text>{g.name}</Text>
                  <Text size="caption">{g.members} members · {g.activity}</Text>
                </Column>
              </Row>
              <Button size="sm">Join</Button>
            </Row>
          );
        })}
      </Column>
    </Surface>
  );
}
