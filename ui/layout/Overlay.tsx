import type { ReactNode } from 'react';
import { Layer, type LayerZ } from './Layered';
import { type Gap } from './_classes';

type Pin = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';

interface OverlayProps {
  pin?: Pin;
  gap?: Gap;
  z?: LayerZ;
  className?: string;
  children: ReactNode;
}

export function Overlay({ pin = 'top-left', gap, z = 'content', className, children }: OverlayProps) {
  return (
    <Layer pin={pin} gap={gap} z={z} className={className}>
      {children}
    </Layer>
  );
}
