import type { Result, Id } from '@shared/types';
import { ok, err } from '@shared/types';
import type { AddAppointment, UpdateAppointment, DeleteAppointment, ReorderAppointments, JoinEvent, LeaveEvent, SchedulingEvent } from '../domain/types';
import { cryptoIdGenerator } from '@core/id-generator';
import { systemClock } from '@core/clock';
import { defineCommand } from '@data/define-command';
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

export const handleAddAppointment = defineCommand<AddAppointment, Result<void, string>>({
  execute: async (cmd) => {
    if (!cmd.title.trim()) return { events: [], result: err('Title is required') };

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

    applyAndStore([event]);
    return { events: [event], result: ok(undefined) };
  },
});

export const handleUpdateAppointment = defineCommand<UpdateAppointment, Result<void, string>>({
  execute: async (cmd) => {
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

    applyAndStore([event]);
    return { events: [event], result: ok(undefined) };
  },
});

export const handleDeleteAppointment = defineCommand<DeleteAppointment, Result<void, string>>({
  execute: async (cmd) => {
    const event: SchedulingEvent = {
      type: 'AppointmentDeleted',
      aggregateId: cmd.appointmentId,
      aggregateType: 'Appointment',
      timestamp: systemClock.now(),
      version: 1,
      payload: { appointmentId: cmd.appointmentId },
    };

    applyAndStore([event]);
    return { events: [event], result: ok(undefined) };
  },
});

export const handleReorderAppointments = defineCommand<ReorderAppointments, Result<void, string>>({
  execute: async (cmd) => {
    const event: SchedulingEvent = {
      type: 'AppointmentsReordered',
      aggregateId: 'scheduling' as unknown as Id,
      aggregateType: 'Scheduling',
      timestamp: systemClock.now(),
      version: 1,
      payload: { orderedIds: cmd.orderedIds },
    };

    applyAndStore([event]);
    return { events: [event], result: ok(undefined) };
  },
});

export const handleJoinEvent = defineCommand<JoinEvent, Result<void, string>>({
  execute: async (cmd) => {
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

    applyAndStore([event]);
    return { events: [event], result: ok(undefined) };
  },
});

export const handleLeaveEvent = defineCommand<LeaveEvent, Result<void, string>>({
  execute: async (cmd) => {
    const event: SchedulingEvent = {
      type: 'EventLeft',
      aggregateId: cmd.eventId,
      aggregateType: 'ScheduledEvent',
      timestamp: systemClock.now(),
      version: 1,
      payload: { eventId: cmd.eventId },
    };

    applyAndStore([event]);
    return { events: [event], result: ok(undefined) };
  },
});
