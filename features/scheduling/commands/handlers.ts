import type { Result, Id } from '@shared/types';
import { ok, err } from '@shared/types';
import type { AddAppointment, UpdateAppointment, DeleteAppointment, ReorderAppointments, JoinEvent, LeaveEvent, SchedulingEvent } from '../domain/types';
import { cryptoIdGenerator } from '@core/id-generator';
import { systemClock } from '@core/clock';
import { inMemoryEventStore } from '@data/store';
import { viewStore } from '@data/projections/views';
import { appointmentsByDateProjection, joinedEventsProjection } from '../projections';

function applyAndStore(events: SchedulingEvent[]): void {
  events.forEach(e => {
    appointmentsByDateProjection.apply(e);
    joinedEventsProjection.apply(e);
  });
  viewStore.set('appointments_by_date', appointmentsByDateProjection.getState());
  viewStore.set('joined_events', joinedEventsProjection.getState());
}

export async function handleAddAppointment(cmd: AddAppointment): Promise<Result<void, string>> {
  if (!cmd.title.trim()) return err('Title is required');

  const event: SchedulingEvent = {
    type: 'AppointmentAdded',
    aggregateId: cmd.userId,
    aggregateType: 'User',
    timestamp: systemClock.now(),
    version: 1,
    payload: {
      appointmentId: cryptoIdGenerator.next<'Appointment'>(),
      userId: cmd.userId,
      title: cmd.title.trim(),
      scheduledAt: cmd.scheduledAt,
      durationMinutes: cmd.durationMinutes,
      notes: cmd.notes,
      order: systemClock.now(),
    },
  };

  await inMemoryEventStore.append(event);
  applyAndStore([event]);
  return ok(undefined);
}

export async function handleUpdateAppointment(cmd: UpdateAppointment): Promise<Result<void, string>> {
  const event: SchedulingEvent = {
    type: 'AppointmentUpdated',
    aggregateId: cmd.appointmentId,
    aggregateType: 'Appointment',
    timestamp: systemClock.now(),
    version: 1,
    payload: {
      appointmentId: cmd.appointmentId,
      title: cmd.title,
      scheduledAt: cmd.scheduledAt,
      durationMinutes: cmd.durationMinutes,
      notes: cmd.notes,
    },
  };

  await inMemoryEventStore.append(event);
  applyAndStore([event]);
  return ok(undefined);
}

export async function handleDeleteAppointment(cmd: DeleteAppointment): Promise<Result<void, string>> {
  const event: SchedulingEvent = {
    type: 'AppointmentDeleted',
    aggregateId: cmd.appointmentId,
    aggregateType: 'Appointment',
    timestamp: systemClock.now(),
    version: 1,
    payload: { appointmentId: cmd.appointmentId },
  };

  await inMemoryEventStore.append(event);
  applyAndStore([event]);
  return ok(undefined);
}

export async function handleReorderAppointments(cmd: ReorderAppointments): Promise<Result<void, string>> {
  const event: SchedulingEvent = {
    type: 'AppointmentsReordered',
    aggregateId: 'scheduling' as unknown as Id,
    aggregateType: 'Scheduling',
    timestamp: systemClock.now(),
    version: 1,
    payload: { orderedIds: cmd.orderedIds },
  };

  await inMemoryEventStore.append(event);
  applyAndStore([event]);
  return ok(undefined);
}

export async function handleJoinEvent(cmd: JoinEvent): Promise<Result<void, string>> {
  const event: SchedulingEvent = {
    type: 'EventJoined',
    aggregateId: cmd.eventId,
    aggregateType: 'ScheduledEvent',
    timestamp: systemClock.now(),
    version: 1,
    payload: {
      eventId: cmd.eventId,
      title: cmd.title,
      sport: cmd.sport,
      startAt: cmd.startAt,
      endAt: cmd.endAt,
      organizerId: cmd.organizerId,
    },
  };

  await inMemoryEventStore.append(event);
  applyAndStore([event]);
  return ok(undefined);
}

export async function handleLeaveEvent(cmd: LeaveEvent): Promise<Result<void, string>> {
  const event: SchedulingEvent = {
    type: 'EventLeft',
    aggregateId: cmd.eventId,
    aggregateType: 'ScheduledEvent',
    timestamp: systemClock.now(),
    version: 1,
    payload: { eventId: cmd.eventId },
  };

  await inMemoryEventStore.append(event);
  applyAndStore([event]);
  return ok(undefined);
}
