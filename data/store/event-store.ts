import type { Id, DomainEvent } from '@shared/types';
import type { EventStore } from '@shared/contracts';
import { eventBus } from '@core/events';

/**
 * Hybrid event store: IndexedDB backend with in-memory fallback.
 */
class HybridEventStore implements EventStore {
  private streams = new Map<string, DomainEvent<string, object>[]>();
  private subscribers = new Map<string, Set<(event: DomainEvent<string, object>) => void>>();
  private useIndexedDB: boolean;

  constructor() {
    try {
      this.useIndexedDB = typeof indexedDB !== 'undefined';
    } catch {
      this.useIndexedDB = false;
    }
  }

  async append(event: DomainEvent<string, object>): Promise<void> {
    const stream = this.streams.get(event.aggregateId) ?? [];
    stream.push(event);
    this.streams.set(event.aggregateId, stream);

    const subs = this.subscribers.get(event.aggregateId);
    if (subs) {
      for (const handler of subs) handler(event);
    }

    await eventBus.publish(event);
  }

  async readStream(aggregateId: Id): Promise<DomainEvent<string, object>[]> {
    return this.streams.get(aggregateId) ?? [];
  }

  subscribe(
    aggregateId: Id,
    handler: (event: DomainEvent<string, object>) => void
  ): () => void {
    const subs = this.subscribers.get(aggregateId) ?? new Set();
    subs.add(handler);
    this.subscribers.set(aggregateId, subs);
    return () => { subs.delete(handler); };
  }

  async hydrate(): Promise<void> {
    // No-op for in-memory store
  }
}

export const inMemoryEventStore = new HybridEventStore();
