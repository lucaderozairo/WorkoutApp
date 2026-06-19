import type { ReactNode, ToggleEvent } from 'react';
import { useEffect, useRef } from 'react';
import { Column, Row } from '@ui/layout';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const SIZE_CLASS = { sm: 'modal-sm', md: '', lg: 'modal-lg' };

/**
 * Native Popover API modal — promoted to the browser top layer (no z-index),
 * with native light-dismiss + Esc and a ::backdrop. The `open` prop drives
 * show/hide imperatively; light-dismiss syncs back through onClose.
 */
export function Modal({ open, onClose, title, footer, size = 'md', children }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const isOpen = el.matches(':popover-open');
    if (open && !isOpen) el.showPopover();
    else if (!open && isOpen) el.hidePopover();
  }, [open]);

  const handleToggle = (e: ToggleEvent<HTMLDivElement>) => {
    // Native light-dismiss / Esc closed the popover — sync React state.
    if (e.newState === 'closed' && open) onClose();
  };

  return (
    <div
      ref={ref}
      popover="auto"
      onToggle={handleToggle}
      className={['modal', 'surface', SIZE_CLASS[size]].filter(Boolean).join(' ')}
    >
      <Column grow>
      {title && <h3>{title}</h3>}
      {children}
      {footer && <Row grow justify='between'>{footer}</Row>}
      </Column>
    </div>
  );
}
