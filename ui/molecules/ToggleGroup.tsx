import type { ReactNode } from 'react';
import { Toggle } from './Toggle';

export interface ToggleGroupItem<T extends string> {
  value: T;
  label: ReactNode;
  disabled?: boolean;
}

interface ToggleGroupProps<T extends string> {
  items: ToggleGroupItem<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  className?: string;
}

export function ToggleGroup<T extends string>({ items, value, onChange, label, className }: ToggleGroupProps<T>) {
  return (
    <div role="group" aria-label={label} className={['toggle-group', className].filter(Boolean).join(' ')}>
      {items.map((item) => (
        <Toggle
          key={item.value}
          pressed={value === item.value}
          disabled={item.disabled}
          onPressedChange={() => onChange(item.value)}
        >
          {item.label}
        </Toggle>
      ))}
    </div>
  );
}
