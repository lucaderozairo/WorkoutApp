import { defineCommand } from '@data/define-command';
import { systemClock } from '@core/clock';
import { generateId } from '@shared/utils';
import type { Id } from '@shared/types';
import type {
  LogMeasurement,
  AddEquipment,
  MeasurementLoggedPayload,
  EquipmentAddedPayload,
} from '../domain/body';

export const handleLogMeasurement = defineCommand<LogMeasurement, Id<'Measurement'>>({
  execute: async (cmd) => {
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
    return {
      result: entryId,
      events: [{
        type: 'MeasurementLogged',
        aggregateId: entryId,
        aggregateType: 'Measurement',
        timestamp: payload.loggedAt,
        version: 1,
        payload,
      }],
    };
  },
});

export const handleAddEquipment = defineCommand<AddEquipment, Id<'Equipment'>>({
  execute: async (cmd) => {
    const equipmentId = generateId<'Equipment'>();
    const payload: EquipmentAddedPayload = {
      equipmentId,
      userId: cmd.userId,
      name: cmd.name,
      equipmentType: cmd.equipmentType,
      retirementDistanceKm: cmd.retirementDistanceKm,
      addedAt: systemClock.now(),
    };
    return {
      result: equipmentId,
      events: [{
        type: 'EquipmentAdded',
        aggregateId: equipmentId,
        aggregateType: 'Equipment',
        timestamp: payload.addedAt,
        version: 1,
        payload,
      }],
    };
  },
});
