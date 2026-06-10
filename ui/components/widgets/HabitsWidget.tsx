import { Badge } from '@ui/molecules';
import { Column, Row, Text, WidgetShell, type DemoWidgetProps } from './widgetPrimitives';

export function HabitsWidget({ size }: DemoWidgetProps) {
  return (
    <WidgetShell title="Habits" badge="4/5" size={size}>
      <Column gap={1}>
        {['Mobility', 'Hydration', 'Steps'].map((label) => (
          <Row key={label} align="center" justify="between" gap={2}>
            <Text size="caption">{label}</Text>
            <Badge>Done</Badge>
          </Row>
        ))}
      </Column>
    </WidgetShell>
  );
}
