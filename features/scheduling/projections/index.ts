import type { SchedulingEvent, Appointment, ScheduledEvent } from '../domain/types';
import { schedulingReducers, initialSchedulingState } from '../domain/reducers';
import { ProjectionBuilder } from '@data/projections/builders';
import { projectionRegistry } from '@data/projections/builders';

export const appointmentsByDateProjection = new ProjectionBuilder<Appointment[], SchedulingEvent>(
  'appointments_by_date',
  [],
  {
    AppointmentAdded: (state, event) => {
      const next = schedulingReducers.AppointmentAdded({ ...initialSchedulingState, appointments: state }, event);
      return [...next.appointments].sort((a, b) => a.scheduledAt - b.scheduledAt);
    },
    AppointmentUpdated: (state, event) => {
      const next = schedulingReducers.AppointmentUpdated({ ...initialSchedulingState, appointments: state }, event);
      return [...next.appointments].sort((a, b) => a.scheduledAt - b.scheduledAt);
    },
    AppointmentDeleted: (state, event) => {
      const next = schedulingReducers.AppointmentDeleted({ ...initialSchedulingState, appointments: state }, event);
      return next.appointments;
    },
    AppointmentsReordered: (state, event) => {
      const next = schedulingReducers.AppointmentsReordered({ ...initialSchedulingState, appointments: state }, event);
      return next.appointments;
    },
    EventJoined: (state) => state,
    EventLeft: (state) => state,
  }
);

export const joinedEventsProjection = new ProjectionBuilder<ScheduledEvent[], SchedulingEvent>(
  'joined_events',
  [],
  {
    AppointmentAdded: (state) => state,
    AppointmentUpdated: (state) => state,
    AppointmentDeleted: (state) => state,
    AppointmentsReordered: (state) => state,
    EventJoined: (state, event) => {
      const next = schedulingReducers.EventJoined({ ...initialSchedulingState, joinedEvents: state }, event);
      return next.joinedEvents;
    },
    EventLeft: (state, event) => {
      const next = schedulingReducers.EventLeft({ ...initialSchedulingState, joinedEvents: state }, event);
      return next.joinedEvents;
    },
  }
);

projectionRegistry.register('appointments_by_date', appointmentsByDateProjection);
projectionRegistry.register('joined_events', joinedEventsProjection);
