import type { ReactNode } from 'react';
import { Cluster } from '@ui/layout';

export interface BreadcrumbItem {
  label: ReactNode;
  href?: string;
  onClick?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  label?: string;
  className?: string;
}

export function Breadcrumb({ items, label = 'Breadcrumb', className }: BreadcrumbProps) {
  return (
    <nav aria-label={label} className={['breadcrumb', className].filter(Boolean).join(' ')}>
      <Cluster as="ol" gap={1} align="center">
        {items.map((item, index) => {
          const current = index === items.length - 1;
          return (
            <li key={index}>
              {item.href ? (
                <a href={item.href} aria-current={current ? 'page' : undefined}>{item.label}</a>
              ) : (
                <button type="button" className="breadcrumb-button" aria-current={current ? 'page' : undefined} onClick={item.onClick}>
                  {item.label}
                </button>
              )}
            </li>
          );
        })}
      </Cluster>
    </nav>
  );
}
