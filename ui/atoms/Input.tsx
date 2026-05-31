import type { InputHTMLAttributes, ReactNode } from 'react';
import { Column } from '../layout/Column';
import { Row } from '../layout/Row';
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
  const hasSlots = leading || trailingSlot;

  return (
    <Column gap={1} className={className}>
      {label && <label htmlFor={inputId}>{label}</label>}
      {hasSlots ? (
        <Row align="center" gap={1} className={error ? 'error' : undefined}>
          {leading}
          <input id={inputId} className="grow" {...rest} />
          {trailingSlot}
        </Row>
      ) : (
        <input id={inputId} className={error ? 'error' : undefined} {...rest} />
      )}
      {error ? (
        <span className="caption negative">{error}</span>
      ) : hint ? (
        <span className="caption muted">{hint}</span>
      ) : null}
    </Column>
  );
}
