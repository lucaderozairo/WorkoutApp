import { useState } from 'react';
import { AlertTriangle, MoreVertical, Trash2, X } from 'lucide-react';
import { Row, Column, Cluster } from '@ui/layout';
import { Surface } from '@ui/atoms';
import { ExerciseSection } from './ExerciseSection';
import { CardioEditor } from './CardioEditor';
import { CommentLine } from './CommentLine';
import { SetsBarChart } from './SetsBarChart';
import { SetRow } from './SetRow';
import { getWarnings, worstSev } from '@features/training_log/projections/mappers';
import type { UIBlock, UICardioSet, UIExercise, UICondition } from '@features/training_log/projections/viewTypes';
import type { SetMode } from '@data/static/exercises';

export interface BlockCardProps {
  blockIndex: number;
  block: UIBlock;
  openMenu: string | null;
  onOpenMenu: (key: string | null) => void;
  onToggleWarmup: (blockId: string, exIdx: number, setId: string) => void;
  onToggleDone: (blockId: string, exIdx: number, setId: string) => void;
  onDeleteRequest: (blockId: string, exIdx: number, setId: string, setIdx: number) => void;
  onDeleteBlock: (blockIds: string[]) => void;
  onAddSet: (blockId: string) => void;
  onUpdateSet: (blockId: string, setNumber: number, weightKg: number, reps: number) => void;
  onCommentSet: (blockId: string, exIdx: number, setId: string, text: string) => void;
  onUpdateCardio: (blockId: string, field: keyof UICardioSet, value: number) => void;
  injuries: UICondition[];
  acknowledged: Set<string>;
  onAcknowledge: (name: string) => void;
  onStartRest: (exerciseName: string, seconds: number) => void;
}

const ALL_MODES: SetMode[] = ['wt-reps', 'reps', 'time', 'dist', 'dist-time'];

