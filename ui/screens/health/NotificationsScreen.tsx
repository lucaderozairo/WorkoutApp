import { Surface, Text } from '@ui/atoms';
import { ScreenHeader, EmptyState } from '@ui/molecules';
import { Grid } from '@ui/layout';
import { useNotificationsScreen } from './useNotificationsScreen';

export function NotificationsScreen() {
  const { notifications } = useNotificationsScreen();
  return (
    <Grid>
      <ScreenHeader title="Notifications" />
      {notifications.length === 0 ? (
        <EmptyState
          icon="🔔"
          title="You're all caught up"
          message="We'll notify you when something needs your attention."
        />
      ) : (
        notifications.map(n => (
          <Surface key={n.id}>
            <Text>{n.message}</Text>
          </Surface>
        ))
      )}
    </Grid>
  );
}
