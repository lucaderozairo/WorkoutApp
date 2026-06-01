import { useUndoToast } from './hooks/useUndoToast';
import { Row } from '@ui/layout';
import { Surface } from '@ui/atoms';

export function UndoToast() {
  const { current, undo } = useUndoToast();
  if (!current) return null;
  return (
    <Surface>
      <div role="status" aria-live="polite">
      <Row align="center" justify="between">
        <span className="caption">{current.message}</span>
        <button type="button" className="secondary sm" onClick={undo}>
          Undo
        </button>
      </Row>
      </div>
    </Surface>
  );
}
