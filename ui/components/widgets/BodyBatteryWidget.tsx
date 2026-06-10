import { DemoWidget, type DemoWidgetProps } from './widgetPrimitives';

export function BodyBatteryWidget({ size }: DemoWidgetProps) {
  return (
    <DemoWidget
      title="Body Battery"
      badge="Recovering"
      size={size}
      metrics={[
        { label: 'Current', value: 67 },
        { label: 'Low', value: 24 },
      ]}
    />
  );
}
