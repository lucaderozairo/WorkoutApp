import type { ReactNode } from 'react';
import { Column } from '@ui/layout';
import { Text } from '@ui/atoms';

export interface TableOfContentsItem {
  id: string;
  label: ReactNode;
  level?: 1 | 2 | 3;
}

interface TableOfContentsProps {
  items: TableOfContentsItem[];
  activeId?: string;
  label?: string;
  className?: string;
}

export function TableOfContents({ items, activeId, label = 'Contents', className }: TableOfContentsProps) {
  return (
    <Column as="nav" gap={2} className={['table-of-contents', className].filter(Boolean).join(' ')} aria-label={label}>
      {items.map((item) => (
        <a key={item.id} href={`#${item.id}`} className="toc-link" data-level={item.level ?? 1} aria-current={activeId === item.id ? 'location' : undefined}>
          <Text size="caption" color={activeId === item.id ? 'default' : 'muted'}>{item.label}</Text>
        </a>
      ))}
    </Column>
  );
}
