import { DemoWidget, type DemoWidgetProps } from './widgetPrimitives';

export function MonthlyDistanceWidget({ size }: DemoWidgetProps) {
  return (
    <DemoWidget
      title="Monthly Distance"
      badge="June"
      size={size}
      metrics={[
        { label: 'Total', value: 184, unit: 'km' },
        { label: 'Target', value: 220, unit: 'km' },
      ]}
    />
  );
}
