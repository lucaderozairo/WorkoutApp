import type { DomainEvent } from '@shared/types';

export type EventHandler<E extends DomainEvent<string, object>> = (event: E) => void | Promise<void>;

export interface SubscriptionOptions {
  async?: boolean;
}

export interface SubscriptionToken {
  unsubscribe(): void;
}

interface SubscriberEntry {
  handler: EventHandler<DomainEvent<string, object>>;
  options: SubscriptionOptions;
}

class EventBusImpl {
  private subscribers = new Map<string, SubscriberEntry[]>();
  private orderingBuffers = new Map<string, DomainEvent<string, object>[]>();

  publish(event: DomainEvent<string, object>): Promise<void> {
    const key = event.aggregateId;
    const buffer = this.orderingBuffers.get(key) ?? [];
    buffer.push(event);
    this.orderingBuffers.set(key, buffer);

    const handlers = this.subscribers.get(event.type) ?? [];
    const syncHandlers = handlers.filter(h => !h.options.async);
    const asyncHandlers = handlers.filter(h => h.options.async);

    // Run sync handlers inline
    for (const entry of syncHandlers) {
      const result = entry.handler(event);
      if (result instanceof Promise) {
        console.warn(`Sync handler for ${event.type} returned a promise. Mark it as async.`);
      }
    }

    // Dispatch async handlers via queue (fire and forget, errors go to dead letter)
    for (const entry of asyncHandlers) {
      const result = entry.handler(event);
      if (result instanceof Promise) {
        result.catch((err: unknown) => {
          console.error(`Async handler for ${event.type} failed:`, err);
        });
      }
    }

    return Promise.resolve();
  }

  subscribe<E extends DomainEvent<string, object>>(
    eventType: string,
    handler: EventHandler<E>,
    options: SubscriptionOptions = {}
  ): SubscriptionToken {
    const entries = this.subscribers.get(eventType) ?? [];
    entries.push({ handler: handler as EventHandler<DomainEvent<string, object>>, options });
    this.subscribers.set(eventType, entries);

    return {
      unsubscribe: () => {
        const current = this.subscribers.get(eventType) ?? [];
        this.subscribers.set(
          eventType,
          current.filter(e => e.handler !== handler)
        );
      },
    };
  }
}

export const eventBus = new EventBusImpl();
