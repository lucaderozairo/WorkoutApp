import type { DomainEvent } from '@shared/types';

type EventHandler = (event: DomainEvent<string, object>) => void | Promise<void>;

class EventBus {
  private handlers = new Set<EventHandler>();

  subscribe(handler: EventHandler): () => void {
    this.handlers.add(handler);
    return () => { this.handlers.delete(handler); };
  }

  async publish(event: DomainEvent<string, object>): Promise<void> {
    for (const handler of this.handlers) {
      try {
        await handler(event);
      } catch (e) {
        console.error('Event bus handler error:', e);
      }
    }
  }
}

export const eventBus = new EventBus();
