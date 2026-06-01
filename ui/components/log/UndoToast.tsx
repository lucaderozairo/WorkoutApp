import { useUndoToast } from './hooks/useUndoToast';
import { Row } from '@ui/layout';
import { Surface, Button, Text } from '@ui/atoms';

export function UndoToast() {
  const { current, undo } = useUndoToast();
  if (!current) return null;
  return (
    <Surface>
      <div role="status" aria-live="polite">
        <Row align="center" justify="between">
          <Text size="caption">{current.message}</Text>
          <Button type="button" variant="secondary" size="sm" onClick={undo}>
            Undo
          </Button>
        </Row>
      </div>
    </Surface>
  );
}
