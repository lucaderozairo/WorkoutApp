import { Flame } from 'phosphor-react';
import { Row, Column } from '@ui/layout';
import { Surface, Text } from '@ui/atoms';
import { Badge } from '@ui/molecules';
import { MiniRing, scoreBadge, type WidgetSize } from './widgetPrimitives';

const MOCK = { adherenceRate: 0.83, currentStreak: 6 };

export function PlanAdherenceWidget({ size }: { size: WidgetSize }) {
  const { adherenceRate, currentStreak } = MOCK;
  const pct       = Math.round(adherenceRate * 100);
  const badge     = scoreBadge(pct);
  const ringColor = pct >= 80 ? 'var(--ok)' : pct >= 60 ? 'var(--warn)' : 'var(--bad)';

  if (size === '1x1') return (
    <Surface pad="sm"><Column justify="center" align="center" className="h-full">
      <Text size="eyebrow">Adherence</Text>
      <MiniRing value={pct} color={ringColor} size={72} />
    </Column></Surface>
  );

  return (
    <Surface pad="sm"><Column className="h-full">
      <Row justify="between" align="center">
        <Text size="eyebrow">Plan Adherence</Text>
        <Badge className={badge.cls}>{badge.label}</Badge>
      </Row>
      <Row align="center">
        <MiniRing value={pct} color={ringColor} size={80} />
        <Column gap={1} className="grow">
          <Text as="h3" mono>{pct}<Text as="span" size="caption" color="faint">%</Text></Text>
          <Text size="caption" color="faint">adherence</Text>
        </Column>
      </Row>
      <Row align="center" gap={1}>
        <Row align="center" gap={1} className="mono caption">{currentStreak} <Flame size={12} /></Row>
        <Text size="caption" color="faint">day streak</Text>
      </Row>
    </Column></Surface>
  );
}
