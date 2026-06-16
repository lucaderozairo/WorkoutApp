import type { ReactNode } from 'react';
import { Cluster, Row } from '@ui/layout';
import { Surface } from '@ui/atoms';

interface FilterBarProps {
  search?: ReactNode;
  filters?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function FilterBar({ search, filters, actions, className }: FilterBarProps) {
  return (
    <Surface as="section" pad="sm" className={['filter-bar', className].filter(Boolean).join(' ')}>
      <Row align="center" justify="between" gap={3} wrap>
        <Row align="center" gap={2} className="min-w-0">
          {search}
        </Row>
        {filters ? <Cluster gap={1}>{filters}</Cluster> : null}
        {actions ? <Cluster gap={1} justify="end">{actions}</Cluster> : null}
      </Row>
    </Surface>
  );
}
