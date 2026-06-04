import { PieChart, Pie, Cell } from 'recharts';
import { Row, Column } from '@ui/layout';
import { Surface, Text } from '@ui/atoms';
import type { WidgetSize } from './widgetPrimitives';

const MOCK_NUTRITION = { kcal: 1940, target: 2400, protein: 148, carbs: 210, fat: 62 };

export function MacrosWidget({ size }: { size: WidgetSize }) {
  const { protein, carbs, fat, kcal } = MOCK_NUTRITION;
  const macroData = [
    { name: 'Protein', value: protein, color: 'var(--accent)' },
    { name: 'Carbs',   value: carbs,   color: 'var(--warn)'   },
    { name: 'Fat',     value: fat,     color: 'var(--c-strength)' },
  ];
  const pieSize = size === '2x1' ? 90 : 110;

  return (
    <Surface pad="sm"><Column className="h-full">
      <Text size="eyebrow">Macros</Text>
      <Row align="center">
        <PieChart width={pieSize} height={pieSize}>
          <Pie
            data={macroData}
            dataKey="value"
            innerRadius="60%" outerRadius="88%"
            paddingAngle={2}
            startAngle={90} endAngle={-270}
            strokeWidth={0}
            isAnimationActive={false}
          >
            {macroData.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Pie>
        </PieChart>
        <Column gap={1} className="grow">
          <Text mono>{kcal}<Text as="span" size="caption" color="faint"> kcal</Text></Text>
          {macroData.map(d => (
            <Row key={d.name} align="center" gap={1}>
              <span
                className="dot shrink-0"
                style={{ '--dot-color': d.color } as React.CSSProperties}
              />
              <Text size="caption" className="grow">{d.name}</Text>
              <Text size="caption" mono>{d.value}g</Text>
            </Row>
          ))}
        </Column>
      </Row>
    </Column></Surface>
  );
}
