import { Row } from '../layout/Row';

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
          {label && <label className="caption">{label}</label>}
          {showValue && <span className="caption mono">{value}</span>}
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
