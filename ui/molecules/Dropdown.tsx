import type { ReactNode } from 'react';
import { useId } from 'react';
import { Button } from '@ui/atoms/Button';

interface DropdownItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
}

/**
 * Native Popover API dropdown — the menu is promoted to the top layer (no
 * z-index) and anchored to its invoker via the implicit anchor. Light-dismiss
 * + Esc are native, so there's no outside-click listener.
 */
export function Dropdown({ trigger, items, align = 'right' }: DropdownProps) {
  const id = useId();
  const pid = `dd-${id.replace(/:/g, '')}`;

  return (
    <>
      <button type="button" className="ghost" popoverTarget={pid}>{trigger}</button>
      <div
        id={pid}
        popover="auto"
        className={`dropdown surface column gap-1 menu-popover${align === 'left' ? ' anchor-left' : ''}`}
      >
        {items.map((item, i) => (
          <Button
            key={i}
            variant="ghost"
            block
            disabled={item.disabled}
            leading={item.icon}
            className={item.destructive ? 'negative' : undefined}
            onClick={() => { item.onClick(); document.getElementById(pid)?.hidePopover(); }}
          >
            {item.label}
          </Button>
        ))}
      </div>
    </>
  );
}
