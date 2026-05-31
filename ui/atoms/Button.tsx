import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Row } from '../layout/Row';
import { Spinner } from './Spinner';
import { Icon } from './Icon';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  leading?: ReactNode;
  trailing?: ReactNode;
  loading?: boolean;
  success?: boolean;
  block?: boolean;
  children?: ReactNode;
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary:     'primary',
  secondary:   'secondary',
  ghost:       'ghost',
  destructive: 'destructive',
};

const SIZE_CLASS: Record<Size, string> = {
  sm:   'sm',
  md:   '',
  lg:   'lg',
  icon: 'icon',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  leading,
  trailing,
  loading = false,
  success = false,
  block = false,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = [
    VARIANT_CLASS[variant],
    SIZE_CLASS[size],
    block ? 'block' : '',
    className,
  ].filter(Boolean).join(' ');

  const trailingSlot = loading
    ? <Spinner size="sm" />
    : success
      ? <Icon name="check" size="sm" />
      : trailing;

  const hasSlots = leading || trailingSlot;

  return (
    <button className={classes} disabled={disabled || loading} {...rest}>
      {hasSlots ? (
        <Row align="center" gap={2} as="span">
          {leading}
          {children}
          {trailingSlot}
        </Row>
      ) : children}
    </button>
  );
}
