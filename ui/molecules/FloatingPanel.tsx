import type { ComponentProps, ReactNode } from 'react';
import { Layer } from '@ui/layout';
import type { LayerPin, LayerZ } from '@ui/layout';
import { Surface } from '@ui/atoms';

type SurfaceVariant = ComponentProps<typeof Surface>['variant'];
type SurfacePad = ComponentProps<typeof Surface>['pad'];

interface FloatingPanelProps {
  pin?: LayerPin;
  z?: LayerZ;
  variant?: SurfaceVariant;
  pad?: SurfacePad;
  className?: string;
  children: ReactNode;
}

export function FloatingPanel({
  pin = 'top-left',
  z = 'controls',
  variant = 'default',
  pad = 'sm',
  className,
  children,
}: FloatingPanelProps) {
  return (
    <Layer pin={pin} z={z}>
      <Surface variant={variant} pad={pad} className={className}>
        {children}
      </Surface>
    </Layer>
  );
}
