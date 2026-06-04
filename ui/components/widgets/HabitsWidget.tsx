import { Flame } from 'phosphor-react';
import { Row, Column } from '@ui/layout';
import { Surface, Text } from '@ui/atoms';
import { Badge } from '@ui/molecules';
import type { WidgetSize } from './widgetPrimitives';

const MOCK_HABITS = [
  { name: 'Morning mobility', streak: 12, done: true  },
  { name: 'Cold shower',      streak:  5, done: true  },
  { name: 'Protein goal',     streak:  3, done: false },
  { name: '8h sleep',         streak:  8, done: true  },
  { name: 'No alcohol',       streak: 21, done: true  },
];

export function HabitsWidget({ size }: { size: WidgetSize }) {
  const habits = size === '2x1' ? MOCK_HABITS : MOCK_HABITS.slice(0, 3);
  const done   = habits.filter(h => h.done).length;

  if (size === '1x1') return (
    <Surface pad="sm"><Column justify="center" align="center" className="h-full">
      <Text size="eyebrow">Habits</Text>
      <Text as="h3" mono>{done}/{habits.length}</Text>
      <Text size="caption" color="faint">done today</Text>
    </Column></Surface>
  );

  return (
    <Surface pad="sm"><Column className="h-full">
      <Row justify="between" align="center">
        <Text size="eyebrow">Today's Habits</Text>
        <Text size="caption" color="faint">{done}/{habits.length}</Text>
      </Row>
      <Column gap={1} className="grow scroll-y">
        {habits.map((h, i) => (
          <Row key={i} align="center" gap={1} className="list-divider-sm">
            <Badge className={h.done ? 'green' : ''}>{h.done ? '✓' : '·'}</Badge>
            <Text size="detail" className="grow">{h.name}</Text>
            {h.streak > 0 && <Row align="center" gap={1} className="mono caption">{h.streak}<Flame size={11} /></Row>}
          </Row>
        ))}
      </Column>
    </Column></Surface>
  );
}
