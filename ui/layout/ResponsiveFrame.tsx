import type { ElementType, ReactNode } from 'react';

type ResponsiveMode = 'auto' | 'mobile' | 'tablet' | 'desktop' | 'wide';
type ResponsiveMaxWidth = 'form' | 'content' | 'wide' | 'none';
type ResponsivePadding = 'none' | 'sm' | 'md' | 'lg';

interface ResponsiveFrameProps {
  mode?: ResponsiveMode;
  maxWidth?: ResponsiveMaxWidth;
  padding?: ResponsivePadding;
  as?: ElementType;
  className?: string;
  children: ReactNode;
}

export function ResponsiveFrame({
  mode = 'auto',
  maxWidth = 'content',
  padding = 'md',
  as: Tag = 'div',
  className,
  children,
}: ResponsiveFrameProps) {
  const classes = [
    'responsive-frame',
    `responsive-frame-${mode}`,
    `responsive-frame-max-${maxWidth}`,
    `responsive-frame-pad-${padding}`,
    className,
  ].filter(Boolean).join(' ');

  return <Tag className={classes}>{children}</Tag>;
}

export type { ResponsiveMode, ResponsiveMaxWidth, ResponsivePadding };
