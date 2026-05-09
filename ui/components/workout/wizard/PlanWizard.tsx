// ui/components/workout/wizard/PlanWizard.tsx
import { useState, useCallback } from 'react';
import { useCommand } from '@ui/bindings';
import { handlePlanSession } from '@features/planning';
import type { PlanType, PlannedExercise } from '@features/planning';
import type { Id } from '@shared/types';
import { StepType } from './StepType';
import { StepGym } from './StepGym';
import { StepCardio } from './StepCardio';
import { StepSwim } from './StepSwim';
import { StepSchedule } from './StepSchedule';
import { StepReview } from './StepReview';
import { totalDistanceKm } from './RouteMap';
import { buildMarkers } from '@features/planning';
import { defaultSessionName } from './wizardUtils';

const USER_ID = 'user-001' as Id<'User'>;

export interface WizardData {
  type: PlanType | null;
  sessionName: string;
  exercises: PlannedExercise[];
  waypoints: [number, number][];
  distanceKm: number;
  routedKm: number;
  paceSecPerKm: number;
  poolLengthM: 25 | 50;
  targetDistanceM: number;
  paceSecPer100m: number;
  scheduledDate: string;
  scheduledTime: string;
  notes: string;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseScheduledAt(date: string, time: string): number {
  const [h, m] = time.split(':').map(Number);
  const d = new Date(date);
  d.setHours(h ?? 7, m ?? 0, 0, 0);
  return d.getTime();
}

const EMPTY: WizardData = {
  type: null,
  sessionName: '',
  exercises: [],
  waypoints: [],
  distanceKm: 0,
  routedKm: 0,
  paceSecPerKm: 300,
  poolLengthM: 25,
  targetDistanceM: 1000,
  paceSecPer100m: 120,
  scheduledDate: todayStr(),
  scheduledTime: '07:30',
  notes: '',
};

const STEP_LABELS = ['Type', 'Configure', 'Schedule', 'Review'];

function canAdvance(step: number, data: WizardData): boolean {
  if (step === 0) return data.type !== null;
  if (step === 1) {
    if (data.type === 'gym') return true;
    if (data.type === 'run' || data.type === 'cycle') return data.paceSecPerKm > 0;
    if (data.type === 'swim') return data.targetDistanceM > 0 && data.paceSecPer100m > 0;
  }
  if (step === 2) return data.scheduledDate.length > 0 && data.scheduledTime.length > 0;
  return true;
}

interface PlanWizardProps {
  onClose: () => void;
  onSaved: () => void;
}

export function PlanWizard({ onClose, onSaved }: PlanWizardProps) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(EMPTY);
  const { dispatch: planSession, pending: saving } = useCommand(handlePlanSession);

  const update = useCallback((patch: Partial<WizardData>) => {
    setData(prev => ({ ...prev, ...patch }));
  }, []);

  async function handleSaveDraft() {
    if (!data.type) return;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(7, 30, 0, 0);
    const scheduledAt = data.scheduledDate
      ? parseScheduledAt(data.scheduledDate, data.scheduledTime || '07:30')
      : tomorrow.getTime();

    const distanceKm = (data.type === 'run' || data.type === 'cycle')
      ? (data.routedKm > 0 ? data.routedKm : totalDistanceKm(data.waypoints))
      : data.type === 'swim'
        ? data.targetDistanceM / 1000
        : undefined;

    await planSession({
      type: 'PlanSession',
      userId: USER_ID,
      planType: data.type,
      name: data.sessionName || defaultSessionName(data.type),
      scheduledAt,
      notes: data.notes,
      exercises: data.type === 'gym' ? data.exercises : undefined,
      routeWaypoints: (data.type === 'run' || data.type === 'cycle') ? data.waypoints : undefined,
      distanceKm,
      paceSecPerKm: (data.type === 'run' || data.type === 'cycle') ? data.paceSecPerKm : undefined,
      distanceMarkers: undefined,
      poolLengthM: data.type === 'swim' ? data.poolLengthM : undefined,
      targetDistanceM: data.type === 'swim' ? data.targetDistanceM : undefined,
      paceSecPer100m: data.type === 'swim' ? data.paceSecPer100m : undefined,
    });
    onSaved();
  }

