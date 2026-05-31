import { useEffect, useState } from 'react';
import { Check, MessageSquare, MoreVertical, Pencil, Trash2, X } from 'lucide-react';
import type { UISet } from '@features/training_log/projections/viewTypes';
import type { SetMode } from '@data/static/exercises';
import { Row, Column, Cluster } from '@ui/layout';
import { Surface } from '@ui/atoms';

export interface SetRowProps {
  num: number;
  set: UISet;
  menuKey: string;
  openMenu: string | null;
  onOpenMenu: (key: string | null) => void;
  onToggleWarmup: () => void;
  onToggleDone: () => void;
  onDeleteRequest: () => void;
  onUpdate: (weightKg: number, reps: number) => void;
  onComment: (text: string) => void;
  currentMode: SetMode;
  availableModes: SetMode[];
  onSetModeChange: (mode: SetMode) => void;
  disabled?: boolean;
}

export function SetRow({
  num, set, menuKey, openMenu, onOpenMenu, onToggleWarmup, onToggleDone, onDeleteRequest, onUpdate, onComment,
  currentMode, availableModes, onSetModeChange, disabled = false,
}: SetRowProps) {
  const { w, r, done: _done, warmup, comment } = set;
  const isOpen = openMenu === menuKey;

  const [wVal, setWVal] = useState(w !== '—' ? w : '');
  const [rVal, setRVal] = useState(r);
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentDraft, setCommentDraft] = useState(comment ?? '');

  useEffect(() => { setWVal(w !== '—' ? w : ''); }, [w]);
  useEffect(() => { setRVal(r); }, [r]);
  useEffect(() => { setCommentDraft(comment ?? ''); }, [comment]);

  const commit = (newW: string, newR: string) => {
    const weightKg = Math.max(0, parseFloat(newW) || 0);
    const reps = currentMode === 'time' || currentMode === 'dist'
      ? Math.max(0, parseInt(newR) || 0)
      : Math.max(1, parseInt(newR) || 1);
    onUpdate(weightKg, reps);
  };

  const submitComment = () => {
    onComment(commentDraft.trim());
    setCommentOpen(false);
  };

  const label = warmup ? 'WU' : `S${num}`;
  const cls = warmup ? 'faint' : 'muted';

  const sepCls = `set-sep caption ${cls}`;

  return (
    <Column gap={1}>
      <Row align="center" justify="between">
        <span className={`mono caption ${cls}`} style={{ minWidth: 28, textAlign: 'center', fontWeight: 600 }}>
          {label}
        </span>
        <Row className="grow" align="center" gap={1}>
          {currentMode === 'wt-reps' && (
            <>
              <input
                type="number"
                className={`mono num${warmup ? ' faint' : ''}`}
                value={wVal}
                placeholder="0"
                min="0"
                step="0.5"
                disabled={disabled}
                onChange={e => setWVal(e.target.value)}
                onBlur={e => commit(e.target.value, rVal)}
              />
              <span className={sepCls}>kg ×</span>
              <input
                type="number"
                className={`mono num${warmup ? ' faint' : ''}`}
                value={rVal}
                placeholder="1"
                min="1"
                step="1"
                disabled={disabled}
                onChange={e => setRVal(e.target.value)}
                onBlur={e => commit(wVal, e.target.value)}
              />
              <span className={sepCls}>reps</span>
            </>
          )}
          {currentMode === 'reps' && (
            <>
              <span className={sepCls}>×</span>
              <input
                type="number"
                className={`mono num grow${warmup ? ' faint' : ''}`}
                value={rVal}
                placeholder="1"
                min="1"
                step="1"
                disabled={disabled}
                onChange={e => setRVal(e.target.value)}
                onBlur={e => commit('0', e.target.value)}
              />
              <span className={sepCls}>reps</span>
            </>
          )}
          {currentMode === 'time' && (
            <>
              <input
                type="number"
                className={`mono num${warmup ? ' faint' : ''}`}
                value={wVal}
                placeholder="0"
                min="0"
                step="1"
                disabled={disabled}
                onChange={e => setWVal(e.target.value)}
                onBlur={e => commit(e.target.value, '0')}
              />
              <span className={sepCls}>sec</span>
            </>
          )}
          {currentMode === 'dist' && (
            <>
              <input
                type="number"
                className={`mono num${warmup ? ' faint' : ''}`}
                value={wVal}
                placeholder="0"
                min="0"
                step="1"
                disabled={disabled}
                onChange={e => setWVal(e.target.value)}
                onBlur={e => commit(e.target.value, '0')}
              />
              <span className={sepCls}>m</span>
            </>
          )}
          {currentMode === 'dist-time' && (
            <>
              <input
                type="number"
                className={`mono num${warmup ? ' faint' : ''}`}
                value={wVal}
                placeholder="0"
                min="0"
                step="1"
                disabled={disabled}
                onChange={e => setWVal(e.target.value)}
                onBlur={e => commit(e.target.value, rVal)}
              />
              <span className={sepCls}>m</span>
              <input
                type="number"
                className={`mono num${warmup ? ' faint' : ''}`}
                value={rVal}
                placeholder="0"
                min="0"
                step="1"
                disabled={disabled}
                onChange={e => setRVal(e.target.value)}
                onBlur={e => commit(wVal, e.target.value)}
              />
              <span className={sepCls}>sec</span>
            </>
          )}
        </Row>
        {!disabled && (
          <button
            type="button"
            className="ghost icon sm"
            onClick={() => onOpenMenu(isOpen ? null : menuKey)}
          >
            <MoreVertical size={10} className="faint" />
          </button>
        )}
      </Row>

      {comment && !commentOpen && (
        <Row align="center" justify="between">
          <button className="icon sm ghost" disabled>
            <MessageSquare size={9} className="faint" />
          </button>
          <div className="surface tight ghost grow align-center">
            <span className="caption pre-wrap">{comment}</span>
          </div>
          {!disabled && (
            <button className="ghost icon sm" onClick={() => setCommentOpen(true)}>
              <Pencil size={10} className="faint" />
            </button>
          )}
        </Row>
      )}

      {!disabled && isOpen && (
        <Surface variant="flat" pad="sm">
          <Column gap={1}>
            <Row justify="between" align="center">
              <h3>Set Options</h3>
              <button type="button" className="ghost icon sm" onClick={() => onOpenMenu(null)}>
                <X size={10} className="faint" />
              </button>
            </Row>
            <Row gap={1}>
              <button type="button" className="ghost sm" onClick={() => { onToggleWarmup(); onOpenMenu(null); }}>
                {warmup ? 'Mark working' : 'Mark warmup'}
              </button>
              <button type="button" className="ghost sm" onClick={() => { onOpenMenu(null); setCommentOpen(v => !v); }}>
                <MessageSquare size={9} /> {comment ? 'Edit note' : 'Add note'}
              </button>
            </Row>
            <span className="eyebrow">Set mode</span>
            <Cluster gap={1}>
              {availableModes.map(mode => (
                <button
                  key={mode}
                  type="button"
                  className={`chip${currentMode === mode ? ' active' : ''}`}
                  onClick={() => { onSetModeChange(mode); onOpenMenu(null); }}
                >
                  {mode}
                </button>
              ))}
            </Cluster>
            <Row gap={1} justify="between">
              <span />
              <button
                type="button"
                className="sm warning"
                onClick={() => { onOpenMenu(null); onDeleteRequest(); }}
              >
                <Trash2 size={9} /> Delete
              </button>
            </Row>
          </Column>
        </Surface>
      )}

      {!disabled && commentOpen && (
        <Row gap={1} align="start">
          <button className='icon sm ghost' disabled><MessageSquare size={9} /></button>
          <textarea
            className="grow"
            rows={3}
            placeholder="Add a note…"
            value={commentDraft}
            autoFocus
            onChange={e => setCommentDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Escape') setCommentOpen(false);
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') submitComment();
            }}
          />
          <Column gap={1} align="center">
            <button type="button" className="ghost icon sm" onClick={submitComment}>
              <Check size={10} />
            </button>
            <button type="button" className="ghost icon sm" onClick={() => setCommentOpen(false)}>
              <X size={10} className="faint" />
            </button>
          </Column>
        </Row>
      )}
    </Column>
  );
}
