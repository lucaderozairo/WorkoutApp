import type { ReactNode } from 'react';

type IconFrameTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';
type IconFrameSport = 'lift' | 'run' | 'cycle' | 'swim' | 'rowing' | 'mind';

interface IconFrameProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  tone?: IconFrameTone;
  sport?: IconFrameSport;
  className?: string;
  children: ReactNode;
}

export function IconFrame({ size = 'md', tone = 'neutral', sport, className, children }: IconFrameProps) {
  const classes = ['icon-frame', size !== 'md' ? size : '', className].filter(Boolean).join(' ');

  return (
    <span
      className={classes}
      data-tone={tone !== 'neutral' ? tone : undefined}
      data-sport={sport}
    >
      {children}
    </span>
  );
}
