import { useState } from 'react';
import { AlertTriangle, Minus, MoreVertical, Plus, Timer, Trash2, X } from 'lucide-react';
import { Row, Column, Cluster } from '@ui/layout';
import { Surface, Text, Chip, Divider } from '@ui/atoms';
import { Badge, Button, Input, Modal, Switch } from '@ui/molecules';
import { ExerciseSection } from './ExerciseSection';
import { CardioEditor } from './CardioEditor';
import { CommentLine } from './CommentLine';
import { SetsBarChart } from './SetsBarChart';
import { SetRow } from './SetRow';
import { PreviousPerformanceLine } from './PreviousPerformanceLine';
import { OverloadHintLine } from './OverloadHintLine';
import { getWarnings, worstSev } from '@features/training_log/projections/mappers';
import { paceSecPerKm, formatPace } from '@shared/utils';
import type { UIBlock, UICardioSet, UIExercise, UICondition } from '@features/training_log/projections/viewTypes';
import type { SetMode } from '@data/static/exercises';
import type { PreviousExercisePerformance, ProgressiveOverloadHint } from '@shared/contracts';

export interface BlockCardProps {
  blockIndex: number;
  block: UIBlock;
  openMenu: string | null;
  onOpenMenu: (key: string | null) => void;
  onToggleWarmup: (blockId: string, exIdx: number, setId: string) => void;
  onToggleDone: (blockId: string, exIdx: number, setId: string) => void;
  onToggleDropset?: (blockId: string, exIdx: number, setId: string) => void;
  onDeleteRequest: (blockId: string, exIdx: number, setId: string, setIdx: number) => void;
  onDeleteBlock: (blockIds: string[]) => void;
  onAddSet: (blockId: string) => void;
  onUpdateSet: (blockId: string, setNumber: number, weightKg: number, reps: number) => void;
  onCommentSet: (blockId: string, exIdx: number, setId: string, text: string) => void;
  onUpdateCardio: (blockId: string, field: keyof UICardioSet, value: number) => void;
  onUpdateCardioSet?: (blockId: string, setNumber: number, field: keyof UICardioSet, value: number) => void;
  onAddCardioSet?: (blockId: string) => void;
  onRemoveCardioSet?: (blockId: string, setNumber: number) => void;
  injuries: UICondition[];
  acknowledged: Set<string>;
  onAcknowledge: (name: string) => void;
  onStartRest: (exerciseName: string, seconds: number) => void;
  previousPerformance?: PreviousExercisePerformance;
  overloadHint?: ProgressiveOverloadHint;
  onPlateCalculator?: (blockId: string, weightKg: number) => void;
  autoRestEnabled?: boolean;
  onToggleAutoRest?: () => void;
  onSetRounds?: (blockIds: string[], rounds: number) => void;
}

const ALL_MODES: SetMode[] = ['wt-reps', 'reps', 'time', 'dist', 'dist-time'];

