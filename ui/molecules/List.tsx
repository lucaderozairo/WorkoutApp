import type { ReactNode } from 'react';
import { Row } from '../layout/Row';
import { Column } from '../layout/Column';

interface ListProps {
  divided?: boolean;
  className?: string;
  children: ReactNode;
}

export function List({ divided = false, className, children }: ListProps) {
  const classes = ['column', divided ? 'divided' : '', className].filter(Boolean).join(' ');
  return <ul className={classes}>{children}</ul>;
}

interface ListItemProps {
  leading?: ReactNode;
  trailing?: ReactNode;
  label?: string;
  sublabel?: string;
  interactive?: boolean;
  onClick?: () => void;
  className?: string;
}

export function ListItem({ leading, trailing, label, sublabel, interactive = false, onClick, className }: ListItemProps) {
  const classes = ['surface', interactive ? 'interactive' : '', className].filter(Boolean).join(' ');

  return (
    <li className={classes || undefined} onClick={onClick}>
      <Row align="center">
        {leading && <span className="list-leading">{leading}</span>}
        {(label || sublabel) && (
          <Column className="min-w-0">
            {label && <span>{label}</span>}
            {sublabel && <span className="caption muted">{sublabel}</span>}
          </Column>
        )}
        {trailing && <span className="list-trailing">{trailing}</span>}
      </Row>
    </li>
  );
}
