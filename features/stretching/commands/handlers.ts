import type { Result } from '@shared/types';
import { ok, err } from '@shared/types';
import type { LogStretching, StretchingEvent } from '../domain/types';
import { cryptoIdGenerator } from '@core/id-generator';
import { systemClock } from '@core/clock';
import { projectionRegistry } from '@data/projections/builders';
import { viewStore } from '@data/projections/views';
import { stretchingLogProjection } from '../projections';

projectionRegistry.register('stretching_log', stretchingLogProjection);

// ─── Command Handlers ────────────────────────────────────────

export async function handleLogStretching(cmd: LogStretching): Promise<Result<void, string>> {
  if (cmd.session.durationMinutes < 1) return err('Duration must be at least 1 minute');
  if (cmd.session.mode === 'routine' && !cmd.session.routineName?.trim()) {
    return err('Routine name is required for routine mode');
  }

  const sessionId = cryptoIdGenerator.next<'StretchingSession'>();

  const events: StretchingEvent[] = [{
    type: 'StretchingLogged',
    aggregateId: cmd.userId,
    aggregateType: 'User',
    timestamp: systemClock.now(),
    version: 1,
    payload: {
      sessionId,
      userId: cmd.userId,
      mode: cmd.session.mode,
      routineName: cmd.session.routineName,
      durationMinutes: cmd.session.durationMinutes,
      stretches: cmd.session.stretches,
      completedStretches: cmd.session.completedStretches,
      notes: cmd.session.notes,
    },
  }];

  events.forEach(e => stretchingLogProjection.apply(e));
  viewStore.set('stretching_log', stretchingLogProjection.getState());
  return ok(undefined);
}
