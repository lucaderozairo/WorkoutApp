import { useNotificationsScreen } from './useNotificationsScreen';

export function NotificationsScreen() {
  const { notifications } = useNotificationsScreen();
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
