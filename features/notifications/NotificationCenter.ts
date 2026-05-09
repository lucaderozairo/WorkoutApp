export type Notification = {
  id: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export class NotificationCenter {
  private notifications: Notification[] = [];

  add(message: string): Notification {
    const n: Notification = {
      id: crypto.randomUUID(),
      message,
      read: false,
      createdAt: new Date().toISOString(),
    };
    this.notifications.push(n);
    return n;
  }

  getAll(): Notification[] {
    return [...this.notifications];
  }

  markRead(id: string): void {
    const n = this.notifications.find(n => n.id === id);
    if (n) n.read = true;
  }
}
