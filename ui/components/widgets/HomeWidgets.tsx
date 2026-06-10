import { Surface, Text, Metric } from '@ui/atoms';
import { Badge } from '@ui/molecules';
import { Column, Row, Spacer } from '@ui/layout';
import { SparklineArea } from '@ui/patterns/charts/domain-charts';
import type { WidgetSize } from './widgetTypes';

// ── Shared helpers ────────────────────────────────────────────────────────────

const SCORE_7DAY = [
  { x: 'M', y: 74 }, { x: 'T', y: 68 }, { x: 'W', y: 82 },
  { x: 'T', y: 79 }, { x: 'F', y: 85 }, { x: 'S', y: 71 }, { x: 'S', y: 89 },
];

const HRV_7DAY = [
  { x: 'M', y: 58 }, { x: 'T', y: 54 }, { x: 'W', y: 61 },
  { x: 'T', y: 59 }, { x: 'F', y: 63 }, { x: 'S', y: 57 }, { x: 'S', y: 65 },
];

const MACRO_KEYS = ['protein', 'carbs', 'fat'] as const;

// ── Readiness ─────────────────────────────────────────────────────────────────

export function ReadinessHomeWidget({ size }: { size: WidgetSize }) {
  if (size === 'sm') {
    return (
      <Surface pad="sm" className="h-full">
        <Column gap={1} className="h-full" justify="between">
          <Text size="caption" color="muted">Readiness</Text>
          <Metric value={82} size="xl" />
        </Column>
      </Surface>
    );
  }

  if (size === 'wide') {
    return (
      <Surface pad="sm" className="h-full">
        <Row align="center" className="h-full" gap={3}>
          <Column gap={0} className="min-w-0">
            <Text size="caption" color="muted">Readiness</Text>
            <Metric value={82} unit="/100" size="lg" />
          </Column>
          <div className="home-widget-divider" />
          <Column gap={0} className="min-w-0">
            <Text size="caption" color="muted">Load</Text>
            <Metric value={41} size="lg" />
          </Column>
        </Row>
      </Surface>
    );
  }

  // md / lg
  return (
    <Surface pad="sm" className="h-full">
      <Column gap={2} className="h-full">
        <Row align="center" justify="between" gap={2}>
          <Text size="caption" color="muted">Readiness</Text>
          <Badge>Steady</Badge>
        </Row>
        <Row align="center" gap={3}>
          <Metric value={82} unit="/100" size="xl" />
          <Column gap={0}>
            <Text size="detail">Load 41</Text>
            <Text size="detail" color="muted">Moderate session ok</Text>
          </Column>
        </Row>
        <div className="min-w-0 min-h-0">
          <SparklineArea data={SCORE_7DAY} color="var(--color-positive)" height={40} id="hw-readiness" />
        </div>
      </Column>
    </Surface>
  );
}

// ── HRV ───────────────────────────────────────────────────────────────────────

export function HRVHomeWidget({ size }: { size: WidgetSize }) {
  if (size === 'sm') {
    return (
      <Surface pad="sm" className="h-full">
        <Column gap={1} className="h-full" justify="between">
          <Text size="caption" color="muted">HRV</Text>
          <Metric value={54} unit="ms" size="xl" />
        </Column>
      </Surface>
    );
  }

  // wide / md / lg
  return (
    <Surface pad="sm" className="h-full">
      <Row align="center" className="h-full" gap={3}>
        <Column gap={0} className="min-w-0">
          <Text size="caption" color="muted">HRV</Text>
          <Metric value={54} unit="ms" size="lg" />
          <Text size="detail" color="muted">+4 vs baseline</Text>
        </Column>
        {size !== 'wide' && (
          <div className="min-w-0">
            <SparklineArea data={HRV_7DAY} color="var(--color-primary)" height={50} id="hw-hrv" />
          </div>
        )}
      </Row>
    </Surface>
  );
}

// ── Sleep ─────────────────────────────────────────────────────────────────────

const SLEEP_7DAY = [
  { x: 'M', y: 74 }, { x: 'T', y: 81 }, { x: 'W', y: 68 },
  { x: 'T', y: 85 }, { x: 'F', y: 76 }, { x: 'S', y: 90 }, { x: 'S', y: 89 },
];

