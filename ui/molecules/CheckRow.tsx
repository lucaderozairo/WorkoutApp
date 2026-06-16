import type { ReactNode } from 'react';
import { Button } from './Button';
import { Text } from '@ui/atoms';

const Checkmark = () => (
  <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
    <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface CheckRowProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  trailing?: ReactNode;
  className?: string;
}

export function CheckRow({ label, checked, onChange, trailing, className }: CheckRowProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      role="checkbox"
      aria-checked={checked}
      className={['check-row', className].filter(Boolean).join(' ')}
      onClick={() => onChange(!checked)}
      leading={
        <span className="check-icon" aria-hidden="true">
          {checked && <Checkmark />}
        </span>
      }
      trailing={trailing}
    >
      <Text className="check-label">{label}</Text>
    </Button>
  );
}
