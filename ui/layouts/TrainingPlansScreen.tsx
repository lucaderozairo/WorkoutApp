import { useState } from 'react';
import { useCommand, useQuery } from '@ui/bindings';
import {
  handleCreatePlan,
  getPlanAdherence,
} from '@features/training_plans';
import type { TrainingPlan, PlanAdherence } from '@features/training_plans';
import type { Id } from '@shared/types';
import type { PlannedSession } from '@features/planning';
import { CalendarGrid } from '@ui/components/widgets/CalendarWidgets';
import type { Sport } from '@data/mock/workouts';

const USER_ID = 'user-001' as Id<'User'>;

type CalView = 'month' | 'week' | 'day';

const FILTERS = [
  { label: 'Strength', color: 'var(--c-strength)' },
  { label: 'Cardio', color: 'var(--c-cardio)' },
  { label: 'Mobility', color: 'var(--c-mind)' },
  { label: 'Recovery', color: 'var(--c-recovery)' },
];

const LEGEND = [
  { label: 'Strength', color: 'var(--c-strength)' },
  { label: 'Cardio', color: 'var(--c-cardio)' },
  { label: 'Mobility', color: 'var(--c-mind)' },
  { label: 'Appt.', color: 'var(--ink-muted)' },
];

const SPORT_COLOR: Record<Sport, string> = {
  lift: 'var(--c-strength)',
  run: 'var(--c-cardio)',
  cycle: 'var(--c-nutrition)',
  swim: 'var(--c-water)',
  rowing: 'var(--c-recovery)',
};

const SPORT_LABEL: Record<Sport, string> = {
  lift: 'Strength', run: 'Cardio', cycle: 'Cardio', swim: 'Cardio', rowing: 'Cardio',
};

const SPORT_TITLE: Record<Sport, string> = {
  lift: 'Strength Session', run: 'Morning Run', cycle: 'Easy Ride', swim: 'Swim Session', rowing: 'Rowing',
};

const DOW_SHORT = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

