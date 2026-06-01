import {
  registerBodyProjections,
  registerEquipmentMileagePolicy,
} from '@features/profile';
import { ActivitiesTab } from '@ui/components/profile/ActivitiesTab';
import { HealthOverviewTab } from '@ui/components/profile/HealthOverviewTab';
import { Avatar, Badge, Surface } from '@ui/atoms';
import { Grid, Row, Column, Cluster } from '@ui/layout';
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
      <Surface>
        <Column>
          <Row align="center">
            <Avatar name={profile?.displayName ?? 'You'} size="xl" />
            <Column gap={1}>
              <span>{profile?.displayName ?? 'You'}</span>
              <span className="mono muted">{profile?.email ?? ''}</span>
              <Cluster>
                <Badge tone="accent"><Flame size={12} /> Active</Badge>
              </Cluster>
            </Column>
          </Row>
          <Grid variant="triple">
            <StatTile value={stats?.totalSessions ?? '-'} label="Workouts" />
            <StatTile value={stats?.liftSessions ?? '-'} label="Lifts" />
            {(stats?.kmRan ?? 0) > 0 && (
              <StatTile value={stats!.kmRan.toFixed(0)} unit="km" label="Km ran" />
            )}
          </Grid>
        </Column>
      </Surface>

      <Tabs items={PROFILE_TABS} value={activeTab} onChange={setActiveTab} />

      {activeTab === 'health' && <HealthOverviewTab />}
      {activeTab === 'activities' && <ActivitiesTab />}
    </Grid>
  );
}
