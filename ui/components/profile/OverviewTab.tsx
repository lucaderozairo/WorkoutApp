import { useQuery } from '@ui/bindings';
import type { PersonalRecord } from '@features/progress_analysis';
import type { MockAchievement, MockGoal } from '@features/profile';

export function OverviewTab() {
  const achievements = (useQuery<MockAchievement[]>('profile_achievements') ?? []) as MockAchievement[];
  const goals        = (useQuery<MockGoal[]>('profile_goals') ?? []) as MockGoal[];
  const prs          = (useQuery<PersonalRecord[]>('personal_records') ?? []) as PersonalRecord[];
  return ( <>
  {/* ── Achievements ── */}
      <h2 className="eyebrow">Achievements</h2>
      <div className="scroll-row">
        {achievements.map((a, i) => (
          <div key={i} className={`surface tight${a.unlocked ? '' : ' inset'}`}>
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
                <span className="pill accent">PR</span>
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
                <span className={`pill ${done ? 'ok' : 'warn'}`}>
                  {done ? 'Done' : 'In progress'}
                </span>
              </div>
              <div className="bar">
                <div
                  className={done ? 'fill done' : 'fill'}
                  style={{ '--fill': `${pct}%` } as React.CSSProperties}
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
