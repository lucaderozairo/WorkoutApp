import type { Id, DomainEvent } from '@shared/types';

// ─── Domain Types ────────────────────────────────────────────

export type UnitSystem = 'metric' | 'imperial';

export interface UserProfile {
  id: Id<'User'>;
  displayName: string;
  email: string;
  unitPreference: UnitSystem;
  createdAt: number;
}

export interface Injury {
  id: Id<'Injury'>;
  userId: Id<'User'>;
  description: string;
  bodyPart: string;
  recordedAt: number;
  resolvedAt: number | null;
}

export interface BodyweightEntry {
  id: Id<'BodyweightEntry'>;
  userId: Id<'User'>;
  weightKg: number;
  loggedAt: number;
}

// ─── Events ──────────────────────────────────────────────────

export type ProfileEvent =
  | DomainEvent<'ProfileUpdated', ProfileUpdatedPayload>
  | DomainEvent<'UnitsChanged', UnitsChangedPayload>
  | DomainEvent<'InjuryRecorded', InjuryRecordedPayload>
  | DomainEvent<'InjuryResolved', InjuryResolvedPayload>
  | DomainEvent<'BodyweightLogged', BodyweightLoggedPayload>;

export interface ProfileUpdatedPayload {
  displayName: string;
  email: string;
}

export interface UnitsChangedPayload {
  units: UnitSystem;
}

export interface InjuryRecordedPayload {
  injuryId: Id<'Injury'>;
  description: string;
  bodyPart: string;
}

export interface InjuryResolvedPayload {
  injuryId: Id<'Injury'>;
}

export interface BodyweightLoggedPayload {
  entryId: Id<'BodyweightEntry'>;
  userId: Id<'User'>;
  weightKg: number;
}

// ─── Commands ────────────────────────────────────────────────

export interface UpdateProfile {
  type: 'UpdateProfile';
  userId: Id<'User'>;
  displayName: string;
  email: string;
}

export interface SetUnitPreference {
  type: 'SetUnitPreference';
  userId: Id<'User'>;
  units: UnitSystem;
}

export interface RecordInjury {
  type: 'RecordInjury';
  userId: Id<'User'>;
  description: string;
  bodyPart: string;
}

export interface ResolveInjury {
  type: 'ResolveInjury';
  userId: Id<'User'>;
  injuryId: Id<'Injury'>;
}

export interface LogBodyweight {
  type: 'LogBodyweight';
  userId: Id<'User'>;
  weightKg: number;
  loggedAt: number;
}

export type ProfileCommand = UpdateProfile | SetUnitPreference | RecordInjury | ResolveInjury | LogBodyweight;

// ─── State ───────────────────────────────────────────────────

export interface ProfileState {
  profile: UserProfile | null;
  injuries: Injury[];
  bodyweightEntries: BodyweightEntry[];
}
