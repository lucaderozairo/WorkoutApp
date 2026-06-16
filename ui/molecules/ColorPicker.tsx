import type { CSSProperties, InputHTMLAttributes } from 'react';
import { Row } from '@ui/layout';
import { Input } from './Input';

interface ColorPickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  hint?: string;
  error?: string;
  swatches?: string[];
  onValueChange?: (value: string) => void;
}

export function ColorPicker({ swatches = [], onValueChange, onChange, value, ...rest }: ColorPickerProps) {
  const current = String(value ?? '');

  return (
    <Row align="end" gap={2} className="color-picker">
      <Input
        {...rest}
        type="color"
        value={current}
        controlClassName="color-picker-input"
        onChange={(event) => {
          onChange?.(event);
          onValueChange?.(event.currentTarget.value);
        }}
      />
      {swatches.length > 0 ? (
        <Row gap={1} align="center" className="color-picker-swatches">
          {swatches.map((swatch) => (
            <button
              key={swatch}
              type="button"
              className="color-picker-swatch"
              aria-label={`Use color ${swatch}`}
              aria-pressed={current.toLowerCase() === swatch.toLowerCase()}
              style={{ '--swatch-color': swatch } as CSSProperties}
              onClick={() => onValueChange?.(swatch)}
            />
          ))}
        </Row>
      ) : null}
    </Row>
  );
}
