import { Row, Column } from '@ui/layout';
import { Surface, Text } from '@ui/atoms';
import { MiniBar, type WidgetSize } from './widgetPrimitives';

const MOCK_GOALS = [
  { name: 'Squat 140 kg',  target: 140, current: 120, unit: 'kg'  },
  { name: 'Run 100 km/mo', target: 100, current:  84, unit: 'km'  },
  { name: '30-day streak', target:  30, current:  22, unit: 'days'},
  { name: '10% body fat',  target:  10, current:  13, unit: '%', inverted: true },
];

export function ActiveGoalsWidget({ size }: { size: WidgetSize }) {
  const goals = size === '2x2' ? MOCK_GOALS : MOCK_GOALS.slice(0, 2);
  return (
    <Surface pad="sm"><Column className="h-full">
      <Text size="eyebrow">Active Goals</Text>
      <Column gap={1} className="grow scroll-y">
        {goals.map((g) => {
          const pct = Math.min(100, 'inverted' in g && g.inverted
            ? Math.round((g.target / g.current) * 100)
            : Math.round((g.current / g.target) * 100));
          const barColor = pct >= 100 ? 'var(--ok)' : pct >= 60 ? 'var(--accent)' : 'var(--warn)';
          return (
            <Column key={g.name} gap={1}>
              <Row justify="between" align="center">
                <Text size="detail">{g.name}</Text>
                <Text size="caption" mono>{g.current}/{g.target} {g.unit}</Text>
              </Row>
              <MiniBar value={pct} max={100} color={barColor} />
            </Column>
          );
        })}
      </Column>
    </Column></Surface>
  );
}
