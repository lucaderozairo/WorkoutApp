import { forwardRef } from 'react';
import type { ElementType, ReactNode } from 'react';
import { type Gap } from './_classes';

type LayerPin =
  | 'top-left' | 'top-center' | 'top-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right'
  | 'below-left' | 'below-center' | 'below-right'
  | 'above-left' | 'above-center' | 'above-right'
  | 'left-start' | 'left-center' | 'left-end'
  | 'right-start' | 'right-center' | 'right-end'
  | 'center' | 'full';

export type LayerZ = 'base' | 'content' | 'controls' | 'sticky' | 'fixed';
type LayerDirection = 'row' | 'column' | 'none';

interface LayeredProps {
  as?: ElementType;
  fill?: boolean;
  clip?: boolean;
  className?: string;
  children: ReactNode;
}

interface LayerProps {
  as?: ElementType;
  pin?: LayerPin;
  z?: LayerZ;
  direction?: LayerDirection;
  gap?: Gap;
  className?: string;
  children: ReactNode;
}

const PIN_CLASS: Record<LayerPin, string> = {
  'top-left':     'layer-pin-top-left',
  'top-center':   'layer-pin-top-center',
  'top-right':    'layer-pin-top-right',
  'bottom-left':  'layer-pin-bottom-left',
  'bottom-center':'layer-pin-bottom-center',
  'bottom-right': 'layer-pin-bottom-right',
  'below-left':   'layer-pin-below-left',
  'below-center': 'layer-pin-below-center',
  'below-right':  'layer-pin-below-right',
  'above-left':   'layer-pin-above-left',
  'above-center': 'layer-pin-above-center',
  'above-right':  'layer-pin-above-right',
  'left-start':   'layer-pin-left-start',
  'left-center':  'layer-pin-left-center',
  'left-end':     'layer-pin-left-end',
  'right-start':  'layer-pin-right-start',
  'right-center': 'layer-pin-right-center',
  'right-end':    'layer-pin-right-end',
  center:         'layer-pin-center',
  full:           'layer-pin-full',
};

const Z_CLASS: Record<LayerZ, string> = {
  base:     'layer-z-base',
  content:  'layer-z-content',
  controls: 'layer-z-controls',
  sticky:   'layer-z-sticky',
  fixed:    'layer-z-fixed',
};

export const Layered = forwardRef<HTMLElement, LayeredProps>(function Layered(
  { as: Tag = 'div', fill = false, clip = false, className, children }, ref
) {
  const classes = ['layered', fill ? 'h-full w-full' : '', clip ? 'clip' : '', className]
    .filter(Boolean).join(' ');
  return <Tag ref={ref} className={classes}>{children}</Tag>;
});

export function Layer({
  as: Tag = 'div',
  pin = 'top-left',
  z = 'content',
  direction = 'column',
  gap,
  className,
  children,
}: LayerProps) {
  const gapClass = gap !== undefined ? `gap-${gap}` : '';
  const classes = [
    'layer',
    PIN_CLASS[pin],
    Z_CLASS[z],
    direction !== 'none' ? direction : '',
    gapClass,
    className,
  ].filter(Boolean).join(' ');
  return <Tag className={classes}>{children}</Tag>;
}
