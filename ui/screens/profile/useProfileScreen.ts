import { useState } from 'react';
import { useQuery } from '@ui/bindings';
import type { UnitSystem } from '@features/profile/contract';
import type { StatsSummary } from '@features/progress_analysis/contract';

type ProfileView = { displayName: string; email: string; unitPreference: UnitSystem };
export type ProfileTab = 'activities' | 'health';

export function useProfileScreen() {
  const [activeTab, setActiveTab] = useState<ProfileTab>('health');
  const profile = useQuery<ProfileView>('profile');
  const stats = useQuery<StatsSummary>('stats_summary');
  const initial = profile?.displayName?.charAt(0).toUpperCase() ?? 'Y';

  return { activeTab, setActiveTab, profile, stats, initial };
}
