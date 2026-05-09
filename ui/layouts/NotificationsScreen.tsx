import { useState } from 'react';
import { NotificationCenter } from '@features/notifications';

const center = new NotificationCenter();

export function NotificationsScreen() {
  const [notifications] = useState(() => center.getAll());
  return (
    <div className="column">
      <h2>Notifications</h2>
      {notifications.length === 0 && <p className="muted">No notifications.</p>}
      {notifications.map(n => (
        <div key={n.id} className="surface row">
          <span>{n.message}</span>
        </div>
      ))}
    </div>
  );
}
