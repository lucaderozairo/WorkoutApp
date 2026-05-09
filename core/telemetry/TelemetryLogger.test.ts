import { describe, it, expect, vi } from 'vitest';
import { TelemetryLogger } from './TelemetryLogger';

describe('TelemetryLogger', () => {
  it('logs error events with domain and timestamp', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const logger = new TelemetryLogger();
    logger.logError('workout', new Error('test'), { sessionId: 'abc' });
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('[telemetry:workout]'),
      expect.any(Error),
      expect.objectContaining({ sessionId: 'abc' })
    );
    spy.mockRestore();
  });

  it('logs info events', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const logger = new TelemetryLogger();
    logger.logEvent('navigation', 'tab_changed', { to: '/log' });
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('[telemetry:navigation]'),
      expect.objectContaining({ to: '/log' })
    );
    spy.mockRestore();
  });
});
