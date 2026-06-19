import type { ElementType, ReactNode } from 'react';
import { Metric } from './Metric';
import { Text } from '@ui/atoms';

type DataValueVariant = 'number' | 'unit' | 'percentage' | 'duration' | 'distance' | 'pace' | 'weight' | 'date' | 'time' | 'delta' | 'trend';
type DataValueTone = 'default' | 'muted' | 'positive' | 'negative';

interface DataValueProps {
  value: ReactNode;
  unit?: string;
  variant?: DataValueVariant;
  tone?: DataValueTone;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  as?: ElementType;
  className?: string;
}

const TONE_CLASS: Record<DataValueTone, string> = {
  default: '',
  muted: 'muted',
  positive: 'positive',
  negative: 'negative',
};

export function DataValue({
  value,
  unit,
  variant = 'number',
  tone = 'default',
  size = 'md',
  as,
  className,
}: DataValueProps) {
  const classes = ['data-value', `data-value-${variant}`, TONE_CLASS[tone], className].filter(Boolean).join(' ');

  if (typeof value === 'string' || typeof value === 'number') {
    return <Metric value={value} unit={unit} size={size} className={classes} />;
  }

  return (
    <Text as={as} mono className={classes}>
      {value}
      {unit ? <Text as="span" size="caption" color="muted"> {unit}</Text> : null}
    </Text>
  );
}