// Monday of the week containing `date`
function weekStart(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - (d.getDay() + 6) % 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function getUpcoming(year: number, month: number, todayCutoff: number, workoutCalendar: Record<number, Sport[]>) {
  const isCurrentMonth = new Date().getFullYear() === year && new Date().getMonth() === month;
  const cutoff = isCurrentMonth ? todayCutoff : 0;
  const monthLabel = new Date(year, month, 1).toLocaleString('en-US', { month: 'short' }).toUpperCase();

  return Object.entries(workoutCalendar)
    .map(([d, sports]) => ({ day: Number(d), sport: sports[0] }))
    .filter(({ day }) => day > cutoff)
    .slice(0, 4)
    .map(({ day, sport }) => ({ day, monthLabel, sport, title: SPORT_TITLE[sport], time: '18:00 · ~55 min est.' }));
}

// ─── PlanCard ────────────────────────────────────────────────────────────────

function PlanCard({ plan, adherenceRate }: { plan: TrainingPlan; adherenceRate: number }) {
  const pct = Math.round(adherenceRate * 100);
  const startMs = new Date(plan.startDate).getTime();
  const diffDays = Math.max(0, Math.floor((Date.now() - startMs) / 86_400_000));
  const currentWeek = Math.min(Math.floor(diffDays / 7) + 1, plan.durationWeeks);

  return (
    <div className="surface column compact">
      <div className="row space-between align-center">
        <h3>{plan.name}</h3>
        <span className={`pill${pct >= 80 ? ' pill--ok' : pct >= 60 ? '' : ' pill--warn'}`}>{pct}%</span>
      </div>
      <span className="caption">Week {currentWeek} / {plan.durationWeeks} · Started {plan.startDate}</span>
      <progress value={currentWeek} max={plan.durationWeeks} />
    </div>
  );
}

// ─── PlanBuilder ─────────────────────────────────────────────────────────────

function PlanBuilder({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [durationWeeks, setDurationWeeks] = useState(4);
  const { dispatch: createPlan, pending } = useCommand(handleCreatePlan);

  async function submit() {
    if (!name.trim() || !startDate) return;
    await createPlan({ type: 'CreatePlan', userId: USER_ID, name: name.trim(), startDate, durationWeeks });
    onCreated();
  }

  return (
    <div className="surface column">
      <h3>New Plan</h3>
      <div className="column">
        <label className="caption">Plan name</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. 4-Week Strength Block" />
        <label className="caption">Start date</label>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        <label className="caption">Duration (weeks)</label>
        <input type="number" min={1} max={52} value={durationWeeks} onChange={e => setDurationWeeks(Number(e.target.value))} />
        <div className="row">
          <button className="primary" onClick={submit} disabled={pending}>Create Plan</button>
          <button className="ghost" onClick={onCreated}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── WeekView ────────────────────────────────────────────────────────────────

function WeekView({ anchor, workoutCalendar }: { anchor: Date; workoutCalendar: Record<number, Sport[]> }) {
  const today = new Date();
  const monday = weekStart(anchor);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  // Collect unique event times for this week; always include 18:00 if any events
  const eventsByDow = new Map<number, Sport>();
  days.forEach((d, i) => {
    const sports = workoutCalendar[d.getDate()];
    if (sports?.length) eventsByDow.set(i, sports[0]);
  });

  const dayCircleStyle = (d: Date, dow: number): React.CSSProperties => {
    const sport = eventsByDow.get(dow);
    if (isSameDay(d, today)) return { background: 'var(--ink)', color: 'var(--surface-1)' };
    if (sport) return { background: `color-mix(in oklab, ${SPORT_COLOR[sport]} 12%, var(--surface-2))` };
    return {};
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '40px repeat(7, 1fr)',
    gap: 2,
  };

  const eventBlockStyle = (sport: Sport): React.CSSProperties => ({
    background: 'var(--accent-soft)',
    borderRadius: 4,
    padding: '4px 6px',
    fontSize: 10,
    fontWeight: 500,
    color: 'var(--accent)',
    borderLeft: `2px solid var(--accent)`,
  });

  const circleBase: React.CSSProperties = {
    width: 28, height: 28,
    borderRadius: 'var(--r-sm)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-mono)',
    fontSize: 'var(--t-xs)',
  };

  return (
    <div className="surface column compact">
      {/* Day headers */}
      <div style={gridStyle}>
        <span />
        {days.map((d, i) => (
          <div key={i} className="column compact" style={{ alignItems: 'center', gap: 2 }}>
            <span className="mono" style={{ fontSize: 9, color: 'var(--ink-faint)' }}>{DOW_SHORT[i]}</span>
            <span style={{ ...circleBase, ...dayCircleStyle(d, i) }}>{d.getDate()}</span>
          </div>
        ))}
      </div>

      {/* Time slots */}
      {eventsByDow.size === 0 ? (
        <p className="caption muted" style={{ marginTop: 'var(--s-2)' }}>No scheduled events this week.</p>
      ) : (
        <div style={{ ...gridStyle, marginTop: 'var(--s-2)' }}>
          <span className="mono" style={{ fontSize: 9, color: 'var(--ink-faint)', paddingTop: 4 }}>18:00</span>
          {days.map((_, i) => {
            const sport = eventsByDow.get(i);
            return sport
              ? <div key={i} style={eventBlockStyle(sport)}>{SPORT_TITLE[sport]}</div>
              : <span key={i} />;
          })}
        </div>
      )}
    </div>
  );
}

// ─── DayView ─────────────────────────────────────────────────────────────────

function DayView({ anchor, workoutCalendar }: { anchor: Date; workoutCalendar: Record<number, Sport[]> }) {
  const today = new Date();
  const isToday = isSameDay(anchor, today);
  const dateLabel = anchor.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  const sports = workoutCalendar[anchor.getDate()] ?? [];

  return (
    <div className="surface column compact">
      <div className="row space-between align-center">
        <span style={{ fontWeight: 600 }}>{dateLabel}</span>
        {isToday && <span className="pill pill--ok">Today</span>}
      </div>
      <hr />

      {sports.length === 0 ? (
        <p className="caption muted">No events scheduled.</p>
      ) : (
        <div className="column compact">
          <span className="eyebrow">18:00</span>
          {sports.map((sport, i) => (
            <div key={i} style={{
              background: 'var(--accent-soft)',
              borderRadius: 'var(--r-sm)',
              padding: 'var(--s-3)',
              borderLeft: '3px solid var(--accent)',
            }}>
              <span style={{ fontWeight: 600, fontSize: 'var(--t-sm)', display: 'block' }}>{SPORT_TITLE[sport]}</span>
              <span className="muted" style={{ display: 'block', fontSize: 'var(--t-xs)' }}>{SPORT_LABEL[sport]} · ~55 min est.</span>
            </div>
          ))}
        </div>
      )}

      <button className="ghost" style={{ width: '100%', borderStyle: 'dashed' }}>+ Add event</button>
    </div>
  );
}

// ─── PlannedSessionCard ───────────────────────────────────────────────────────

const PLAN_EMOJI: Record<string, string> = {
  gym: '🏋️', run: '🏃', cycle: '🚴', swim: '🏊',
};

function PlannedSessionCard({ plan }: { plan: PlannedSession }) {
  const when = new Date(plan.scheduledAt).toLocaleString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  });
  return (
    <div className="surface column compact">
      <div className="row align-center space-between">
        <div className="row compact align-center">
          <span aria-hidden>{PLAN_EMOJI[plan.type] ?? '📋'}</span>
          <span className="detail">{plan.name}</span>
        </div>
        <span className="caption muted">{when}</span>
      </div>
      {plan.distanceKm != null && (
        <span className="caption muted">{plan.distanceKm} km</span>
      )}
      {plan.exercises && plan.exercises.length > 0 && (
        <span className="caption muted">{plan.exercises.length} exercises</span>
      )}
    </div>
  );
}

// ─── TrainingPlansScreen ─────────────────────────────────────────────────────

export function TrainingPlansScreen() {
  const [calView, setCalView] = useState<CalView>('month');
  const [activeFilters, setActiveFilters] = useState(new Set(['Strength', 'Cardio', 'Mobility', 'Recovery']));
  const [showPanel, setShowPanel] = useState(false);
  const [panelView, setPanelView] = useState<'plans' | 'builder'>('plans');
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const workoutCalendar = (useQuery<Record<number, Sport[]>>('workout_calendar') ?? {}) as Record<number, Sport[]>;
  const plans = (useQuery<TrainingPlan[]>('plan_list') ?? []) as TrainingPlan[];
  const adherence = (useQuery<PlanAdherence>('plan_adherence') ?? getPlanAdherence()) as PlanAdherence | null;
  const plannedSessions = (useQuery<PlannedSession[]>('planned_sessions') ?? []) as PlannedSession[];
  const upcomingPlanned = plannedSessions
    .filter(p => p.scheduledAt > Date.now())
    .slice(0, 10);

  const today = new Date();

  // Navigation — behaviour differs per view
  function prev() {
    if (calView === 'month') setCurrentDate(d => { const n = new Date(d); n.setMonth(n.getMonth() - 1); return n; });
    else if (calView === 'week') setCurrentDate(d => addDays(d, -7));
    else setCurrentDate(d => addDays(d, -1));
  }
  function next() {
    if (calView === 'month') setCurrentDate(d => { const n = new Date(d); n.setMonth(n.getMonth() + 1); return n; });
    else if (calView === 'week') setCurrentDate(d => addDays(d, 7));
    else setCurrentDate(d => addDays(d, 1));
  }

  // Label changes per view
  let navLabel: string;
  if (calView === 'month') {
    navLabel = currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  } else if (calView === 'week') {
    const mon = weekStart(currentDate);
    const sun = addDays(mon, 6);
    const mo = mon.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const su = sun.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    navLabel = `${mo} – ${su}`;
  } else {
    navLabel = currentDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }

  const monthLabel = currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const upcoming = getUpcoming(currentDate.getFullYear(), currentDate.getMonth(), today.getDate(), workoutCalendar);

  function toggleFilter(label: string) {
    setActiveFilters(prev => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  }

  return (
    <div className="column">

      {upcomingPlanned.length > 0 && (
        <div className="surface column">
          <span className="caption">PLANNED SESSIONS</span>
          <div className="column compact">
            {upcomingPlanned.map(plan => (
              <PlannedSessionCard key={plan.id} plan={plan} />
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <header className="row space-between align-center">
        <div className="column compact">
          <span className="eyebrow">Schedule · {monthLabel}</span>
          <h1>Training plan.</h1>
        </div>
        <button className="primary" onClick={() => { setShowPanel(v => !v); setPanelView('plans'); }}>
          {showPanel ? 'Close' : '+ Add event'}
        </button>
      </header>

      {/* Plan management panel */}
      {showPanel && (
        panelView === 'builder' ? (
          <PlanBuilder onCreated={() => { setPanelView('plans'); setShowPanel(false); }} />
        ) : (
          <div className="column">
            <div className="row space-between align-center">
              <h3>Training Plans</h3>
              <button className="primary" onClick={() => setPanelView('builder')}>New Plan</button>
            </div>
            {plans.length === 0
              ? <p className="caption muted">No plans yet.</p>
              : plans.map(plan => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  adherenceRate={adherence?.planId === plan.id ? adherence.adherenceRate : 1}
                />
              ))
            }
          </div>
        )
      )}

      {/* View toggle + navigation */}
      <div className="row space-between align-center">
        <div className="row compact">
          {(['month', 'week', 'day'] as CalView[]).map(v => (
            <button
              key={v}
              className={`chip${calView === v ? ' chip--active' : ''}`}
              onClick={() => setCalView(v)}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
        <div className="row compact align-center">
          <button className="ghost icon" onClick={prev}>‹</button>
          <span className="caption" style={{ fontWeight: 600 }}>{navLabel}</span>
          <button className="ghost icon" onClick={next}>›</button>
        </div>
      </div>

      {/* Filter chips */}
      <div className="row" style={{ overflowX: 'auto', paddingBottom: 4 }}>
        {FILTERS.map(f => (
          <button
            key={f.label}
            className={`chip${activeFilters.has(f.label) ? ' chip--active' : ''}`}
            style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
            onClick={() => toggleFilter(f.label)}
          >
            <span className="chip__dot" style={{ '--dot': f.color } as React.CSSProperties} />
            {f.label}
          </button>
        ))}
      </div>

      {/* Month view */}
      {calView === 'month' && (
        <>
          <div className="surface column compact">
            <CalendarGrid year={currentDate.getFullYear()} month={currentDate.getMonth()} />
            <div className="cluster" style={{ marginTop: 'var(--s-3)' }}>
              {LEGEND.map(l => (
                <div key={l.label} className="row align-center compact" style={{ fontSize: 'var(--t-xs)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: l.color, display: 'inline-block', flexShrink: 0 }} />
                  <span className="muted">{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          <h3>Coming up</h3>
          {upcoming.length === 0
            ? <p className="caption muted">No upcoming events this month.</p>
            : (
              <div className="column compact">
                {upcoming.map(ev => (
                  <div key={ev.day} className="surface row align-center compact">
                    <div style={{
                      width: 42, height: 42, borderRadius: 'var(--r-md)',
                      background: 'var(--accent-soft)', display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <span className="mono" style={{ fontSize: 9, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{ev.monthLabel}</span>
                      <span style={{ fontSize: 'var(--t-lg)', lineHeight: 1 }}>{ev.day}</span>
                    </div>
                    <div className="column compact" style={{ flex: 1 }}>
                      <div className="row space-between align-center">
                        <span className="detail">{ev.title}</span>
                        <span className={`pill ${ev.sport}`}>{SPORT_LABEL[ev.sport]}</span>
                      </div>
                      <span className="caption">{ev.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </>
      )}

      {/* Week view */}
      {calView === 'week' && <WeekView anchor={currentDate} workoutCalendar={workoutCalendar} />}

      {/* Day view */}
      {calView === 'day' && <DayView anchor={currentDate} workoutCalendar={workoutCalendar} />}

    </div>
  );
}
