import { DemoWidget, type DemoWidgetProps } from './widgetPrimitives';

export function MacrosWidget({ size }: DemoWidgetProps) {
  return (
    <DemoWidget
      title="Macros"
      size={size}
      metrics={[
        { label: 'Protein', value: 142, unit: 'g' },
        { label: 'Carbs', value: 310, unit: 'g' },
      ]}
    />
  );
}
