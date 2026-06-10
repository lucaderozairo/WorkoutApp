import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Spinner } from '../atoms/Spinner';
import { Icon } from '../atoms/Icon';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  leading?: ReactNode;
  trailing?: ReactNode;
  loading?: boolean;
  success?: boolean;
  block?: boolean;
  active?: boolean;
  children?: ReactNode;
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary:     'primary',
  secondary:   'secondary',
  ghost:       'ghost',
  destructive: 'destructive',
};

const SIZE_CLASS: Record<Size, string> = {
  sm:      'sm',
  md:      '',
  lg:      'lg',
  icon:    'icon',
  'icon-sm': 'icon sm',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  leading,
  trailing,
  loading = false,
  success = false,
  block = false,
  active = false,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = [
    'button',
    VARIANT_CLASS[variant],
    SIZE_CLASS[size],
    block ? 'block' : '',
    active ? 'active' : '',
    className,
  ].filter(Boolean).join(' ');

  const trailingSlot = loading
    ? <Spinner size="sm" />
    : success
      ? <Icon name="check" size="sm" />
      : trailing;

  // button CSS is already display:inline-flex align-items:center gap:s-2 —
  // no wrapper needed for leading/trailing slots
  return (
    <button className={classes} disabled={disabled || loading} {...rest}>
      {leading}
      {children}
      {trailingSlot}
    </button>
  );
}
