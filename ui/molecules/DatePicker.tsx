import type { InputHTMLAttributes, ReactNode } from 'react';
import { Field } from './Field';

interface DatePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
}

export function DatePicker({ label, hint, error, id, className, ...rest }: DatePickerProps) {
  return (
    <Field id={id} label={label} hint={hint} error={error} className={className}>
      {({ id: inputId, describedBy, invalid }) => (
        <input
          id={inputId}
          type="date"
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={['input', 'date-picker', invalid ? 'error' : ''].filter(Boolean).join(' ')}
          {...rest}
        />
      )}
    </Field>
  );
}