export function BlockCard({
  blockIndex, block, openMenu, onOpenMenu, onToggleWarmup, onToggleDone, onDeleteRequest, onDeleteBlock,
  onAddSet, onUpdateSet, onCommentSet, onUpdateCardio, injuries, acknowledged, onAcknowledge, onStartRest,
}: BlockCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showRestPicker, setShowRestPicker] = useState(false);
  const [exerciseModes, setExerciseModes] = useState<Record<string, SetMode>>({});
  const closeMenu = () => { setMenuOpen(false); setShowRestPicker(false); };
  const blockIds = block.memberBlockIds ?? [block.id];

  const getMode = (ex: UIExercise) => exerciseModes[ex.blockId ?? block.id] ?? 'wt-reps';
  const setMode = (ex: UIExercise, mode: SetMode) =>
    setExerciseModes(prev => ({ ...prev, [ex.blockId ?? block.id]: mode }));
  const getAvailableModes = (_ex: UIExercise): SetMode[] => ALL_MODES;

  const restPickerContent = (
    <Column gap={1}>
      <span className="caption muted">Choose duration</span>
      <Cluster gap={1}>
        {(block.restSeconds != null ? [block.restSeconds] : [])
          .concat([30, 60, 90, 120, 180].filter(s => s !== block.restSeconds))
          .map(s => (
            <button
              key={s}
              type="button"
              className="chip"
              onClick={() => { closeMenu(); onStartRest(block.exerciseName, s); }}
            >
              {s < 60 ? `${s}s` : `${s / 60}m`}
            </button>
          ))}
      </Cluster>
    </Column>
  );

  const blockMenu = (
    <div className="modal-overlay">
      <Surface>
        <Column>
          <Row justify="between" align="center">
            <span className="detail">{block.exerciseName}</span>
            <button type="button" className="ghost icon sm" onClick={closeMenu}>
              <X size={10} className="faint" />
            </button>
          </Row>
          {showRestPicker ? restPickerContent : (
            <button type="button" className="secondary sm" onClick={() => setShowRestPicker(true)}>
              Rest timer
            </button>
          )}
          <button type="button" className="sm warning" onClick={() => { closeMenu(); onDeleteBlock(blockIds); }}>
            <Trash2 size={9} /> Delete exercise
          </button>
        </Column>
      </Surface>
    </div>
  );

  if (block.type === 'stretch') {
    return (
      <Surface>
        <Column>
          <Row align="center" justify="between">
            <Row gap={1} align="center">
              {block.tag && (
                <span className="badge">
                  <span className="dot" />
                  {block.tag}
                </span>
              )}
              <span className="caption muted">Stretch</span>
            </Row>
            <button type="button" className="ghost icon sm" onClick={() => setMenuOpen(v => !v)}>
              <MoreVertical size={10} className="faint" />
            </button>
          </Row>
          {menuOpen && blockMenu}
          {block.exercises.map((ex, i) => (
            <Row
              key={i}
              align="center"
              justify="between"
              className={i < block.exercises.length - 1 ? 'bordered-bottom' : undefined}
            >
              <Column gap={1} className="grow">
                <span className="detail">{ex.name}</span>
                <span className="caption">{ex.muscle}</span>
              </Column>
              <span className="mono caption">{ex.hold}</span>
            </Row>
          ))}
        </Column>
      </Surface>
    );
  }

  if (block.type === 'cardio') {
    const ex = block.exercises[0];
    return (
      <Surface>
        <Column>
          <Row align="center" justify="between">
            <span className="detail">{ex.name}</span>
            <Row gap={1} align="center">
              <span className="badge">
                <span className="dot" />
                Cardio
              </span>
              <button type="button" className="ghost icon sm" onClick={() => setMenuOpen(v => !v)}>
                <MoreVertical size={10} className="faint" />
              </button>
            </Row>
          </Row>
          {menuOpen && blockMenu}
          <CardioEditor
            cardioSet={ex.cardioSet ?? null}
            onUpdate={(field, value) => onUpdateCardio(block.id, field, value)}
          />
        </Column>
      </Surface>
    );
  }

  if (block.type === 'single') {
    const ex = block.exercises[0];
    const warnings = getWarnings(ex.name, injuries);
    const isAcked = acknowledged.has(ex.name);
    const top = worstSev(warnings);
    const flagCls = top && !isAcked ? (top.severity === 'severe' ? 'warning' : 'caution') : undefined;

    return (
      <Surface className={flagCls}>
        <Column>
          <Row align="center" justify="between">
            <Row gap={1} align="center" className="grow">
              {warnings.length > 0 && <AlertTriangle size={12} />}
              <h3 className="grow">{ex.name}</h3>
              <span className="caption muted faint">{getMode(ex)}</span>
              {warnings.map(w => (
                <span key={w.id} className={`badge ${w.severity === 'severe' ? 'warning' : 'caution'}`}>{w.bodyPart}</span>
              ))}
            </Row>
            <button type="button" className="ghost icon sm" onClick={() => setMenuOpen(v => !v)}>
              <MoreVertical size={10} className="faint" />
            </button>
          </Row>
          {menuOpen && blockMenu}
          {warnings.length > 0 && !isAcked && (
            <Column gap={1}>
              {warnings.map(w => (
                <Row key={w.id} align="center" gap={1}>
                  <span className="caption grow">{w.advice}</span>
                </Row>
              ))}
            </Column>
          )}
          {ex.comment && <CommentLine text={ex.comment} />}
          {ex.sets?.some(s => s.w !== '—') && (
            <SetsBarChart sets={ex.sets} />
          )}
          <Column gap={1}>
            {ex.sets?.map((s, j) => {
              const workingNum = (ex.sets ?? []).filter((x, idx) => !x.warmup && idx <= j).length;
              return (
                <SetRow
                  key={s.id}
                  num={workingNum}
                  set={s}
                  menuKey={s.id}
                  openMenu={openMenu}
                  onOpenMenu={onOpenMenu}
                  onToggleWarmup={() => onToggleWarmup(block.id, 0, s.id)}
                  onToggleDone={() => onToggleDone(block.id, 0, s.id)}
                  onDeleteRequest={() => onDeleteRequest(block.id, 0, s.id, j)}
                  onUpdate={(kg, reps) => onUpdateSet(block.id, s.setNumber, kg, reps)}
                  onComment={text => onCommentSet(block.id, 0, s.id, text)}
                  currentMode={getMode(ex)}
                  availableModes={getAvailableModes(ex)}
                  onSetModeChange={mode => setMode(ex, mode)}
                />
              );
            })}
          </Column>
          <button type="button" className="ghost surface pad-sm" onClick={() => onAddSet(block.id)}>+ Add Set</button>
        </Column>
      </Surface>
    );
  }

  // Superset / Circuit
  return (
    <Surface>
      <Column>
        <Row align="center" justify="between">
          <Row gap={1} align="center">
            <button className="icon ghost" disabled>{blockIndex + 1}.</button>
            <span className="badge">
              <span className="dot" />
              {block.label}
            </span>
          </Row>
          <button type="button" className="ghost icon sm" onClick={() => setMenuOpen(v => !v)}>
            <MoreVertical size={10} className="faint" />
          </button>
        </Row>
        {menuOpen && blockMenu}
        {block.exercises.map((ex, i) => (
          <div key={i}>
            {i > 0 && <div className="rule" />}
            <ExerciseSection
              ex={ex}
              openMenu={openMenu}
              onOpenMenu={onOpenMenu}
              onToggleWarmup={setId => onToggleWarmup(block.id, i, setId)}
              onToggleDone={setId => onToggleDone(block.id, i, setId)}
              onDeleteRequest={(setId, setIdx) => onDeleteRequest(block.id, i, setId, setIdx)}
              onAddSet={() => onAddSet(ex.blockId ?? block.id)}
              onUpdateSet={(setNumber, kg, reps) => onUpdateSet(ex.blockId ?? block.id, setNumber, kg, reps)}
              onCommentSet={(setId, text) => onCommentSet(block.id, i, setId, text)}
              injuries={injuries}
              acknowledged={acknowledged}
              onAcknowledge={onAcknowledge}
              currentMode={getMode(ex)}
              availableModes={getAvailableModes(ex)}
              onSetModeChange={mode => setMode(ex, mode)}
            />
          </div>
        ))}
      </Column>
    </Surface>
  );
}
