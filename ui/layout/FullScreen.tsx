import type { ReactNode } from 'react';
import { Column } from './Column';

interface FullScreenProps {
  className?: string;
  children: ReactNode;
}

export function FullScreen({ className, children }: FullScreenProps) {
  return (
    <Column gap={0} className={['full-screen', className].filter(Boolean).join(' ')}>
      {children}
    </Column>
  );
}
