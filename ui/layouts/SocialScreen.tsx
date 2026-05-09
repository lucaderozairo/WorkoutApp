import { useState } from 'react';
import { FeedTab }   from '@ui/components/social/FeedTab';
import { EventsTab } from '@ui/components/social/EventsTab';
import { GroupsTab } from '@ui/components/social/GroupsTab';
import '@features/scheduling';

type SocialTab = 'feed' | 'events' | 'groups';

export function SocialScreen() {
  const [activeTab, setActiveTab] = useState<SocialTab>('feed');
  return (
    <div className="column">
      <div className="tabs">
        <button className={`tab${activeTab === 'feed'   ? ' active' : ''}`} onClick={() => setActiveTab('feed')}>Feed</button>
        <button className={`tab${activeTab === 'events' ? ' active' : ''}`} onClick={() => setActiveTab('events')}>Events</button>
        <button className={`tab${activeTab === 'groups' ? ' active' : ''}`} onClick={() => setActiveTab('groups')}>Groups</button>
      </div>
      {activeTab === 'feed'   && <FeedTab />}
      {activeTab === 'events' && <EventsTab />}
      {activeTab === 'groups' && <GroupsTab />}
    </div>
  );
}
