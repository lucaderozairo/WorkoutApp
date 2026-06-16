import { Column, Row } from '@ui/layout';
import { Surface, Text } from '@ui/atoms';
import { Button, Modal } from '@ui/molecules';
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
  const available = registry.filter(def => !activeIds.has(def.id));

  return (
    <Modal open onClose={onClose} title="Add Widget" size="lg">
      <Column gap={3}>
        <Row align="center" justify="end">
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
    </Modal>
  );
}
