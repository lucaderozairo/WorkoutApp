import type { ButtonHTMLAttributes } from 'react';
import { Button } from '../../molecules/Button';

interface MapControlButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export function MapControlButton({ active, children, ...rest }: MapControlButtonProps) {
  return (
    <Button variant="ghost" size="icon-sm" active={active} data-map-btn {...rest}>
      {children}
    </Button>
  );
}
