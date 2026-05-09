import type { Id, DomainEvent } from '@shared/types';

export interface Appointment {
  id: Id<'Appointment'>;
  userId: Id<'User'>;
  title: string;
  scheduledAt: number;
  durationMinutes: number;
  notes: string;
  order: number;
}

export interface ScheduledEvent {
  id: Id<'ScheduledEvent'>;
  title: string;
  sport: string;
  startAt: number;
  endAt: number;
  organizerId: Id<'User'>;
  joinedAt: number | null;
}

export interface SchedulingState {
  appointments: Appointment[];
  joinedEvents: ScheduledEvent[];
}

export type SchedulingEvent =
  | DomainEvent<'AppointmentAdded', AppointmentAddedPayload>
  | DomainEvent<'AppointmentUpdated', AppointmentUpdatedPayload>
  | DomainEvent<'AppointmentDeleted', AppointmentDeletedPayload>
  | DomainEvent<'AppointmentsReordered', AppointmentsReorderedPayload>
  | DomainEvent<'EventJoined', EventJoinedPayload>
  | DomainEvent<'EventLeft', EventLeftPayload>;

export interface AppointmentAddedPayload {
  appointmentId: Id<'Appointment'>;
  userId: Id<'User'>;
  title: string;
  scheduledAt: number;
  durationMinutes: number;
  notes: string;
  order: number;
}

export interface AppointmentUpdatedPayload {
  appointmentId: Id<'Appointment'>;
  title?: string;
  scheduledAt?: number;
  durationMinutes?: number;
  notes?: string;
}

export interface AppointmentDeletedPayload {
  appointmentId: Id<'Appointment'>;
}

export interface AppointmentsReorderedPayload {
  orderedIds: Id<'Appointment'>[];
}

export interface EventJoinedPayload {
  eventId: Id<'ScheduledEvent'>;
  title: string;
  sport: string;
  startAt: number;
  endAt: number;
  organizerId: Id<'User'>;
}

export interface EventLeftPayload {
  eventId: Id<'ScheduledEvent'>;
}

export interface AddAppointment {
  type: 'AddAppointment';
  userId: Id<'User'>;
  title: string;
  scheduledAt: number;
  durationMinutes: number;
  notes: string;
}

export interface UpdateAppointment {
  type: 'UpdateAppointment';
  appointmentId: Id<'Appointment'>;
  title?: string;
  scheduledAt?: number;
  durationMinutes?: number;
  notes?: string;
}

export interface DeleteAppointment {
  type: 'DeleteAppointment';
  appointmentId: Id<'Appointment'>;
}

export interface ReorderAppointments {
  type: 'ReorderAppointments';
  orderedIds: Id<'Appointment'>[];
}

export interface JoinEvent {
  type: 'JoinEvent';
  eventId: Id<'ScheduledEvent'>;
  title: string;
  sport: string;
  startAt: number;
  endAt: number;
  organizerId: Id<'User'>;
}

export interface LeaveEvent {
  type: 'LeaveEvent';
  eventId: Id<'ScheduledEvent'>;
}

export type SchedulingCommand =
  | AddAppointment
  | UpdateAppointment
  | DeleteAppointment
  | ReorderAppointments
  | JoinEvent
  | LeaveEvent;
