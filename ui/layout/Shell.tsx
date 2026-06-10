import type { ReactNode } from 'react';
import { Grid } from './Grid';

interface ShellProps {
  mode?: 'web' | 'app';
  header?: ReactNode;
  menu?: ReactNode;
  navbar?: ReactNode;
  appbar?: ReactNode;
  footer?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function Shell({
  mode = 'web',
  header,
  menu,
  navbar,
  appbar,
  footer,
  className,
  children,
}: ShellProps) {
  return (
    <Grid className={['layout', mode, className].filter(Boolean).join(' ')} gap={0}>
      {menu}
      {header}
      {navbar}
      <main className="content">{children}</main>
      {appbar}
      {footer}
    </Grid>
  );
}
