import type { ReactNode } from 'react';

type SplitPaneVariant = 'sidebar-main' | 'main-detail';
type SplitPaneCollapseAt = 'mobile' | 'tablet';
type SplitPaneDefaultPane = 'primary' | 'secondary';

interface SplitPaneProps {
  primary: ReactNode;
  secondary: ReactNode;
  variant?: SplitPaneVariant;
  collapseAt?: SplitPaneCollapseAt;
  defaultPane?: SplitPaneDefaultPane;
  className?: string;
}

export function SplitPane({
  primary,
  secondary,
  variant = 'sidebar-main',
  collapseAt = 'mobile',
  defaultPane = 'primary',
  className,
}: SplitPaneProps) {
  const classes = [
    'split-pane',
    `split-pane-${variant}`,
    `split-pane-collapse-${collapseAt}`,
    `split-pane-default-${defaultPane}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <div className="split-pane-primary">{primary}</div>
      <div className="split-pane-secondary">{secondary}</div>
    </div>
  );
}

export type { SplitPaneVariant, SplitPaneCollapseAt, SplitPaneDefaultPane };