export function BlockCard({
  blockIndex, block, openMenu, onOpenMenu, onToggleWarmup, onToggleDone, onDeleteRequest, onDeleteBlock,
  onAddSet, onUpdateSet, onCommentSet, onUpdateCardio, injuries, acknowledged, onAcknowledge, onStartRest,
  previousPerformance, overloadHint, onPlateCalculator, autoRestEnabled, onToggleAutoRest, onSetRounds, onToggleDropset,
  onUpdateCardioSet, onAddCardioSet, onRemoveCardioSet,
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
      <Text size="caption" color="muted">Choose duration</Text>
      <Cluster gap={1}>
        {(block.restSeconds != null ? [block.restSeconds] : [])
          .concat([30, 60, 90, 120, 180].filter(s => s !== block.restSeconds))
          .map(s => (
            <Chip
              key={s}
              onClick={() => { closeMenu(); onStartRest(block.exerciseName, s); }}
            >
              {s < 60 ? `${s}s` : `${s / 60}m`}
            </Chip>
          ))}
      </Cluster>
    </Column>
  );

  const blockMenu = (
    <Modal open onClose={closeMenu} size="sm">
      <Column>
        <Row justify="between" align="center">
          <Text size="detail">{block.exerciseName}</Text>
          <Button type="button" variant="ghost" size="icon" onClick={closeMenu}>
            <X size={10} className="faint" />
          </Button>
        </Row>
        {showRestPicker ? restPickerContent : (
          <Button type="button" variant="secondary" size="sm" onClick={() => setShowRestPicker(true)}>
            Rest timer
          </Button>
        )}
        <Row align="center" justify="between">
          <Row gap={1} align="center">
            <Timer size={10} className="faint" />
            <Text size="caption">Auto-rest</Text>
          </Row>
          <Switch
            checked={autoRestEnabled ?? false}
            onChange={() => onToggleAutoRest?.()}
          />
        </Row>
        <Button type="button" size="sm" className="error-tint" onClick={() => { closeMenu(); onDeleteBlock(blockIds); }}>
          <Trash2 size={9} /> Delete exercise
        </Button>
      </Column>
    </Modal>
  );

  if (block.type === 'transition') {
    const ex = block.exercises[0];
    const seconds = ex?.cardioSets?.[0]?.durationSeconds ?? ex?.cardioSet?.durationSeconds ?? 0;
    return (
      <Surface>
        <Column>
          <Row align="center" justify="between">
            <Row gap={1} align="center">
              <Badge dot>Transition</Badge>
              <Text size="detail">{ex?.name}</Text>
            </Row>
            <Button type="button" variant="ghost" size="icon" onClick={() => setMenuOpen(v => !v)}>
              <MoreVertical size={10} className="faint" />
            </Button>
          </Row>
          {menuOpen && blockMenu}
          <Row gap={1} align="center">
            <Text size="eyebrow">Duration</Text>
            <Input
              type="number"
              controlClassName="mono num"
              defaultValue={seconds > 0 ? String(seconds) : ''}
              placeholder="0"
              min="0"
              step="1"
              onBlur={e => onUpdateCardio(block.id, 'durationSeconds', Math.max(0, parseInt(e.target.value) || 0))}
            />
            <Text size="caption" color="muted">sec</Text>
          </Row>
        </Column>
      </Surface>
    );
  }

  if (block.type === 'stretch') {
    return (
      <Surface>
        <Column>
          <Row align="center" justify="between">
            <Row gap={1} align="center">
              {block.tag && <Badge dot>{block.tag}</Badge>}
              <Text size="caption" color="muted">Stretch</Text>
            </Row>
            <Button type="button" variant="ghost" size="icon" onClick={() => setMenuOpen(v => !v)}>
              <MoreVertical size={10} className="faint" />
            </Button>
          </Row>
          {menuOpen && blockMenu}
          {block.exercises.map((ex, i) => (
            <Row
              key={i}
              align="center"
              justify="between"
              className={i < block.exercises.length - 1 ? 'bordered-bottom' : undefined}
            >
              <Column gap={1} className="min-w-0">
                <Text size="detail">{ex.name}</Text>
                <Text size="caption">{ex.muscle}</Text>
              </Column>
              <Text size="caption" mono>{ex.hold}</Text>
            </Row>
          ))}
        </Column>
      </Surface>
    );
  }

  if (block.type === 'cardio') {
    const ex = block.exercises[0];
    const cardioSets = ex.cardioSets ?? [];
    const multi = cardioSets.length > 1;
    return (
      <Surface>
        <Column>
          <Row align="center" justify="between">
            <Text size="detail">{ex.name}</Text>
            <Row gap={1} align="center">
              <Badge dot>Cardio</Badge>
              <Button type="button" variant="ghost" size="icon" onClick={() => setMenuOpen(v => !v)}>
                <MoreVertical size={10} className="faint" />
              </Button>
            </Row>
          </Row>
          {menuOpen && blockMenu}
          {cardioSets.length === 0 ? (
            <CardioEditor
              cardioSet={null}
              onUpdate={(field, value) => onUpdateCardio(block.id, field, value)}
            />
          ) : (
            cardioSets.map((cs, idx) => {
              const pace = paceSecPerKm(cs.durationSeconds, cs.distanceMeters);
              return (
                <Column key={cs.setNumber} gap={1}>
                  {(multi || onRemoveCardioSet) && (
                    <Row align="center" justify="between">
                      <Row gap={1} align="center">
                        {multi && <Text size="eyebrow">Interval {idx + 1}</Text>}
                        {pace > 0 && <Text size="caption" color="muted" mono>{formatPace(pace, { suffix: true })}</Text>}
                      </Row>
                      {onRemoveCardioSet && (multi || cardioSets.length > 1) && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => onRemoveCardioSet(block.id, cs.setNumber)}>
                          <Trash2 size={9} className="faint" />
                        </Button>
                      )}
                    </Row>
                  )}
                  <CardioEditor
                    cardioSet={cs}
                    onUpdate={(field, value) =>
                      onUpdateCardioSet
                        ? onUpdateCardioSet(block.id, cs.setNumber, field, value)
                        : onUpdateCardio(block.id, field, value)
                    }
                  />
                </Column>
              );
            })
          )}
          {onAddCardioSet && (
            <Button type="button" variant="ghost" className="surface pad-sm" onClick={() => onAddCardioSet(block.id)}>
              <Plus size={10} /> Add interval
            </Button>
          )}
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
            <Row gap={1} align="center" className="min-w-0">
              {warnings.length > 0 && <AlertTriangle size={12} />}
              <Text as="h3" className="min-w-0">{ex.name}</Text>
              <Text size="caption" color="faint">{getMode(ex)}</Text>
              {warnings.map(w => (
                <Badge key={w.id} tone={w.severity === 'severe' ? 'bad' : 'warn'}>{w.bodyPart}</Badge>
              ))}
            </Row>
            <Button type="button" variant="ghost" size="icon" onClick={() => setMenuOpen(v => !v)}>
              <MoreVertical size={10} className="faint" />
            </Button>
          </Row>
          {menuOpen && blockMenu}
          {warnings.length > 0 && !isAcked && (
            <Column gap={1}>
              {warnings.map(w => (
                <Row key={w.id} align="center" gap={1}>
                  <Text size="caption" className="min-w-0">{w.advice}</Text>
                </Row>
              ))}
            </Column>
          )}
          {previousPerformance && <PreviousPerformanceLine performance={previousPerformance} />}
          {overloadHint && <OverloadHintLine hint={overloadHint} />}
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
                  onToggleDropset={onToggleDropset ? () => onToggleDropset(block.id, 0, s.id) : undefined}
                  onPlateCalculator={onPlateCalculator ? (w) => onPlateCalculator(block.id, w) : undefined}
                  currentMode={getMode(ex)}
                  availableModes={getAvailableModes(ex)}
                  onSetModeChange={mode => setMode(ex, mode)}
                />
              );
            })}
          </Column>
          <Button type="button" variant="ghost" className="surface pad-sm" onClick={() => onAddSet(block.id)}>+ Add Set</Button>
        </Column>
      </Surface>
    );
  }

  // Superset / Circuit / EMOM / AMRAP
  const showRounds = block.type === 'circuit' || block.type === 'emom' || block.type === 'amrap';
  const rounds = block.rounds ?? 1;
  return (
    <Surface>
      <Column>
        <Row align="center" justify="between">
          <Row gap={1} align="center">
            <Text size="caption" color="muted">{blockIndex + 1}.</Text>
            <Badge dot>{block.label}</Badge>
            {showRounds && onSetRounds && (
              <Row gap={1} align="center">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={rounds <= 1}
                  onClick={() => onSetRounds(blockIds, Math.max(1, rounds - 1))}
                >
                  <Minus size={10} className="faint" />
                </Button>
                <Text size="caption" mono>{rounds} {rounds === 1 ? 'round' : 'rounds'}</Text>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onSetRounds(blockIds, rounds + 1)}
                >
                  <Plus size={10} className="faint" />
                </Button>
              </Row>
            )}
          </Row>
          <Button type="button" variant="ghost" size="icon" onClick={() => setMenuOpen(v => !v)}>
            <MoreVertical size={10} className="faint" />
          </Button>
        </Row>
        {menuOpen && blockMenu}
        {block.exercises.map((ex, i) => (
          <Column key={i}>
            {i > 0 && <Divider />}
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
              onToggleDropset={onToggleDropset ? setId => onToggleDropset(block.id, i, setId) : undefined}
              onPlateCalculator={onPlateCalculator ? (w) => onPlateCalculator(block.id, w) : undefined}
              injuries={injuries}
              acknowledged={acknowledged}
              onAcknowledge={onAcknowledge}
              currentMode={getMode(ex)}
              availableModes={getAvailableModes(ex)}
              onSetModeChange={mode => setMode(ex, mode)}
            />
          </Column>
        ))}
      </Column>
    </Surface>
  );
}
