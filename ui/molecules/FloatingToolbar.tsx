import type { ReactNode } from 'react';
import { Layer, Row } from '@ui/layout';
import type { LayerPin, LayerZ } from '@ui/layout';
import { Surface } from '@ui/atoms';

interface FloatingToolbarProps {
  pin?: LayerPin;
  z?: LayerZ;
  className?: string;
  'aria-label'?: string;
  children: ReactNode;
}

export function FloatingToolbar({
  pin = 'bottom-center',
  z = 'controls',
  className,
  'aria-label': ariaLabel,
  children,
}: FloatingToolbarProps) {
  return (
    <Layer pin={pin} z={z}>
      <Surface as="nav" pad="sm" className={className} aria-label={ariaLabel}>
        <Row align="center" gap={1}>
          {children}
        </Row>
      </Surface>
    </Layer>
  );
}
