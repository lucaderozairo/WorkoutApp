import { useQuery } from '@ui/bindings';
import type { MockSocialEvent } from '@features/social';
import { SPORT_MAP } from '@features/social/domain/constants';

export function EventsTab() {
  const mockEvents = (useQuery<MockSocialEvent[]>('social_events_mock') ?? []) as MockSocialEvent[];

  return (
    <section className="surface">
      <h3>Upcoming Events</h3>
      <div className="column">
        {mockEvents.map(ev => {
          const sport = SPORT_MAP[ev.sport];
          return (
            <div key={ev.id} className="row space-between">
              <div className="row">
                <div className={`avatar ${sport?.avatar ?? 'lift'}`}>{sport?.icon}</div>
                <div>
                  <p>{ev.name}</p>
                  <time className="caption">{ev.date} · {ev.location} · {ev.time}</time>
                </div>
              </div>
              <button>Join</button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
