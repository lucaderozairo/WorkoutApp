import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCommand } from '@ui/bindings';
import { handleStartSession } from '@features/training_log';
import { handleRecordCardioSession } from '@features/cardio';
import type { CardioSport } from '@features/cardio';
import type { Id } from '@shared/types';
import type { PlannedSession } from '@features/planning';
import { ACTIVITY_META } from '@ui/components/log/activityConfig';
import type { ActivityKey } from '@ui/components/log/activityConfig';
import { viewStore } from '@data/projections/views';
import { UpcomingPlans } from '@ui/components/workout/UpcomingPlans';
import { PlannedSessionDetail } from '@ui/components/workout/PlannedSessionDetail';
import { PlanWizard } from '@ui/components/workout/wizard/PlanWizard';

const USER_ID = 'user-001' as Id<'User'>;

const SWITCHER_ACTIVITIES: ActivityKey[] = ['gym', 'run', 'hike', 'cycle'];

export function NewSessionScreen() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<ActivityKey>('gym');
  const [selectedPlanId, setSelectedPlanId] = useState<Id<'PlannedSession'> | null>(null);
  const [showPlan, setShowPlan] = useState(false);

  const { dispatch: startSession } = useCommand(handleStartSession);
  const { dispatch: recordCardioSession } = useCommand(handleRecordCardioSession);

  function recordRecentSport(sport: ActivityKey) {
    const current = (viewStore.get<ActivityKey[]>('wapp_recent_sports') ?? [])
      .filter(s => s !== sport);
    viewStore.set('wapp_recent_sports', [sport, ...current].slice(0, 10));
  }

  async function handleStartNow() {
    recordRecentSport(selected);
    if (selected === 'gym') {
      await startSession({ type: 'StartSession', userId: USER_ID, name: 'Workout' });
    } else {
      await recordCardioSession({
        type: 'RecordCardioSession',
        userId: USER_ID,
        sport: selected as CardioSport,
        durationSeconds: 1,
        distanceMeters: 0,
        notes: '',
      });
    }
    navigate('/log');
  }

  function handlePlanStartNow(plan: PlannedSession) {
    setSelectedPlanId(null);
    recordRecentSport(selected);
    void startSession({ type: 'StartSession', userId: USER_ID, name: plan.name });
    navigate('/log');
  }

  if (showPlan) {
    return (
      <PlanWizard
        onClose={() => setShowPlan(false)}
        onSaved={() => setShowPlan(false)}
      />
    );
  }

  return (
    <div className="column">
      <div className="row space-between align-center compact">
        <button className="ghost" onClick={() => navigate(-1)}>← Back</button>
        <h2>New Session</h2>
        <span />
      </div>

      <div className="row compact">
        {SWITCHER_ACTIVITIES.map(key => {
          const { emoji, label } = ACTIVITY_META[key];
          return (
            <button
              key={key}
              className={`surface compact column align-center grow${selected === key ? ' chip--active' : ''}`}
              onClick={() => setSelected(key)}
            >
              <span>{emoji}</span>
              <span className="caption">{label}</span>
            </button>
          );
        })}
      </div>

      <UpcomingPlans type={selected} onSelect={setSelectedPlanId} />

      {selectedPlanId && (
        <PlannedSessionDetail
          planId={selectedPlanId}
          onClose={() => setSelectedPlanId(null)}
          onStartNow={handlePlanStartNow}
        />
      )}

      <div className="row compact">
        <button className="primary grow" onClick={handleStartNow}>▶ Start now</button>
        <button className="secondary grow" onClick={() => setShowPlan(true)}>📅 Plan</button>
      </div>
    </div>
  );
}
