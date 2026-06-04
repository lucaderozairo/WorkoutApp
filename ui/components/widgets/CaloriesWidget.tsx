import { Column } from '@ui/layout';
import { Surface, Text } from '@ui/atoms';
import { MiniBar, type WidgetSize } from './widgetPrimitives';

const MOCK_NUTRITION = { kcal: 1940, target: 2400 };

export function CaloriesWidget({ size: _ }: { size: WidgetSize }) {
  const { kcal, target } = MOCK_NUTRITION;
  const pct = Math.round((kcal / target) * 100);
  return (
    <Surface pad="sm"><Column className="h-full">
      <Text size="eyebrow">Calories</Text>
      <Text as="h3" mono>{kcal}<Text as="span" size="caption" color="faint"> / {target}</Text></Text>
      <MiniBar value={kcal} max={target} color="var(--c-nutrition)" />
      <Text size="caption" color="faint">{pct}% of goal</Text>
    </Column></Surface>
  );
}
