import { DemoWidget, type DemoWidgetProps } from './widgetPrimitives';

export function WeeklyVolumeWidget({ size }: DemoWidgetProps) {
  return (
    <DemoWidget
      title="Weekly Volume"
      size={size}
      metrics={[
        { label: 'Run', value: 42, unit: 'km' },
        { label: 'Lift', value: 4 },
        { label: 'Bike', value: 68, unit: 'km' },
      ]}
    />
  );
}
