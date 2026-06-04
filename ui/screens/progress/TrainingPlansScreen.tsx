import { useState } from 'react';
import { Grid, Row, Column, Cluster } from '@ui/layout';
import { ProgressBar, Chip, Surface, Text } from '@ui/atoms';
import { Badge, Button, Input } from '@ui/molecules';
import { useCommand } from '@ui/bindings';
import { handleCreatePlan } from '@features/training_plans';
import type { TrainingPlan, PlanAdherence } from '@features/training_plans/contract';
import type { PlannedSession } from '@features/planning/contract';
import { CalendarGrid } from '@ui/components/widgets/CalendarWidgets';
import type { SportType } from '@features/training_log/contract';
import {
  useTrainingPlans,
  USER_ID, FILTERS, LEGEND, SPORT_COLOR, SPORT_LABEL, SPORT_TITLE, DOW_SHORT,
  weekStart, addDays, isSameDay,
  type CalView,
} from './useTrainingPlans';

// ─── PlanCard ────────────────────────────────────────────────────────────────

function PlanCard({ plan, adherenceRate }: { plan: TrainingPlan; adherenceRate: number }) {
  const pct = Math.round(adherenceRate * 100);
  const startMs = new Date(plan.startDate).getTime();
  const diffDays = Math.max(0, Math.floor((Date.now() - startMs) / 86_400_000));
  const currentWeek = Math.min(Math.floor(diffDays / 7) + 1, plan.durationWeeks);

  return (
    <Surface>
      <Column gap={1}>
        <Row justify="between" align="center">
          <Text as="h3">{plan.name}</Text>
          <Badge tone={pct >= 80 ? 'ok' : pct < 60 ? 'warn' : undefined}>{pct}%</Badge>
        </Row>
        <Text size="caption">Week {currentWeek} / {plan.durationWeeks} · Started {plan.startDate}</Text>
        <ProgressBar value={Math.min(100, (currentWeek / plan.durationWeeks) * 100)} />
      </Column>
    </Surface>
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
    <Surface>
      <Column gap={1}>
        <Text as="h3">New Plan</Text>
        <Input label="Plan name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. 4-Week Strength Block" />
        <Input label="Start date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        <Input label="Duration (weeks)" type="number" min={1} max={52} value={durationWeeks} onChange={e => setDurationWeeks(Number(e.target.value))} />
        <Row>
          <Button variant="primary" onClick={submit} disabled={pending}>Create Plan</Button>
          <Button variant="ghost" onClick={onCreated}>Cancel</Button>
        </Row>
      </Column>
    </Surface>
  );
}

// ─── WeekView ────────────────────────────────────────────────────────────────

