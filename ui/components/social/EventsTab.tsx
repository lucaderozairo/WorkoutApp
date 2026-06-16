import { useQuery } from '@ui/bindings';
import type { MockSocialEvent } from '@features/social';
import { SPORT_MAP } from '@features/social/domain/constants';
import { Row, Column } from '@ui/layout';
import { Surface, Avatar, Text } from '@ui/atoms';
import { Button } from '@ui/molecules';

export function EventsTab() {
  const mockEvents = (useQuery<MockSocialEvent[]>('social_events_mock') ?? []) as MockSocialEvent[];

  return (
    <Surface>
      <Column>
        <Text as="h3">Upcoming Events</Text>
        {mockEvents.map(ev => {
          const sport = SPORT_MAP[ev.sport];
          return (
            <Row key={ev.id} justify="between">
              <Row>
                <Avatar name={sport?.icon ?? '?'} className={sport?.avatar ?? 'lift'} />
                <Column>
                  <Text>{ev.name}</Text>
                  <Text as="time" size="caption">{ev.date} · {ev.location} · {ev.time}</Text>
                </Column>
              </Row>
              <Button variant="secondary" size="sm">Join</Button>
            </Row>
          );
        })}
      </Column>
    </Surface>
  );
}