export function SleepHomeWidget({ size }: { size: WidgetSize }) {
  if (size === 'sm') {
    return (
      <Surface pad="sm" className="h-full">
        <Column gap={1} className="h-full" justify="between">
          <Text size="caption" color="muted">Sleep</Text>
          <Metric value={89} size="xl" />
        </Column>
      </Surface>
    );
  }

  if (size === 'wide') {
    return (
      <Surface pad="sm" className="h-full">
        <Row align="center" className="h-full" gap={3}>
          <Column gap={0} className="min-w-0">
            <Text size="caption" color="muted">Sleep</Text>
            <Metric value={89} unit="/100" size="lg" />
          </Column>
          <div className="home-widget-divider" />
          <Column gap={0} className="min-w-0">
            <Text size="caption" color="muted">Duration</Text>
            <Metric value="7h 23m" size="lg" />
          </Column>
        </Row>
      </Surface>
    );
  }

  // md / lg — two rows available (~207px)
  return (
    <Surface pad="sm" className="h-full">
      <Column gap={2} className="h-full">
        <Row align="center" justify="between" gap={2}>
          <Text size="caption" color="muted">Sleep</Text>
          <Badge>Good</Badge>
        </Row>
        <Row align="center" gap={3}>
          <Metric value={89} unit="/100" size="xl" />
          <Column gap={0}>
            <Text size="detail">7h 23m</Text>
            <Text size="detail" color="muted">Deep 1h 18m · REM 1h 54m</Text>
          </Column>
        </Row>
        <div className="min-w-0">
          <SparklineArea data={SLEEP_7DAY} color="var(--color-primary)" height={40} id="hw-sleep" showTooltip tooltipFormatter={v => `Score ${v}`} />
        </div>
      </Column>
    </Surface>
  );
}

// ── Weather ───────────────────────────────────────────────────────────────────

const HOURLY = [
  { h: '2pm', icon: '⛅', t: 19 },
  { h: '4pm', icon: '☁',  t: 17 },
  { h: '6pm', icon: '🌧', t: 14 },
  { h: '8pm', icon: '🌧', t: 12 },
  { h: '10pm', icon: '🌙', t: 10 },
];

export function WeatherHomeWidget({ size }: { size: WidgetSize }) {
  if (size === 'sm') {
    return (
      <Surface pad="sm" className="h-full">
        <Column gap={0} className="h-full" align="center" justify="center">
          <span aria-hidden="true" className="home-weather-icon">⛅</span>
          <Metric value={18} unit="°" size="lg" />
        </Column>
      </Surface>
    );
  }

  if (size === 'wide') {
    return (
      <Surface pad="sm" className="h-full">
        <Row align="center" className="h-full" gap={3}>
          <Row align="center" gap={2}>
            <span aria-hidden="true" className="home-weather-icon">⛅</span>
            <Column gap={0}>
              <Metric value={18} unit="°C" size="lg" />
              <Text size="detail" color="muted">Partly cloudy</Text>
            </Column>
          </Row>
          <Spacer />
          <Row gap={3}>
            {HOURLY.slice(0, 3).map(({ h, icon, t }) => (
              <Column key={h} gap={0} align="center">
                <Text size="detail" color="muted">{h}</Text>
                <span aria-hidden="true">{icon}</span>
                <Text size="detail">{t}°</Text>
              </Column>
            ))}
          </Row>
        </Row>
      </Surface>
    );
  }

  // md / lg
  return (
    <Surface pad="sm" className="h-full">
      <Column gap={2} className="h-full">
        <Row align="center" justify="between" gap={2}>
          <Text size="caption" color="muted">Weather</Text>
          <Text size="detail" color="muted">Kingston, UK</Text>
        </Row>
        <Row align="center" gap={4} className="min-w-0">
          <Row align="center" gap={2}>
            <span aria-hidden="true" className="home-weather-icon">⛅</span>
            <Column gap={0}>
              <Metric value={18} unit="°C" size="xl" />
              <Text size="detail" color="muted">Partly cloudy</Text>
              <Text size="detail" color="muted">Good for training</Text>
            </Column>
          </Row>
          <Spacer />
          <Row gap={3} align="center">
            {(size === 'lg' ? HOURLY : HOURLY.slice(0, 3)).map(({ h, icon, t }) => (
              <Column key={h} gap={0} align="center">
                <Text size="detail" color="muted">{h}</Text>
                <span aria-hidden="true">{icon}</span>
                <Text size="detail">{t}°</Text>
              </Column>
            ))}
          </Row>
        </Row>
      </Column>
    </Surface>
  );
}

// ── Body Battery ──────────────────────────────────────────────────────────────

