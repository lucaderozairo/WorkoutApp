import { useState } from 'react';

export type SocialTab = 'feed' | 'events' | 'groups';

export function useSocialScreen() {
  const [activeTab, setActiveTab] = useState<SocialTab>('feed');
  return { activeTab, setActiveTab };
}
