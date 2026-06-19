import { X } from 'lucide-react';
import type { ReactNode, ToggleEvent } from 'react';
import { useEffect, useId, useRef } from 'react';
import { Surface, Text } from '@ui/atoms';
import { Column, Row } from '@ui/layout';
import { Button } from './Button';

type DrawerSide = 'left' | 'right';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  side?: DrawerSide;
  footer?: ReactNode;
  children: ReactNode;
}

export function Drawer({ open, onClose, title, side = 'right', footer, children }: DrawerProps) {
  const id = useId();
  const panelId = `drawer-${id.replace(/:/g, '')}`;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const isOpen = el.matches(':popover-open');
    if (open && !isOpen) el.showPopover();
    if (!open && isOpen) el.hidePopover();
  }, [open]);

  return (
    <Surface
      ref={ref}
      id={panelId}
      popover="auto"
      variant="default"
      className={`drawer drawer-${side}`}
      onToggle={(event: ToggleEvent<HTMLElement>) => {
        if (event.newState === 'closed' && open) onClose();
      }}
    >
      <Column gap={4} className="h-full">
        <Row align="center" justify="between" gap={2}>
          {title ? <Text as="h2">{title}</Text> : <span />}
          <Button type="button" variant="ghost" size="icon" aria-label="Close drawer" onClick={onClose}>
            <X size={16} aria-hidden="true" />
          </Button>
        </Row>
        <Column gap={3} grow className="scroll-y">
          {children}
        </Column>
        {footer ? <Row justify="end" gap={2}>{footer}</Row> : null}
      </Column>
    </Surface>
  );
}
