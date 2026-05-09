import { viewStore } from '@data/projections/views';
import type { Appointment, ScheduledEvent } from '../domain/types';

export function getAppointments(): Appointment[] {
  return viewStore.get<Appointment[]>('appointments_by_date') ?? [];
}

export function getScheduleForDay(dateMs: number): Appointment[] {
  const all = getAppointments();
  const startOfDay = new Date(dateMs);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(dateMs);
  endOfDay.setHours(23, 59, 59, 999);
  return all.filter(a => a.scheduledAt >= startOfDay.getTime() && a.scheduledAt <= endOfDay.getTime());
}

export function getJoinedEvents(): ScheduledEvent[] {
  return viewStore.get<ScheduledEvent[]>('joined_events') ?? [];
}
