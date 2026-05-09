export type NotificationPreferences = {
  workoutReminders: boolean;
  goalAlerts: boolean;
  socialActivity: boolean;
  systemAlerts: boolean;
};

export const defaultPreferences: NotificationPreferences = {
  workoutReminders: true,
  goalAlerts: true,
  socialActivity: false,
  systemAlerts: true,
};
