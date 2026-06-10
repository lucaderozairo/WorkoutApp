import type { LabelHTMLAttributes, ReactNode } from 'react';

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  children: ReactNode;
}

export function Label({ className, children, ...rest }: LabelProps) {
  return (
    <label className={['label', className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </label>
  );
}
