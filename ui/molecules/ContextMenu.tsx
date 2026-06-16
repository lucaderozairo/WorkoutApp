import type { ReactNode } from 'react';
import { Dropdown } from './Dropdown';

export interface ContextMenuItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

interface ContextMenuProps {
  trigger: ReactNode;
  items: ContextMenuItem[];
  align?: 'left' | 'right';
}

export function ContextMenu({ trigger, items, align = 'right' }: ContextMenuProps) {
  return <Dropdown trigger={trigger} items={items} align={align} />;
}
