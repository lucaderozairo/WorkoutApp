import type { DomainEvent } from '@shared/types';
import { inMemoryEventStore } from '@data/store';
import { eventBus } from '@core/events/bus';

export interface EventStore {
  append(event: DomainEvent): Promise<void>;
}

export interface EventBus {
  publish(event: DomainEvent): Promise<void>;
}

export class EventRepository {
  constructor(
    private readonly store: EventStore,
    private readonly bus: EventBus,
  ) {}

  async commit(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.store.append(event);
    }
    for (const event of events) {
      await this.bus.publish(event);
    }
  }
}

export const eventRepository = new EventRepository(inMemoryEventStore, eventBus);
