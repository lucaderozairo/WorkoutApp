import type { ReactNode } from 'react';

interface TableProps {
  className?: string;
  children: ReactNode;
}

export function Table({ className, children }: TableProps) {
  return <table className={['data-table', className].filter(Boolean).join(' ')}>{children}</table>;
}

interface TableHeadProps {
  children: ReactNode;
}

export function TableHead({ children }: TableHeadProps) {
  return <thead>{children}</thead>;
}

interface TableRowProps {
  onClick?: () => void;
  interactive?: boolean;
  className?: string;
  children: ReactNode;
}

export function TableRow({ onClick, interactive = false, className, children }: TableRowProps) {
  const classes = [interactive ? 'interactive' : '', className].filter(Boolean).join(' ');
  return <tr className={classes || undefined} onClick={onClick}>{children}</tr>;
}

interface TableCellProps {
  align?: 'left' | 'center' | 'right';
  mono?: boolean;
  muted?: boolean;
  header?: boolean;
  className?: string;
  children: ReactNode;
}

export function TableCell({ align, mono, muted, header = false, className, children }: TableCellProps) {
  const classes = [align && align !== 'left' ? align : '', mono ? 'mono' : '', muted ? 'muted' : '', className]
    .filter(Boolean)
    .join(' ');

  const Tag = header ? 'th' : 'td';
  return <Tag className={classes || undefined}>{children}</Tag>;
}
