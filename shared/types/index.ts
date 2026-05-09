// Core shared types for the domain event system

export type Id<T = unknown> = string & { readonly __brand: unique symbol };

export type DomainEvent<TType extends string = string, TPayload = unknown> = {
  type: TType;
  aggregateId: Id;
  aggregateType: string;
  timestamp: number;
  version: number;
  payload: TPayload;
};

export type ExerciseCategory = 'strength' | 'cardio' | 'mobility';

export interface Result<T, E = string> {
  ok: boolean;
  value?: T;
  error?: E;
}

export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}
