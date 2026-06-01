import { useState } from 'react';
import type { Id } from '@shared/types';
import type { ActivityView } from '@features/training_log/projections';
import { handleFinishSession, handleUpdateSessionNote, getActivityHistory } from '@features/training_log';
import { useCommand } from '@ui/bindings';
import { exportSessionEnvelope } from '@data/sources/local/persistence';
import { exportSessionCsv, triggerDownload } from '@shared/utils/exportSession';
import { Row, Column, Cluster, Spacer } from '@ui/layout';

const RPE_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const SUGGESTED_TAGS = ['push', 'pull', 'legs', 'upper', 'lower', 'full-body', 'heavy', 'light', 'deload'];

type Props = {
  session: ActivityView;
  onClose: () => void;
  onFinished?: () => void;
  onJumpToBlock?: (blockId: Id<'Block'>) => void;
};

export function FinishSessionModal({ session, onClose, onFinished, onJumpToBlock }: Props) {
  const [rpe, setRpe] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState(session.notes);
  const [finished, setFinished] = useState(false);
  const { dispatch: finish } = useCommand(handleFinishSession);
  const { dispatch: updateNote } = useCommand(handleUpdateSessionNote);

  const totalSets = session.segments.reduce((acc, b) => acc + b.sets.length, 0);

  const toggleTag = (t: string) => {
    setTags(prev => (prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]));
  };

  const submit = async () => {
    if (notes !== session.notes) {
      await updateNote({ type: 'UpdateSessionNote', sessionId: session.id, notes });
    }
    await finish({
      type: 'FinishSession',
      sessionId: session.id,
      ...(rpe !== null ? { sessionRpe: rpe } : {}),
      ...(tags.length > 0 ? { tags } : {}),
    });
    setFinished(true);
    onFinished?.();
  };

  const handleExportJson = () => {
    const item = getActivityHistory().find(s => s.id === session.id);
    const sessions = item ? [item] : [];
    const json = exportSessionEnvelope(sessions);
    const blob = new Blob([json], { type: 'application/json' });
    const date = new Date().toISOString().split('T')[0];
    triggerDownload(blob, `session-${session.id}-${date}.json`);
  };

  const handleExportCsv = () => {
    exportSessionCsv(session);
  };

  return (
    <div role="dialog" aria-label="Finish session">
      <Column>
        <Row as="header" align="center" justify="between" gap={1}>
          <h3>Finish session</h3>
          <button type="button" className="ghost sm" onClick={onClose}>✕</button>
        </Row>

        <p className="caption">
          {session.segments.length} exercises · {totalSets} sets
        </p>

        <Column gap={1}>
          <span className="caption">Review</span>
          {session.segments.map(b => (
            <button
              key={b.id}
              type="button"
              className="ghost"
              onClick={() => { onJumpToBlock?.(b.id); onClose(); }}
            >
              <Row justify="between" align="center">
                <span>{b.exerciseName}</span>
                <span className="caption">{b.sets.length} sets</span>
              </Row>
            </button>
          ))}
        </Column>

        <Column gap={1}>
          <span className="caption">Session RPE</span>
          <Cluster gap={1}>
            {RPE_VALUES.map(n => (
              <button
                key={n}
                type="button"
                className={`pill${rpe === n ? ' primary' : ''}`}
                onClick={() => setRpe(n)}
              >
                {n}
              </button>
            ))}
          </Cluster>
        </Column>

        <Column gap={1}>
          <span className="caption">Tags</span>
          <Cluster gap={1}>
            {SUGGESTED_TAGS.map(t => (
              <button
                key={t}
                type="button"
                className={`pill${tags.includes(t) ? ' primary' : ''}`}
                onClick={() => toggleTag(t)}
              >
                {t}
              </button>
            ))}
          </Cluster>
        </Column>

        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Session notes…"
          rows={3}
        />

        {finished ? (
          <Row gap={1} align="center">
            <button type="button" className="secondary" onClick={handleExportJson}>Export JSON</button>
            <button type="button" className="secondary" onClick={handleExportCsv}>Export CSV</button>
            <Spacer />
            <button type="button" className="primary" onClick={onClose}>Close</button>
          </Row>
        ) : (
          <Row align="center" justify="between" gap={1}>
            <button type="button" className="ghost" onClick={onClose}>Cancel</button>
            <button type="button" className="primary" onClick={submit}>Finish</button>
          </Row>
        )}
      </Column>
    </div>
  );
}
