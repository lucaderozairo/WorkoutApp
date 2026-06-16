import type { ReactNode } from 'react';
import { Cluster } from '@ui/layout/Cluster';
import { Column } from '@ui/layout/Column';
import { Text } from '@ui/atoms';
import { Fieldset } from './Field';

export interface RadioOption {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}

interface RadioGroupProps {
  name: string;
  value: string;
  options: RadioOption[];
  onChange: (value: string) => void;
  legend: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  optional?: boolean;
  disabled?: boolean;
  orientation?: 'row' | 'column';
  className?: string;
}

export function RadioGroup({
  name,
  value,
  options,
  onChange,
  legend,
  hint,
  error,
  required,
  optional,
  disabled,
  orientation = 'column',
  className,
}: RadioGroupProps) {
  const Layout = orientation === 'row' ? Cluster : Column;

  return (
    <Fieldset
      legend={legend}
      hint={hint}
      error={error}
      required={required}
      optional={optional}
      className={className}
    >
      <Layout gap={2} className="radio-group">
        {options.map((option) => {
          const optionDisabled = disabled || option.disabled;
          return (
            <label key={option.value} className="radio-option">
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={value === option.value}
                disabled={optionDisabled}
                onChange={() => onChange(option.value)}
              />
              <span className="radio-mark" aria-hidden />
              <Column gap={0} className="radio-copy">
                <span>{option.label}</span>
                {option.description && <Text as="span" size="caption" color="muted">{option.description}</Text>}
              </Column>
            </label>
          );
        })}
      </Layout>
    </Fieldset>
  );
}
