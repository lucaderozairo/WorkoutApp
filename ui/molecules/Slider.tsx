import { Row } from '../layout/Row';
import { Text } from '../atoms/Text';

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  showValue?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Slider({ value, onChange, min = 0, max = 100, step = 1, label, showValue = false, disabled, className }: SliderProps) {
  return (
    <div className={['slider-field', className].filter(Boolean).join(' ')}>
      {(label || showValue) && (
        <Row justify="between">
          {label && <Text as="label" size="caption">{label}</Text>}
          {showValue && <Text as="span" size="caption" mono>{value}</Text>}
        </Row>
      )}
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={e => onChange(Number(e.target.value))}
      />
    </div>
  );
}
