import type { Id, DomainEvent } from '@shared/types';

// ─── Value Types ─────────────────────────────────────────────

export type StretchingMode = 'routine' | 'custom';

export const SEED_ROUTINES = [
  'Morning Mobility',
  'Post-Lift Cool-down',
  'Hip Flexor Focus',
  'Full Body',
] as const;

export interface StretchingSession {
  id: Id<'StretchingSession'>;
  userId: Id<'User'>;
  mode: StretchingMode;
  routineName: string | null;
  durationMinutes: number;
  stretches: string[];
  completedStretches: string[];
  notes: string;
  loggedAt: number;
}

export interface StretchingState {
  sessions: StretchingSession[];
}

// ─── Events ──────────────────────────────────────────────────

export type StretchingEvent =
  | DomainEvent<'StretchingLogged', StretchingLoggedPayload>;

export interface StretchingLoggedPayload {
  sessionId: Id<'StretchingSession'>;
  userId: Id<'User'>;
  mode: StretchingMode;
  routineName: string | null;
  durationMinutes: number;
  stretches: string[];
  completedStretches: string[];
  notes: string;
}

// ─── Commands ────────────────────────────────────────────────

export interface LogStretching {
  type: 'LogStretching';
  userId: Id<'User'>;
  session: {
    mode: StretchingMode;
    routineName: string | null;
    durationMinutes: number;
    stretches: string[];
    completedStretches: string[];
    notes: string;
  };
}

export type StretchingCommand = LogStretching;
