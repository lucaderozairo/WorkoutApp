import { DemoWidget, type DemoWidgetProps } from './widgetPrimitives';

export function RestingHRWidget({ size }: DemoWidgetProps) {
  return (
    <DemoWidget
      title="Resting HR"
      badge="Low"
      size={size}
      metrics={[
        { label: 'Today', value: 48, unit: 'bpm' },
        { label: 'Baseline', value: 51, unit: 'bpm' },
      ]}
    />
  );
}