export function BodyBatteryHomeWidget({ size }: { size: WidgetSize }) {
  if (size === 'sm') {
    return (
      <Surface pad="sm" className="h-full">
        <Column gap={1} className="h-full" justify="between">
          <Text size="caption" color="muted">Battery</Text>
          <Metric value="72%" size="xl" />
        </Column>
      </Surface>
    );
  }

  return (
    <Surface pad="sm" className="h-full">
      <Row align="center" className="h-full" gap={3}>
        <Column gap={0} className="min-w-0">
          <Text size="caption" color="muted">Body Battery</Text>
          <Metric value="72%" size="lg" />
          <Text size="detail" color="muted">Recovering</Text>
        </Column>
        <Column gap={0} className="min-w-0">
          <Text size="detail" color="muted">Low today</Text>
          <Text size="detail">24%</Text>
        </Column>
      </Row>
    </Surface>
  );
}

// ── Habits ────────────────────────────────────────────────────────────────────

const HABITS = [
  { label: 'Mobility', done: true },
  { label: 'Hydration', done: true },
  { label: 'Steps', done: true },
  { label: 'Meditation', done: true },
  { label: 'Cold shower', done: false },
];

export function HabitsHomeWidget({ size }: { size: WidgetSize }) {
  const done = HABITS.filter(h => h.done).length;

  if (size === 'sm') {
    return (
      <Surface pad="sm" className="h-full">
        <Column gap={1} className="h-full" justify="between">
          <Text size="caption" color="muted">Habits</Text>
          <Metric value={`${done}/${HABITS.length}`} size="xl" />
        </Column>
      </Surface>
    );
  }

  if (size === 'wide') {
    return (
      <Surface pad="sm" className="h-full">
        <Row align="center" className="h-full" gap={3}>
          <Column gap={0}>
            <Text size="caption" color="muted">Habits</Text>
            <Metric value={`${done}/${HABITS.length}`} size="lg" />
          </Column>
          <Column gap={1} className="min-w-0">
            {HABITS.slice(0, 3).map(h => (
              <Row key={h.label} align="center" justify="between" gap={2}>
                <Text size="detail">{h.label}</Text>
                <Text size="detail" color={h.done ? 'positive' : 'muted'}>{h.done ? '✓' : '–'}</Text>
              </Row>
            ))}
          </Column>
        </Row>
      </Surface>
    );
  }

  // md / lg
  return (
    <Surface pad="sm" className="h-full">
      <Column gap={2} className="h-full">
        <Row align="center" justify="between" gap={2}>
          <Text size="caption" color="muted">Habits</Text>
          <Badge>{done}/{HABITS.length}</Badge>
        </Row>
        <Column gap={1} className="min-w-0">
          {HABITS.map(h => (
            <Row key={h.label} align="center" justify="between" gap={2}>
              <Text size="detail">{h.label}</Text>
              <Text size="detail" color={h.done ? 'positive' : 'muted'}>{h.done ? '✓' : '–'}</Text>
            </Row>
          ))}
        </Column>
      </Column>
    </Surface>
  );
}

// ── Weekly Volume ─────────────────────────────────────────────────────────────

const VOL_7DAY = [
  { x: 'M', y: 0 }, { x: 'T', y: 2200 }, { x: 'W', y: 0 },
  { x: 'T', y: 3100 }, { x: 'F', y: 1800 }, { x: 'S', y: 0 }, { x: 'S', y: 1320 },
];

export function WeeklyVolumeHomeWidget({ size }: { size: WidgetSize }) {
  if (size === 'wide') {
    return (
      <Surface pad="sm" className="h-full">
        <Row align="center" className="h-full" gap={3}>
          <Column gap={0} className="min-w-0">
            <Text size="caption" color="muted">Weekly Volume</Text>
            <Metric value="8,420" unit="kg" size="lg" />
          </Column>
          <div className="min-w-0">
            <SparklineArea data={VOL_7DAY} color="var(--color-primary)" height={50} id="hw-vol" />
          </div>
        </Row>
      </Surface>
    );
  }

  // md / lg
  return (
    <Surface pad="sm" className="h-full">
      <Column gap={2} className="h-full">
        <Row align="center" justify="between" gap={2}>
          <Text size="caption" color="muted">Weekly Volume</Text>
          <Badge>Week 24</Badge>
        </Row>
        <Metric value="8,420" unit="kg" size="xl" />
        <Column gap={1}>
          <Row align="center" justify="between"><Text size="detail" color="muted">Run</Text><Text size="detail">42 km</Text></Row>
          <Row align="center" justify="between"><Text size="detail" color="muted">Lift</Text><Text size="detail">4 sessions</Text></Row>
          <Row align="center" justify="between"><Text size="detail" color="muted">Bike</Text><Text size="detail">68 km</Text></Row>
        </Column>
        <div className="min-w-0">
          <SparklineArea data={VOL_7DAY} color="var(--color-primary)" height={36} id="hw-vol-md" />
        </div>
      </Column>
    </Surface>
  );
}

