import { DemoWidget, type DemoWidgetProps } from './widgetPrimitives';

export function SleepBreakdownWidget({ size }: DemoWidgetProps) {
  return (
    <DemoWidget
      title="Sleep"
      badge="7h 42m"
      size={size}
      metrics={[
        { label: 'Deep', value: '1h 18m' },
        { label: 'REM', value: '1h 54m' },
        { label: 'Awake', value: 22, unit: 'm' },
      ]}
    />
  );
}
