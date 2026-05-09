export type NotificationRule = {
  id: string;
  trigger: string;
  message: string;
};

export type NotificationEvent = {
  type: string;
  [key: string]: unknown;
};

export type PendingNotification = {
  ruleId: string;
  message: string;
};

export class NotificationRulesEngine {
  constructor(private rules: NotificationRule[]) {}

  evaluate(event: NotificationEvent): PendingNotification[] {
    return this.rules
      .filter(r => r.trigger === event.type)
      .map(r => ({ ruleId: r.id, message: r.message }));
  }
}
