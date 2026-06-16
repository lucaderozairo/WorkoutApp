import { useEffect, useRef, type CSSProperties } from 'react';
import { Column, Row } from '@ui/layout';
import { Text } from '@ui/atoms';
import { Button } from '@ui/molecules';
import type { WidgetDef, WidgetInstance, WidgetSize } from './widgetTypes';

const SIZE_LABELS: Record<WidgetSize, string> = {
  sm:   '1×1',
  wide: '2×1',
  md:   '2×2',
  lg:   '4×2',
};

interface Props {
  x: number;
  y: number;
  instance: WidgetInstance;
  def: WidgetDef;
  onSetSize: (instanceId: string, size: WidgetSize) => void;
  onRemove: (instanceId: string) => void;
  onClose: () => void;
}

export function WidgetContextMenu({ x, y, instance, def, onSetSize, onRemove, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  const style = {
    '--menu-x': `${x}px`,
    '--menu-y': `${y}px`,
  } as CSSProperties;

  return (
    // eslint-disable-next-line no-restricted-syntax -- Pointer coordinates feed menu position through CSS custom properties.
    <div ref={ref} className="surface menu-popover widget-context-menu" style={style} role="menu">
      <Column gap={0}>
        <Text size="caption" color="muted" className="px-3 py-2">Size</Text>
        {(['sm', 'wide', 'md', 'lg'] as WidgetSize[]).map(size => {
          const supported = def.sizes.includes(size);
          const active = instance.size === size;
          return (
            <Button
              key={size}
              role="menuitem"
              variant="ghost"
              className={`menu-item${active ? ' active' : ''}`}
              disabled={!supported}
              onClick={() => onSetSize(instance.instanceId, size)}
            >
              <Row align="center" justify="between" gap={3}>
                <span>{size === 'sm' ? 'Small' : size === 'wide' ? 'Wide' : size === 'md' ? 'Medium' : 'Large'}</span>
                <Text size="caption" color="muted">{SIZE_LABELS[size]}</Text>
              </Row>
            </Button>
          );
        })}
        {def.removable !== false && (
          <>
            <div className="divider" />
            <Button
              role="menuitem"
              variant="ghost"
              className="menu-item menu-item--danger"
              onClick={() => onRemove(instance.instanceId)}
            >
              Remove
            </Button>
          </>
        )}
      </Column>
    </div>
  );
}
