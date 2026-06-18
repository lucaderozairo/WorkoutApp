import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Plus, Trash2 } from 'lucide-react';
import { Row, Column, Cluster } from '@ui/layout';
import { Surface, Text } from '@ui/atoms';
import { Button, Modal } from '@ui/molecules';
import { useCommand } from '@ui/bindings';
import {
  handleRemoveBlock,
  handleRemoveSet,
  handleLogStrengthSet,
  handleUpdateSet,
  handleUpdateSetComment,
  handleLogCardioSet,
  handleDeleteSession,
  handleSetBlockRounds,
  handleChangeSetType,
  handleAddBlock,
} from '@features/training_log';
import { ACTIVITY_ICONS } from '@ui/icons/activityIcons';
import type { SportType } from '@shared/types';

const MULTISPORT_SPORTS = new Set<SportType>(['multi', 'triathlon', 'duathlon', 'hyrox', 'obstacle_course']);
const DISCIPLINE_SPORTS: SportType[] = ['swim', 'cycle', 'run', 'row', 'ski', 'hike', 'strength'];
import type { ActivityView } from '@features/training_log';
import type { StrengthSet, CardioSet } from '@features/training_log/domain/types';
import type { Id } from '@shared/types';
import { UndoToast, useUndoToast, RestTimerAlert } from '@ui/components/log';
import { viewStore } from '@data/projections/views';
import { domainBlocksToUIBlocks, sessionDateLabel } from '@features/training_log/projections/mappers';
import type { UIBlock, UICardioSet, UICondition, DeleteTarget } from '@features/training_log/projections/viewTypes';
import { SessionHeader } from './SessionHeader';
import { triggerDownload } from '@shared/utils/csv';
import { InjuryBanner } from './InjuryBanner';
import { BlockCard } from './BlockCard';
import { PlateCalculatorModal } from './PlateCalculatorModal';
import { SegmentGuide } from './SegmentGuide';
import { getPreviousPerformance, getOverloadHint } from '@features/progression';
import type { PreviousExercisePerformance, ProgressiveOverloadHint } from '@shared/contracts';

export interface WorkoutViewProps {
  session: ActivityView | null;
  conditions: UICondition[];
  isActive: boolean;
  hideHeader?: boolean;
  onAddExercise: () => void;
  onFinish: () => void;
  onDone?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  isPaused?: boolean;
  timerDisplay?: string;
  timerNotStarted?: boolean;
  onStartTimer?: () => void;
}

export function WorkoutView({
  session, conditions, isActive, hideHeader = false, onAddExercise, onFinish, onDone, onPause = () => {}, onResume = () => {},
  isPaused = false, timerDisplay = '', timerNotStarted = false, onStartTimer = () => {},
}: WorkoutViewProps) {
  const domainBlocks = session?.segments ?? [];
  const [blocks, setBlocks] = useState<UIBlock[]>(() => domainBlocksToUIBlocks(domainBlocks));
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [deleteAlert, setDeleteAlert] = useState<DeleteTarget | null>(null);
  const [deleteBlockAlert, setDeleteBlockAlert] = useState<string[] | null>(null);
  const [clearAlert, setClearAlert] = useState(false);
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());
  const [autoRestEnabled, setAutoRestEnabled] = useState(false);
  const [plateCalculatorTarget, setPlateCalculatorTarget] = useState<{ blockId: string; weightKg: number } | null>(null);
  const [showDisciplinePicker, setShowDisciplinePicker] = useState(false);
  const [restTimer, setRestTimer] = useState<{ seconds: number; exerciseName: string } | null>(
    () => viewStore.get('rest_timer') ?? null
  );

  const blockProgressionData = useMemo(() => {
    if (!blocks) return {};
    const map: Record<string, { performance: PreviousExercisePerformance | undefined; hint: ProgressiveOverloadHint }> = {};
    for (const b of blocks) {
      if (b.type === 'single' || b.type === 'superset' || b.type === 'circuit') {
        for (const ex of b.exercises) {
          const performance = getPreviousPerformance(ex.name) ?? undefined;
          const maxW = performance?.maxWeightKg;
          const currentW = Math.max(0, ...(ex.sets ?? []).map(s => parseFloat(s.w) || 0));
          const hint = getOverloadHint(ex.name, currentW || maxW);
          map[ex.name] = { performance, hint };
        }
      }
    }
    return map;
  }, [blocks]);
  const restTimerRef = useRef(restTimer);
  useEffect(() => {
    restTimerRef.current = restTimer;
    viewStore.set('rest_timer', restTimer);
  }, [restTimer]);

  const { enqueue: enqueueUndo } = useUndoToast();
  const { dispatch: removeBlock } = useCommand(handleRemoveBlock);
  const { dispatch: removeSet } = useCommand(handleRemoveSet);
  const { dispatch: logStrengthSet } = useCommand(handleLogStrengthSet);
  const { dispatch: updateSet } = useCommand(handleUpdateSet);
  const { dispatch: updateSetComment } = useCommand(handleUpdateSetComment);
  const { dispatch: logCardioSet } = useCommand(handleLogCardioSet);
  const { dispatch: deleteSession } = useCommand(handleDeleteSession);
  const { dispatch: setBlockRounds } = useCommand(handleSetBlockRounds);
  const { dispatch: changeSetType } = useCommand(handleChangeSetType);
  const { dispatch: addBlock } = useCommand(handleAddBlock);

  const isMultisport = session ? MULTISPORT_SPORTS.has(session.primarySport) : false;

