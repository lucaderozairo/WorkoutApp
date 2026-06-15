import { useEffect, useState } from 'react';
import { Calculator, Check, MessageSquare, MoreVertical, Pencil, Trash2, X } from 'lucide-react';
import type { UISet } from '@features/training_log/projections/viewTypes';
import type { SetMode } from '@data/static/exercises';
import { Row, Column, Cluster, Spacer } from '@ui/layout';
import { Surface, Text, Chip } from '@ui/atoms';
import { Button, Input, Textarea } from '@ui/molecules';

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
  onToggleDropset?: () => void;
  onPlateCalculator?: (weightKg: number) => void;
  currentMode: SetMode;
  availableModes: SetMode[];
  onSetModeChange: (mode: SetMode) => void;
  disabled?: boolean;
}

export function SetRow({
  num, set, menuKey, openMenu, onOpenMenu, onToggleWarmup, onToggleDone, onDeleteRequest, onUpdate, onComment,
  onToggleDropset, onPlateCalculator, currentMode, availableModes, onSetModeChange, disabled = false,
}: SetRowProps) {
  const { w, r, done: _done, warmup, comment, setType } = set;
  const isDropset = setType === 'dropset';
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
  const labelColor = warmup ? 'faint' : 'muted';
  const numberClass = `mono num${warmup ? ' faint' : ''}`;

  return (
    <Column gap={1}>
      <Row align="center" justify="between">
        <Row gap={1} align="center">
          <span className={`mono caption bold text-center set-number ${labelColor}`}>
            {label}
          </span>
          {isDropset && <Chip active>DROP</Chip>}
        </Row>
        <Row className="min-w-0" align="center" gap={1}>
          {currentMode === 'wt-reps' && (
            <>
              <Input
                type="number"
                controlClassName={numberClass}
                value={wVal}
                placeholder="0"
                min="0"
                step="0.5"
                disabled={disabled}
                onChange={e => setWVal(e.target.value)}
                onBlur={e => commit(e.target.value, rVal)}
              />
              <Text size="caption" color={labelColor} mono className="set-sep">kg ×</Text>
              <Input
                type="number"
                controlClassName={numberClass}
                value={rVal}
                placeholder="1"
                min="1"
                step="1"
                disabled={disabled}
                onChange={e => setRVal(e.target.value)}
                onBlur={e => commit(wVal, e.target.value)}
              />
              <Text size="caption" color={labelColor} mono className="set-sep">reps</Text>
              {onPlateCalculator && !warmup && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onPlateCalculator(parseFloat(wVal) || 0)}
                  title="Plate calculator"
                >
                  <Calculator size={10} className="faint" />
                </Button>
              )}
            </>
          )}
          {currentMode === 'reps' && (
            <>
              <Text size="caption" color={labelColor} mono className="set-sep">×</Text>
              <Input
                type="number"
                className="min-w-0"
                controlClassName={numberClass}
                value={rVal}
                placeholder="1"
                min="1"
                step="1"
                disabled={disabled}
                onChange={e => setRVal(e.target.value)}
                onBlur={e => commit('0', e.target.value)}
              />
              <Text size="caption" color={labelColor} mono className="set-sep">reps</Text>
            </>
          )}
          {currentMode === 'time' && (
            <>
              <Input
                type="number"
                controlClassName={numberClass}
                value={wVal}
                placeholder="0"
                min="0"
                step="1"
                disabled={disabled}
                onChange={e => setWVal(e.target.value)}
                onBlur={e => commit(e.target.value, '0')}
              />
              <Text size="caption" color={labelColor} mono className="set-sep">sec</Text>
            </>
          )}
          {currentMode === 'dist' && (
            <>
              <Input
                type="number"
                controlClassName={numberClass}
                value={wVal}
                placeholder="0"
                min="0"
                step="1"
                disabled={disabled}
                onChange={e => setWVal(e.target.value)}
                onBlur={e => commit(e.target.value, '0')}
              />
              <Text size="caption" color={labelColor} mono className="set-sep">m</Text>
            </>
          )}
          {currentMode === 'dist-time' && (
            <>
              <Input
                type="number"
                controlClassName={numberClass}
                value={wVal}
                placeholder="0"
                min="0"
                step="1"
                disabled={disabled}
                onChange={e => setWVal(e.target.value)}
                onBlur={e => commit(e.target.value, rVal)}
              />
              <Text size="caption" color={labelColor} mono className="set-sep">m</Text>
              <Input
                type="number"
                controlClassName={numberClass}
                value={rVal}
                placeholder="0"
                min="0"
                step="1"
                disabled={disabled}
                onChange={e => setRVal(e.target.value)}
                onBlur={e => commit(wVal, e.target.value)}
              />
              <Text size="caption" color={labelColor} mono className="set-sep">sec</Text>
            </>
          )}
        </Row>
        {!disabled && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onOpenMenu(isOpen ? null : menuKey)}
          >
            <MoreVertical size={10} className="faint" />
          </Button>
        )}
      </Row>

      {comment && !commentOpen && (
        <Row align="center" justify="between">
          <Button variant="ghost" size="icon" disabled>
            <MessageSquare size={9} className="faint" />
          </Button>
          <Surface variant="ghost" pad="sm" className="min-w-0">
            <Text size="caption" className="pre-wrap">{comment}</Text>
          </Surface>
          {!disabled && (
            <Button variant="ghost" size="icon" onClick={() => setCommentOpen(true)}>
              <Pencil size={10} className="faint" />
            </Button>
          )}
        </Row>
      )}

      {!disabled && isOpen && (
        <Surface variant="flat" pad="sm">
          <Column gap={1}>
            <Row justify="between" align="center">
              <Text as="h3">Set Options</Text>
              <Button type="button" variant="ghost" size="icon" onClick={() => onOpenMenu(null)}>
                <X size={10} className="faint" />
              </Button>
            </Row>
            <Row gap={1}>
              <Button type="button" variant="ghost" size="sm" onClick={() => { onToggleWarmup(); onOpenMenu(null); }}>
                {warmup ? 'Mark working' : 'Mark warmup'}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => { onOpenMenu(null); setCommentOpen(v => !v); }}>
                <MessageSquare size={9} /> {comment ? 'Edit note' : 'Add note'}
              </Button>
              {onToggleDropset && !warmup && (
                <Button type="button" variant="ghost" size="sm" onClick={() => { onToggleDropset(); onOpenMenu(null); }}>
                  {isDropset ? 'Clear drop set' : 'Mark drop set'}
                </Button>
              )}
            </Row>
            <Text size="eyebrow">Set mode</Text>
            <Cluster gap={1}>
              {availableModes.map(mode => (
                <Chip
                  key={mode}
                  active={currentMode === mode}
                  onClick={() => { onSetModeChange(mode); onOpenMenu(null); }}
                >
                  {mode}
                </Chip>
              ))}
            </Cluster>
            <Row gap={1} justify="between">
              <Spacer />
              <Button
                type="button"
                size="sm"
                className="error-tint"
                onClick={() => { onOpenMenu(null); onDeleteRequest(); }}
              >
                <Trash2 size={9} /> Delete
              </Button>
            </Row>
          </Column>
        </Surface>
      )}

      {!disabled && commentOpen && (
        <Row gap={1} align="start">
          <Button variant="ghost" size="icon" disabled><MessageSquare size={9} /></Button>
          <Textarea
            className="min-w-0"
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
            <Button type="button" variant="ghost" size="icon" onClick={submitComment}>
              <Check size={10} />
            </Button>
            <Button type="button" variant="ghost" size="icon" onClick={() => setCommentOpen(false)}>
              <X size={10} className="faint" />
            </Button>
          </Column>
        </Row>
      )}
    </Column>
  );
}
