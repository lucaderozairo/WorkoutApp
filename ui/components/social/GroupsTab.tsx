import { useQuery } from '@ui/bindings';
import type { MockSuggestedGroup } from '@features/social';
import { SPORT_MAP } from '@features/social/domain/constants';
import { Row, Column } from '@ui/layout';
import { Surface } from '@ui/atoms';

export function GroupsTab() {
  const mockGroups = (useQuery<MockSuggestedGroup[]>('social_groups_mock') ?? []) as MockSuggestedGroup[];

  return (
    <Surface>
      <Column>
        <h3>Suggested Groups</h3>
        {mockGroups.map(g => {
          const sport = SPORT_MAP[g.sport];
          return (
            <Row key={g.id} justify="between">
              <Row>
                <div className={`avatar ${sport?.avatar ?? 'lift'}`}>{g.initials}</div>
                <div>
                  <p>{g.name}</p>
                  <span className="caption">{g.members} members · {g.activity}</span>
                </div>
              </Row>
              <button className="sm">Join</button>
            </Row>
          );
        })}
      </Column>
    </Surface>
  );
}
