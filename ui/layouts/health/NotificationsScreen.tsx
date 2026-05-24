import { ScreenHeader, EmptyState } from '@ui/components/shared';
import { useNotificationsScreen } from './useNotificationsScreen';

export function NotificationsScreen() {
  const { notifications } = useNotificationsScreen();
  return (
    <div className="column">
      <ScreenHeader title="Notifications" />
      {notifications.length === 0 ? (
        <EmptyState
          icon="🔔"
          title="You're all caught up"
          message="We'll notify you when something needs your attention."
        />
      ) : (
        notifications.map(n => (
          <div key={n.id} className="surface row">
            <span>{n.message}</span>
          </div>
        ))
      )}
    </div>
  );
}
