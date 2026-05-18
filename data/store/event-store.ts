import type { Id, DomainEvent } from '@shared/types';
import type { EventStore } from '@shared/contracts';
import { eventBus } from '@core/events';
import { persistEvent, loadAllEvents } from '@data/sources/local/event-db';

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

    if (this.useIndexedDB) {
      try {
        await persistEvent(event);
      } catch {
        // non-fatal: in-memory + localStorage snapshot still intact
      }
    }

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
    if (!this.useIndexedDB) return;
    try {
      const events = await loadAllEvents();
      for (const event of events) {
        const stream = this.streams.get(event.aggregateId) ?? [];
        stream.push(event);
        this.streams.set(event.aggregateId, stream);
      }
    } catch {
      // IndexedDB unavailable — proceed with empty streams
    }
  }

  hasAnyEvents(): boolean {
    for (const stream of this.streams.values()) {
      if (stream.length > 0) return true;
    }
    return false;
  }

  getAllEventsFlat(): DomainEvent<string, object>[] {
    const all: DomainEvent<string, object>[] = [];
    for (const stream of this.streams.values()) {
      all.push(...stream);
    }
    return all.sort((a, b) => a.timestamp - b.timestamp);
  }
}

export const inMemoryEventStore = new HybridEventStore();
