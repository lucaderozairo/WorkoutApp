// Public contract for the profile feature.

// Domain events this feature publishes.
export type {
  ProfileEvent,
  ProfileUpdatedPayload,
  UnitsChangedPayload,
  InjuryRecordedPayload,
  InjuryResolvedPayload,
  BodyweightLoggedPayload,
} from './domain/types';

// Commands this feature accepts.
export type {
  ProfileCommand,
  UpdateProfile,
  SetUnitPreference,
  RecordInjury,
  ResolveInjury,
  LogBodyweight,
} from './domain/types';

// Domain types consumed by UI, screens and data/projections.
export type { UnitSystem, UserProfile, Injury, BodyweightEntry } from './domain/types';

// Body sub-domain events, commands and types.
export type {
  MeasurementEntry,
  Equipment,
  MeasurementLoggedPayload,
  EquipmentAddedPayload,
  EquipmentMileageUpdatedPayload,
  LogMeasurement,
  AddEquipment,
} from './domain/body';

// Mock view-model types consumed by data/mock and profile UI.
export type {
  MockAchievement,
  MockGoal,
  MockSharedSession,
  MockLoggedHealth,
  MockProfileNutrition,
} from './domain/mock-types';

// ─── Typed event manifest ────────────────────────────────────
import type { BodyweightLoggedPayload } from './domain/types';
import type {
  MeasurementLoggedPayload,
  EquipmentAddedPayload,
  EquipmentMileageUpdatedPayload,
} from './domain/body';

/** All event-bus topics this feature publishes, namespaced to prevent collisions. */
export const ProfileEvents = {
  BodyweightLogged:         'BodyweightLogged',
  MeasurementLogged:        'MeasurementLogged',
  EquipmentAdded:           'EquipmentAdded',
  EquipmentMileageUpdated:  'EquipmentMileageUpdated',
} as const;

export type ProfileEventPayloads = {
  [ProfileEvents.BodyweightLogged]:        BodyweightLoggedPayload;
  [ProfileEvents.MeasurementLogged]:       MeasurementLoggedPayload;
  [ProfileEvents.EquipmentAdded]:          EquipmentAddedPayload;
  [ProfileEvents.EquipmentMileageUpdated]: EquipmentMileageUpdatedPayload;
};
