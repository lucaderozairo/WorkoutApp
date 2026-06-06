import { describe, it, expect, vi } from 'vitest';
import type { DomainEvent, Id } from '@shared/types';
import { EventRepository } from './event-repository';
import type { EventStore, EventBus } from './event-repository';

function makeEvent(type: string): DomainEvent {
  return {
    type,
    aggregateId: 'agg-1' as Id,
    aggregateType: 'Test',
    timestamp: 1000,
    version: 1,
    payload: null,
  };
}

describe('EventRepository', () => {
  it('persists each event to the store', async () => {
    const store: EventStore = { append: vi.fn().mockResolvedValue(undefined) };
    const bus:   EventBus   = { publish: vi.fn().mockResolvedValue(undefined) };
    const repo  = new EventRepository(store, bus);

    await repo.commit([makeEvent('ThingHappened')]);

    expect(store.append).toHaveBeenCalledTimes(1);
    expect(store.append).toHaveBeenCalledWith(expect.objectContaining({ type: 'ThingHappened' }));
  });

  it('publishes each event to the bus', async () => {
    const store: EventStore = { append: vi.fn().mockResolvedValue(undefined) };
    const bus:   EventBus   = { publish: vi.fn().mockResolvedValue(undefined) };
    const repo  = new EventRepository(store, bus);

    await repo.commit([makeEvent('ThingHappened')]);

    expect(bus.publish).toHaveBeenCalledTimes(1);
    expect(bus.publish).toHaveBeenCalledWith(expect.objectContaining({ type: 'ThingHappened' }));
  });

  it('persists all events before publishing any', async () => {
    const order: string[] = [];
    const store: EventStore = {
      append: vi.fn().mockImplementation(() => {
        order.push('persist');
        return Promise.resolve();
      }),
    };
    const bus: EventBus = {
      publish: vi.fn().mockImplementation(() => {
        order.push('publish');
        return Promise.resolve();
      }),
    };
    const repo = new EventRepository(store, bus);

    await repo.commit([makeEvent('A'), makeEvent('B')]);

    expect(order).toEqual(['persist', 'persist', 'publish', 'publish']);
  });

  it('handles multiple events, preserving order', async () => {
    const persisted: string[] = [];
    const published: string[] = [];
    const store: EventStore = {
      append: vi.fn().mockImplementation((e: DomainEvent) => {
        persisted.push(e.type);
        return Promise.resolve();
      }),
    };
    const bus: EventBus = {
      publish: vi.fn().mockImplementation((e: DomainEvent) => {
        published.push(e.type);
        return Promise.resolve();
      }),
    };
    const repo = new EventRepository(store, bus);

    await repo.commit([makeEvent('EventA'), makeEvent('EventB'), makeEvent('EventC')]);

    expect(persisted).toEqual(['EventA', 'EventB', 'EventC']);
    expect(published).toEqual(['EventA', 'EventB', 'EventC']);
  });

  it('handles an empty array without error', async () => {
    const store: EventStore = { append: vi.fn().mockResolvedValue(undefined) };
    const bus:   EventBus   = { publish: vi.fn().mockResolvedValue(undefined) };
    const repo  = new EventRepository(store, bus);

    await expect(repo.commit([])).resolves.toBeUndefined();
    expect(store.append).not.toHaveBeenCalled();
    expect(bus.publish).not.toHaveBeenCalled();
  });
});
