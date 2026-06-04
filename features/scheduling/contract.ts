// Public contract for the scheduling feature.

// Domain events this feature publishes.
export type { SchedulingEvent } from './domain/types';

// Commands this feature accepts.
export type {
  SchedulingCommand,
  AddAppointment,
  UpdateAppointment,
  DeleteAppointment,
  ReorderAppointments,
  JoinEvent,
  LeaveEvent,
} from './domain/types';

// Domain types consumed by screens and widgets.
export type { Appointment, ScheduledEvent } from './domain/types';
export type { MockCalendarEvent } from './domain/mock-types';
