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
import type { MockAchievement, MockGoal } from '@data/mock/profile';

import '@features/progress_analysis';
import '@features/readiness';

registerBodyProjections();
registerEquipmentMileagePolicy();

type ProfileView = { displayName: string; email: string; unitPreference: UnitSystem };

type ProfileTab = 'activities' | 'health' | 'overview';

export function OverviewTab() {
  const achievements = (useQuery<MockAchievement[]>('profile_achievements') ?? []) as MockAchievement[];
  const goals        = (useQuery<MockGoal[]>('profile_goals') ?? []) as MockGoal[];
  const prs          = (useQuery<PersonalRecord[]>('personal_records') ?? []) as PersonalRecord[];
  return ( <>
  {/* ── Achievements ── */}
      <h2 className="eyebrow">Achievements</h2>
      <div className="scroll-row">
        {achievements.map((a, i) => (
          <div key={i} className={`surface compact${a.unlocked ? '' : ' inset'}`}>
            <span>{a.emoji}</span>
            <span className="eyebrow">{a.name}</span>
            <span className="muted">{a.desc}</span>
          </div>
        ))}
      </div>

      {/* ── Personal Records ── */}
      <h2 className="eyebrow">Personal Records</h2>
      {prs.length === 0 ? (
        <p className="muted">No PRs recorded yet.</p>
      ) : (
        <div className="surface bare">
          <div className="trend-">
            {prs.map(pr => (
              <div key={pr.exerciseName} className="trend-">
                <div className="stack">
                  <span>{pr.exerciseName}</span>
                </div>
                {pr.valueKg !== undefined && (
                  <span>
                    {pr.valueKg}<span className="faint">kg 1RM</span>
                  </span>
                )}
                <span className="pill pill--accent">PR</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Goals ── */}
      <h2 className="eyebrow">Goals</h2>
      <div className="stack">
        {goals.map(goal => {
          const pct = goal.lowerIsBetter
            ? Math.max(0, Math.min(100, (goal.target / goal.current) * 100))
            : Math.min(100, (goal.current / goal.target) * 100);
          const done = pct >= 100;
          return (
            <div key={goal.name} className="surface">
              <div className="row space-between align-center">
                <span>{goal.name}</span>
                <span className={`pill ${done ? 'pill--ok' : 'pill--warn'}`}>
                  {done ? 'Done' : 'In progress'}
                </span>
              </div>
              <div className="bar">
                <div
                  className="bar__fill"
                  style={{
                    '--fill': `${pct}%`,
                    '--bar-color': done ? 'var(--ok)' : 'var(--accent)',
                  } as React.CSSProperties}
                />
              </div>
              <div className="row space-between">
                <span className="mono muted">{goal.current} / {goal.target}</span>
              </div>
            </div>
          );
        })}
      </div>

  </>)
}

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
