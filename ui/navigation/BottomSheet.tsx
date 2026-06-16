import type { ReactNode } from 'react';

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
      <div className="body">{children}</div>
    </div>
  );
}
