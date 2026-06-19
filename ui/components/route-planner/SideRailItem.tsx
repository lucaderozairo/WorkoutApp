import type { ReactNode } from 'react';
import { Button } from '../../molecules/Button';
import { Column } from '@ui/layout';
import { Text } from '@ui/atoms';

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
      className="route-planner-rail-item"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      data-panel={id}
    >
      <Column align="center" gap={1}>
        {icon}
        <Text size="eyebrow">{label}</Text>
      </Column>
    </Button>
  );
}
