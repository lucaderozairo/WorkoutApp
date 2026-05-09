import type { SchedulingState, SchedulingEvent, Appointment, ScheduledEvent } from './types';

export const initialSchedulingState: SchedulingState = {
  appointments: [],
  joinedEvents: [],
};

export const schedulingReducers: Record<string, (state: SchedulingState, event: SchedulingEvent) => SchedulingState> = {
  AppointmentAdded: (state, event) => {
    if (event.type !== 'AppointmentAdded') return state;
    const a: Appointment = {
      id: event.payload.appointmentId,
      userId: event.payload.userId,
      title: event.payload.title,
      scheduledAt: event.payload.scheduledAt,
      durationMinutes: event.payload.durationMinutes,
      notes: event.payload.notes,
      order: event.payload.order,
    };
    return { ...state, appointments: [...state.appointments, a] };
  },
  AppointmentUpdated: (state, event) => {
    if (event.type !== 'AppointmentUpdated') return state;
    return {
      ...state,
      appointments: state.appointments.map(a =>
        a.id === event.payload.appointmentId ? { ...a, ...event.payload } : a
      ),
    };
  },
  AppointmentDeleted: (state, event) => {
    if (event.type !== 'AppointmentDeleted') return state;
    return { ...state, appointments: state.appointments.filter(a => a.id !== event.payload.appointmentId) };
  },
  AppointmentsReordered: (state, event) => {
    if (event.type !== 'AppointmentsReordered') return state;
    const order = event.payload.orderedIds;
    return {
      ...state,
      appointments: [...state.appointments]
        .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))
        .map((a, i) => ({ ...a, order: i })),
    };
  },
  EventJoined: (state, event) => {
    if (event.type !== 'EventJoined') return state;
    const e: ScheduledEvent = {
      id: event.payload.eventId,
      title: event.payload.title,
      sport: event.payload.sport,
      startAt: event.payload.startAt,
      endAt: event.payload.endAt,
      organizerId: event.payload.organizerId,
      joinedAt: event.timestamp,
    };
    return { ...state, joinedEvents: [...state.joinedEvents, e] };
  },
  EventLeft: (state, event) => {
    if (event.type !== 'EventLeft') return state;
    return { ...state, joinedEvents: state.joinedEvents.filter(e => e.id !== event.payload.eventId) };
  },
};
