import type { ReactNode, ToggleEvent } from 'react';
import { useEffect, useRef } from 'react';
import { Button } from '@ui/atoms/Button';
import { Column } from '@ui/layout/Column';

interface ActionSheetItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  destructive?: boolean;
}

interface ActionSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  items: ActionSheetItem[];
}

/**
 * Native Popover API bottom action sheet — top-layer + ::backdrop, native
 * light-dismiss/Esc. The `open` prop drives show/hide; light-dismiss syncs
 * back via onClose.
 */
export function ActionSheet({ open, onClose, title, items }: ActionSheetProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const isOpen = el.matches(':popover-open');
    if (open && !isOpen) el.showPopover();
    else if (!open && isOpen) el.hidePopover();
  }, [open]);

  return (
    <div
      ref={ref}
      popover="auto"
      data-snap="mid"
      className="bottom-sheet action-sheet"
      onToggle={(e: ToggleEvent<HTMLDivElement>) => { if (e.newState === 'closed' && open) onClose(); }}
    >
      <div className="handle" />
      <Column className="body">
        {title && <span className="caption muted">{title}</span>}
        {items.map((item, i) => (
          <Button
            key={i}
            variant="ghost"
            block
            leading={item.icon}
            className={item.destructive ? 'negative' : undefined}
            onClick={() => { item.onClick(); onClose(); }}
          >
            {item.label}
          </Button>
        ))}
        <Button variant="ghost" block onClick={onClose}>Cancel</Button>
      </Column>
    </div>
  );
}
