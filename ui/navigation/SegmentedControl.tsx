import type { ReactNode } from 'react';

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
  const classes = ['surface', 'tight', 'row', 'compact', size !== 'md' ? size : '', className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
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
    </div>
  );
}
