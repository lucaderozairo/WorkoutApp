import type { ReactNode } from 'react';
import { Surface } from '@ui/atoms/Surface';
import { Row } from '@ui/layout/Row';

interface SegmentOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface SegmentedControlProps {
  options: SegmentOption[];
  value: string;
  onChange: (value: string) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export function SegmentedControl({ options, value, onChange, size = 'md', className }: SegmentedControlProps) {
  return (
    <Surface pad="sm" className={[size !== 'md' ? size : '', className].filter(Boolean).join(' ') || undefined}>
      <Row gap={1}>
        {options.map(opt => (
          <button
            key={opt.value}
            type="button"
            className={opt.value === value ? 'primary' : 'ghost'}
            onClick={() => onChange(opt.value)}
          >
            {opt.icon}
            {opt.label}
          </button>
        ))}
      </Row>
    </Surface>
  );
}
