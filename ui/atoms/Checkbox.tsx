import { useRef, useEffect } from 'react';
import { Text } from './Text';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  indeterminate?: boolean;
  className?: string;
}

export function Checkbox({ checked, onChange, label, disabled, indeterminate = false, className }: CheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <label className={['checkbox-label', className].filter(Boolean).join(' ')}>
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={e => onChange(e.target.checked)}
      />
      {label && <Text as="span">{label}</Text>}
    </label>
  );
}
