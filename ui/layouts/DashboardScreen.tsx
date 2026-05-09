import { useEffect } from 'react';
import { useState } from 'react';
import { useQuery, useCommand } from '@ui/bindings';
import { useExpandable } from '@ui/interactions/useExpandable';
import type { TodayReadinessView } from '@features/readiness';
import type { SessionHistoryItem } from '@features/training_log';
import type { Id } from '@shared/types';
import { handleRefreshConditions } from '@features/conditions';
import type { WeatherCondition, SuitabilityEntry } from '@features/conditions';
import type { Appointment } from '@features/scheduling';
import { registerTrainingPlanProjections, registerAdherencePolicy } from '@features/training_plans';
import { registerGoalProjections } from '@features/goals';
import { registerHabitProjections, registerStreakMilestonePolicy } from '@features/habits';
import {
  handleLogRestingHR,
  handleLogSubjectiveRPE,
  getTodaySubjectiveRPE,
} from '@features/readiness';
import { SleepSmall, SleepLarge } from '@ui/components/widgets/SleepWidgets';
import { ScoreRing } from '@ui/components/shared/Charts';
import { CalendarLarge } from '@ui/components/widgets/CalendarWidgets';
import type { SleepSession } from '@data/mock/sleep';
import type { SleepEntryView } from '@features/readiness';
import { WeatherWidget } from '@ui/components/widgets/WeatherWidget';

import '@features/training_log';
import '@features/readiness';
import '@features/conditions';
import '@features/scheduling';
import '@features/news_feed';
import '@features/training_plans';
import '@features/goals';
import '@features/habits';

registerTrainingPlanProjections();
registerAdherencePolicy();
registerGoalProjections();
registerHabitProjections();
registerStreakMilestonePolicy();

const USER_ID = 'user-001' as Id<'User'>;

const GOAL_MINUTES = 480; // 8h
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

function sleepEntryToSession(entry: SleepEntryView): SleepSession {
  const end = new Date(entry.date);
  end.setHours(6, 30, 0, 0);
  const durationMs = (entry.durationMin ?? 0) * 60_000;
  return {
    start: new Date(end.getTime() - durationMs),
    end,
    score: entry.score,
    stages: {
      deep: entry.deepMin ?? 0,
      light: entry.lightMin ?? 0,
      rem: entry.remMin ?? 0,
      awake: entry.awakeMin ?? 0,
    },
  };
}
const RING_COLORS = {
  good: 'var(--color-success)',
  warning: 'var(--color-warning)',
  poor: 'var(--color-danger)',
} as const;

const SPORT_ICONS: Record<string, string> = {
  run: '🏃', cycle: '🚴', swim: '🏊', row: '🚣', hike: '🥾', ski: '⛷️',
};

/* ── Shared expandable card wrapper ── */

function ExpandableCard({ children, className, footer }: {
  children: (toggle: () => void) => React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
}) {
  const { expanded, toggle } = useExpandable();
  const normalizedClassName = className?.split(' ').filter((name) => name !== 'surface').join(' ');
  return (
    <section className={`surface interactive${normalizedClassName ? ` ${normalizedClassName}` : ''}${expanded ? ' expanded' : ''}`}>
      {children(toggle)}
      {footer}
    </section>
  );
}

/* ── Sleep / Readiness Card ── */

