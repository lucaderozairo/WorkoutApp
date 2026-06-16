import type { ReactNode } from 'react';
import { useId } from 'react';
import { Surface } from '@ui/atoms';
import { Column } from '@ui/layout';
import { Button } from '@ui/molecules/Button';

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
  const alignClass = align === 'left' ? 'popover-align-start' : 'popover-align-end';

  return (
    <>
      <Button type="button" variant="ghost" popoverTarget={pid}>{trigger}</Button>
      <Surface
        as="div"
        id={pid}
        popover="auto"
        pad="sm"
        className={`dropdown menu-popover popover-bottom ${alignClass}`}
      >
        <Column gap={1}>
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
        </Column>
      </Surface>
    </>
  );
}
