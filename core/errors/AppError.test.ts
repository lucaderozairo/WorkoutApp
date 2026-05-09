import { describe, it, expect } from 'vitest';
import {
  DomainError, InfraError,
  InvalidSetWeightError, SessionAlreadyDeletedError, EventConflictError, BlueprintNotFoundError,
  NetworkOfflineError, StorageFullError, SyncConflictError, RemoteUnavailableError, MigrationRequiredError
} from './AppError';

describe('DomainError', () => {
  it('carries a stable code and message', () => {
    const err = new InvalidSetWeightError('weight must be positive');
    expect(err.code).toBe('INVALID_SET_WEIGHT');
    expect(err.message).toBe('weight must be positive');
    expect(err instanceof DomainError).toBe(true);
  });
});

describe('InfraError', () => {
  it('carries a stable code', () => {
    const err = new NetworkOfflineError('no connection');
    expect(err.code).toBe('NETWORK_OFFLINE');
    expect(err instanceof InfraError).toBe(true);
  });
});

describe('EventConflictError', () => {
  it('includes conflicting event ids', () => {
    const err = new EventConflictError('conflict', { a: '1', b: '2' });
    expect(err.code).toBe('EVENT_CONFLICT');
    expect(err.context).toEqual({ a: '1', b: '2' });
  });
});
