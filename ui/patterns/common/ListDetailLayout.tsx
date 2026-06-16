import type { ReactNode } from 'react';
import { SplitPane, type SplitPaneCollapseAt, type SplitPaneDefaultPane } from '@ui/layout';

interface ListDetailLayoutProps {
  list: ReactNode;
  detail: ReactNode;
  collapseAt?: SplitPaneCollapseAt;
  defaultPane?: SplitPaneDefaultPane;
  className?: string;
}

export function ListDetailLayout({
  list,
  detail,
  collapseAt = 'mobile',
  defaultPane = 'primary',
  className,
}: ListDetailLayoutProps) {
  return (
    <SplitPane
      primary={list}
      secondary={detail}
      variant="sidebar-main"
      collapseAt={collapseAt}
      defaultPane={defaultPane}
      className={['list-detail-layout', className].filter(Boolean).join(' ')}
    />
  );
}