function SubjectiveAndHRInputs() {
  const [hrInput, setHrInput] = useState('');
  const [selectedFeeling, setSelectedFeeling] = useState<number | null>(null);
  const { dispatch: logHR } = useCommand(handleLogRestingHR);
  const { dispatch: logFeeling } = useCommand(handleLogSubjectiveRPE);
  const todayFeeling = getTodaySubjectiveRPE();

  async function submitHR() {
    const bpm = parseInt(hrInput, 10);
    if (!bpm || bpm < 30 || bpm > 200) return;
    await logHR({ type: 'LogRestingHR', userId: USER_ID, bpm, date: new Date().toISOString().slice(0, 10) });
    setHrInput('');
  }

  async function submitFeeling(score: number) {
    setSelectedFeeling(score);
    await logFeeling({ type: 'LogSubjectiveRPE', userId: USER_ID, score });
  }

  return (
    <div className="column">
      <div className="row">
        <input
          className="input"
          type="number"
          placeholder="Resting HR"
          value={hrInput}
          onChange={(event) => setHrInput(event.target.value)}
          min={30}
          max={200}
        />
        <button className="secondary" onClick={submitHR}>Log HR</button>
      </div>
      <div className="column">
        <p className="caption">How do you feel today?</p>
        <div className="row">
          {[1, 2, 3, 4, 5].map((score) => (
            <button
              key={score}
              className={selectedFeeling === score || (todayFeeling === score && selectedFeeling == null) ? 'primary' : 'secondary'}
              onClick={() => submitFeeling(score)}
            >
              {score}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SleepCard({ score, scoreClass, readiness }: {
  score: number; scoreClass: keyof typeof RING_COLORS; readiness: TodayReadinessView | null;
}) {
  const stroke = RING_COLORS[scoreClass];

  return (
    <ExpandableCard>
      {(toggle) => (
        <>
          <header className="row space-between" onClick={toggle}>
            <h3>Readiness</h3>
            <span>›</span>
          </header>
          <div className="row space-between">
            <div>
              <p className={`value ${scoreClass}`}>{score}</p>
              <span className="caption">
                {readiness?.hasEntry ? `${readiness.sleep}/10 sleep · Logged` : 'Not logged'}
              </span>
            </div>
            <ScoreRing score={score} color={stroke} subtitle="readiness" size={80} />
          </div>
          <div className="expandable column" onClick={e => e.stopPropagation()}>
            <h3>Readiness Factors</h3>
            {readiness?.hasEntry && (
              <div className="column ">
                {[
                  { label: 'Sleep quality', value: readiness.sleep },
                  { label: 'Energy', value: readiness.energy },
                  { label: 'Mood', value: readiness.mood },
                  { label: 'Soreness (inv.)', value: 10 - readiness.soreness },
                ].map((factor) => (
                  <div key={factor.label} className="row space-between">
                    <span className="caption">{factor.label}</span>
                    <progress value={factor.value} max={10} />
                  </div>
                ))}
              </div>
            )}
            <p>{score >= 80 ? 'Ready to train' : score >= 60 ? 'Take it easy' : 'Rest day'}</p>
            <SubjectiveAndHRInputs />
          </div>
        </>
      )}
    </ExpandableCard>
  );
}

/* ── Conditions Card ── */

function ConditionsCard({ conditions, suitability }: {
  conditions: WeatherCondition | null; suitability: SuitabilityEntry[];
}) {
  if (!conditions) {
    return (
      <section className="surface compact">
        <h3>Conditions</h3>
        <p>Loading…</p>
      </section>
    );
  }

  return (
    <ExpandableCard className="compact">
      {(toggle) => (
        <>
          <header className="row space-between" onClick={toggle}>
            <h3>Conditions</h3>
            <span>›</span>
          </header>
          <div className="row">
            <span>{conditions.icon}</span>
            <div>
              <p className="value">{conditions.tempCelsius}°</p>
              <span className="caption">Humidity {conditions.humidity}% · Wind {conditions.windKph} km/h</span>
            </div>
          </div>
          <div className="expandable column" onClick={e => e.stopPropagation()}>
            <h3>Details</h3>
            <div className="column ">
              <div className="row space-between">
                <span className="caption">Description</span>
                <span>{conditions.description}</span>
              </div>
              <div className="row space-between">
                <span className="caption">Wind</span>
                <span className="value">{conditions.windKph} km/h</span>
              </div>
              {suitability.length > 0 && (
                <div className="row space-between align-top">
                  <span className="caption">Sport suitability</span>
                  <div className="column">
                    {suitability.map(s => (
                      <span key={s.sport} className={`pill ${s.suitability}`}>
                        {SPORT_ICONS[s.sport]} {s.sport}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </ExpandableCard>
  );
}

/* ── Schedule Card ── */

function ScheduleCard({ appointments }: { appointments: Appointment[]; }) {
  return (
    <ExpandableCard className="compact">
      {(toggle) => (
        <>
          <header className="row space-between" onClick={toggle}>
            <h3>Schedule</h3>
            <span>›</span>
          </header>
          {appointments.length === 0 ? (
            <p>No appointments today.</p>
          ) : (
            <>
              <div className="column ">
                {appointments.slice(0, 2).map(a => (
                  <div key={a.id} className="row  align-center">
                    <div className="block bg-primary radius-1" style={{ width: 6, minHeight: 48, flex: 'none' }} />
                    <div>
                      <p>{a.title}</p>
                      <time className="caption">
                        {new Date(a.scheduledAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        {' · '}{a.durationMinutes} min
                      </time>
                    </div>
                  </div>
                ))}
              </div>
              <div className="expandable column " onClick={e => e.stopPropagation()}>
                {appointments.slice(2).map(a => (
                  <div key={a.id} className="row  align-center">
                    <div className="block bg-primary radius-1" style={{ width: 6, minHeight: 48, flex: 'none' }} />
                    <div>
                      <p>{a.title}</p>
                      <time className="caption">
                        {new Date(a.scheduledAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        {' · '}{a.durationMinutes} min
                      </time>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </ExpandableCard>
  );
}

/* ── Welcome Widget ── */

function WelcomeWidget({ workoutsThisWeek, scoreClass }: {
  workoutsThisWeek: number;
  scoreClass: 'good' | 'warning' | 'poor';
}) {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const day  = now.toLocaleDateString(undefined, { weekday: 'long' });
  const date = now.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });

  const workoutLine = workoutsThisWeek === 0
    ? 'No workouts logged yet this week.'
    : workoutsThisWeek === 1
    ? 'One workout this week.'
    : `${workoutsThisWeek} workouts this week.`;

  const recoveryWord = scoreClass === 'good' ? 'green' : scoreClass === 'warning' ? 'amber' : 'red';

  return (
    <div className="column">
      <span className="caption">{day} · {date}</span>
      <h2>{ greeting }, Luca.</h2>
      <p className="detail">
        {workoutLine} Recovery is <span className={`value ${scoreClass}`}>{recoveryWord}</span>. Let's keep it rolling.
      </p>
    </div>
  );
}

/* ── Dashboard Screen ── */

export function DashboardScreen() {
  const readiness = useQuery<TodayReadinessView>('today_readiness');
  const history = (useQuery<SessionHistoryItem[]>('session_history') ?? []) as SessionHistoryItem[];
  const conditions = useQuery<WeatherCondition>('current_conditions');
  const suitability = (useQuery<SuitabilityEntry[]>('suitability_by_sport') ?? []) as SuitabilityEntry[];
  const allAppointments = (useQuery<Appointment[]>('appointments_by_date') ?? []) as Appointment[];
  const { dispatch: refreshConditions } = useCommand(handleRefreshConditions);

  useEffect(() => {
    refreshConditions({ type: 'RefreshConditions' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const SCORE = readiness?.hasEntry ? readiness.score : 82;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  const todayAppointments = allAppointments.filter(
    a => a.scheduledAt >= startOfToday.getTime() && a.scheduledAt <= endOfToday.getTime()
  );

  const scoreClass = SCORE >= 80 ? 'good' as const : SCORE >= 60 ? 'warning' as const : 'poor' as const;

  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const workoutsThisWeek = history.filter(s => new Date(s.startedAt) >= startOfWeek).length;

  const sleepHistory = (useQuery<SleepEntryView[]>('sleep_history') ?? []) as SleepEntryView[];
  const sleepWeek = sleepHistory.slice(0, 7).reverse().map(sleepEntryToSession);
  const lastNight = sleepWeek.length > 0 ? sleepWeek[sleepWeek.length - 1] : null;
  const weeklyTrend = sleepWeek.map(session => {
    const totalMinutes = Math.floor((session.end.getTime() - session.start.getTime()) / 60_000);
    return {
      day: DAY_LABELS[session.end.getDay()],
      value: Math.round(((totalMinutes - GOAL_MINUTES) / 60) * 10) / 10,
    };
  });

  const scoreHistory = sleepWeek.map((s) => ({
    x: s.end.toLocaleDateString(undefined, { weekday: 'short' }),
    y: s.score,
  }));

  return (<>
  <div className="column">
    <WelcomeWidget workoutsThisWeek={workoutsThisWeek} scoreClass={scoreClass} />
    <div className="auto-grid">
      {lastNight && <SleepLarge session={lastNight} goalMinutes={GOAL_MINUTES} weeklyTrend={weeklyTrend} scoreHistory={scoreHistory} />}
      <WeatherWidget />
      <CalendarLarge />
    </div>
    </div>
  </>
  );
}
