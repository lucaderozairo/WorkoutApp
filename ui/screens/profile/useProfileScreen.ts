import { useState } from 'react';
import { useQuery } from '@ui/bindings';
import type { UnitSystem } from '@features/profile';
import type { StatsSummary } from '@features/progress_analysis';

type ProfileView = { displayName: string; email: string; unitPreference: UnitSystem };
export type ProfileTab = 'activities' | 'health';

export function useProfileScreen() {
  const [activeTab, setActiveTab] = useState<ProfileTab>('health');
  const profile = useQuery('profile');
  const stats = useQuery('stats_summary');
  const initial = profile?.displayName?.charAt(0).toUpperCase() ?? 'Y';

  return { activeTab, setActiveTab, profile, stats, initial };
}
