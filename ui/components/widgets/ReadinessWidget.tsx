import { Row, Column } from '@ui/layout';
import { Surface, Text } from '@ui/atoms';
import { Badge } from '@ui/molecules';
import { MiniBar, MiniRing, scoreBadge, type WidgetSize } from './widgetPrimitives';

const MOCK = { score: 76, sleep: 8, energy: 7, soreness: 3, mood: 8 };

export function ReadinessWidget({ size }: { size: WidgetSize }) {
  const { score, sleep, energy, soreness, mood } = MOCK;
  const badge     = scoreBadge(score);
  const ringColor = score >= 75 ? 'var(--ok)' : score >= 50 ? 'var(--warn)' : 'var(--bad)';
  const ringSize  = size === '2x2' ? 96 : 72;

  if (size === '1x1') return (
    <Surface pad="sm"><Column justify="center" align="center" className="h-full">
      <Text size="eyebrow">Readiness</Text>
      <MiniRing value={score} color={ringColor} size={72} />
    </Column></Surface>
  );

  const factors = [
    { label: 'Sleep',    val: sleep,         max: 10 },
    { label: 'Energy',   val: energy,        max: 10 },
    { label: 'Mood',     val: mood,          max: 10 },
    { label: 'Recovery', val: 10 - soreness, max: 10 },
  ];

  return (
    <Surface pad="sm"><Column className="h-full">
      <Row justify="between" align="center">
        <Text size="eyebrow">Readiness</Text>
        <Badge className={badge.cls}>{badge.label}</Badge>
      </Row>
      <Row align="center">
        <MiniRing value={score} color={ringColor} size={ringSize} />
        <Column gap={1} className="grow">
          <Text as="h3" mono>{score}</Text>
          <Text size="caption" color="faint">out of 100</Text>
        </Column>
      </Row>
      {size === '2x2' && (
        <Column gap={1}>
          {factors.map(({ label, val, max }) => (
            <Column key={label} gap={1}>
              <Row justify="between" align="center">
                <Text size="caption">{label}</Text>
                <Text size="caption" mono>{val}/{max}</Text>
              </Row>
              <MiniBar value={val} max={max} />
            </Column>
          ))}
        </Column>
      )}
    </Column></Surface>
  );
}
