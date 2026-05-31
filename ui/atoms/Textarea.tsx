import type { TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  rows?: number;
  autoGrow?: boolean;
}

export function Textarea({ label, hint, error, rows = 3, autoGrow = false, id, className, onChange, ...rest }: TextareaProps) {
  const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    if (autoGrow) {
      e.target.style.height = 'auto';
      e.target.style.height = `${e.target.scrollHeight}px`;
    }
    onChange?.(e);
  }

  return (
    <div className={['field', className].filter(Boolean).join(' ')}>
      {label && <label htmlFor={textareaId}>{label}</label>}
      <textarea
        id={textareaId}
        rows={rows}
        className={error ? 'error' : undefined}
        onChange={autoGrow || onChange ? handleChange : undefined}
        {...rest}
      />
      {error ? (
        <span className="caption negative">{error}</span>
      ) : hint ? (
        <span className="caption muted">{hint}</span>
      ) : null}
    </div>
  );
}
