import type { ReactNode } from 'react';
import { Chip } from '@ui/atoms/Chip';
import { Cluster } from '@ui/layout/Cluster';

interface ChipGroupProps<T extends string | number> {
  options: readonly T[];
  isActive: (option: T) => boolean;
  onToggle: (option: T) => void;
  renderLabel?: (option: T) => ReactNode;
  className?: string;
}

export function ChipGroup<T extends string | number>({
  options, isActive, onToggle, renderLabel, className,
}: ChipGroupProps<T>) {
  return (
    <Cluster gap={1} className={className}>
      {options.map(opt => (
        <Chip key={String(opt)} active={isActive(opt)} onClick={() => onToggle(opt)}>
          {renderLabel ? renderLabel(opt) : opt}
        </Chip>
      ))}
    </Cluster>
  );
}
