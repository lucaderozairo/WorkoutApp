// Core shared types for the domain event system

export type Id<T = unknown> = string & { readonly __brand: unique symbol };

export type DomainEvent<TType extends string = string, TPayload = unknown> = {
  type: TType;
  aggregateId: Id;
  aggregateType: string;
  timestamp: number;
  /** Aggregate stream version for optimistic concurrency. */
  version: number;
  /** Payload schema version. Absent on legacy events (treat as 1). Used by upcasters during replay. */
  schemaVersion?: number;
  payload: TPayload;
};

export type ExerciseCategory = 'strength' | 'cardio' | 'mobility';

export type SportType =
  // Outdoor endurance
  | 'run' | 'cycle' | 'swim' | 'row' | 'hike' | 'ski' | 'snowboard'
  | 'kayak' | 'surf' | 'climb'
  // Gym cardio machines — continuous effort (use StrengthSegment + sets for intervals)
  | 'ski_erg' | 'assault_bike' | 'air_bike' | 'concept2_rower'
  | 'treadmill' | 'stair_climber' | 'elliptical'
  // Gym / structured
  | 'strength' | 'hiit' | 'yoga' | 'stretch' | 'mobility' | 'boxing'
  // Named multi-sport events
  | 'triathlon' | 'duathlon' | 'hyrox' | 'obstacle_course'
  // Generic multi-sport — combining two or more sports without a named event format
  | 'multi'
  // Internal / structural
  | 'transition'
  // Catch-all — pair with Activity.customSport for the label
  | 'other';


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
