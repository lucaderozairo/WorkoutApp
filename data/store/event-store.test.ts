import { describe, it, expect, vi } from 'vitest';
import type { DomainEvent, Id } from '@shared/types';
import { HybridEventStore, type PersistenceBackend } from './event-store';

function makeEvent(type = 'ThingDone'): DomainEvent<string, object> {
  return {
    type,
    aggregateId: 'agg-1' as Id,
    aggregateType: 'Thing',
    timestamp: Date.now(),
    version: 1,
    payload: {},
  };
}

function backend(over: Partial<PersistenceBackend> = {}): PersistenceBackend {
  return {
    persist: vi.fn(async () => {}),
    loadAll: vi.fn(async () => []),
    available: true,
    ...over,
  };
}

describe('HybridEventStore persistence health', () => {
  it('reports working when the backend persists successfully', async () => {
    const store = new HybridEventStore(backend());
    await store.append(makeEvent());
    expect(store.isPersistenceWorking()).toBe(true);
  });

  it('keeps the event in memory even when the durable write fails', async () => {
    const store = new HybridEventStore(backend({ persist: vi.fn(async () => { throw new Error('quota'); }) }));
    await expect(store.append(makeEvent())).resolves.toBeUndefined();
    expect((await store.readStream('agg-1' as Id)).length).toBe(1);
  });

  it('flips health and notifies subscribers when a write fails mid-session', async () => {
    const store = new HybridEventStore(backend({ persist: vi.fn(async () => { throw new Error('quota'); }) }));
    const statuses: boolean[] = [];
    store.onPersistenceStatus((working) => statuses.push(working));

    await store.append(makeEvent());

    expect(store.isPersistenceWorking()).toBe(false);
    expect(statuses).toEqual([false]);
  });

  it('notifies only on the first failure, not on every subsequent one', async () => {
    const store = new HybridEventStore(backend({ persist: vi.fn(async () => { throw new Error('quota'); }) }));
    const statuses: boolean[] = [];
    store.onPersistenceStatus((working) => statuses.push(working));

    await store.append(makeEvent());
    await store.append(makeEvent());

    expect(statuses).toEqual([false]);
  });

  it('reports not-working (no durable backend) without notifying on append', async () => {
    const store = new HybridEventStore(backend({ available: false }));
    const statuses: boolean[] = [];
    store.onPersistenceStatus((working) => statuses.push(working));

    await store.append(makeEvent());

    expect(store.isPersistenceWorking()).toBe(false);
    expect(statuses).toEqual([]); // never was working, so no transition fired
  });
});
