import type { ReactNode } from 'react';
import { Column } from '@ui/layout';

type Snap = 'peek' | 'mid' | 'full';

interface BottomSheetProps {
  snap: Snap;
  onSnapChange?: (snap: Snap) => void;
  children: ReactNode;
}

export function BottomSheet({ snap, children }: BottomSheetProps) {
  return (
    <div className="bottom-sheet" data-snap={snap}>
      <div data-role="handle" />
      <Column gap={3} className="body">{children}</Column>
    </div>
  );
}