// ── Macros ────────────────────────────────────────────────────────────────────

export function MacrosHomeWidget({ size }: { size: WidgetSize }) {
  if (size === 'wide') {
    return (
      <Surface pad="sm" className="h-full">
        <Column gap={2} className="h-full" justify="between">
          <Row align="center" justify="between" gap={2}>
            <Text size="caption" color="muted">Nutrition</Text>
            <Text size="detail" color="muted">1,840 kcal</Text>
          </Row>
          <Row gap={1} className="macro-bar macro-bar-sm">
            {MACRO_KEYS.map(key => (
              <div key={key} className={`macro-segment macro-${key}`} />
            ))}
          </Row>
          <Row align="center" justify="between">
            <Text size="detail" color="muted">P 142g</Text>
            <Text size="detail" color="muted">C 198g</Text>
            <Text size="detail" color="muted">F 62g</Text>
          </Row>
        </Column>
      </Surface>
    );
  }

  // md / lg
  return (
    <Surface pad="sm" className="h-full">
      <Column gap={2} className="h-full">
        <Row align="center" justify="between" gap={2}>
          <Text size="caption" color="muted">Nutrition</Text>
          <Badge>1,840 kcal</Badge>
        </Row>
        <Row gap={1} className="macro-bar">
          {MACRO_KEYS.map(key => (
            <div key={key} className={`macro-segment macro-${key}`} />
          ))}
        </Row>
        <Column gap={1} className="min-w-0">
          <Row align="center" justify="between"><Text size="detail" color="muted">Protein</Text><Text size="detail">142 g</Text></Row>
          <Row align="center" justify="between"><Text size="detail" color="muted">Carbs</Text><Text size="detail">198 g</Text></Row>
          <Row align="center" justify="between"><Text size="detail" color="muted">Fat</Text><Text size="detail">62 g</Text></Row>
          <Row align="center" justify="between"><Text size="detail" color="muted">Remaining</Text><Text size="detail">420 kcal</Text></Row>
        </Column>
      </Column>
    </Surface>
  );
}

// ── Resting HR ────────────────────────────────────────────────────────────────

const RHR_7DAY = [
  { x: 'M', y: 53 }, { x: 'T', y: 55 }, { x: 'W', y: 51 },
  { x: 'T', y: 50 }, { x: 'F', y: 49 }, { x: 'S', y: 52 }, { x: 'S', y: 48 },
];

export function RestingHRHomeWidget({ size }: { size: WidgetSize }) {
  if (size === 'sm') {
    return (
      <Surface pad="sm" className="h-full">
        <Column gap={1} className="h-full" justify="between">
          <Text size="caption" color="muted">Resting HR</Text>
          <Metric value={48} unit="bpm" size="xl" />
        </Column>
      </Surface>
    );
  }

  return (
    <Surface pad="sm" className="h-full">
      <Row align="center" className="h-full" gap={3}>
        <Column gap={0} className="min-w-0">
          <Text size="caption" color="muted">Resting HR</Text>
          <Metric value={48} unit="bpm" size="lg" />
          <Text size="detail" color="muted">Baseline 51 bpm</Text>
        </Column>
        <div className="min-w-0">
          <SparklineArea data={RHR_7DAY} color="var(--color-negative, #f44336)" height={50} id="hw-rhr" />
        </div>
      </Row>
    </Surface>
  );
}

// ── Insights ──────────────────────────────────────────────────────────────────

export function InsightsHomeWidget({ size }: { size: WidgetSize }) {
  return (
    <Surface pad="sm" className="h-full">
      <Column gap={2} className="h-full">
        <Row align="center" justify="between" gap={2}>
          <Text size="caption" color="muted">Insight</Text>
          <Badge>New</Badge>
        </Row>
        <em className="min-w-0 home-widget-insight">
          {size === 'sm'
            ? 'Best sleep follows rest days.'
            : 'Your best sleep scores follow rest days. Consider scheduling rest tomorrow.'}
        </em>
      </Column>
    </Surface>
  );
}
