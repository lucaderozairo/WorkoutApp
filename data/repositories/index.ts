import type { Id, DomainEvent, Result } from '@shared/types';
import { ok } from '@shared/types';
import { inMemoryEventStore } from '@data/store';

type Reducer<TState, TEvent> = (state: TState, event: TEvent) => TState;
type ReducerMap<TState, TEvent> = Record<string, Reducer<TState, TEvent>>;

export class AggregateRepository<TState, TEvent extends DomainEvent<string, object>> {
  private reducers: ReducerMap<TState, TEvent>;
  private initialState: TState;

  constructor(initialState: TState, reducers: ReducerMap<TState, TEvent>) {
    this.initialState = initialState;
    this.reducers = reducers;
  }

  async load(_aggregateId: Id): Promise<TState> {
    // For now, return initial state. In production, replay events from event store.
    return this.initialState;
  }

  async save(events: TEvent[]): Promise<void> {
    for (const event of events) {
      await inMemoryEventStore.append(event);
    }
  }

  applyAll(events: TEvent[]): TState {
    let state = this.initialState;
    for (const event of events) {
      const reducer = this.reducers[event.type];
      if (reducer) {
        state = reducer(state, event);
      }
    }
    return state;
  }
}
