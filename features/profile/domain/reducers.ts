import type { Reducer } from '@core/computation';
import type { ProfileState } from './types';
import type { ProfileEvent, UserProfile, Injury, BodyweightEntry } from './types';
import { systemClock } from '@core/clock';

// ─── Profile State ───────────────────────────────────────────

export const initialProfileState: ProfileState = {
  profile: null,
  injuries: [],
  bodyweightEntries: [],
};

// ─── Reducers ────────────────────────────────────────────────

export const profileReducers: Record<string, Reducer<ProfileState, ProfileEvent>> = {
  ProfileUpdated: (state, event) => {
    if (event.type !== 'ProfileUpdated') return state;
    const existing = state.profile;
    const profile: UserProfile = {
      id: event.aggregateId,
      displayName: event.payload.displayName,
      email: event.payload.email,
      unitPreference: existing?.unitPreference ?? 'metric',
      createdAt: existing?.createdAt ?? event.timestamp,
    };
    return { ...state, profile };
  },

  UnitsChanged: (state, event) => {
    if (event.type !== 'UnitsChanged') return state;
    if (!state.profile) return state;
    return {
      ...state,
      profile: { ...state.profile, unitPreference: event.payload.units },
    };
  },

  InjuryRecorded: (state, event) => {
    if (event.type !== 'InjuryRecorded') return state;
    const injury: Injury = {
      id: event.payload.injuryId,
      userId: event.aggregateId,
      description: event.payload.description,
      bodyPart: event.payload.bodyPart,
      recordedAt: event.timestamp,
      resolvedAt: null,
    };
    return { ...state, injuries: [...state.injuries, injury] };
  },

  InjuryResolved: (state, event) => {
    if (event.type !== 'InjuryResolved') return state;
    return {
      ...state,
      injuries: state.injuries.map(inj =>
        inj.id === event.payload.injuryId
          ? { ...inj, resolvedAt: event.timestamp }
          : inj
      ),
    };
  },

  BodyweightLogged: (state, event) => {
    if (event.type !== 'BodyweightLogged') return state;
    const entry: BodyweightEntry = {
      id: event.payload.entryId,
      userId: event.payload.userId,
      weightKg: event.payload.weightKg,
      loggedAt: event.timestamp,
    };
    return { ...state, bodyweightEntries: [...state.bodyweightEntries, entry] };
  },
};
