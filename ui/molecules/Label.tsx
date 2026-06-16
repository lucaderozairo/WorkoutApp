import type { LabelHTMLAttributes, ReactNode } from 'react';
import { Text } from '@ui/atoms/Text';

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  children: ReactNode;
}

export function Label({ className, children, color: _color, ...rest }: LabelProps) {
  return (
    <Text as="label" size="detail" bold className={['label', className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </Text>
  );
}
