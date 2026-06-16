import type { ReactNode } from 'react';
import { Layer } from '@ui/layout';
import type { LayerPin, LayerZ } from '@ui/layout';
import { Button } from './Button';

interface FloatingActionButtonProps {
  pin?: LayerPin;
  z?: LayerZ;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  className?: string;
}

export function FloatingActionButton({
  pin = 'bottom-right',
  z = 'controls',
  label,
  icon,
  onClick,
  className,
}: FloatingActionButtonProps) {
  return (
    <Layer pin={pin} z={z}>
      <Button type="button" variant="primary" size="icon" aria-label={label} className={['fab', className].filter(Boolean).join(' ')} onClick={onClick}>
        {icon}
      </Button>
    </Layer>
  );
}
