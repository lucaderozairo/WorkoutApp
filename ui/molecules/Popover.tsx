import type { ReactNode, ToggleEvent } from 'react';
import { useId, useEffect, useRef } from 'react';

type Position = 'top' | 'bottom' | 'left' | 'right';
type Align = 'start' | 'center' | 'end';

interface PopoverProps {
  trigger: ReactNode;
  position?: Position;
  align?: Align;
  /** Optional controlled visibility. When omitted, the popover is uncontrolled. */
  open?: boolean;
  onClose?: () => void;
  children: ReactNode;
}

/**
 * Native Popover API popover — top-layer, anchored to its invoker, with native
 * light-dismiss. Pass `open`/`onClose` for controlled visibility, or omit them
 * for uncontrolled (the trigger button toggles it natively).
 */
export function Popover({ trigger, position = 'bottom', open, onClose, children }: PopoverProps) {
  const id = useId();
  const pid = `pop-${id.replace(/:/g, '')}`;
  const ref = useRef<HTMLDivElement>(null);
  const controlled = open !== undefined;

  useEffect(() => {
    if (!controlled) return;
    const el = ref.current;
    if (!el) return;
    const isOpen = el.matches(':popover-open');
    if (open && !isOpen) el.showPopover();
    else if (!open && isOpen) el.hidePopover();
  }, [open, controlled]);

  const anchorClass = position === 'top' ? ' anchor-above' : '';

  return (
    <>
      <button type="button" className="ghost" popoverTarget={pid}>{trigger}</button>
      <div
        ref={ref}
        id={pid}
        popover="auto"
        className={`popover surface menu-popover${anchorClass}`}
        onToggle={controlled ? (e: ToggleEvent<HTMLDivElement>) => {
          if (e.newState === 'closed' && open) onClose?.();
        } : undefined}
      >
        {children}
      </div>
    </>
  );
}
