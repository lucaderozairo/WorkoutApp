import { useState } from 'react';
import { NotificationCenter } from '@features/notifications';

const center = new NotificationCenter();

export function useNotificationsScreen() {
  const [notifications] = useState(() => center.getAll());
  return { notifications };
}
