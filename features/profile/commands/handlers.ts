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
import { defineCommand } from '@data/define-command';
import { projectionRegistry } from '@data/projections/builders';
import { profileProjection, activeInjuriesProjection, preferencesProjection, bodyweightProjection } from '../projections';
import { viewStore } from '@data/projections/views';

// Register projections
projectionRegistry.register('profile', profileProjection);
projectionRegistry.register('active_injuries', activeInjuriesProjection);
projectionRegistry.register('preferences', preferencesProjection);
projectionRegistry.register('bodyweight_log', bodyweightProjection);

// ─── Command Handlers ────────────────────────────────────────

export const handleUpdateProfile = defineCommand<UpdateProfile, Result<void, string>>({
  execute: async (cmd) => {
    if (!cmd.displayName.trim()) return { events: [], result: err('Display name is required') };
    if (!cmd.email.includes('@')) return { events: [], result: err('Invalid email') };

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

    return { events, result: ok(undefined) };
  },
});

export const handleSetUnitPreference = defineCommand<SetUnitPreference, Result<void, string>>({
  execute: async (cmd) => {
    const events: ProfileEvent[] = [{
      type: 'UnitsChanged',
      aggregateId: cmd.userId,
      aggregateType: 'User',
      timestamp: systemClock.now(),
      version: 1,
      payload: { units: cmd.units },
    }];

    return { events, result: ok(undefined) };
  },
});

export const handleRecordInjury = defineCommand<RecordInjury, Result<void, string>>({
  execute: async (cmd) => {
    if (!cmd.description.trim()) return { events: [], result: err('Description is required') };
    if (!cmd.bodyPart.trim()) return { events: [], result: err('Body part is required') };

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

    return { events, result: ok(undefined) };
  },
});

export const handleResolveInjury = defineCommand<ResolveInjury, Result<void, string>>({
  execute: async (cmd) => {
    const events: ProfileEvent[] = [{
      type: 'InjuryResolved',
      aggregateId: cmd.userId,
      aggregateType: 'User',
      timestamp: systemClock.now(),
      version: 1,
      payload: { injuryId: cmd.injuryId },
    }];

    return { events, result: ok(undefined) };
  },
});

export const handleLogBodyweight = defineCommand<LogBodyweight, Result<void, string>>({
  execute: async (cmd) => {
    if (cmd.weightKg <= 0) return { events: [], result: err('Weight must be positive') };

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

    events.forEach(e => bodyweightProjection.apply(e));
    viewStore.set('bodyweight_log', bodyweightProjection.getState());
    return { events, result: ok(undefined) };
  },
});
