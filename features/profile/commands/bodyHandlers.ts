import { eventBus } from '@core/events/bus';
import { systemClock } from '@core/clock';
import { generateId } from '@shared/utils';
import type { Id } from '@shared/types';
import type {
  LogMeasurement,
  AddEquipment,
  MeasurementLoggedPayload,
  EquipmentAddedPayload,
} from '../domain/body';

export async function handleLogMeasurement(cmd: LogMeasurement): Promise<Id<'Measurement'>> {
  const entryId = generateId<'Measurement'>();
  const payload: MeasurementLoggedPayload = {
    entryId,
    userId: cmd.userId,
    waistCm: cmd.waistCm,
    chestCm: cmd.chestCm,
    armsCm: cmd.armsCm,
    legsCm: cmd.legsCm,
    date: cmd.date,
    loggedAt: systemClock.now(),
  };
  await eventBus.publish({
    type: 'MeasurementLogged',
    aggregateId: entryId,
    aggregateType: 'Measurement',
    timestamp: payload.loggedAt,
    version: 1,
    payload,
  });
  return entryId;
}

export async function handleAddEquipment(cmd: AddEquipment): Promise<Id<'Equipment'>> {
  const equipmentId = generateId<'Equipment'>();
  const payload: EquipmentAddedPayload = {
    equipmentId,
    userId: cmd.userId,
    name: cmd.name,
    equipmentType: cmd.equipmentType,
    retirementDistanceKm: cmd.retirementDistanceKm,
    addedAt: systemClock.now(),
  };
  await eventBus.publish({
    type: 'EquipmentAdded',
    aggregateId: equipmentId,
    aggregateType: 'Equipment',
    timestamp: payload.addedAt,
    version: 1,
    payload,
  });
  return equipmentId;
}
