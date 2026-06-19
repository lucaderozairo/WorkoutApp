import type { ReactNode } from 'react';

interface FillScreenProps {
  className?: string;
  children: ReactNode;
}

export function FillScreen({ className, children }: FillScreenProps) {
  return (
    <div className={['fill-screen', className].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
}
