import type { ReactNode } from 'react';
import { Row } from '@ui/layout/Row';
import { Column } from '@ui/layout/Column';

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
    <Row className="timeline-item">
      <Column align="center" className="timeline-track">
        <div className="timeline-dot">{dot ?? <span className="dot accent" />}</div>
        <div className="timeline-line" />
      </Column>
      <Column className="grow">
        <Row justify="between" align="center">
          <Column gap={0}>
            {title && <span>{title}</span>}
            {description && <span className="caption muted">{description}</span>}
          </Column>
          <Row align="center">
            {time && <span className="caption muted mono">{time}</span>}
            {trailing}
          </Row>
        </Row>
        {children}
      </Column>
    </Row>
  );
}

interface TimelineProps {
  className?: string;
  children: ReactNode;
}

export function Timeline({ className, children }: TimelineProps) {
  return (
    <Column className={['timeline', className].filter(Boolean).join(' ')}>
      {children}
    </Column>
  );
}
