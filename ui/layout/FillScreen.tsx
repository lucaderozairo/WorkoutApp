import type { ReactNode } from 'react';
import { Column } from './Column';

interface FillScreenProps {
  className?: string;
  children: ReactNode;
}

export function FillScreen({ className, children }: FillScreenProps) {
  return (
    <Column gap={0} className={['fill-screen', className].filter(Boolean).join(' ')}>
      {children}
    </Column>
  );
}