const completedDistanceKm = (session?.segments ?? [])
  .filter(s => s.exerciseCategory === 'cardio')
  .flatMap(s => s.sets)
  .reduce((acc, set) => acc + (set.distanceMeters ?? 0), 0) / 1000;

function parseTimerDisplay(display: string): number {
  const parts = display.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

  const blocksSig = domainBlocks.reduce((acc, b) =>
    acc + b.sets.reduce((s, set) => {
      const ss = set as {
        weightKg?: number; reps?: number; distanceMeters?: number;
        durationSeconds?: number; avgPowerWatts?: number; resistance?: number;
      };
      return s + (ss.weightKg ?? 0) * 100 + (ss.reps ?? 0)
        + (ss.distanceMeters ?? 0) + (ss.durationSeconds ?? 0)
        + (ss.avgPowerWatts ?? 0) + (ss.resistance ?? 0);
    }, b.sets.length),
    0);
  const groupsSig = domainBlocks.filter(b => b.supersetGroupId).length;
  const metaSig = domainBlocks.map(b => `${b.blockType ?? ''}:${b.rounds ?? ''}`).join('|');
  useEffect(() => {
    setBlocks(domainBlocksToUIBlocks(domainBlocks));
  }, [blocksSig, domainBlocks.length, groupsSig, metaSig]);

  const handleToggleDone = async (blockId: string, exIdx: number, setId: string) => {
    const block = blocks.find(b => b.id === blockId);
    const ex = block?.exercises[exIdx];
    const set = ex?.sets?.find(s => s.id === setId);
    if (!set || !ex?.blockId || !session?.id) return;

    const newDone = !set.done;
    setBlocks(prev => prev.map(b => {
      if (b.id !== blockId) return b;
      return {
        ...b,
        exercises: b.exercises.map((e, i) => {
          if (i !== exIdx) return e;
          return { ...e, sets: e.sets?.map(s => s.id === setId ? { ...s, done: newDone } : s) };
        }),
      };
    }));

    await updateSet({
      type: 'UpdateSet',
      sessionId: session.id,
      blockId: ex.blockId as Id<'Block'>,
      setNumber: set.setNumber,
      done: newDone,
    });
  };

  const handleToggleWarmup = (blockId: string, exIdx: number, setId: string) => {
    setBlocks(prev => prev.map(b => {
      if (b.id !== blockId) return b;
      return {
        ...b,
        exercises: b.exercises.map((ex, i) => {
          if (i !== exIdx) return ex;
          return {
            ...ex,
            sets: ex.sets?.map(s => s.id === setId ? { ...s, warmup: !s.warmup } : s),
          };
        }),
      };
    }));
  };

  const handleToggleDropset = async (blockId: string, exIdx: number, setId: string) => {
    const block = blocks.find(b => b.id === blockId);
    const ex = block?.exercises[exIdx];
    const set = ex?.sets?.find(s => s.id === setId);
    if (!set || !ex?.blockId || !session?.id) return;

    const newType = set.setType === 'dropset' ? 'normal' : 'dropset';
    setBlocks(prev => prev.map(b => {
      if (b.id !== blockId) return b;
      return {
        ...b,
        exercises: b.exercises.map((e, i) => {
          if (i !== exIdx) return e;
          return { ...e, sets: e.sets?.map(s => s.id === setId ? { ...s, setType: newType } : s) };
        }),
      };
    }));

    await changeSetType({
      type: 'ChangeSetType',
      sessionId: session.id,
      blockId: ex.blockId as Id<'Block'>,
      setNumber: set.setNumber,
      setType: newType,
    });
  };

  const handleCommentSet = async (blockId: string, exIdx: number, setId: string, text: string) => {
    const block = blocks.find(b => b.id === blockId);
    const ex = block?.exercises[exIdx];
    const set = ex?.sets?.find(s => s.id === setId);
    if (!set || !ex?.blockId || !session?.id) return;

    setBlocks(prev => prev.map(b => {
      if (b.id !== blockId) return b;
      return {
        ...b,
        exercises: b.exercises.map((e, i) => {
          if (i !== exIdx) return e;
          return { ...e, sets: e.sets?.map(s => s.id === setId ? { ...s, comment: text || null } : s) };
        }),
      };
    }));

    await updateSetComment({
      type: 'UpdateSetComment',
      sessionId: session.id,
      blockId: ex.blockId as Id<'Block'>,
      setNumber: set.setNumber,
      comment: text,
    });
  };

  const handleDeleteRequest = (blockId: string, exIdx: number, setId: string, setIdx: number) => {
    const block = blocks.find(b => b.id === blockId);
    const ex = block?.exercises[exIdx];
    const s = ex?.sets?.[setIdx];
    if (!s) return;
    const wNum = (ex.sets ?? []).filter((x, i) => !x.warmup && i <= setIdx).length;
    const label = `${s.warmup ? 'W' : `S${wNum}`} · ${s.w !== '—' ? s.w + ' kg × ' : ''}${s.r}`;
    setDeleteAlert({ blockId, exIdx, setId, label });
  };

  const handleConfirmDelete = async () => {
    if (!deleteAlert || !session?.id) return;
    const { blockId, exIdx, setId, label } = deleteAlert;

    const block = blocks.find(b => b.id === blockId);
    const ex = block?.exercises[exIdx];
    const snapshot = ex?.sets?.find(s => s.id === setId);
    if (!snapshot || !ex?.blockId) return;

    const domainBlockId = ex.blockId as Id<'Block'>;
    const setNumber = snapshot.setNumber;
    const sessionId = session.id;

    setBlocks(prev => prev.map(b => {
      if (b.id !== blockId) return b;
      return {
        ...b,
        exercises: b.exercises.map((e, i) => {
          if (i !== exIdx) return e;
          return { ...e, sets: e.sets?.filter(s => s.id !== setId) };
        }),
      };
    }));
    setDeleteAlert(null);

    await removeSet({ type: 'RemoveSet', sessionId, blockId: domainBlockId, setNumber });

    enqueueUndo({
      message: `${label} deleted`,
      onExpire: () => { },
      onUndo: async () => {
        await logStrengthSet({
          type: 'LogStrengthSet',
          sessionId,
          blockId: domainBlockId,
          weightKg: parseFloat(snapshot.w) || 0,
          reps: parseInt(snapshot.r) || 1,
          isWarmup: snapshot.warmup,
        });
      },
    });
  };

  const handleAcknowledge = (name: string) => {
    setAcknowledged(prev => { const n = new Set(prev); n.add(name); return n; });
  };

  const handleAddSet = async (blockId: string) => {
    if (!session?.id) return;
    const domainBlock = domainBlocks.find(b => b.id === blockId);
    const strengthSets = domainBlock?.sets.filter(s => s.weightKg !== undefined || s.reps !== undefined) ?? [];
    const lastStrength = strengthSets[strengthSets.length - 1];
    await logStrengthSet({
      type: 'LogStrengthSet',
      sessionId: session.id,
      blockId: blockId as Id<'Block'>,
      weightKg: lastStrength?.weightKg ?? 0,
      reps: lastStrength?.reps ?? 1,
      isWarmup: false,
    });
  };

  const handleUpdateSetValues = async (blockId: string, setNumber: number, weightKg: number, reps: number) => {
    if (!session?.id) return;
    await updateSet({
      type: 'UpdateSet',
      sessionId: session.id,
      blockId: blockId as Id<'Block'>,
      setNumber,
      weightKg,
      reps,
    });
  };

  const handleUpdateCardio = async (blockId: string, field: keyof UICardioSet, value: number) => {
    if (!session?.id) return;
    const domainBlock = domainBlocks.find(b => b.id === blockId);
    const existing = domainBlock?.sets.find(s => s.distanceMeters !== undefined || s.durationSeconds !== undefined);
    if (!existing) {
      await logCardioSet({
        type: 'LogCardioSet',
        sessionId: session.id,
        blockId: blockId as Id<'Block'>,
        durationSeconds: field === 'durationSeconds' ? value : 0,
        distanceMeters: field === 'distanceMeters' ? value : 0,
      });
    } else {
      await updateSet({
        type: 'UpdateSet',
        sessionId: session.id,
        blockId: blockId as Id<'Block'>,
        setNumber: existing.setNumber,
        ...(field === 'durationSeconds' && { durationSeconds: value }),
        ...(field === 'distanceMeters' && { distanceMeters: value }),
        ...(field === 'avgPowerWatts' && { avgPowerWatts: value }),
        ...(field === 'resistance' && { resistance: value }),
      });
    }
  };

  const handleSetRounds = async (blockIds: string[], rounds: number) => {
    if (!session?.id) return;
    for (const id of blockIds) {
      await setBlockRounds({
        type: 'SetBlockRounds',
        sessionId: session.id,
        blockId: id as Id<'Block'>,
        rounds,
      });
    }
  };

  const handleAddCardioInterval = async (blockId: string) => {
    if (!session?.id) return;
    await logCardioSet({
      type: 'LogCardioSet',
      sessionId: session.id,
      blockId: blockId as Id<'Block'>,
      durationSeconds: 0,
      distanceMeters: 0,
    });
  };

  const handleUpdateCardioSet = async (blockId: string, setNumber: number, field: keyof UICardioSet, value: number) => {
    if (!session?.id) return;
    await updateSet({
      type: 'UpdateSet',
      sessionId: session.id,
      blockId: blockId as Id<'Block'>,
      setNumber,
      ...(field === 'durationSeconds' && { durationSeconds: value }),
      ...(field === 'distanceMeters' && { distanceMeters: value }),
      ...(field === 'avgPowerWatts' && { avgPowerWatts: value }),
      ...(field === 'resistance' && { resistance: value }),
    });
  };

  const handleRemoveCardioSet = async (blockId: string, setNumber: number) => {
    if (!session?.id) return;
    await removeSet({ type: 'RemoveSet', sessionId: session.id, blockId: blockId as Id<'Block'>, setNumber });
  };

  const handleAddDiscipline = async (sport: SportType) => {
    if (!session?.id) return;
    setShowDisciplinePicker(false);
    // Gym is a discipline, not an exercise — open the exercise picker so the user
    // logs real exercises with sets, same as a standalone gym activity.
    if (sport === 'strength') {
      onAddExercise();
      return;
    }
    await addBlock({
      type: 'AddBlock',
      sessionId: session.id,
      exerciseName: ACTIVITY_ICONS[sport].label,
      exerciseCategory: 'cardio',
    });
  };

  const handleAddTransition = async () => {
    if (!session?.id) return;
    await addBlock({
      type: 'AddBlock',
      sessionId: session.id,
      exerciseName: 'Transition',
      exerciseCategory: 'cardio',
      isTransition: true,
    });
  };

  const handleConfirmDeleteBlock = async () => {
    if (!session?.id || !deleteBlockAlert) return;
    for (const id of deleteBlockAlert) {
      await removeBlock({ type: 'RemoveBlock', sessionId: session.id, blockId: id as Id<'Block'> });
    }
    setDeleteBlockAlert(null);
  };

  const handleConfirmClearSession = async () => {
    if (!session?.id) return;
    await deleteSession({ type: 'DeleteSession', sessionId: session.id });
    setClearAlert(false);
  };

  const name = session?.name ?? 'Workout';
  const dateLabel = session?.startedAt ? sessionDateLabel(session.startedAt) : '—';
  const startTime = session?.startedAt ? new Date(session.startedAt).toTimeString().slice(0, 5) : '';
  const endTime = session?.finishedAt ? new Date(session.finishedAt).toTimeString().slice(0, 5) : '';
  const date = session?.startedAt ? new Date(session.startedAt).toISOString().slice(0, 10) : '';
  const durationMs = session?.finishedAt && session?.startedAt ? session.finishedAt - session.startedAt : 0;
  const duration = durationMs > 0
    ? (() => { const m = Math.floor(durationMs / 60000); const h = Math.floor(m / 60); return h > 0 ? `${h}h ${m % 60}m` : `${m}m`; })()
    : '';

  function handleExport() {
    if (!session) return;
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
    triggerDownload(blob, `${session.name ?? 'workout'}-${date}.json`);
  }

  function handleShare() {
    const shareData = { title: name, text: `Check out my workout: ${name} on ${dateLabel}` };
    if (navigator.share) {
      navigator.share(shareData);
    }
  }

  return (
    <Column>
      {!hideHeader && (
        <SessionHeader
          name={name}
          dateLabel={dateLabel}
          timerDisplay={timerDisplay}
          isActive={isActive}
          isPaused={isPaused}
          onPause={onPause}
          onResume={onResume}
          onFinish={onFinish}
          onDone={onDone}
          onClearSession={() => setClearAlert(true)}
          timerNotStarted={timerNotStarted}
          onStartTimer={onStartTimer}
          onExport={handleExport}
          onShare={handleShare}
          startTime={startTime}
          endTime={endTime}
          date={date}
          duration={duration}
        />
      )}

      <InjuryBanner conditions={conditions} />

      {session?.paceTarget?.kind === 'segments' && (
        <SegmentGuide
          segments={session.paceTarget.segments}
          completedDistanceKm={completedDistanceKm}
          elapsedSeconds={parseTimerDisplay(timerDisplay)}
        />
      )}

      <UndoToast />

      <Column>
        {blocks.map((b, idx) => {
          const exName = b.exercises[0]?.name;
          const pd = exName ? blockProgressionData[exName] : undefined;
          return (
            <BlockCard
              key={b.id}
              blockIndex={idx}
              block={b}
              openMenu={openMenu}
              onOpenMenu={setOpenMenu}
              onToggleWarmup={handleToggleWarmup}
              onToggleDone={handleToggleDone}
              onToggleDropset={handleToggleDropset}
              onDeleteRequest={handleDeleteRequest}
              onDeleteBlock={ids => setDeleteBlockAlert(ids)}
              onAddSet={handleAddSet}
              onUpdateSet={handleUpdateSetValues}
              onCommentSet={handleCommentSet}
              onUpdateCardio={handleUpdateCardio}
              onUpdateCardioSet={handleUpdateCardioSet}
              onAddCardioSet={handleAddCardioInterval}
              onRemoveCardioSet={handleRemoveCardioSet}
              injuries={conditions}
              acknowledged={acknowledged}
              onAcknowledge={handleAcknowledge}
              onStartRest={(exerciseName, seconds) => setRestTimer({ seconds, exerciseName })}
              previousPerformance={pd?.performance}
              overloadHint={pd?.hint}
              onPlateCalculator={(blockId, weightKg) => setPlateCalculatorTarget({ blockId, weightKg })}
              autoRestEnabled={autoRestEnabled}
              onToggleAutoRest={() => setAutoRestEnabled(v => !v)}
              onSetRounds={handleSetRounds}
            />
          );
        })}

        <Button type="button" variant="ghost" className="row" onClick={onAddExercise}>
          <Plus size={12} /> Add Exercise
        </Button>

        {isMultisport && (
          <Row gap={1}>
            <Button type="button" variant="ghost" className="row" onClick={() => setShowDisciplinePicker(true)}>
              <Plus size={12} /> Add Discipline
            </Button>
            <Button type="button" variant="ghost" className="row" onClick={handleAddTransition}>
              <Plus size={12} /> Add Transition
            </Button>
          </Row>
        )}
      </Column>

      {deleteAlert && (
        <Modal open onClose={() => setDeleteAlert(null)} size="sm">
          <Column>
            <Column gap={1}>
              <Text size="detail">Delete set?</Text>
              <Text size="detail" mono color="muted" className="num">{deleteAlert.label}</Text>
              <Text size="caption" color="faint">This removes the set from your log.</Text>
            </Column>
            <Row justify="between">
              <Button type="button" variant="ghost" onClick={() => setDeleteAlert(null)}>Cancel</Button>
              <Button type="button" className="error-tint" onClick={handleConfirmDelete}>
                <Trash2 size={12} /> Delete
              </Button>
            </Row>
          </Column>
        </Modal>
      )}

      {deleteBlockAlert && (
        <Modal open onClose={() => setDeleteBlockAlert(null)} size="sm">
          <Column>
            <Column gap={1}>
              <Text size="detail">Delete exercise?</Text>
              <Text size="caption" color="faint">This removes the exercise and all its sets.</Text>
            </Column>
            <Row justify="between">
              <Button type="button" variant="ghost" onClick={() => setDeleteBlockAlert(null)}>Cancel</Button>
              <Button type="button" className="error-tint" onClick={handleConfirmDeleteBlock}>
                <Trash2 size={12} /> Delete
              </Button>
            </Row>
          </Column>
        </Modal>
      )}

      {clearAlert && (
        <Modal open onClose={() => setClearAlert(false)} size="sm">
          <Column>
            <Column gap={1}>
              <Text as="h3">Delete session?</Text>
              <Text size="caption" color="faint">This removes the entire session and cannot be undone.</Text>
            </Column>
            <Row justify="between">
              <Button type="button" variant="secondary" onClick={() => setClearAlert(false)}>Cancel</Button>
              <Button type="button" className="error-tint" onClick={handleConfirmClearSession}>
                <Trash2 size={12} /> Delete
              </Button>
            </Row>
          </Column>
        </Modal>
      )}

      {showDisciplinePicker && (
        <Modal open onClose={() => setShowDisciplinePicker(false)} size="sm">
          <Column>
            <Text as="h3" size="detail">Add discipline</Text>
            <Cluster gap={1}>
              {DISCIPLINE_SPORTS.map(sport => (
                <Button key={sport} type="button" variant="secondary" size="sm" onClick={() => handleAddDiscipline(sport)}>
                  {ACTIVITY_ICONS[sport].label}
                </Button>
              ))}
            </Cluster>
            <Button type="button" variant="ghost" onClick={() => setShowDisciplinePicker(false)}>Cancel</Button>
          </Column>
        </Modal>
      )}

      {restTimer && (
        <div className="bottom-banner">
          <RestTimerAlert
            initialSeconds={restTimer.seconds}
            onSkip={() => { viewStore.set('rest_timer', null); setRestTimer(null); }}
          />
        </div>
      )}

      <PlateCalculatorModal
        open={plateCalculatorTarget !== null}
        onClose={() => setPlateCalculatorTarget(null)}
        initialWeightKg={plateCalculatorTarget?.weightKg ?? undefined}
      />
    </Column>
  );
}
