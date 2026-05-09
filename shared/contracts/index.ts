import type { Id, DomainEvent } from '@shared/types';

export type { Id };

export interface Clock {
  now(): number;
}

export interface IdGenerator {
  next<T = unknown>(): Id<T>;
}

export interface EventStore {
  append(event: DomainEvent<string, object>): Promise<void>;
  readStream(aggregateId: Id): Promise<DomainEvent<string, object>[]>;
  subscribe(aggregateId: Id, handler: (event: DomainEvent<string, object>) => void): () => void;
}

export interface Repository<TState, TEvent extends DomainEvent<string, object>> {
  load(aggregateId: Id): Promise<TState>;
  save(events: TEvent[]): Promise<void | { ok: boolean; error?: string }>;
}

export interface Logger {
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}

export interface JobQueue<T = unknown> {
  enqueue(job: T): Promise<void>;
  dequeue(): Promise<T | null>;
}
