import { Column, Row, Text, WidgetShell, type DemoWidgetProps } from './widgetPrimitives';

export function ActivityFeedWidget({ size }: DemoWidgetProps) {
  return (
    <WidgetShell title="Recent Sessions" size={size}>
      <Column gap={2}>
        {['Tempo run', 'Upper strength', 'Recovery ride'].map((label) => (
          <Row key={label} align="center" gap={2}>
            <span className="dot sm" />
            <Text size="detail">{label}</Text>
          </Row>
        ))}
      </Column>
    </WidgetShell>
  );
}
