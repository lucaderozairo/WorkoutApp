import type { ReactNode } from 'react';

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
  const classes = ['row', 'align-center', 'surface', 'bare', interactive ? 'interactive' : '', className].filter(Boolean).join(' ');

  return (
    <li className={classes} onClick={onClick}>
      {leading && <span className="list-leading">{leading}</span>}
      {(label || sublabel) && (
        <span className="column grow">
          {label && <span>{label}</span>}
          {sublabel && <span className="caption muted">{sublabel}</span>}
        </span>
      )}
      {trailing && <span className="list-trailing">{trailing}</span>}
    </li>
  );
}
