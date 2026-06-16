import type { ReactNode } from 'react';
import { Row } from '@ui/layout/Row';
import { Column } from '@ui/layout/Column';
import { Text } from '@ui/atoms';

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
      <Column className="min-w-0">
        <Row justify="between" align="center">
          <Column gap={0}>
            {title && <span>{title}</span>}
            {description && <Text as="span" size="caption" color="muted">{description}</Text>}
          </Column>
          <Row align="center">
            {time && <Text as="span" size="caption" color="muted" mono>{time}</Text>}
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
