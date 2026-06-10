import { DemoWidget, Text, type DemoWidgetProps } from './widgetPrimitives';

export function ReadinessWidget({ size }: DemoWidgetProps) {
  return (
    <DemoWidget
      title="Readiness"
      badge="Steady"
      size={size}
      metrics={[
        { label: 'Score', value: 82, unit: '/100' },
        { label: 'Load', value: 41 },
      ]}
      detail={<Text size="caption" color="muted">Moderate session recommended.</Text>}
    />
  );
}
