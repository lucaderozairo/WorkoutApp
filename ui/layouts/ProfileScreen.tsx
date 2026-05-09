import { useState } from 'react';
import { useQuery } from '@ui/bindings';
import {
  registerBodyProjections,
  registerEquipmentMileagePolicy,
} from '@features/profile';
import type { UnitSystem } from '@features/profile';
import type { PersonalRecord, StatsSummary } from '@features/progress_analysis';

import { HealthTab } from '../components/profile/HealthTab';
import { ActivitiesTab } from '../components/profile/ActivitiesTab';
import { OverviewTab } from '../components/profile/OverviewTab';

import '@features/progress_analysis';
import '@features/readiness';

registerBodyProjections();
registerEquipmentMileagePolicy();

type ProfileView = { displayName: string; email: string; unitPreference: UnitSystem };

type ProfileTab = 'activities' | 'health' | 'overview';

export function ProfileScreen() {
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');

  const profile = useQuery<ProfileView>('profile');
  const prs     = (useQuery<PersonalRecord[]>('personal_records') ?? []) as PersonalRecord[];
  const stats   = useQuery<StatsSummary>('stats_summary');

  const initial = profile?.displayName?.charAt(0).toUpperCase() ?? 'Y';

  return (
    <div className="stack">

      {/* ── Hero ── */}
      <div className="surface">
        <div className="row align-center">
          <div className="avatar avatar--xl">{initial}</div>
          <div className="stack compact">
            <span>{profile?.displayName ?? 'You'}</span>
            <span className="mono muted">{profile?.email ?? ''}</span>
            <div className="cluster">
              <span className="pill pill--accent">🔥 Active</span>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="stat">
            <span className="eyebrow">Workouts</span>
            <span className="num">{stats?.totalSessions ?? '—'}</span>
          </div>
          <div className="stat">
            <span className="eyebrow">Lifts</span>
            <span className="num">{stats?.liftSessions ?? '—'}</span>
          </div>
          {(stats?.kmRan ?? 0) > 0 && (
            <div className="stat">
              <span className="eyebrow">Km ran</span>
              <span className="num">
                {stats!.kmRan.toFixed(0)}<span className="stat__unit">km</span>
              </span>
            </div>
          )}
        </div>
      </div>

      
      {/* ── Tabs ── */}
      <div className="tabs">
        <button className={`tab${activeTab === 'overview' ? ' active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
        <button className={`tab${activeTab === 'activities' ? ' active' : ''}`} onClick={() => setActiveTab('activities')}>Activities</button>
        <button className={`tab${activeTab === 'health'     ? ' active' : ''}`} onClick={() => setActiveTab('health')}>Health</button>
      </div>

      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'activities' && <ActivitiesTab />}
      {activeTab === 'health'     && <HealthTab />}

    </div>
  );
}
