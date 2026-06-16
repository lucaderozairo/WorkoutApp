import { forwardRef, type ReactNode } from 'react';
import { type Gap } from '@ui/layout/_classes';

export const CardScroller = forwardRef<HTMLDivElement, {
  gap?: Gap;
  children: ReactNode;
}>(function CardScroller({ gap = 3, children }, ref) {
  return (
    <div className="card-scroller">
      <div
        ref={ref}
        className="card-scroller-track"
        data-gap={gap !== 3 ? gap : undefined}
      >
        {children}
      </div>
    </div>
  );
});
