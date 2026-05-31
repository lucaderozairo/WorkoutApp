import type { ReactNode } from 'react';

interface TimelineItemProps {
  time?: string;
  dot?: ReactNode;
  title?: string;
  description?: string;
  trailing?: ReactNode;
  children?: ReactNode;
}

export function TimelineItem({ time, dot, title, description, trailing, children }: TimelineItemProps) {
  return (
    <div className="row timeline-item">
      <div className="column align-center timeline-track">
        <div className="timeline-dot">{dot ?? <span className="dot accent" />}</div>
        <div className="timeline-line" />
      </div>
      <div className="column grow">
        <div className="row space-between align-center">
          <div className="column">
            {title && <span>{title}</span>}
            {description && <span className="caption muted">{description}</span>}
          </div>
          <div className="row align-center">
            {time && <span className="caption muted mono">{time}</span>}
            {trailing}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

interface TimelineProps {
  className?: string;
  children: ReactNode;
}

export function Timeline({ className, children }: TimelineProps) {
  const classes = ['column', 'timeline', className].filter(Boolean).join(' ');
  return <div className={classes}>{children}</div>;
}
