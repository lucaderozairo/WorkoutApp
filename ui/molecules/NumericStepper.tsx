import { Minus, Plus } from 'lucide-react';
import { Row } from '@ui/layout';
import { Button } from './Button';
import { Input } from './Input';

interface NumericStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function NumericStepper({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  disabled,
  className,
}: NumericStepperProps) {
  const clamp = (next: number) => Math.min(max ?? next, Math.max(min ?? next, next));
  const decrementDisabled = disabled || (min !== undefined && value <= min);
  const incrementDisabled = disabled || (max !== undefined && value >= max);

  return (
    <Row align="end" gap={1} className={['numeric-stepper', className].filter(Boolean).join(' ')}>
      <Button type="button" variant="secondary" size="icon-sm" aria-label="Decrease value" disabled={decrementDisabled} onClick={() => onChange(clamp(value - step))}>
        <Minus size={14} aria-hidden="true" />
      </Button>
      <Input
        label={label}
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        controlClassName="num"
        onChange={(event) => onChange(clamp(Number(event.currentTarget.value)))}
      />
      <Button type="button" variant="secondary" size="icon-sm" aria-label="Increase value" disabled={incrementDisabled} onClick={() => onChange(clamp(value + step))}>
        <Plus size={14} aria-hidden="true" />
      </Button>
    </Row>
  );
}
