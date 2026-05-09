export type HealthIntegration = 'apple_health' | 'garmin' | 'whoop';

export function getAvailableIntegrations(): HealthIntegration[] {
  return [];
}
