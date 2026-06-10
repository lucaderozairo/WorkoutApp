import type { TextareaHTMLAttributes } from 'react';
import { Field } from './Field';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  rows?: number;
  autoGrow?: boolean;
}

export function Textarea({ label, hint, error, rows = 3, autoGrow = false, id, className, onChange, ...rest }: TextareaProps) {
  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    if (autoGrow) {
      e.target.style.height = 'auto';
      e.target.style.height = `${e.target.scrollHeight}px`;
    }
    onChange?.(e);
  }

  return (
    <Field id={id} label={label} hint={hint} error={error} className={className}>
      {({ id: textareaId, describedBy, invalid }) => (
        <textarea
          id={textareaId}
          rows={rows}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={['textarea', invalid ? 'error' : ''].filter(Boolean).join(' ')}
          onChange={autoGrow || onChange ? handleChange : undefined}
          {...rest}
        />
      )}
    </Field>
  );
}
