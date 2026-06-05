import type { ReactNode } from 'react';

type SurfaceVariant = 'default' | 'plain' | 'flat' | 'accent' | 'ghost';
type SurfacePad = 'md' | 'sm' | 'none';
type SurfaceAs = 'div' | 'section' | 'article' | 'aside' | 'nav' | 'header' | 'footer' | 'main' | 'button';

interface SurfaceProps {
  variant?: SurfaceVariant;
  pad?: SurfacePad;
  interactive?: boolean;
  selected?: boolean;
  as?: SurfaceAs;
  role?: string;
  'aria-expanded'?: boolean | 'true' | 'false';
  'aria-label'?: string;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}

const VARIANT_CLASS: Record<SurfaceVariant, string> = {
  default: '',
  plain:   'plain',
  flat:    'flat',
  accent:  'accent',
  ghost:   'ghost',
};

const PAD_CLASS: Record<SurfacePad, string> = {
  md:   '',
  sm:   'pad-sm',
  none: 'pad-none',
};

export function Surface({
  variant = 'default',
  pad = 'md',
  interactive = false,
  selected = false,
  as: Tag = 'div',
  role,
  'aria-expanded': ariaExpanded,
  'aria-label': ariaLabel,
  className,
  children,
  onClick,
}: SurfaceProps) {
  const classes = [
    'surface',
    VARIANT_CLASS[variant],
    PAD_CLASS[pad],
    interactive ? 'interactive' : '',
    selected    ? 'selected'    : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <Tag
      className={classes}
      role={role}
      aria-expanded={ariaExpanded}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      {children}
    </Tag>
  );
}
