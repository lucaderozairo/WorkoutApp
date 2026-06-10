import type { InputHTMLAttributes, ReactNode } from 'react';
import { Row } from '@ui/layout/Row';
import { Spinner } from '@ui/atoms/Spinner';
import { Field } from './Field';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  loading?: boolean;
  variant?: 'default' | 'ghost';
}

export function Input({ label, hint, error, leading, trailing, loading, id, className, variant = 'default', ...rest }: InputProps) {
  const trailingSlot = loading ? <Spinner size="sm" /> : trailing;
  const hasSlots = leading || trailingSlot;
  const inputClassName = ['input', variant === 'ghost' ? 'ghost' : '', error ? 'error' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <Field id={id} label={label} hint={hint} error={error} className={className}>
      {({ id: inputId, describedBy, invalid }) => hasSlots ? (
        <Row align="center" gap={1} className={invalid ? 'field-control error' : 'field-control'}>
          {leading}
          <input
            id={inputId}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            className={`${inputClassName} min-w-0`}
            {...rest}
          />
          {trailingSlot}
        </Row>
      ) : (
        <input
          id={inputId}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={inputClassName}
          {...rest}
        />
      )}
    </Field>
  );
}
