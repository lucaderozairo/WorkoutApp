import { describe, it, expect, vi } from 'vitest';
import type { DomainEvent, Id } from '@shared/types';
import type { EventStore, EventBus } from './event-repository';
import { EventRepository } from './event-repository';
import { defineCommand } from './define-command';
import { ProjectionBuilder } from './projections/builders';
import { viewStore } from './projections/views';

function makeStore(): EventStore & { calls: DomainEvent[] } {
  const calls: DomainEvent[] = [];
  return { calls, append: async (e) => { calls.push(e); } };
}

function makeBus(): EventBus & { published: DomainEvent[] } {
  const published: DomainEvent[] = [];
  return { published, publish: async (e) => { published.push(e); } };
}

function makeRepo() {
  const store = makeStore();
  const bus = makeBus();
  return { repo: new EventRepository(store, bus), store, bus };
}

function makeEvent(type: string): DomainEvent {
  return { type, aggregateId: 'agg' as Id, aggregateType: 'T', timestamp: 1, version: 1, payload: null };
}

describe('defineCommand', () => {
  it('calls execute with the command', async () => {
    const executeSpy = vi.fn().mockResolvedValue({ events: [] });
    const { repo } = makeRepo();
    const handler = defineCommand({ execute: executeSpy }, repo);
    await handler({ type: 'DoThing' });
    expect(executeSpy).toHaveBeenCalledWith({ type: 'DoThing' });
  });

  it('persists events returned by execute', async () => {
    const { repo, store } = makeRepo();
    const event = makeEvent('ThingDone');
    const handler = defineCommand({ execute: async () => ({ events: [event] }) }, repo);
    await handler({});
    expect(store.calls).toEqual([event]);
  });

  it('publishes events to the bus after persisting', async () => {
    const { repo, bus } = makeRepo();
    const event = makeEvent('ThingDone');
    const handler = defineCommand({ execute: async () => ({ events: [event] }) }, repo);
    await handler({});
    expect(bus.published).toEqual([event]);
  });

  it('returns the result from execute', async () => {
    const { repo } = makeRepo();
    const handler = defineCommand(
      { execute: async () => ({ events: [], result: 'abc-id' }) },
      repo,
    );
    const result = await handler({});
    expect(result).toBe('abc-id');
  });

  it('returns undefined when execute omits result', async () => {
    const { repo } = makeRepo();
    const handler = defineCommand({ execute: async () => ({ events: [] }) }, repo);
    const result = await handler({});
    expect(result).toBeUndefined();
  });

  it('does not call commit when execute returns no events', async () => {
    const { repo } = makeRepo();
    const commitSpy = vi.spyOn(repo, 'commit');
    const handler = defineCommand({ execute: async () => ({ events: [] }) }, repo);
    await handler({});
    expect(commitSpy).toHaveBeenCalledWith([]);
  });

  it('preloads declared projection state into the command context', async () => {
    type CounterEvent = DomainEvent<'CounterIncremented', { by: number }>;
    const projection = new ProjectionBuilder<{ count: number }, CounterEvent>(
      'define_command_counter_preload',
      { count: 0 },
      {
        CounterIncremented: (state, event) => ({ count: state.count + event.payload.by }),
      },
    );
    const { repo } = makeRepo();
    viewStore.set('define_command_counter_preload', { count: 5 });

    const handler = defineCommand({
      projections: [{ key: 'define_command_counter_preload' as const, projection }],
      execute: async (_cmd: { amount: number }, ctx) => {
        expect(ctx.state.define_command_counter_preload.count).toBe(5);
        return 'loaded';
      },
    }, repo);

    await expect(handler({ amount: 1 })).resolves.toBe('loaded');
  });

  it('applies ctx.commit events to declared projections and persists them', async () => {
    type CounterEvent = DomainEvent<'CounterIncremented', { by: number }>;
    const projection = new ProjectionBuilder<{ count: number }, CounterEvent>(
      'define_command_counter_commit',
      { count: 0 },
      {
        CounterIncremented: (state, event) => ({ count: state.count + event.payload.by }),
      },
    );
    const { repo, store, bus } = makeRepo();
    viewStore.set('define_command_counter_commit', { count: 0 });

    const event: CounterEvent = {
      type: 'CounterIncremented',
      aggregateId: 'counter' as Id,
      aggregateType: 'Counter',
      timestamp: 1,
      version: 1,
      payload: { by: 3 },
    };
    const handler = defineCommand({
      projections: [{ key: 'define_command_counter_commit' as const, projection }],
      execute: async (_cmd: void, ctx) => {
        await ctx.commit([event]);
        return 'committed';
      },
    }, repo);

    await expect(handler()).resolves.toBe('committed');
    expect(viewStore.get<{ count: number }>('define_command_counter_commit')).toEqual({ count: 3 });
    expect(store.calls).toEqual([event]);
    expect(bus.published).toEqual([event]);
  });
});
