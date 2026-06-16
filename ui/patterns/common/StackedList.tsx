import type { ReactNode } from 'react';
import { List, ListItem } from '@ui/molecules';

export interface StackedListItem {
  id: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  label?: string;
  sublabel?: string;
  onClick?: () => void;
}

interface StackedListProps {
  items: StackedListItem[];
  divided?: boolean;
  className?: string;
}

export function StackedList({ items, divided = true, className }: StackedListProps) {
  return (
    <List divided={divided} className={className}>
      {items.map((item) => (
        <ListItem
          key={item.id}
          leading={item.leading}
          trailing={item.trailing}
          label={item.label}
          sublabel={item.sublabel}
          interactive={Boolean(item.onClick)}
          onClick={item.onClick}
        />
      ))}
    </List>
  );
}
