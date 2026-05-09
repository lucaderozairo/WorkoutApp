import type { Id, DomainEvent } from '@shared/types';

export interface MeasurementEntry {
  id: Id<'Measurement'>;
  userId: Id<'User'>;
  waistCm?: number;
  chestCm?: number;
  armsCm?: number;
  legsCm?: number;
  date: string;
  loggedAt: number;
}

export interface Equipment {
  id: Id<'Equipment'>;
  userId: Id<'User'>;
  name: string;
  type: 'shoes' | 'bike' | 'other';
  distanceKm: number;
  retirementDistanceKm: number;
  addedAt: number;
}

export interface MeasurementLoggedPayload {
  entryId: Id<'Measurement'>;
  userId: Id<'User'>;
  waistCm?: number;
  chestCm?: number;
  armsCm?: number;
  legsCm?: number;
  date: string;
  loggedAt: number;
}

export interface EquipmentAddedPayload {
  equipmentId: Id<'Equipment'>;
  userId: Id<'User'>;
  name: string;
  equipmentType: Equipment['type'];
  retirementDistanceKm: number;
  addedAt: number;
}

export interface EquipmentMileageUpdatedPayload {
  equipmentId: Id<'Equipment'>;
  deltaKm: number;
}

export interface LogMeasurement {
  type: 'LogMeasurement';
  userId: Id<'User'>;
  waistCm?: number;
  chestCm?: number;
  armsCm?: number;
  legsCm?: number;
  date: string;
}

export interface AddEquipment {
  type: 'AddEquipment';
  userId: Id<'User'>;
  name: string;
  equipmentType: Equipment['type'];
  retirementDistanceKm: number;
}

export type BodyTrackingEvent =
  | DomainEvent<'MeasurementLogged', MeasurementLoggedPayload>
  | DomainEvent<'EquipmentAdded', EquipmentAddedPayload>
  | DomainEvent<'EquipmentMileageUpdated', EquipmentMileageUpdatedPayload>;
