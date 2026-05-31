import type { ReactNode } from 'react';
import { useId } from 'react';
import { Surface } from '@ui/atoms/Surface';
import { Row } from '@ui/layout/Row';
import { Column } from '@ui/layout/Column';

interface ExpandableCardProps {
  header: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/** CSS-only expandable — visually-hidden checkbox toggled by the header label
 *  reveals the body via :has(). No JS state. See .expandable/.exp-toggle in components.css. */
export function ExpandableCard({ header, children, footer, className }: ExpandableCardProps) {
  const id = useId();
  return (
    <Surface as="section" className={className}>
      <input type="checkbox" id={id} className="exp-toggle" />
      <label htmlFor={id} className="exp-trigger interactive">
        <Row justify="between" align="center">
          {header}
          <span className="chevron" aria-hidden>⌄</span>
        </Row>
      </label>
      <Column className="expandable">{children}</Column>
      {footer}
    </Surface>
  );
}
