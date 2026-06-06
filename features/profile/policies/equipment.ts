import { eventBus } from '@core/events/bus';
import { eventRepository } from '@data/event-repository';
import { viewStore } from '@data/projections/views';
import { CardioEvents } from '@features/cardio/contract';
import type { Equipment, EquipmentMileageUpdatedPayload } from '../domain/body';

let registered = false;

export function registerEquipmentMileagePolicy(): void {
  if (registered) return;
  registered = true;

  eventBus.subscribe(CardioEvents.CardioSessionRecorded, async (event) => {
    const deltaKm = (event.payload.distanceMeters ?? 0) / 1000;
    if (deltaKm <= 0) return;

    const equipment = viewStore.get<Equipment[]>('equipment_list') ?? [];
    for (const item of equipment) {
      const payload: EquipmentMileageUpdatedPayload = {
        equipmentId: item.id,
        deltaKm,
      };
      await eventRepository.commit([{
        type: 'EquipmentMileageUpdated',
        aggregateId: item.id,
        aggregateType: 'Equipment',
        timestamp: Date.now(),
        version: 1,
        payload,
      }]);
    }
  });
}
