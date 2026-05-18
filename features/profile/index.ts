export type {
  UnitSystem,
  UserProfile,
  Injury,
  BodyweightEntry,
  ProfileEvent,
  ProfileUpdatedPayload,
  UnitsChangedPayload,
  InjuryRecordedPayload,
  InjuryResolvedPayload,
  BodyweightLoggedPayload,
  ProfileCommand,
  UpdateProfile,
  SetUnitPreference,
  RecordInjury,
  ResolveInjury,
  LogBodyweight,
} from './domain/types';

export {
  handleUpdateProfile,
  handleSetUnitPreference,
  handleRecordInjury,
  handleResolveInjury,
  handleLogBodyweight,
} from './commands/handlers';

export {
  getProfile,
  getActiveInjuries,
  getPreferences,
  getBodyweightLog,
} from './queries';

export {
  profileProjection,
  activeInjuriesProjection,
  preferencesProjection,
  bodyweightProjection,
} from './projections';

export type {
  MeasurementEntry,
  Equipment,
  MeasurementLoggedPayload,
  EquipmentAddedPayload,
  EquipmentMileageUpdatedPayload,
  LogMeasurement,
  AddEquipment,
} from './domain/body';

export {
  handleLogMeasurement,
  handleAddEquipment,
} from './commands/bodyHandlers';

export {
  bodyweightHistoryProjection,
  measurementsProjection,
  equipmentProjection,
  registerBodyProjections,
} from './projections/body';

export { registerEquipmentMileagePolicy } from './policies/equipment';

export type { MockAchievement, MockGoal, MockSharedSession, MockLoggedHealth, MockProfileNutrition } from './domain/mock-types';
