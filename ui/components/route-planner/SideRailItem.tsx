import type { ReactNode } from 'react';
import { Button } from '../../molecules/Button';

interface SideRailItemProps {
  id: string;
  label: string;
  icon: ReactNode;
  active?: boolean;
  onClick: () => void;
}

export function SideRailItem({ id, label, icon, active, onClick }: SideRailItemProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      active={active}
      className="side-rail-item"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      data-panel={id}
    >
      {icon}
      <span>{label}</span>
    </Button>
  );
}
