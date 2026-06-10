import { useEffect, useRef } from 'react';
import { Column, Row } from '@ui/layout';
import { Surface, Text } from '@ui/atoms';
import { Button } from '@ui/molecules';
import type { WidgetDef } from './widgetTypes';

const SIZE_LABEL: Record<string, string> = {
  sm: '1×1', wide: '2×1', md: '2×2', lg: '4×2',
};

interface Props {
  registry: WidgetDef[];
  activeIds: Set<string>;
  onAdd: (id: string) => void;
  onClose: () => void;
}

export function WidgetAddPanel({ registry, activeIds, onAdd, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const available = registry.filter(def => !activeIds.has(def.id));

  return (
    <>
      <div
        className="overlay-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      <div ref={ref} className="side-panel" role="dialog" aria-label="Add widget">
        <Column gap={3}>
          <Row align="center" justify="between">
            <Text size="caption" color="muted">Add Widget</Text>
            <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">×</Button>
          </Row>
          {available.length === 0 ? (
            <Text size="detail" color="muted">All widgets are on your home screen.</Text>
          ) : (
            <Column gap={2}>
              {available.map(def => (
                <Surface key={def.id} as="button" onClick={() => onAdd(def.id)} className="widget-add-item">
                  <Row align="center" justify="between" gap={3}>
                    <Column gap={0}>
                      <Text size="caption">{def.label}</Text>
                      <Text size="detail" color="muted">
                        {def.sizes.map(s => SIZE_LABEL[s]).join(' · ')}
                      </Text>
                    </Column>
                    <Text size="caption" color="muted">+</Text>
                  </Row>
                </Surface>
              ))}
            </Column>
          )}
        </Column>
      </div>
    </>
  );
}
