import { useQuery } from '@ui/bindings';
import type { MockSocialEvent } from '@features/social';
import { SPORT_MAP } from '@features/social/domain/constants';
import { Row, Column } from '@ui/layout';
import { Surface } from '@ui/atoms';

export function EventsTab() {
  const mockEvents = (useQuery<MockSocialEvent[]>('social_events_mock') ?? []) as MockSocialEvent[];

  return (
    <Surface>
      <Column>
        <h3>Upcoming Events</h3>
        {mockEvents.map(ev => {
          const sport = SPORT_MAP[ev.sport];
          return (
            <Row key={ev.id} justify="between">
              <Row>
                <div className={`avatar ${sport?.avatar ?? 'lift'}`}>{sport?.icon}</div>
                <div>
                  <p>{ev.name}</p>
                  <time className="caption">{ev.date} · {ev.location} · {ev.time}</time>
                </div>
              </Row>
              <button>Join</button>
            </Row>
          );
        })}
      </Column>
    </Surface>
  );
}
