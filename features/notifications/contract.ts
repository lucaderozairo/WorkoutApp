// Public contract for the notifications feature.
// This feature is not event-sourced (no commands/events/projections layers).
// External consumers use the NotificationCenter runtime (exported from index.ts)
// plus the public data shapes below.

export type { Notification } from './NotificationCenter';
export type { NotificationPreferences } from './NotificationPreferences';
export type {
  NotificationRule,
  NotificationEvent,
  PendingNotification,
} from './NotificationRulesEngine';
