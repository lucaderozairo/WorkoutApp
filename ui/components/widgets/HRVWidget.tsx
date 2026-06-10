import { DemoWidget, type DemoWidgetProps } from './widgetPrimitives';

export function HRVWidget({ size }: DemoWidgetProps) {
  return (
    <DemoWidget
      title="HRV"
      badge="+4"
      size={size}
      metrics={[
        { label: '7-day avg', value: 61, unit: 'ms' },
        { label: 'Baseline', value: 58, unit: 'ms' },
      ]}
    />
  );
}
