import { FeedTab }   from '@ui/components/social/FeedTab';
import { EventsTab } from '@ui/components/social/EventsTab';
import { GroupsTab } from '@ui/components/social/GroupsTab';
import { Grid } from '@ui/layout';
import { Tabs } from '@ui/molecules';
import { useSocialScreen } from './useSocialScreen';
import '@features/scheduling';

const SOCIAL_TABS = [
  { id: 'feed', label: 'Feed' },
  { id: 'events', label: 'Events' },
  { id: 'groups', label: 'Groups' },
] as const;

export function SocialScreen() {
  const { activeTab, setActiveTab } = useSocialScreen();
  return (
    <Grid>
      <Tabs items={[...SOCIAL_TABS]} value={activeTab} onChange={setActiveTab} />
      {activeTab === 'feed'   && <FeedTab />}
      {activeTab === 'events' && <EventsTab />}
      {activeTab === 'groups' && <GroupsTab />}
    </Grid>
  );
}
