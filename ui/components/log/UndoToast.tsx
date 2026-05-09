import { useUndoToast } from './hooks/useUndoToast';

export function UndoToast() {
  const { current, undo } = useUndoToast();
  if (!current) return null;
  return (
    <div className="surface row align-center space-between" role="status" aria-live="polite">
      <span className="caption">{current.message}</span>
      <button type="button" className="secondary sm" onClick={undo}>
        Undo
      </button>
    </div>
  );
}
