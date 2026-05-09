export class TelemetryLogger {
  logError(domain: string, error: Error, context?: Record<string, unknown>) {
    console.error(`[telemetry:${domain}] ${error.message}`, error, context ?? {});
  }

  logEvent(domain: string, event: string, context?: Record<string, unknown>) {
    console.info(`[telemetry:${domain}] ${event}`, context ?? {});
  }
}

export const telemetry = new TelemetryLogger();
