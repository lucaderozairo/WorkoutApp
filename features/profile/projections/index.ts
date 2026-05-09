import type { Id } from '@shared/types';
import type { ProfileEvent } from '../domain/types';
import { ProjectionBuilder } from '@data/projections/builders';

// ─── Projections ─────────────────────────────────────────────

/** `profile` — current user profile snapshot */
export const profileProjection = new ProjectionBuilder<
  { displayName: string; email: string; unitPreference: 'metric' | 'imperial' },
  ProfileEvent
>(
  'profile',
  { displayName: '', email: '', unitPreference: 'metric' as const },
  {
    ProfileUpdated: (state, event) => {
      if (event.type !== 'ProfileUpdated') return state;
      return {
        displayName: event.payload.displayName,
        email: event.payload.email,
        unitPreference: state.unitPreference,
      };
    },
    UnitsChanged: (state, event) => {
      if (event.type !== 'UnitsChanged') return state;
      return { ...state, unitPreference: event.payload.units };
    },
  }
);

/** `active_injuries` — list of unresolved injuries */
export const activeInjuriesProjection = new ProjectionBuilder<
  Array<{ id: Id<'Injury'>; description: string; bodyPart: string; recordedAt: number }>,
  ProfileEvent
>(
  'active_injuries',
  [],
  {
    InjuryRecorded: (state, event) => {
      if (event.type !== 'InjuryRecorded') return state;
      return [...state, {
        id: event.payload.injuryId,
        description: event.payload.description,
        bodyPart: event.payload.bodyPart,
        recordedAt: event.timestamp,
      }];
    },
    InjuryResolved: (state, event) => {
      if (event.type !== 'InjuryResolved') return state;
      return state.filter(i => i.id !== event.payload.injuryId);
    },
  }
);

/** `preferences` — user preferences snapshot */
export const preferencesProjection = new ProjectionBuilder<
  { unitPreference: 'metric' | 'imperial' },
  ProfileEvent
>(
  'preferences',
  { unitPreference: 'metric' as const },
  {
    UnitsChanged: (state, event) => {
      if (event.type !== 'UnitsChanged') return state;
      return { unitPreference: event.payload.units };
    },
    ProfileUpdated: (state) => state,
  }
);

/** `bodyweight_log` — all bodyweight entries, newest first */
export const bodyweightProjection = new ProjectionBuilder<
  Array<{ id: Id<'BodyweightEntry'>; weightKg: number; loggedAt: number }>,
  ProfileEvent
>(
  'bodyweight_log',
  [],
  {
    BodyweightLogged: (state, event) => {
      if (event.type !== 'BodyweightLogged') return state;
      const entry = {
        id: event.payload.entryId,
        weightKg: event.payload.weightKg,
        loggedAt: event.timestamp,
      };
      return [entry, ...state];
    },
  }
);
