import type { ReactNode } from 'react';
import { Surface } from '@ui/atoms/Surface';
import { Column } from '@ui/layout/Column';
import { Text } from '@ui/atoms';

interface StatTileProps {
  value: ReactNode;
  unit?: string;
  label: string;
  className?: string;
}

export function StatTile({ value, unit, label, className }: StatTileProps) {
  return (
    <Surface variant="flat" pad="sm" className={['min-w-0', 'q-tile', className].filter(Boolean).join(' ')}>
      <Column gap={1} align="center">
        <Text as="span" size="detail" mono>
          {value}
          {unit && <Text as="span" size="caption" color="muted"> {unit}</Text>}
        </Text>
        <Text size="eyebrow">{label}</Text>
      </Column>
    </Surface>
  );
}
