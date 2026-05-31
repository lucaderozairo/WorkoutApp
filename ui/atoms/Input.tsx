import type { InputHTMLAttributes, ReactNode } from 'react';
import { Spinner } from './Spinner';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  loading?: boolean;
}

export function Input({ label, hint, error, leading, trailing, loading, id, className, ...rest }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  const trailingSlot = loading ? <Spinner size="sm" /> : trailing;

  return (
    <div className={['field', className].filter(Boolean).join(' ')}>
      {label && <label htmlFor={inputId}>{label}</label>}
      <div className={['input-wrap', error ? 'error' : ''].filter(Boolean).join(' ')}>
        {leading && <span className="input-leading">{leading}</span>}
        <input id={inputId} {...rest} />
        {trailingSlot && <span className="input-trailing">{trailingSlot}</span>}
      </div>
      {error ? (
        <span className="caption negative">{error}</span>
      ) : hint ? (
        <span className="caption muted">{hint}</span>
      ) : null}
    </div>
  );
}
