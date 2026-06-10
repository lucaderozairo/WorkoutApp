import type { ElementType, HTMLAttributes, ReactNode } from 'react';

type SurfaceVariant = 'default' | 'plain' | 'flat' | 'accent' | 'ghost' | 'inset' | 'pinned';
type SurfacePad = 'md' | 'sm' | 'xs' | 'none';
type SurfaceAs = 'div' | 'section' | 'article' | 'aside' | 'nav' | 'header' | 'footer' | 'main' | 'button';

interface SurfaceProps extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'onClick'> {
  variant?: SurfaceVariant;
  pad?: SurfacePad;
  interactive?: boolean;
  selected?: boolean;
  as?: SurfaceAs;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  className?: string;
  children: ReactNode;
  onClick?: HTMLAttributes<HTMLElement>['onClick'];
}

const VARIANT_CLASS: Record<SurfaceVariant, string> = {
  default: '',
  plain:   'plain',
  flat:    'flat',
  accent:  'accent',
  ghost:   'ghost',
  inset:   'inset',
  pinned:  'pinned',
};

const PAD_CLASS: Record<SurfacePad, string> = {
  md:   '',
  sm:   'pad-sm',
  xs:   'pad-xs',
  none: 'pad-none',
};

export function Surface({
  variant = 'default',
  pad = 'md',
  interactive = false,
  selected = false,
  as: Tag = 'div',
  className,
  children,
  onClick,
  ...rest
}: SurfaceProps) {
  const classes = [
    'surface',
    VARIANT_CLASS[variant],
    PAD_CLASS[pad],
    interactive ? 'interactive' : '',
    selected    ? 'selected'    : '',
    className,
  ].filter(Boolean).join(' ');

  const Component = Tag as ElementType;

  return (
    <Component
      className={classes}
      onClick={onClick}
      {...rest}
    >
      {children}
    </Component>
  );
}
