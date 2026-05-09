import type { Result } from '@shared/types';
import { ok, err } from '@shared/types';

export type Validator<T, E = string> = (value: unknown) => Result<T, E>;

export function stringField(name: string): Validator<string> {
  return (value) => {
    if (typeof value !== 'string' || value.trim().length === 0) {
      return err(`${name} must be a non-empty string`);
    }
    return ok(value);
  };
}

export function numberField(name: string, min?: number, max?: number): Validator<number> {
  return (value) => {
    if (typeof value !== 'number' || isNaN(value)) {
      return err(`${name} must be a number`);
    }
    if (min !== undefined && value < min) {
      return err(`${name} must be >= ${min}`);
    }
    if (max !== undefined && value > max) {
      return err(`${name} must be <= ${max}`);
    }
    return ok(value);
  };
}

export function optionalField<T, E = string>(validator: Validator<T, E>): Validator<T | undefined, E> {
  return (value): Result<T | undefined, E> => {
    if (value === undefined || value === null) {
      return { ok: true, value: undefined };
    }
    return validator(value);
  };
}

export function validate<T>(validators: Record<keyof T, Validator<any, string>>, input: Record<string, unknown>): Result<T, string> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(validators)) {
    const validator = validators[key as keyof T];
    const r = validator(input[key]);
    if (!r.ok) return err(r.error ?? 'Validation failed');
    result[key] = r.value;
  }
  return ok<T>(result as T);
}