function WeekView({ anchor, workoutCalendar }: { anchor: Date; workoutCalendar: Record<number, SportType[]> }) {
  const today = new Date();
  const monday = weekStart(anchor);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  // Collect unique event times for this week; always include 18:00 if any events
  const eventsByDow = new Map<number, SportType>();
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

  const eventBlockStyle = (sport: SportType): React.CSSProperties => ({
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
    <Surface>
      <Column gap={1}>
      {/* Day headers */}
      <div style={gridStyle}>
        <span />
        {days.map((d, i) => (
          <div key={i} className="column gap-1" style={{ alignItems: 'center', gap: 2 }}>
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
      </Column>
    </Surface>
  );
}

// ─── DayView ─────────────────────────────────────────────────────────────────

function DayView({ anchor, workoutCalendar }: { anchor: Date; workoutCalendar: Record<number, SportType[]> }) {
  const today = new Date();
  const isToday = isSameDay(anchor, today);
  const dateLabel = anchor.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  const sports = workoutCalendar[anchor.getDate()] ?? [];

  return (
    <Surface>
      <Column gap={1}>
        <Row justify="between" align="center">
          <Text bold>{dateLabel}</Text>
          {isToday && <Text className="badge ok">Today</Text>}
        </Row>
        <hr />

        {sports.length === 0 ? (
          <Text as="p" size="caption" color="muted">No events scheduled.</Text>
        ) : (
          <Column gap={1}>
            <Text size="eyebrow">18:00</Text>
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
          </Column>
        )}

        <Button variant="ghost" style={{ width: '100%', borderStyle: 'dashed' }}>+ Add event</Button>
      </Column>
    </Surface>
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
    <Surface>
      <Column gap={1}>
        <Row align="center" justify="between">
          <Row gap={1} align="center">
            <span aria-hidden>{PLAN_EMOJI[plan.type] ?? '📋'}</span>
            <Text size="detail">{plan.name}</Text>
          </Row>
          <Text size="caption" color="muted">{when}</Text>
        </Row>
        {plan.distanceKm != null && (
          <Text size="caption" color="muted">{plan.distanceKm} km</Text>
        )}
        {plan.exercises && plan.exercises.length > 0 && (
          <Text size="caption" color="muted">{plan.exercises.length} exercises</Text>
        )}
      </Column>
    </Surface>
  );
}

// ─── TrainingPlansScreen ─────────────────────────────────────────────────────

export function TrainingPlansScreen() {
  const {
    calView, setCalView,
    activeFilters,
    showPanel, setShowPanel,
    panelView, setPanelView,
    currentDate,
    workoutCalendar,
    plans,
    adherence,
    upcomingPlanned,
    navLabel, monthLabel, upcoming,
    prev, next, toggleFilter,
  } = useTrainingPlans();

  return (
    <Grid>

      {upcomingPlanned.length > 0 && (
        <Surface>
          <Column gap={1}>
            <Text size="caption">PLANNED SESSIONS</Text>
            {upcomingPlanned.map(plan => (
              <PlannedSessionCard key={plan.id} plan={plan} />
            ))}
          </Column>
        </Surface>
      )}

      {/* Header */}
      <Row justify="between" align="center">
        <Column gap={1}>
          <Text size="eyebrow">Schedule · {monthLabel}</Text>
          <Text as="h1">Training plan.</Text>
        </Column>
        <Button variant="primary" onClick={() => { setShowPanel(v => !v); setPanelView('plans'); }}>
          {showPanel ? 'Close' : '+ Add event'}
        </Button>
      </Row>

      {/* Plan management panel */}
      {showPanel && (
        panelView === 'builder' ? (
          <PlanBuilder onCreated={() => { setPanelView('plans'); setShowPanel(false); }} />
        ) : (
          <Column>
            <Row justify="between" align="center">
              <Text as="h3">Training Plans</Text>
              <Button variant="primary" onClick={() => setPanelView('builder')}>New Plan</Button>
            </Row>
            {plans.length === 0
              ? <Text as="p" size="caption" color="muted">No plans yet.</Text>
              : plans.map(plan => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  adherenceRate={adherence?.planId === plan.id ? adherence.adherenceRate : 1}
                />
              ))
            }
          </Column>
        )
      )}

      {/* View toggle + navigation */}
      <Row justify="between" align="center">
        <Row gap={1}>
          {(['month', 'week', 'day'] as CalView[]).map(v => (
            <Chip key={v} active={calView === v} onClick={() => setCalView(v)}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </Chip>
          ))}
        </Row>
        <Row gap={1} align="center">
          <Button variant="ghost" size="icon" onClick={prev}>‹</Button>
          <Text size="caption" bold>{navLabel}</Text>
          <Button variant="ghost" size="icon" onClick={next}>›</Button>
        </Row>
      </Row>

      {/* Filter chips */}
      <Row>
        {FILTERS.map(f => (
          <Chip
            key={f.label}
            className="nowrap shrink-0"
            active={activeFilters.has(f.label)}
            onClick={() => toggleFilter(f.label)}
            leading={<span className="dot sm" style={{ '--dot-color': f.color } as React.CSSProperties} />}
          >
            {f.label}
          </Chip>
        ))}
      </Row>

      {/* Month view */}
      {calView === 'month' && (
        <>
          <Surface>
            <Column gap={1}>
              <CalendarGrid year={currentDate.getFullYear()} month={currentDate.getMonth()} />
              <Cluster>
                {LEGEND.map(l => (
                  <Row key={l.label} align="center" gap={1} className="caption">
                    <span className="dot sm" style={{ '--dot-color': l.color } as React.CSSProperties} />
                    <Text color="muted">{l.label}</Text>
                  </Row>
                ))}
              </Cluster>
            </Column>
          </Surface>

          <Text as="h3">Coming up</Text>
          {upcoming.length === 0
            ? <Text as="p" size="caption" color="muted">No upcoming events this month.</Text>
            : (
              <Column gap={1}>
                {upcoming.map(ev => (
                  <Surface key={ev.day}>
                    <Row align="center">
                      <Column gap={1} align="center">
                        <Text size="caption" mono>{ev.monthLabel}</Text>
                        <Text size="caption">{ev.day}</Text>
                      </Column>
                      <Column gap={1} className="grow">
                        <Row justify="between" align="center">
                          <Text size="detail">{ev.title}</Text>
                          <Text className={`badge ${ev.sport}`}>{SPORT_LABEL[ev.sport]}</Text>
                        </Row>
                        <Text size="caption">{ev.time}</Text>
                      </Column>
                    </Row>
                  </Surface>
                ))}
              </Column>
            )
          }
        </>
      )}

      {/* Week view */}
      {calView === 'week' && <WeekView anchor={currentDate} workoutCalendar={workoutCalendar} />}

      {/* Day view */}
      {calView === 'day' && <DayView anchor={currentDate} workoutCalendar={workoutCalendar} />}

    </Grid>
  );
}
