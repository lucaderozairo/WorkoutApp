export type DomainErrorCode =
  | 'INVALID_SET_WEIGHT'
  | 'SESSION_ALREADY_DELETED'
  | 'EVENT_CONFLICT'
  | 'BLUEPRINT_NOT_FOUND';

export type InfraErrorCode =
  | 'NETWORK_OFFLINE'
  | 'STORAGE_FULL'
  | 'SYNC_CONFLICT_UNRESOLVABLE'
  | 'REMOTE_UNAVAILABLE'
  | 'MIGRATION_REQUIRED';

export abstract class DomainError extends Error {
  abstract readonly code: DomainErrorCode;
  readonly context?: Record<string, unknown>;
  constructor(message: string, context?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.context = context;
  }
}

export abstract class InfraError extends Error {
  abstract readonly code: InfraErrorCode;
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

// Domain errors
export class InvalidSetWeightError extends DomainError {
  readonly code = 'INVALID_SET_WEIGHT' as const;
}

export class SessionAlreadyDeletedError extends DomainError {
  readonly code = 'SESSION_ALREADY_DELETED' as const;
}

export class EventConflictError extends DomainError {
  readonly code = 'EVENT_CONFLICT' as const;
}

export class BlueprintNotFoundError extends DomainError {
  readonly code = 'BLUEPRINT_NOT_FOUND' as const;
}

// Infra errors
export class NetworkOfflineError extends InfraError {
  readonly code = 'NETWORK_OFFLINE' as const;
}

export class StorageFullError extends InfraError {
  readonly code = 'STORAGE_FULL' as const;
}

export class SyncConflictError extends InfraError {
  readonly code = 'SYNC_CONFLICT_UNRESOLVABLE' as const;
}

export class RemoteUnavailableError extends InfraError {
  readonly code = 'REMOTE_UNAVAILABLE' as const;
}

export class MigrationRequiredError extends InfraError {
  readonly code = 'MIGRATION_REQUIRED' as const;
}
