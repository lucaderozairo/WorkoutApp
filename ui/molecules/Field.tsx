import type { ReactNode } from 'react';
import { useId } from 'react';
import { Row } from '@ui/layout/Row';
import { Column } from '@ui/layout/Column';

export interface FieldRenderProps {
  id: string;
  describedBy?: string;
  invalid: boolean;
}

interface FieldProps {
  id?: string;
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  optional?: boolean;
  className?: string;
  children: ReactNode | ((props: FieldRenderProps) => ReactNode);
}

interface FieldsetProps {
  legend: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  optional?: boolean;
  className?: string;
  children: ReactNode;
}

interface FormActionsProps {
  align?: 'start' | 'end' | 'between';
  className?: string;
  children: ReactNode;
}

function suffixId(id: string, suffix: string) {
  return `${id}-${suffix}`;
}

export function Field({ id, label, hint, error, required, optional, className, children }: FieldProps) {
  const generatedId = useId();
  const controlId = id ?? `field-${generatedId.replace(/:/g, '')}`;
  const hintId = hint ? suffixId(controlId, 'hint') : undefined;
  const errorId = error ? suffixId(controlId, 'error') : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;
  const invalid = Boolean(error);

  return (
    <Column gap={1} className={['field', invalid ? 'has-error' : '', className].filter(Boolean).join(' ')}>
      {label && (
        <Row align="baseline" justify="between" gap={2} className="field-label-row">
          <label htmlFor={controlId}>{label}</label>
          {required && <span className="caption muted">Required</span>}
          {optional && !required && <span className="caption muted">Optional</span>}
        </Row>
      )}
      {typeof children === 'function'
        ? children({ id: controlId, describedBy, invalid })
        : children}
      {error ? (
        <span id={errorId} className="caption negative">{error}</span>
      ) : hint ? (
        <span id={hintId} className="caption muted">{hint}</span>
      ) : null}
    </Column>
  );
}

export function Fieldset({ legend, hint, error, required, optional, className, children }: FieldsetProps) {
  const generatedId = useId();
  const hintId = hint ? `fieldset-${generatedId.replace(/:/g, '')}-hint` : undefined;
  const errorId = error ? `fieldset-${generatedId.replace(/:/g, '')}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <Column
      as="fieldset"
      gap={2}
      className={['fieldset', error ? 'has-error' : '', className].filter(Boolean).join(' ')}
      {...(describedBy ? { 'aria-describedby': describedBy } : {})}
    >
      <Row as="legend" align="baseline" justify="between" gap={2} className="field-label-row">
        <span>{legend}</span>
        {required && <span className="caption muted">Required</span>}
        {optional && !required && <span className="caption muted">Optional</span>}
      </Row>
      {children}
      {error ? (
        <span id={errorId} className="caption negative">{error}</span>
      ) : hint ? (
        <span id={hintId} className="caption muted">{hint}</span>
      ) : null}
    </Column>
  );
}

export function FormActions({ align = 'end', className, children }: FormActionsProps) {
  return (
    <Row
      align="center"
      justify={align}
      wrap
      className={['form-actions', className].filter(Boolean).join(' ')}
    >
      {children}
    </Row>
  );
}
