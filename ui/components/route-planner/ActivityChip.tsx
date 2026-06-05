import type { ReactNode } from 'react';
import { Button } from '../../molecules/Button';
import { Column } from '../../layout/Column';

interface ActivityChipProps {
  id: string;
  label: string;
  dot: ReactNode;
  active?: boolean;
  onClick: () => void;
}

export function ActivityChip({ id, label, dot, active, onClick }: ActivityChipProps) {
  return (
    <Button
      variant="ghost"
      active={active}
      className="activity-chip"
      onClick={onClick}
      data-id={id}
    >
      <Column gap={1} align="center">
        {dot}
        <span>{label}</span>
      </Column>
    </Button>
  );
}
