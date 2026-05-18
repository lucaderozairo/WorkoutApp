import type { DomainEvent } from '@shared/types';

type ReducerMap<State, Event extends DomainEvent<string, object>> = {
  [K in Event['type']]?: (state: State, event: Event & { type: K }) => State;
};

export class ProjectionBuilder<State, Event extends DomainEvent<string, object>> {
  private state: State;
  private key: string;
  private reducers: ReducerMap<State, Event>;

  constructor(key: string, initialState: State, reducers: ReducerMap<State, Event>) {
    this.key = key;
    this.state = initialState;
    this.reducers = reducers;
  }

  apply(event: Event): void {
    const reducer = this.reducers[event.type as Event['type']];
    if (reducer) {
      this.state = reducer(this.state, event);
    }
  }

  getState(): State {
    return this.state;
  }

  getKey(): string {
    return this.key;
  }

  setState(state: State): void {
    this.state = state;
  }
}

class ProjectionRegistry {
  private registry = new Map<string, unknown>();

  register(key: string, projection: unknown): void {
    this.registry.set(key, projection);
  }

  get(key: string): unknown | undefined {
    return this.registry.get(key);
  }
}

export const projectionRegistry = new ProjectionRegistry();
