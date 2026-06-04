import { useQuery } from '@ui/bindings';
import type { SleepEntryView, SleepSession } from '@features/readiness/contract';
import { sleepEntryToSession } from '@features/readiness/queries';
import { SleepReviewWidget } from '@ui/components/widgets/SleepReviewWidget';
import { WeatherDashWidget, CalendarDashWidget } from '@ui/components/widgets/DashboardMiniWidgets';
import {
  ReadinessWidget, SleepBreakdownWidget, HRVWidget, RestingHRWidget,
  BodyBatteryWidget, PlanAdherenceWidget, WeeklyVolumeWidget,
  ActivityFeedWidget, ActiveGoalsWidget, MacrosWidget, CaloriesWidget,
  HabitsWidget, MonthlyDistanceWidget, InsightsWidget,
} from '@ui/components/widgets/DashWidgets';
import { ChartContainer } from '@ui/patterns/charts/charts';
import { Grid, Row, Column, Cluster } from '@ui/layout';
import { Surface, Text } from '@ui/atoms';
import { Button } from '@ui/molecules';
import { useWidgetPrototype, type WidgetSize, type WidgetInstance, type WidgetDef } from './useWidgetPrototype';

function useLastNightSession(): SleepSession | null {
  const history = (useQuery<SleepEntryView[]>('sleep_history') ?? []) as SleepEntryView[];
  const latest = history[history.length - 1];
  return latest ? sleepEntryToSession(latest) : null;
}

const REGISTRY: WidgetDef[] = [
  { id: 'sleep-review', label: 'Sleep Review', sizes: ['1x1', '2x1', '2x2'], Component: ({ size }) => {
    const lastNight = useLastNightSession();
    if (!lastNight) return null;
    return <SleepReviewWidget size={size} session={lastNight} />;
  } },
  { id: 'weather', label: 'Weather', sizes: ['1x1', '2x1', '2x2'], Component: WeatherDashWidget },
  { id: 'calendar', label: 'Calendar', sizes: ['1x1', '2x1', '2x2'], Component: ({ size }) => <CalendarDashWidget size={size} appointments={[]} /> },
  { id: 'readiness', label: 'Readiness', sizes: ['1x1', '2x1', '2x2'], Component: ReadinessWidget },
  { id: 'sleep-breakdown', label: 'Sleep Breakdown', sizes: ['2x1', '2x2'], Component: SleepBreakdownWidget },
  { id: 'hrv', label: 'HRV Trend', sizes: ['2x1', '2x2'], Component: HRVWidget },
  { id: 'resting-hr', label: 'Resting HR', sizes: ['1x1', '2x1'], Component: RestingHRWidget },
  { id: 'body-battery', label: 'Body Battery', sizes: ['1x1', '2x1'], Component: BodyBatteryWidget },
  { id: 'plan-adherence', label: 'Plan Adherence', sizes: ['1x1', '2x1'], Component: PlanAdherenceWidget },
  { id: 'weekly-volume', label: 'Weekly Volume', sizes: ['2x1', '2x2'], Component: WeeklyVolumeWidget },
  { id: 'activity-feed', label: 'Recent Sessions', sizes: ['2x1', '2x2'], Component: ActivityFeedWidget },
  { id: 'active-goals', label: 'Active Goals', sizes: ['2x1', '2x2'], Component: ActiveGoalsWidget },
  { id: 'macros', label: 'Macros', sizes: ['1x1', '2x1'], Component: MacrosWidget },
  { id: 'calories', label: 'Calories', sizes: ['1x1'], Component: CaloriesWidget },
  { id: 'habits', label: "Today's Habits", sizes: ['1x1', '2x1'], Component: HabitsWidget },
  { id: 'monthly-dist', label: 'Monthly Distance', sizes: ['2x1', '2x2'], Component: MonthlyDistanceWidget },
  { id: 'insights', label: 'Insights', sizes: ['2x1', '2x2'], Component: InsightsWidget },
];

interface WidgetCardProps {
  def: WidgetDef;
  instance: WidgetInstance;
  editMode: boolean;
  delay: number;
  onRemove: (id: string) => void;
  onCycleSize: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (id: string) => void;
}