  async function handleSave() {
    if (!data.type) return;
    const scheduledAt = parseScheduledAt(data.scheduledDate, data.scheduledTime);
    const distanceKm = (data.type === 'run' || data.type === 'cycle')
      ? (data.routedKm > 0 ? data.routedKm : totalDistanceKm(data.waypoints))
      : data.type === 'swim'
        ? data.targetDistanceM / 1000
        : undefined;

    const intervalKm = data.type === 'cycle' ? 5 : data.type === 'swim' ? 0.1 : 1;
    const paceForMarkers = data.type === 'swim'
      ? data.paceSecPer100m * 10
      : data.paceSecPerKm;
    const distanceMarkers = distanceKm && distanceKm > 0
      ? buildMarkers(distanceKm, paceForMarkers, intervalKm)
      : undefined;

    await planSession({
      type: 'PlanSession',
      userId: USER_ID,
      planType: data.type,
      name: data.sessionName || data.type,
      scheduledAt,
      notes: data.notes,
      exercises: data.type === 'gym' ? data.exercises : undefined,
      routeWaypoints: (data.type === 'run' || data.type === 'cycle') ? data.waypoints : undefined,
      distanceKm: distanceKm,
      paceSecPerKm: (data.type === 'run' || data.type === 'cycle') ? data.paceSecPerKm : undefined,
      distanceMarkers,
      poolLengthM: data.type === 'swim' ? data.poolLengthM : undefined,
      targetDistanceM: data.type === 'swim' ? data.targetDistanceM : undefined,
      paceSecPer100m: data.type === 'swim' ? data.paceSecPer100m : undefined,
    });
    onSaved();
  }

  const scheduledAt = parseScheduledAt(data.scheduledDate, data.scheduledTime);
  const distanceKmForReview = (data.type === 'run' || data.type === 'cycle')
    ? (data.routedKm > 0 ? data.routedKm : totalDistanceKm(data.waypoints))
    : 0;

  function renderStep() {
    switch (step) {
      case 0:
        return (
          <StepType
            selected={data.type}
            onSelect={type => {
              update({ type, sessionName: defaultSessionName(type) });
              setStep(1);
            }}
          />
        );
      case 1:
        if (data.type === 'gym') {
          return (
            <StepGym
              sessionName={data.sessionName}
              exercises={data.exercises}
              onSessionNameChange={sessionName => update({ sessionName })}
              onExercisesChange={exercises => update({ exercises })}
            />
          );
        }
        if (data.type === 'run' || data.type === 'cycle') {
          return (
            <StepCardio
              planType={data.type}
              sessionName={data.sessionName}
              waypoints={data.waypoints}
              paceSecPerKm={data.paceSecPerKm}
              onSessionNameChange={sessionName => update({ sessionName })}
              onWaypointsChange={waypoints => update({ waypoints, distanceKm: totalDistanceKm(waypoints) })}
              onPaceChange={paceSecPerKm => update({ paceSecPerKm })}
              onRoutedKmChange={(km) => update({ routedKm: km })}
            />
          );
        }
        if (data.type === 'swim') {
          return (
            <StepSwim
              sessionName={data.sessionName}
              poolLengthM={data.poolLengthM}
              targetDistanceM={data.targetDistanceM}
              paceSecPer100m={data.paceSecPer100m}
              onSessionNameChange={sessionName => update({ sessionName })}
              onPoolLengthChange={poolLengthM => update({ poolLengthM })}
              onTargetDistanceChange={targetDistanceM => update({ targetDistanceM })}
              onPaceChange={paceSecPer100m => update({ paceSecPer100m })}
            />
          );
        }
        return null;
      case 2:
        return (
          <StepSchedule
            scheduledDate={data.scheduledDate}
            scheduledTime={data.scheduledTime}
            notes={data.notes}
            onDateChange={scheduledDate => update({ scheduledDate })}
            onTimeChange={scheduledTime => update({ scheduledTime })}
            onNotesChange={notes => update({ notes })}
          />
        );
      case 3:
        return (
          <StepReview
            data={{ ...data, distanceKm: distanceKmForReview }}
            scheduledAt={scheduledAt}
            onSave={handleSave}
            saving={saving}
          />
        );
      default:
        return null;
    }
  }

  return (
    <div className='column'>
      <header className="row space-between align-center">
        <div className="row compact">
          {STEP_LABELS.map((_, i) => (
            <div key={i} className={`dot${i === step ? ' active' : ''}`} />
          ))}
        </div>
        <span className="detail">
          {step < STEP_LABELS.length ? STEP_LABELS[step] : 'Plan'}
        </span>
        <button type="button" className="ghost icon sm" onClick={onClose} aria-label="Close">
          ×
        </button>
      </header>

      <div>
        {renderStep()}
      </div>

      <footer>
        <div className="row space-between align-center">
          <div>
            {step > 0 && (
              <button type="button" className="ghost" onClick={handleSaveDraft} disabled={saving}>
                Save draft
              </button>
            )}
          </div>
          <div className="row compact">
            {step > 0 && (
              <button type="button" className="secondary" onClick={() => setStep(s => s - 1)}>
                Back
              </button>
            )}
            {step < STEP_LABELS.length - 1 ? (
              <button
                type="button"
                className="primary"
                disabled={!canAdvance(step, data)}
                onClick={() => setStep(s => s + 1)}
              >
                Next
              </button>
            ) : (
              <button type="button" className="primary" disabled={saving} onClick={handleSave}>
                {saving ? 'Saving…' : 'Save plan'}
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
