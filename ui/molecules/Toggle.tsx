import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  pressed: boolean;
  onPressedChange?: (pressed: boolean) => void;
  children: ReactNode;
}

export function Toggle({ pressed, onPressedChange, className, children, onClick, ...rest }: ToggleProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={['toggle', pressed ? 'active' : '', className].filter(Boolean).join(' ')}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) onPressedChange?.(!pressed);
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
