import type { Id, DomainEvent } from '@shared/types';
import type { EventStore } from '@shared/contracts';
import { persistEvent, loadAllEvents } from '@data/sources/local/event-db';
import { upcastEvent } from './upcasters';

/** Persistence backend for the hybrid store. Injected so the failure path is testable. */
export interface PersistenceBackend {
  persist(event: DomainEvent<string, object>): Promise<void>;
  loadAll(): Promise<DomainEvent<string, object>[]>;
  /** True when a durable backend (IndexedDB) is available. */
  available: boolean;
}

const indexedDbBackend: PersistenceBackend = {
  persist: persistEvent,
  loadAll: loadAllEvents,
  available: (() => {
    try { return typeof indexedDB !== 'undefined'; } catch { return false; }
  })(),
};

/**
 * Hybrid event store: durable backend (IndexedDB) with in-memory fallback.
 *
 * `append` is best-effort: a failed durable write does NOT reject (the event
 * still lives in memory for this session), but it flips persistence health and
 * notifies subscribers so the app can warn the user in real time — rather than
 * losing the write silently until the next reload.
 */
export class HybridEventStore implements EventStore {
  private streams = new Map<string, DomainEvent<string, object>[]>();
  private subscribers = new Map<string, Set<(event: DomainEvent<string, object>) => void>>();
  private statusListeners = new Set<(working: boolean) => void>();
  private readonly backend: PersistenceBackend;
  private useIndexedDB: boolean;
  private hydrationFailed = false;
  private persistenceFailures = 0;

  constructor(backend: PersistenceBackend = indexedDbBackend) {
    this.backend = backend;
    this.useIndexedDB = backend.available;
  }

  /** False means events are in-memory only and will be lost on page refresh. */
  isPersistenceWorking(): boolean {
    return this.useIndexedDB && !this.hydrationFailed && this.persistenceFailures === 0;
  }

  /**
   * Subscribe to persistence-health changes. Fires whenever durability degrades
   * (e.g. a write fails mid-session). Returns an unsubscribe function.
   */
  onPersistenceStatus(listener: (working: boolean) => void): () => void {
    this.statusListeners.add(listener);
    return () => { this.statusListeners.delete(listener); };
  }

  private notifyStatus(): void {
    const working = this.isPersistenceWorking();
    for (const listener of this.statusListeners) listener(working);
  }

  async append(event: DomainEvent<string, object>): Promise<void> {
    const stream = this.streams.get(event.aggregateId) ?? [];
    stream.push(event);
    this.streams.set(event.aggregateId, stream);

    if (this.useIndexedDB) {
      try {
        await this.backend.persist(event);
      } catch {
        const wasWorking = this.isPersistenceWorking();
        this.persistenceFailures++;
        if (wasWorking) this.notifyStatus();
      }
    }

    const subs = this.subscribers.get(event.aggregateId);
    if (subs) {
      for (const handler of subs) handler(event);
    }
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
    if (!this.useIndexedDB) {
      this.hydrationFailed = true;
      this.notifyStatus();
      return;
    }
    try {
      const events = await this.backend.loadAll();
      for (const raw of events) {
        const event = upcastEvent(raw);
        const stream = this.streams.get(event.aggregateId) ?? [];
        stream.push(event);
        this.streams.set(event.aggregateId, stream);
      }
    } catch {
      this.hydrationFailed = true;
      this.notifyStatus();
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
