import type { Result } from '@shared/types';
import { ok, err } from '@shared/types';
import type {
  UpdateProfile,
  SetUnitPreference,
  RecordInjury,
  ResolveInjury,
  LogBodyweight,
  ProfileEvent,
} from '../domain/types';
import { cryptoIdGenerator } from '@core/id-generator';
import { systemClock } from '@core/clock';
import { eventRepository } from '@data/event-repository';
import { projectionRegistry } from '@data/projections/builders';
import { profileProjection, activeInjuriesProjection, preferencesProjection, bodyweightProjection } from '../projections';
import { viewStore } from '@data/projections/views';

// Register projections
projectionRegistry.register('profile', profileProjection);
projectionRegistry.register('active_injuries', activeInjuriesProjection);
projectionRegistry.register('preferences', preferencesProjection);
projectionRegistry.register('bodyweight_log', bodyweightProjection);

// ─── Command Handlers ────────────────────────────────────────

export async function handleUpdateProfile(cmd: UpdateProfile): Promise<Result<void, string>> {
  if (!cmd.displayName.trim()) return err('Display name is required');
  if (!cmd.email.includes('@')) return err('Invalid email');

  const events: ProfileEvent[] = [{
    type: 'ProfileUpdated',
    aggregateId: cmd.userId,
    aggregateType: 'User',
    timestamp: systemClock.now(),
    version: 1,
    payload: {
      displayName: cmd.displayName.trim(),
      email: cmd.email.trim(),
    },
  }];

  await eventRepository.commit(events);
  return ok(undefined);
}

export async function handleSetUnitPreference(cmd: SetUnitPreference): Promise<Result<void, string>> {
  const events: ProfileEvent[] = [{
    type: 'UnitsChanged',
    aggregateId: cmd.userId,
    aggregateType: 'User',
    timestamp: systemClock.now(),
    version: 1,
    payload: { units: cmd.units },
  }];

  await eventRepository.commit(events);
  return ok(undefined);
}

export async function handleRecordInjury(cmd: RecordInjury): Promise<Result<void, string>> {
  if (!cmd.description.trim()) return err('Description is required');
  if (!cmd.bodyPart.trim()) return err('Body part is required');

  const injuryId = cryptoIdGenerator.next<'Injury'>();

  const events: ProfileEvent[] = [{
    type: 'InjuryRecorded',
    aggregateId: cmd.userId,
    aggregateType: 'User',
    timestamp: systemClock.now(),
    version: 1,
    payload: {
      injuryId,
      description: cmd.description.trim(),
      bodyPart: cmd.bodyPart.trim(),
    },
  }];

  await eventRepository.commit(events);
  return ok(undefined);
}

export async function handleResolveInjury(cmd: ResolveInjury): Promise<Result<void, string>> {
  const events: ProfileEvent[] = [{
    type: 'InjuryResolved',
    aggregateId: cmd.userId,
    aggregateType: 'User',
    timestamp: systemClock.now(),
    version: 1,
    payload: { injuryId: cmd.injuryId },
  }];

  await eventRepository.commit(events);
  return ok(undefined);
}

export async function handleLogBodyweight(cmd: LogBodyweight): Promise<Result<void, string>> {
  if (cmd.weightKg <= 0) return err('Weight must be positive');

  const entryId = cryptoIdGenerator.next<'BodyweightEntry'>();

  const events: ProfileEvent[] = [{
    type: 'BodyweightLogged',
    aggregateId: cmd.userId,
    aggregateType: 'User',
    timestamp: cmd.loggedAt,
    version: 1,
    payload: {
      entryId,
      userId: cmd.userId,
      weightKg: cmd.weightKg,
    },
  }];

  await eventRepository.commit(events);
  events.forEach(e => bodyweightProjection.apply(e));
  viewStore.set('bodyweight_log', bodyweightProjection.getState());
  return ok(undefined);
}
