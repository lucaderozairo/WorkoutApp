import type { ReactNode } from 'react';

interface SidebarProps {
  open: boolean;
  rail: ReactNode;
  children?: ReactNode;
}

export function Sidebar({ open, rail, children }: SidebarProps) {
  return (
    <div className="side">
      <div className="side-rail">{rail}</div>
      {open && children && <div className="side-content">{children}</div>}
    </div>
  );
}
