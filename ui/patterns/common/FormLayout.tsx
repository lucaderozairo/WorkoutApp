import type { ReactNode } from 'react';
import { ResponsiveFrame, Stack } from '@ui/layout';

interface FormLayoutProps {
  header?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function FormLayout({ header, actions, children, className }: FormLayoutProps) {
  return (
    <ResponsiveFrame maxWidth="form" padding="md" className={['form-layout', className].filter(Boolean).join(' ')}>
      <Stack gap={4}>
        {header}
        <div className="form-layout-body">{children}</div>
        {actions ? <div className="form-layout-actions">{actions}</div> : null}
      </Stack>
    </ResponsiveFrame>
  );
}
