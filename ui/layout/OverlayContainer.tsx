import type { ReactNode } from 'react';
import { Layered } from './Layered';

interface OverlayContainerProps {
  as?: 'div' | 'section';
  className?: string;
  children: ReactNode;
}

export function OverlayContainer({ as: Tag = 'div', className, children }: OverlayContainerProps) {
  return (
    <Layered as={Tag} fill clip className={className}>
      {children}
    </Layered>
  );
}
