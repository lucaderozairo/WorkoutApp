import type { Id } from '@shared/types';
import type { StretchingEvent, StretchingLoggedPayload } from './types';

export interface StretchingSessionView {
  id: Id<'StretchingSession'>;
  mode: string;
  routineName: string | null;
  durationMinutes: number;
  stretches: string[];
  completedStretches: string[];
  notes: string;
  loggedAt: number;
}

export function applyStretchingLogged(state: StretchingSessionView[], event: StretchingEvent): StretchingSessionView[] {
  if (event.type !== 'StretchingLogged') return state;
  const p = event.payload as StretchingLoggedPayload;
  const session: StretchingSessionView = {
    id: p.sessionId,
    mode: p.mode,
    routineName: p.routineName,
    durationMinutes: p.durationMinutes,
    stretches: p.stretches,
    completedStretches: p.completedStretches,
    notes: p.notes,
    loggedAt: event.timestamp,
  };
  return [session, ...state];
}
