export type {
  Appointment,
  ScheduledEvent,
  SchedulingState,
  SchedulingEvent,
  SchedulingCommand,
  AddAppointment,
  UpdateAppointment,
  DeleteAppointment,
  ReorderAppointments,
  JoinEvent,
  LeaveEvent,
} from './domain/types';

export { appointmentsByDateProjection, joinedEventsProjection } from './projections';

export { getAppointments, getScheduleForDay, getJoinedEvents } from './queries';

export {
  handleAddAppointment,
  handleUpdateAppointment,
  handleDeleteAppointment,
  handleReorderAppointments,
  handleJoinEvent,
  handleLeaveEvent,
} from './commands/handlers';
