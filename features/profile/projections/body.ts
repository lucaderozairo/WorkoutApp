import { eventBus } from '@core/events/bus';
import { ProjectionBuilder, projectionRegistry } from '@data/projections/builders';
import { viewStore } from '@data/projections/views';
import type { DomainEvent } from '@shared/types';
import type { BodyweightLoggedPayload } from '../domain/types';
import type {
  BodyTrackingEvent,
  MeasurementEntry,
  Equipment,
  MeasurementLoggedPayload,
  EquipmentAddedPayload,
  EquipmentMileageUpdatedPayload,
} from '../domain/body';

export const bodyweightHistoryProjection = new ProjectionBuilder<
  Array<{ id: string; weightKg: number; date: string; loggedAt: number }>,
  DomainEvent<'BodyweightLogged', BodyweightLoggedPayload>
>('bodyweight_history', [], {
  BodyweightLogged: (state, event) => {
    const date = new Date(event.timestamp).toISOString().slice(0, 10);
    return [...state, { id: event.payload.entryId, weightKg: event.payload.weightKg, date, loggedAt: event.timestamp }]
      .sort((a, b) => a.date.localeCompare(b.date));
  },
});

export const measurementsProjection = new ProjectionBuilder<MeasurementEntry[], BodyTrackingEvent>('measurement_history', [], {
  MeasurementLogged: (state, event) => {
    const payload = event.payload as MeasurementLoggedPayload;
    return [
      ...state,
      {
        id: payload.entryId,
        userId: payload.userId,
        waistCm: payload.waistCm,
        chestCm: payload.chestCm,
        armsCm: payload.armsCm,
        legsCm: payload.legsCm,
        date: payload.date,
        loggedAt: payload.loggedAt,
      },
    ].sort((a, b) => a.date.localeCompare(b.date));
  },
});

export const equipmentProjection = new ProjectionBuilder<Equipment[], BodyTrackingEvent>('equipment_list', [], {
  EquipmentAdded: (state, event) => {
    const payload = event.payload as EquipmentAddedPayload;
    return [
      ...state,
      {
        id: payload.equipmentId,
        userId: payload.userId,
        name: payload.name,
        type: payload.equipmentType,
        distanceKm: 0,
        retirementDistanceKm: payload.retirementDistanceKm,
        addedAt: payload.addedAt,
      },
    ];
  },
  EquipmentMileageUpdated: (state, event) => {
    const payload = event.payload as EquipmentMileageUpdatedPayload;
    return state.map((item) =>
      item.id === payload.equipmentId
        ? { ...item, distanceKm: item.distanceKm + payload.deltaKm }
        : item,
    );
  },
});

let registered = false;

export function registerBodyProjections(): void {
  if (registered) return;
  registered = true;

  projectionRegistry.register('bodyweight_history', bodyweightHistoryProjection);
  projectionRegistry.register('measurement_history', measurementsProjection);
  projectionRegistry.register('equipment_list', equipmentProjection);
  viewStore.set('bodyweight_history', bodyweightHistoryProjection.getState());
  viewStore.set('measurement_history', measurementsProjection.getState());
  viewStore.set('equipment_list', equipmentProjection.getState());

  eventBus.subscribe<DomainEvent<'BodyweightLogged', BodyweightLoggedPayload>>('BodyweightLogged', (event) => {
    bodyweightHistoryProjection.apply(event);
    viewStore.set('bodyweight_history', bodyweightHistoryProjection.getState());
  });
  eventBus.subscribe('MeasurementLogged', (event) => {
    measurementsProjection.apply(event as BodyTrackingEvent);
    viewStore.set('measurement_history', measurementsProjection.getState());
  });
  eventBus.subscribe('EquipmentAdded', (event) => {
    equipmentProjection.apply(event as BodyTrackingEvent);
    viewStore.set('equipment_list', equipmentProjection.getState());
  });
  eventBus.subscribe('EquipmentMileageUpdated', (event) => {
    equipmentProjection.apply(event as BodyTrackingEvent);
    viewStore.set('equipment_list', equipmentProjection.getState());
  });
}
