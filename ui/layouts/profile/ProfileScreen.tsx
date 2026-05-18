import {
  registerBodyProjections,
  registerEquipmentMileagePolicy,
} from '@features/profile';
import { ActivitiesTab } from '@ui/components/profile/ActivitiesTab';
import { HealthOverviewTab } from '@ui/components/profile/HealthOverviewTab';
import { useProfileScreen } from './useProfileScreen';

import '@features/progress_analysis';
import '@features/readiness';

registerBodyProjections();
registerEquipmentMileagePolicy();

export function ProfileScreen() {
  const { activeTab, setActiveTab, profile, stats, initial } = useProfileScreen();

  return (
    <div className="stack">
      <div className="surface">
        <div className="row align-center">
          <div className="avatar avatar--xl">{initial}</div>
          <div className="stack compact">
            <span>{profile?.displayName ?? 'You'}</span>
            <span className="mono muted">{profile?.email ?? ''}</span>
            <div className="cluster">
              <span className="pill accent">🔥 Active</span>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="column compact">
            <span className="eyebrow">Workouts</span>
            <span className="num">{stats?.totalSessions ?? '—'}</span>
          </div>
          <div className="column compact">
            <span className="eyebrow">Lifts</span>
            <span className="num">{stats?.liftSessions ?? '—'}</span>
          </div>
          {(stats?.kmRan ?? 0) > 0 && (
            <div className="column compact">
              <span className="eyebrow">Km ran</span>
              <span className="num">
                {stats!.kmRan.toFixed(0)}<span className="muted">km</span>
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="tabs">
        <button className={`tab${activeTab === 'health' ? ' active' : ''}`} onClick={() => setActiveTab('health')}>Health</button>
        <button className={`tab${activeTab === 'activities' ? ' active' : ''}`} onClick={() => setActiveTab('activities')}>Activities</button>
      </div>

      {activeTab === 'health' && <HealthOverviewTab />}
      {activeTab === 'activities' && <ActivitiesTab />}
    </div>
  );
}