function WidgetCard({ def, instance, editMode, delay, onRemove, onCycleSize, onDragStart, onDragOver, onDrop }: WidgetCardProps) {
  const { Component } = def;
  return (
    <div
      className={`widget-${instance.size} relative ${editMode ? 'widget-edit' : 'widget-enter'}`}
      style={{ '--anim-delay': `${delay}ms` } as React.CSSProperties}
      draggable={editMode}
      onDragStart={() => onDragStart(def.id)}
      onDragOver={e => { e.preventDefault(); onDragOver(e); }}
      onDrop={() => onDrop(def.id)}
    >
      {editMode && (
        <>
          <button
            className="widget-remove"
            onClick={e => { e.stopPropagation(); onRemove(def.id); }}
            aria-label="Remove widget"
          >×</button>
          <button
            className="widget-resize"
            onClick={e => { e.stopPropagation(); onCycleSize(def.id); }}
            aria-label="Resize widget"
            title={`Current: ${instance.size}`}
          >⤢</button>
        </>
      )}
      <Component size={instance.size} />
    </div>
  );
}

function AddWidgetPanel({ activeIds, onAdd }: { activeIds: Set<string>; onAdd: (id: string) => void }) {
  const available = REGISTRY.filter(d => !activeIds.has(d.id));
  if (available.length === 0) return (
    <Surface className="pad-sm">
      <Text size="caption" color="faint">All widgets are on the dashboard.</Text>
    </Surface>
  );
  return (
    <Surface className="pad-sm column">
      <Text size="eyebrow">Add Widget</Text>
      <Cluster>
        {available.map(d => (
          <Button key={d.id} size="sm" onClick={() => onAdd(d.id)}>{d.label}</Button>
        ))}
      </Cluster>
    </Surface>
  );
}

export function WidgetPrototypeScreen() {
  const {
    widgets,
    editMode,
    showAddPanel, setShowAddPanel,
    activeIds,
    cycleSize,
    removeWidget,
    addWidget,
    handleDragStart,
    handleDrop,
    enterEdit,
    exitEdit,
  } = useWidgetPrototype(REGISTRY);

  return (
    <>
      <style>{`
        @keyframes widget-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes wiggle {
          0%,100% { transform: rotate(-1.2deg) scale(1.01); }
          50%      { transform: rotate( 1.2deg) scale(1.01); }
        }
        .widget-enter { animation: widget-in .3s cubic-bezier(0.2,0.8,0.2,1) var(--anim-delay, 0ms) both; }
        .widget-edit  { animation: wiggle .35s ease-in-out infinite; cursor: grab; }
        .widget-remove {
          position: absolute; top: -10px; left: -10px; z-index: 20;
          width: 22px; height: 22px; padding: 0; border-radius: var(--r-pill);
          background: var(--bad); color: #fff; border: 2px solid var(--surface-0);
          font-size: 13px; font-weight: 700; cursor: pointer; line-height: 1;
        }
        .widget-resize {
          position: absolute; top: -10px; right: -10px; z-index: 20;
          width: 22px; height: 22px; padding: 0; border-radius: var(--r-pill);
          background: var(--surface-3); border: 2px solid var(--line-strong);
          cursor: pointer; font-size: 11px; line-height: 1;
        }
      `}</style>

      <Column>
        <Text as="h2">Widget Overview</Text>

        <Grid variant="widget">
          {widgets.map((instance, i) => {
            const def = REGISTRY.find(r => r.id === instance.id);
            if (!def) return null;
            return (
              <WidgetCard
                key={instance.id}
                def={def}
                instance={instance}
                editMode={editMode}
                delay={i * 35}
                onRemove={removeWidget}
                onCycleSize={cycleSize}
                onDragStart={handleDragStart}
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
              />
            );
          })}
        </Grid>

        <Row gap={1} className="pad-top">
          {editMode ? (
            <>
              <Button variant="primary" size="sm" onClick={exitEdit}>Done</Button>
              <Button size="sm" onClick={() => setShowAddPanel(p => !p)}>
                {showAddPanel ? 'Hide Panel' : 'Add Widget'}
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={enterEdit}>Edit Widgets</Button>
          )}
        </Row>

        {showAddPanel && (
          <AddWidgetPanel activeIds={activeIds} onAdd={addWidget} />
        )}
      </Column>
      <ChartContainer chartType='line' height={60}/>

      <Column>
        <Text as="h2">Chart Showcase</Text>

        {([
          'line', 'bar', 'area', 'composed',
          'pie', 'radar', 'radialbar', 'scatter',
          'stacked-bar', 'percent-area', 'area-fill-value',
          'positive-negative', 'brush-bar', 'timeline',
          'waterfall', 'banded',
        ] as const).map(type => (
          <Column key={type}>
            <Text size="eyebrow">{type}</Text>
            <ChartContainer chartType={type} height={160} />
          </Column>
        ))}
      </Column>
    </>
  );
}
