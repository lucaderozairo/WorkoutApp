import type { ReactNode } from 'react';

interface FullScreenProps {
  className?: string;
  children: ReactNode;
}

export function FullScreen({ className, children }: FullScreenProps) {
  return (
    <div className={['full-screen', className].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
}
