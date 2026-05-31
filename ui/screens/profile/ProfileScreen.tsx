import {
  registerBodyProjections,
  registerEquipmentMileagePolicy,
} from '@features/profile';
import { ActivitiesTab } from '@ui/components/profile/ActivitiesTab';
import { HealthOverviewTab } from '@ui/components/profile/HealthOverviewTab';
import { Avatar, Badge } from '@ui/atoms';
import { Grid, Row } from '@ui/layout';
import { StatTile, Tabs } from '@ui/molecules';
import { useProfileScreen } from './useProfileScreen';
import type { ProfileTab } from './useProfileScreen';
import { Flame } from 'lucide-react';

import '@features/progress_analysis';
import '@features/readiness';

registerBodyProjections();
registerEquipmentMileagePolicy();

const PROFILE_TABS: { id: ProfileTab; label: string }[] = [
  { id: 'health', label: 'Health' },
  { id: 'activities', label: 'Activities' },
];

export function ProfileScreen() {
  const { activeTab, setActiveTab, profile, stats } = useProfileScreen();

  return (
    <Grid>
      <div className="surface">
        <Row align="center">
          <Avatar name={profile?.displayName ?? 'You'} size="xl" />
          <div className="column compact">
            <span>{profile?.displayName ?? 'You'}</span>
            <span className="mono muted">{profile?.email ?? ''}</span>
            <div className="cluster">
              <Badge tone="accent"><Flame size={12} /> Active</Badge>
            </div>
          </div>
        </Row>
        <Grid variant="triple">
          <StatTile value={stats?.totalSessions ?? '-'} label="Workouts" />
          <StatTile value={stats?.liftSessions ?? '-'} label="Lifts" />
          {(stats?.kmRan ?? 0) > 0 && (
            <StatTile value={stats!.kmRan.toFixed(0)} unit="km" label="Km ran" />
          )}
        </Grid>
      </div>

      <Tabs items={PROFILE_TABS} value={activeTab} onChange={setActiveTab} />

      {activeTab === 'health' && <HealthOverviewTab />}
      {activeTab === 'activities' && <ActivitiesTab />}
    </Grid>
  );
}
