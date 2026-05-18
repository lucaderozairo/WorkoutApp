import { useQuery } from '@ui/bindings';
import type { MockSuggestedGroup } from '@features/social';
import { SPORT_MAP } from '@features/social/domain/constants';

export function GroupsTab() {
  const mockGroups = (useQuery<MockSuggestedGroup[]>('social_groups_mock') ?? []) as MockSuggestedGroup[];

  return (
    <section className="surface">
      <h3>Suggested Groups</h3>
      <div className="column">
        {mockGroups.map(g => {
          const sport = SPORT_MAP[g.sport];
          return (
            <div key={g.id} className="row space-between">
              <div className="row">
                <div className={`avatar ${sport?.avatar ?? 'lift'}`}>{g.initials}</div>
                <div>
                  <p>{g.name}</p>
                  <span className="caption">{g.members} members · {g.activity}</span>
                </div>
              </div>
              <button className="sm">Join</button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
