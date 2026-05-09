import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useCommand } from '@ui/bindings';
import {
  handleAddBlock,
  handleAddToSuperset,
  handleDeleteSession,
  handleRemoveBlock,
  handleRemoveSet,
  handleLogStrengthSet,
  handleUpdateSet,
  handleUpdateSetComment,
  handleLogCardioSet,
  handleUpdateSessionStartTime,
  getEditingSession,
} from '@features/training_log';
import type { ActiveSessionView, ExerciseCategory } from '@features/training_log';
import type { StrengthSet, CardioSet, TrainingSession } from '@features/training_log/domain/types';
import { ScheduleStrip } from '@ui/components/log/ScheduleStrip';
import { SessionFilterBar, SessionTypeExerciseFilter, DEFAULT_FILTERS } from '@ui/components/log/SessionFilterBar';
import type { SessionFilters } from '@ui/components/log/SessionFilterBar';
import { StrengthSessionItem, CardioSessionItem } from '@ui/components/log/SessionListItem';
import type { SessionHistoryItem, EditingSessionsView } from '@features/training_log';
import type { RecentCardioView, CardioSession } from '@features/cardio';
import { MonthCalendar } from '@ui/components/log/MonthCalendar';
import { WeekCalendar } from '@ui/components/log/WeekCalendar';
import { WorkoutFilterLayer } from '@ui/components/workout/WorkoutFilterLayer';
import type { Id } from '@shared/types';
import { cryptoIdGenerator } from '@core/id-generator';
import {
  FinishSessionModal,
  UndoToast,
  UndoToastProvider,
  useUndoToast,
  useSessionTimer,
  RestTimerAlert,
} from '@ui/components/log';
import {
  AlertTriangle, ChevronDown, ChevronUp, Check, MessageSquare,
  MoreVertical, Pause, Pencil, Play, Plus, Search, Trash2, Undo2, X,
} from 'lucide-react';
import {
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UISet {
  id: string;
  setNumber: number;
  w: string;
  r: string;
  done: boolean;
  warmup: boolean;
  comment: string | null;
}

interface UICardioSet {
  setNumber: number;
  durationSeconds: number;
  distanceMeters: number;
  avgPowerWatts: number;
  resistance: number;
}

interface UIExercise {
  blockId?: string;
  label?: string;
  name: string;
  comment?: string | null;
  hold?: string;
  muscle?: string;
  sets?: UISet[];
  cardioSet?: UICardioSet | null;
}

type UIBlockType = 'single' | 'superset' | 'circuit' | 'stretch' | 'cardio';

interface UIBlock {
  id: string;
  type: UIBlockType;
  label?: string;
  tag?: string;
  exercises: UIExercise[];
  memberBlockIds?: string[];
  restSeconds?: number;
  exerciseName: string;
}

interface UICondition {
  id: string;
  active: boolean;
  severity: 'mild' | 'moderate' | 'severe';
  fullName: string;
  bodyPart: string;
  affectedExercises: string[];
  advice: string;
}

interface DeleteTarget {
  blockId: string;
  exIdx: number;
  setId: string;
  label: string;
}

// ─── Static picker data ───────────────────────────────────────────────────────

const PICKER_CATS = ['All', 'Chest', 'Back', 'Shoulders', 'Arms', 'Core'];

const PICKER_EXES: Array<{ name: string; muscle: string; equip: string; cat: string }> = [
  { name: 'Bench Press', muscle: 'Pectoralis Major', equip: 'Barbell', cat: 'Chest' },
  { name: 'Incline DB Press', muscle: 'Pectoralis Major · Upper', equip: 'Dumbbell', cat: 'Chest' },
  { name: 'Cable Fly', muscle: 'Pectoralis Major', equip: 'Cable', cat: 'Chest' },
  { name: 'Pull-up', muscle: 'Latissimus Dorsi', equip: 'Bodyweight', cat: 'Back' },
  { name: 'Bent Over Row', muscle: 'Latissimus Dorsi · Rhomboids', equip: 'Barbell', cat: 'Back' },
  { name: 'Overhead Press', muscle: 'Anterior Deltoid · Triceps', equip: 'Barbell', cat: 'Shoulders' },
  { name: 'Lateral Raise', muscle: 'Lateral Deltoid', equip: 'Dumbbell', cat: 'Shoulders' },
  { name: 'Cable Tricep Extension', muscle: 'Triceps Brachii', equip: 'Cable', cat: 'Arms' },
  { name: 'Bicep Curl', muscle: 'Biceps Brachii', equip: 'Dumbbell', cat: 'Arms' },
  { name: 'Plank', muscle: 'Core · Transverse Abdominis', equip: 'Bodyweight', cat: 'Core' },
  { name: 'Dead Bug', muscle: 'Rectus Abdominis · Core', equip: 'Bodyweight', cat: 'Core' },
  { name: 'Crunch', muscle: 'Rectus Abdominis', equip: 'Bodyweight', cat: 'Core' },
];

const PICKER_CARDIO: Array<{ name: string; muscle: string; equip: string }> = [
  { name: 'Indoor Bike', muscle: 'Full Body · Cardiovascular', equip: 'Machine' },
  { name: 'Treadmill', muscle: 'Lower Body · Cardiovascular', equip: 'Machine' },
  { name: 'Rowing Machine', muscle: 'Full Body · Cardiovascular', equip: 'Machine' },
  { name: 'Ski Erg', muscle: 'Full Body · Cardiovascular', equip: 'Machine' },
  { name: 'Assault Bike', muscle: 'Full Body · Cardiovascular', equip: 'Machine' },
];

const PICKER_STRETCH: Array<{ name: string; muscle: string; equip: string }> = [
  { name: 'Hip Flexor Stretch', muscle: 'Hip Flexors', equip: 'Bodyweight' },
  { name: 'Thoracic Rotation', muscle: 'Upper Back · T-Spine', equip: 'Bodyweight' },
  { name: 'Pigeon Pose', muscle: 'Glutes · Hip Rotators', equip: 'Bodyweight' },
  { name: "Child's Pose", muscle: 'Lats · Lower Back', equip: 'Bodyweight' },
  { name: 'Band Pull-apart', muscle: 'Rear Deltoids · Rhomboids', equip: 'Band' },
  { name: 'Quad Stretch', muscle: 'Quadriceps', equip: 'Bodyweight' },
  { name: 'Calf Stretch', muscle: 'Gastrocnemius · Soleus', equip: 'Bodyweight' },
];

const BT_OPTIONS = ['Standard', 'Superset', 'Circuit', 'Stretch', 'Cardio'] as const;

const EXAMPLE_CONDITIONS: UICondition[] = [
  {
    id: 'cond-1',
    active: true,
    severity: 'moderate',
    fullName: 'Left Shoulder Impingement',
    bodyPart: 'Shoulder',
    affectedExercises: ['Overhead Press', 'Lateral Raise', 'Bench Press'],
    advice: 'Avoid pressing above shoulder height. Reduce load by 20–30%.',
  },
];
const USER_ID = 'user-001' as Id<'User'>;

// ─── Transformers ─────────────────────────────────────────────────────────────

function editingSessionToView(s: TrainingSession): ActiveSessionView {
  return {
    id: s.id,
    name: s.name,
    startedAt: s.startedAt,
    blocks: s.blocks.map(b => ({
      id: b.id,
      exerciseName: b.exerciseName,
      exerciseCategory: b.exerciseCategory,
      sets: b.sets,
      notes: b.notes,
      order: b.order,
      ...(b.blockType !== undefined && { blockType: b.blockType }),
      ...(b.rounds !== undefined && { rounds: b.rounds }),
      ...(b.restSeconds !== undefined && { restSeconds: b.restSeconds }),
      ...(b.supersetGroupId !== undefined && { supersetGroupId: b.supersetGroupId }),
    })),
    notes: s.notes,
  };
}

function domainBlocksToUIBlocks(blocks: ActiveSessionView['blocks']): UIBlock[] {
  const result: UIBlock[] = [];
  const groupMap = new Map<string, ActiveSessionView['blocks']>();

  for (const b of blocks) {
    if (b.supersetGroupId) {
      const key = String(b.supersetGroupId);
      if (!groupMap.has(key)) groupMap.set(key, []);
      groupMap.get(key)!.push(b);
    }
  }

  const seenGroups = new Set<string>();

  for (const b of blocks) {
    if (b.supersetGroupId) {
      const key = String(b.supersetGroupId);
      if (seenGroups.has(key)) continue;
      seenGroups.add(key);

      const groupBlocks = groupMap.get(key) ?? [b];
      result.push({
        id: key,
        type: b.blockType === 'circuit' ? 'circuit' : 'superset',
        label: b.blockType === 'circuit' ? 'Circuit' : 'Superset',
        memberBlockIds: groupBlocks.map(gb => gb.id),
        restSeconds: groupBlocks[0].restSeconds,
        exerciseName: groupBlocks.map(gb => gb.exerciseName).join(' / '),
        exercises: groupBlocks.map((gb, idx) => ({
          blockId: gb.id,
          label: String.fromCharCode(65 + idx),
          name: gb.exerciseName,
          sets: gb.sets
            .filter((s): s is StrengthSet => s.type === 'strength')
            .map(s => ({
              id: `${gb.id}-${s.setNumber}`,
              setNumber: s.setNumber,
              w: s.weightKg > 0 ? String(s.weightKg) : '—',
              r: String(s.reps),
              done: s.done ?? false,
              warmup: s.isWarmup,
              comment: s.comment ?? null,
            })),
        })),
      });
    } else {
      const type: UIBlockType =
        b.exerciseCategory === 'cardio' ? 'cardio' :
          b.exerciseCategory === 'mobility' ? 'stretch' :
            'single';

      const domainCardioSet = b.sets.filter((s): s is CardioSet => s.type === 'cardio')[0] ?? null;
      result.push({
        id: b.id,
        type,
        restSeconds: b.restSeconds,
        exerciseName: b.exerciseName,
        exercises: [{
          blockId: b.id,
          name: b.exerciseName,
          comment: b.notes || null,
          sets: b.sets
            .filter((s): s is StrengthSet => s.type === 'strength')
            .map(s => ({
              id: `${b.id}-${s.setNumber}`,
              setNumber: s.setNumber,
              w: s.weightKg > 0 ? String(s.weightKg) : '—',
              r: String(s.reps),
              done: s.done ?? false,
              warmup: s.isWarmup,
              comment: s.comment ?? null,
            })),
          cardioSet: domainCardioSet ? {
            setNumber: domainCardioSet.setNumber,
            durationSeconds: domainCardioSet.durationSeconds,
            distanceMeters: domainCardioSet.distanceMeters,
            avgPowerWatts: domainCardioSet.avgPowerWatts ?? 0,
            resistance: domainCardioSet.resistance ?? 0,
          } : null,
        }],
      });
    }
  }

  return result;
}

function sessionDateLabel(ts: number): string {
  return new Date(ts).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

// ─── Injury helpers ───────────────────────────────────────────────────────────

function getWarnings(exName: string, conditions: UICondition[]): UICondition[] {
  return conditions.filter(c => c.active && c.affectedExercises.includes(exName));
}

function worstSev(warnings: UICondition[]): UICondition | null {
  if (!warnings.length) return null;
  const rank: Record<string, number> = { mild: 1, moderate: 2, severe: 3 };
  return warnings.reduce((top, w) => rank[w.severity] > rank[top.severity] ? w : top);
}

function worstActiveCondition(conditions: UICondition[]): UICondition | null {
  return worstSev(conditions.filter(c => c.active));
}

// ─── MiniChart ────────────────────────────────────────────────────────────────

function MiniChart({ sets }: { sets?: UISet[] }) {
  if (!sets?.length) return null;
  const loggedSets = sets.filter(s => s.w !== '—');
  if (!loggedSets.length) return null;

  let workingSet = 0;
  const chartData = loggedSets.map(s => {
    if (!s.warmup) workingSet += 1;
    const weight = parseFloat(s.w) || 0;
    const reps = parseFloat(s.r) || 0;
    return {
      id: s.id,
      set: s.warmup ? 'WU' : `S${workingSet}`,
      weight,
      reps: Number.isInteger(reps) ? String(reps) : reps.toFixed(1),
    };
  });
  const yMax = Math.max(20, Math.ceil(Math.max(...chartData.map(d => d.weight)) / 20) * 20);
  const yTicks = Array.from({ length: yMax / 20 + 1 }, (_, i) => i * 20);

  return (
    <div className="mini-chart" aria-label="Set weight trend">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart accessibilityLayer data={chartData} margin={{ top: 12, right: 12, left: 20 }}>
          <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="2 4" />
          <XAxis
            dataKey="set"
            tickLine={false}
            axisLine={false}
            tickMargin={1}
            tick={{ fontSize: 'var(--t-xs)', fill: 'var(--ink-faint)', fontFamily: 'var(--font-mono)' }}
          />
          <YAxis
            dataKey="weight"
            width={11}
            tickLine={false}
            axisLine={false}
            tickMargin={5}
            tick={{ fontSize: 'var(--t-xs)', fill: 'var(--ink-faint)', fontFamily: 'var(--font-mono)' }}
            tickFormatter={(value: number) => `${value}`}
            domain={[0, yMax]}
            ticks={yTicks}
          />
          <Line
            dataKey="weight"
            type="natural"
            stroke="var(--accent)"
            strokeWidth={1.5}
            dot={{ fill: 'var(--accent)', strokeWidth: 0, r: 2.5 }}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
          >
            <LabelList
              dataKey="reps"
              position="top"
              offset={5}
              className="muted"
              fontSize={'var(--t-xs)'}
            />
          </Line>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── CommentLine ──────────────────────────────────────────────────────────────

function CommentLine({ text, indent }: { text: string; indent?: boolean }) {
  return (
    <div className={`row align-center${indent ? '' : ''}`}>
      <MessageSquare size={9} />
      <span>{text}</span>
    </div>
  );
}

// ─── LetterBadge ─────────────────────────────────────────────────────────────

function LetterBadge({ letter }: { letter: string }) {
  return <div className="letter-badge">{letter}</div>;
}

// ─── SetRow ───────────────────────────────────────────────────────────────────

function SetRow({
  num, set, menuKey, openMenu, onOpenMenu, onToggleWarmup, onToggleDone, onDeleteRequest, onUpdate, onComment,
}: {
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
}) {
  const { w, r, done, warmup, comment } = set;
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
    const reps = Math.max(1, parseInt(newR) || 1);
    onUpdate(weightKg, reps);
  };

  const submitComment = () => {
    onComment(commentDraft.trim());
    setCommentOpen(false);
  };

  return (
    <>
      <div className="row align-center space-between">
        <span className={`mono num caption${warmup ? ' faint' : ' muted'}`}>
          {warmup ? `WU` : `S${num}`}
        </span>
        <div className="row grow align-center compact">
          <input
            type="number"
            className={` mono num${warmup ? ' faint' : ''}`}
            value={wVal}
            placeholder="0"
            min="0"
            step="0.5"
            onChange={e => setWVal(e.target.value)}
            onBlur={e => commit(e.target.value, rVal)}
          />
          <span className={`caption${warmup ? ' faint' : ' muted'}`}>kg ×</span>
          <input
            type="number"
            className={` mono num${warmup ? ' faint' : ''}`}
            value={rVal}
            placeholder="1"
            min="1"
            step="1"
            onChange={e => setRVal(e.target.value)}
            onBlur={e => commit(wVal, e.target.value)}
          />
        </div>
        <button
          type="button"
          className="icon"
          onClick={onToggleDone}
        >
          {done && <Check size={9} strokeWidth={2.5} />}
        </button>
        <button
          type="button"
          className="ghost icon sm"
          onClick={() => onOpenMenu(isOpen ? null : menuKey)}
        >
          <MoreVertical size={10} className="faint" />
        </button>
      </div>

      {isOpen && (
        <div className="modal-overlay">
          <div className="surface column">
            <div className="row space-between align-center">

              <h3>Set Options</h3><button type="button" className="ghost icon sm" onClick={() => onOpenMenu(null)}>
                <X size={10} className="faint" />
              </button>
            </div>
            <button type="button" className="secondary sm" onClick={() => { onToggleWarmup(); onOpenMenu(null); }}>
              {warmup ? 'Mark working' : 'Mark warmup'}
            </button>
            <button type="button" className="secondary sm" onClick={() => { onOpenMenu(null); setCommentOpen(v => !v); }}>
              <MessageSquare size={9} /> {comment ? 'Edit note' : 'Add note'}
            </button>
            <button
              type="button"
              className="sm warning"
              onClick={() => { onOpenMenu(null); onDeleteRequest(); }}
            >
              <Trash2 size={9} /> Delete
            </button>
          </div>
        </div>
      )}

      {commentOpen && (
        <div className="row compact align-center set-row-menu">
          <MessageSquare size={9} className="faint" />
          <input
            type="text"
            className="grow"
            placeholder="Add a note…"
            value={commentDraft}
            autoFocus
            onChange={e => setCommentDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submitComment(); if (e.key === 'Escape') setCommentOpen(false); }}
          />
          <button type="button" className="ghost icon sm" onClick={submitComment}>
            <Check size={10} />
          </button>
          <button type="button" className="ghost icon sm" onClick={() => setCommentOpen(false)}>
            <X size={10} className="faint" />
          </button>
        </div>
      )}

      {comment && !commentOpen && <CommentLine text={comment} indent />}
    </>
  );
}

// ─── ExerciseSection (superset / circuit child) ───────────────────────────────

function ExerciseSection({
  ex, openMenu, onOpenMenu, onToggleWarmup, onToggleDone, onDeleteRequest, onAddSet, onUpdateSet, onCommentSet, injuries, acknowledged, onAcknowledge,
}: {
  ex: UIExercise;
  openMenu: string | null;
  onOpenMenu: (key: string | null) => void;
  onToggleWarmup: (setId: string) => void;
  onToggleDone: (setId: string) => void;
  onDeleteRequest: (setId: string, setIdx: number) => void;
  onAddSet: () => void;
  onUpdateSet: (setNumber: number, weightKg: number, reps: number) => void;
  onCommentSet: (setId: string, text: string) => void;
  injuries: UICondition[];
  acknowledged: Set<string>;
  onAcknowledge: (name: string) => void;
}) {
  const warnings = getWarnings(ex.name, injuries);
  const isAcked = acknowledged.has(ex.name);

  return (
    <div className="column compact">
      <div className="row align-center space-between">
        <div className="row compact grow align-center">
          {ex.label && <LetterBadge letter={ex.label} />}
          <h3 className="grow">{ex.name}</h3>
          {warnings.length > 0 && (
            <AlertTriangle size={11} className="muted" />
          )}
        </div>

      </div>

      {warnings.length > 0 && !isAcked && (
        <div className="column compact">
          {warnings.map(w => (
            <div key={w.id} className="row align-center compact">
              <span className="caption grow">{w.advice}</span>
              <button type="button" className="ghost icon sm" onClick={() => onAcknowledge(ex.name)}>
                <X size={10} className="faint" />
              </button>
            </div>
          ))}
        </div>
      )}

      {ex.comment && <CommentLine text={ex.comment} indent={Boolean(ex.label)} />}
      {ex.sets && (
        <div>
          <MiniChart sets={ex.sets} />
        </div>
      )}
      <div className="column compact">
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
              onToggleWarmup={() => onToggleWarmup(s.id)}
              onToggleDone={() => onToggleDone(s.id)}
              onDeleteRequest={() => onDeleteRequest(s.id, j)}
              onUpdate={(kg, reps) => onUpdateSet(s.setNumber, kg, reps)}
              onComment={text => onCommentSet(s.id, text)}
            />
          );
        })}
      </div>

      <button type="button" className="secondary sm align-left" onClick={onAddSet}>+ Add Set</button>
    </div>
  );
}

// ─── CardioEditor ─────────────────────────────────────────────────────────────

const CARDIO_FIELDS: Array<{ key: keyof UICardioSet; label: string; unit: string; step: number; toDisplay: (v: number) => string; fromDisplay: (s: string) => number }> = [
  { key: 'durationSeconds', label: 'Duration', unit: 'min', step: 0.5, toDisplay: v => v > 0 ? String(Math.round(v / 60 * 10) / 10) : '', fromDisplay: s => Math.round((parseFloat(s) || 0) * 60) },
  { key: 'distanceMeters', label: 'Distance', unit: 'km', step: 0.01, toDisplay: v => v > 0 ? String(Math.round(v / 10) / 100) : '', fromDisplay: s => Math.round((parseFloat(s) || 0) * 1000) },
  { key: 'avgPowerWatts', label: 'Avg Power', unit: 'W', step: 1, toDisplay: v => v > 0 ? String(v) : '', fromDisplay: s => Math.round(parseFloat(s) || 0) },
  { key: 'resistance', label: 'Resistance', unit: 'level', step: 1, toDisplay: v => v > 0 ? String(v) : '', fromDisplay: s => Math.round(parseFloat(s) || 0) },
];

function CardioEditor({ cardioSet, onUpdate }: {
  cardioSet: UICardioSet | null;
  onUpdate: (field: keyof UICardioSet, value: number) => void;
}) {
  const defaults: UICardioSet = cardioSet ?? { setNumber: 0, durationSeconds: 0, distanceMeters: 0, avgPowerWatts: 0, resistance: 0 };
  const [vals, setVals] = useState(() =>
    CARDIO_FIELDS.reduce<Record<string, string>>((acc, f) => ({ ...acc, [f.key]: f.toDisplay(defaults[f.key] as number) }), {})
  );

  useEffect(() => {
    setVals(CARDIO_FIELDS.reduce<Record<string, string>>((acc, f) => ({ ...acc, [f.key]: f.toDisplay(defaults[f.key] as number) }), {}));
  }, [cardioSet?.durationSeconds, cardioSet?.distanceMeters, cardioSet?.avgPowerWatts, cardioSet?.resistance]);

  return (
    <div className="surface grid compact">
      {CARDIO_FIELDS.map(f => (
        <div key={f.key} className="column compact">
          <span className="eyebrow">{f.label}</span>
          <div className="row compact align-center">
            <input
              type="number"
              className="mono num"
              value={vals[f.key]}
              placeholder="—"
              min="0"
              step={f.step}
              onChange={e => setVals(prev => ({ ...prev, [f.key]: e.target.value }))}
              onBlur={e => onUpdate(f.key, f.fromDisplay(e.target.value))}
            />
            <span className="caption muted">{f.unit}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── BlockCard ────────────────────────────────────────────────────────────────

function BlockCard({
  block, openMenu, onOpenMenu, onToggleWarmup, onToggleDone, onDeleteRequest, onDeleteBlock, onAddSet, onUpdateSet, onCommentSet, onUpdateCardio,
  injuries, acknowledged, onAcknowledge, onStartRest,
}: {
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
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showRestPicker, setShowRestPicker] = useState(false);
  const closeMenu = () => { setMenuOpen(false); setShowRestPicker(false); };
  const blockIds = block.memberBlockIds ?? [block.id];

  const restPickerContent = (
    <div className="column compact">
      <span className="caption muted">Choose duration</span>
      <div className="cluster compact align-center">
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
      </div>
    </div>
  );

  const blockMenu = (
    <div className="modal-overlay">
      <div className="surface column">
        <div className="row space-between align-center">
          <span className="detail">{block.exerciseName}</span>
          <button type="button" className="ghost icon sm" onClick={closeMenu}>
            <X size={10} className="faint" />
          </button>
        </div>
        {showRestPicker ? restPickerContent : (
          <button type="button" className="secondary sm" onClick={() => setShowRestPicker(true)}>
            Rest timer
          </button>
        )}
        <button type="button" className="sm warning" onClick={() => { closeMenu(); onDeleteBlock(blockIds); }}>
          <Trash2 size={9} /> Delete exercise
        </button>
      </div>
    </div>
  );

  // ── Stretch ──
  if (block.type === 'stretch') {
    return (
      <div className="surface">
        <div className="row align-center space-between">
          <div className="row compact align-center">
            {block.tag && (
              <span className="pill">
                <span className="dot" />
                {block.tag}
              </span>
            )}
            <span className="caption muted">Stretch</span>
          </div>
          <button type="button" className="ghost icon sm" onClick={() => setMenuOpen(v => !v)}>
            <MoreVertical size={10} className="faint" />
          </button>
        </div>
        {menuOpen && blockMenu}
        {block.exercises.map((ex, i) => (
          <div
            key={i}
            className={`row align-center space-between set-row${i < block.exercises.length - 1 ? ' bordered-bottom' : ''}`}
          >
            <div className="column compact grow">
              <span className="detail">{ex.name}</span>
              <span className="caption">{ex.muscle}</span>
            </div>
            <span className="mono caption">{ex.hold}</span>
          </div>
        ))}
      </div>
    );
  }

  // ── Cardio ──
  if (block.type === 'cardio') {
    const ex = block.exercises[0];
    return (
      <div className="surface">
        <div className="row align-center space-between">
          <span className="detail">{ex.name}</span>
          <div className="row compact align-center">
            <span className="pill">

              Cardio
            </span>
            <button type="button" className="ghost icon sm" onClick={() => setMenuOpen(v => !v)}>
              <MoreVertical size={10} className="faint" />
            </button>
          </div>
        </div>
        {menuOpen && blockMenu}
        <CardioEditor
          cardioSet={ex.cardioSet ?? null}
          onUpdate={(field, value) => onUpdateCardio(block.id, field, value)}
        />
      </div>
    );
  }

  // ── Single ──
  if (block.type === 'single') {
    const ex = block.exercises[0];
    const warnings = getWarnings(ex.name, injuries);
    const isAcked = acknowledged.has(ex.name);
    const top = worstSev(warnings);

    const flagCls = top && !isAcked ? (top.severity === 'severe' ? ' warning' : ' caution') : '';
    return (
      <div className={`surface${flagCls}`}>
        <div className="row align-center space-between">
          <div className="row compact grow align-center">
            {warnings.length > 0 && <AlertTriangle size={12} />}
            <span className="detail grow">{ex.name}</span>
            {warnings.map(w => (
              <span key={w.id} className={`badge ${w.severity === 'severe' ? 'warning' : 'caution'}`}>{w.bodyPart}</span>
            ))}

          </div>
          <button type="button" className="ghost icon sm" onClick={() => setMenuOpen(v => !v)}>
            <MoreVertical size={10} className="faint" />
          </button>
        </div>

        {menuOpen && blockMenu}

        {warnings.length > 0 && !isAcked && (
          <div className="column compact">
            {warnings.map(w => (
              <div key={w.id} className="row align-center compact">
                <span className="caption grow">{w.advice}</span>
              </div>
            ))}
          </div>
        )}

        {ex.comment && <CommentLine text={ex.comment} />}

        {ex.sets?.some(s => s.w !== '—') && (
          <div className="surface">
            <MiniChart sets={ex.sets} />
          </div>
        )}
        <div className="column compact">
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
              />
            );
          })}
        </div>

        <button type="button" className="sm" onClick={() => onAddSet(block.id)}>+ Add Set</button>
      </div>
    );
  }

  // ── Superset / Circuit ──
  return (
    <div className="surface">
      <div className="row align-center space-between">
        <span className="pill">

          {block.label}
        </span>
        <button type="button" className="ghost icon sm" onClick={() => setMenuOpen(v => !v)}>
          <MoreVertical size={10} className="faint" />
        </button>
      </div>

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
          />
        </div>
      ))}
    </div>
  );
}

// ─── InjuryBanner ─────────────────────────────────────────────────────────────

function InjuryBanner({ conditions }: { conditions: UICondition[] }) {
  const [open, setOpen] = useState(false);
  const active = conditions.filter(c => c.active);
  if (!active.length) return null;

  const top = worstActiveCondition(conditions)!;

  const sevClass = top.severity === 'severe' ? 'warning' : 'caution';

  return (
    <div className={`surface ${sevClass}`}>
      <div
        role="button"
        tabIndex={0}
        className="row align-center space-between"
        onClick={() => setOpen(v => !v)}
        onKeyDown={e => e.key === 'Enter' && setOpen(v => !v)}
      >
        <div className="row compact align-center">
          <AlertTriangle size={13} />
          <span className="detail">
            {active.length} injury warning{active.length > 1 ? 's' : ''} active
          </span>
          {!open && <span className="caption">· tap to review</span>}
        </div>
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </div>

      {open && (
        <div className="column compact">
          {active.map(inj => {
            const badgeCls = inj.severity === 'severe' ? 'warning' : 'caution';
            return (
              <div key={inj.id} className="column compact">
                <div className="row compact align-center">
                  <span className="detail grow">{inj.fullName}</span>
                  <span className={`badge ${badgeCls}`}>{inj.severity}</span>
                </div>
                <p className="caption">{inj.advice}</p>
                <div className="row compact">
                  {inj.affectedExercises.map(ex => (
                    <span key={ex} className="badge">{ex}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── SessionHeader ────────────────────────────────────────────────────────────

function V2SessionHeader({
  name, dateLabel, timerDisplay, isActive, isPaused, onPause, onResume, onFinish, onClearSession,
  timerNotStarted, onStartTimer,
}: {
  name: string;
  dateLabel: string;
  timerDisplay?: string;
  isActive: boolean;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onFinish: () => void;
  onClearSession: () => void;
  timerNotStarted: boolean;
  onStartTimer: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="surface secondary header">
      <div className="row align-center space-between">
        <button type="button" className="secondary sm">
          <ChevronDown size={14} />
        </button>
        <div className="column compact grow">
          <span className="detail">{name}</span>
          <div className="row compact align-center">
            <span className="caption muted">{dateLabel}</span>
            {isActive && timerDisplay && !timerNotStarted && (
              <>
                <span className="caption faint">·</span>
                <span className="mono num caption muted">{timerDisplay}</span>
              </>
            )}
          </div>
        </div>
        <div className="row compact align-center">
          <button type="button" className="primary sm" onClick={onFinish}>Finish</button>
          {timerNotStarted ? (
            <button type="button" className="primary sm session-timer-start" onClick={onStartTimer}>
              <Play size={13} /> Start
            </button>
          ) : (
            <button type="button" className="secondary sm" onClick={isPaused ? onResume : onPause}>
              {isPaused ? <Play size={13} /> : <Pause size={13} />}
            </button>
          )}
          <button type="button" className="secondary sm" onClick={() => setMenuOpen(v => !v)}>
            <MoreVertical size={13} />
          </button>
        </div>
      </div>
      {menuOpen && (
        <div className="modal-overlay">
          <div className="surface column">
            <div className="row space-between align-center">
              <span className="detail">Session Options</span>
              <button type="button" className="ghost icon sm" onClick={() => setMenuOpen(false)}>
                <X size={10} className="faint" />
              </button>
            </div>
            <button
              type="button"
              className="sm warning"
              onClick={() => { setMenuOpen(false); onClearSession(); }}
            >
              <Trash2 size={9} /> Delete session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── WorkoutView ──────────────────────────────────────────────────────────────

function WorkoutView({
  session, conditions, isActive, onAddExercise, onFinish, onPause, onResume, isPaused, timerDisplay,
  timerNotStarted, onStartTimer,
}: {
  session: ActiveSessionView | null;
  conditions: UICondition[];
  isActive: boolean;
  onAddExercise: () => void;
  onFinish: () => void;
  onPause: () => void;
  onResume: () => void;
  isPaused: boolean;
  timerDisplay: string;
  timerNotStarted: boolean;
  onStartTimer: () => void;
}) {
  const domainBlocks = session?.blocks ?? [];
  const [blocks, setBlocks] = useState<UIBlock[]>(() => domainBlocksToUIBlocks(domainBlocks));
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [deleteAlert, setDeleteAlert] = useState<DeleteTarget | null>(null);
  const [deleteBlockAlert, setDeleteBlockAlert] = useState<string[] | null>(null);
  const [clearAlert, setClearAlert] = useState(false);
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());
  const [restTimer, setRestTimer] = useState<{ seconds: number; exerciseName: string } | null>(null);

  const { enqueue: enqueueUndo } = useUndoToast();
  const { dispatch: removeBlock } = useCommand(handleRemoveBlock);
  const { dispatch: removeSet } = useCommand(handleRemoveSet);
  const { dispatch: logStrengthSet } = useCommand(handleLogStrengthSet);
  const { dispatch: updateSet } = useCommand(handleUpdateSet);
  const { dispatch: updateSetComment } = useCommand(handleUpdateSetComment);
  const { dispatch: logCardioSet } = useCommand(handleLogCardioSet);
  const { dispatch: deleteSession } = useCommand(handleDeleteSession);

  const blocksSig = domainBlocks.reduce((acc, b) =>
    acc + b.sets.reduce((s, set) => {
      const ss = set as StrengthSet;
      return s + (ss.weightKg ?? 0) * 100 + (ss.reps ?? 0);
    }, b.sets.length),
    0);
  useEffect(() => {
    setBlocks(domainBlocksToUIBlocks(domainBlocks));
  }, [blocksSig, domainBlocks.length]);

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
    const strengthSets = domainBlock?.sets.filter((s): s is StrengthSet => s.type === 'strength') ?? [];
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
    const existing = domainBlock?.sets.find((s): s is CardioSet => s.type === 'cardio');
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

  return (
    <div className="column">
      <V2SessionHeader
        name={name}
        dateLabel={dateLabel}
        timerDisplay={timerDisplay}
        isActive={isActive}
        isPaused={isPaused}
        onPause={onPause}
        onResume={onResume}
        onFinish={onFinish}
        onClearSession={() => setClearAlert(true)}
        timerNotStarted={timerNotStarted}
        onStartTimer={onStartTimer}
      />

      <InjuryBanner conditions={conditions} />

      <UndoToast />

      <div className="column">
        {blocks.map(b => (
          <BlockCard
            key={b.id}
            block={b}
            openMenu={openMenu}
            onOpenMenu={setOpenMenu}
            onToggleWarmup={handleToggleWarmup}
            onToggleDone={handleToggleDone}
            onDeleteRequest={handleDeleteRequest}
            onDeleteBlock={ids => setDeleteBlockAlert(ids)}
            onAddSet={handleAddSet}
            onUpdateSet={handleUpdateSetValues}
            onCommentSet={handleCommentSet}
            onUpdateCardio={handleUpdateCardio}
            injuries={conditions}
            acknowledged={acknowledged}
            onAcknowledge={handleAcknowledge}
            onStartRest={(exerciseName, seconds) => setRestTimer({ seconds, exerciseName })}
          />
        ))}

        <button type="button" className="ghost " onClick={onAddExercise}>
          <Plus size={12} /> Add Exercise
        </button>
      </div>

      {deleteAlert && (
        <div className="modal-overlay">
          <div className="surface">
            <div className="column compact">
              <span className="detail">Delete set?</span>
              <span className="mono num detail muted">{deleteAlert.label}</span>
              <span className="caption faint">This removes the set from your log.</span>
            </div>
            <div className="row space-between">
              <button type="button" className="ghost" onClick={() => setDeleteAlert(null)}>Cancel</button>
              <button type="button" className="warning" onClick={handleConfirmDelete}>
                <Trash2 size={12} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteBlockAlert && (
        <div className="modal-overlay">
          <div className="surface">
            <div className="column compact">
              <span className="detail">Delete exercise?</span>
              <span className="caption faint">This removes the exercise and all its sets.</span>
            </div>
            <div className="row space-between">
              <button type="button" className="ghost" onClick={() => setDeleteBlockAlert(null)}>Cancel</button>
              <button type="button" className="warning" onClick={handleConfirmDeleteBlock}>
                <Trash2 size={12} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {clearAlert && (
        <div className="modal-overlay">
          <div className="surface">
            <div className="column compact">
              <h3>Delete session?</h3>
              <span className="caption faint">This removes the entire session and cannot be undone.</span>
            </div>
            <div className="row space-between">
              <button type="button" className="secondary" onClick={() => setClearAlert(false)}>Cancel</button>
              <button type="button" className="warning" onClick={handleConfirmClearSession}>
                <Trash2 size={12} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {restTimer && (
        <div className="bottom-banner">
          <RestTimerAlert
            initialSeconds={restTimer.seconds}
            onSkip={() => setRestTimer(null)}
          />
        </div>
      )}
    </div>
  );
}

// ─── FinishedView ─────────────────────────────────────────────────────────────

function FinishedView({ session }: { session: ActiveSessionView }) {
  const blocks = domainBlocksToUIBlocks(session.blocks);

  return (
    <div className="column">
      <div className="surface flat column compact">
        <div className="row align-center space-between">
          <span className="detail">{session.name}</span>
          <span className="caption muted">{session.startedAt != null ? sessionDateLabel(session.startedAt) : '—'}</span>
        </div>
      </div>

      <div className="column">
        {blocks.map(b => (
          <div key={b.id} className="surface flat">
            {b.type === 'stretch' && (
              <>
                <div className="row align-center space-between">
                  {b.tag && <span className="pill">{b.tag}</span>}
                  <button type="button" className="ghost icon sm">
                    <Pencil size={10} className="muted" />
                  </button>
                </div>
                {b.exercises.map((ex, i) => (
                  <div key={i} className="row align-center space-between set-row">
                    <span className="detail">{ex.name}</span>
                    <span className="mono caption">{ex.hold}</span>
                  </div>
                ))}
              </>
            )}

            {b.type === 'cardio' && (() => {
              const ex = b.exercises[0];
              return (
                <>
                  <div className="row align-center space-between">
                    <span className="detail">{ex.name}</span>
                    <button type="button" className="ghost icon sm">
                      <Pencil size={10} className="faint" />
                    </button>
                  </div>
                  <div className="grid-4">
                    {CARDIO_FIELDS.map((f, i) => {
                      const raw = ex.cardioSet?.[f.key] as number | undefined;
                      const display = raw != null && raw > 0 ? f.toDisplay(raw) : '—';
                      return (
                        <div key={i} className="surface column compact align-center">
                          <span className="eyebrow">{f.label}</span>
                          <span className="mono num detail">{display}
                            {display !== '—' && <span className="muted caption"> {f.unit}</span>}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}

            {(b.type === 'single' || b.type === 'superset' || b.type === 'circuit') && (
              <>
                <div className="row align-center space-between">
                  {b.type === 'single'
                    ? <><span className="detail grow">{b.exercises[0].name}</span><MiniChart sets={b.exercises[0].sets} /></>
                    : <span className="pill">{b.label}</span>
                  }
                  <button type="button" className="ghost icon sm">
                    <Pencil size={10} className="faint" />
                  </button>
                </div>
                {b.exercises.map((ex, i) => (
                  <div key={i}>
                    {b.type !== 'single' && (
                      <div className="row compact align-center space-between">
                        <div className="row compact align-center">
                          <LetterBadge letter={ex.label ?? String(i + 1)} />
                          <span className="detail">{ex.name}</span>
                        </div>
                        <MiniChart sets={ex.sets} />
                      </div>
                    )}
                    <div className="column compact">
                      {ex.sets?.map((s, j) => {
                        const wNum = (ex.sets ?? []).filter((x, idx) => !x.warmup && idx <= j).length;
                        return (
                          <div key={j} className={`row align-center space-between set-row${j < (ex.sets?.length ?? 0) - 1 ? ' bordered-bottom' : ''}`}>
                            <span className={`mono caption${s.warmup ? ' faint' : ' muted'}`}>
                              {s.warmup ? 'W' : `S${wNum}`}
                            </span>
                            <span className={`detail mono num${s.warmup ? ' faint' : ' muted'}`}>
                              {s.w !== '—' ? `${s.w} kg × ` : ''}{s.r}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ExercisePicker ───────────────────────────────────────────────────────────

function ExercisePicker({
  onClose,
  onCommit,
}: {
  onClose: () => void;
  onCommit: (selections: Array<{ name: string; category: ExerciseCategory }>, blockType: typeof BT_OPTIONS[number]) => void;
}) {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('All');
  const [blockType, setBlockType] = useState<typeof BT_OPTIONS[number]>('Standard');
  const [pending, setPending] = useState<string[]>([]);

  const isStretch = blockType === 'Stretch';
  const isCardio = blockType === 'Cardio';
  const isMulti = blockType === 'Superset' || blockType === 'Circuit';
  const baseList = isStretch ? PICKER_STRETCH : isCardio ? PICKER_CARDIO : PICKER_EXES;

  const catMap: Record<string, ExerciseCategory> = {
    Standard: 'strength', Superset: 'strength', Circuit: 'strength',
    Stretch: 'mobility', Cardio: 'cardio',
  };

  const filtered = baseList.filter(ex => {
    const catOk = isStretch || isCardio || cat === 'All' || ('cat' in ex && ex.cat === cat);
    const searchOk = !search
      || ex.name.toLowerCase().includes(search.toLowerCase())
      || ex.muscle.toLowerCase().includes(search.toLowerCase());
    return catOk && searchOk;
  });

  const groupKeys = filtered.reduce<string[]>((acc, ex) => {
    const key = 'cat' in ex ? (ex as { cat: string }).cat : (isStretch ? 'Stretch' : 'Cardio');
    if (!acc.includes(key)) acc.push(key);
    return acc;
  }, []);

  const handleSelect = (name: string) => {
    if (isMulti) {
      setPending(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
    } else {
      onCommit([{ name, category: catMap[blockType] ?? 'strength' }], blockType);
      onClose();
    }
  };

  const handleCommit = () => {
    if (pending.length === 0) return;
    onCommit(pending.map(name => ({ name, category: catMap[blockType] ?? 'strength' })), blockType);
    onClose();
  };

  return (
    <div className="column surface">
      <div className="row align-center space-between">
        <h3 className="detail">Add Exercise</h3>
        <button type="button" className="icon sm secondary" onClick={onClose}>
          <X size={14} />
        </button>
      </div>

      <div className="cluster">
        {BT_OPTIONS.map(bt => (
          <button
            key={bt}
            type="button"
            className={`chip${blockType === bt ? ' active' : ''}`}
            onClick={() => { setBlockType(bt); setCat('All'); setPending([]); }}
          >
            {bt}
          </button>
        ))}
      </div>

      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search exercises…"
      />

      {!isStretch && !isCardio && (
        <div className="cluster">
          {PICKER_CATS.map(c => (
            <button
              key={c}
              type="button"
              className={`chip${cat === c ? ' active' : ''}`}
              onClick={() => setCat(c)}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {isMulti && (
        <p className="caption faint">
          Select 2 or more exercises, then tap Add.
        </p>
      )}

      <div className="column">
        {groupKeys.map(grp => (
          <div className="column" key={grp}>
            <span className="eyebrow">{grp}</span>
            {filtered
              .filter(ex => ('cat' in ex ? ex.cat : (isStretch ? 'Stretch' : 'Cardio')) === grp)
              .map((ex, i, arr) => {
                const isSelected = pending.includes(ex.name);
                return (
                  <button
                    key={i}
                    type="button"
                    className={`surface row space-between${isSelected ? ' active' : ''}${i < arr.length - 1 ? ' bordered-bottom' : ''}`}
                    onClick={() => handleSelect(ex.name)}
                  >
                    <div className="align-left column compact grow">
                      <span className="detail">{ex.name}</span>
                      <span className="caption">{ex.muscle}</span>
                    </div>
                    {isSelected
                      ? <Check size={14} className="accent" />
                      : <span className="pill">{ex.equip}</span>
                    }
                  </button>
                );
              })
            }
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="caption muted">No exercises found</p>
        )}

        {isMulti && pending.length >= 2 && (
          <button type="button" className="surface secondary" onClick={handleCommit}>
            Add {pending.length} exercises to {blockType}
          </button>
        )}

        {isMulti && pending.length === 1 && (
          <p className="caption muted">Select at least one more exercise.</p>
        )}

        {!isMulti && (
          <button type="button" className="secondary">
            <Plus size={12} /> Create exercise
          </button>
        )}
      </div>
    </div>
  );
}

// ─── LogScreenV2 ──────────────────────────────────────────────────────────────

type CombinedEntry =
  | { kind: 'strength'; session: SessionHistoryItem; matchedExercise?: string }
  | { kind: 'cardio'; session: CardioSession };

export function LogScreen() {
  const navigate = useNavigate();
  const { sessionId: routeSessionId } = useParams<{ sessionId: string }>();
  const activeSession = useQuery<ActiveSessionView | null>('active_session');
  const queriedConditions = (useQuery<UICondition[]>('active_conditions') ?? []) as UICondition[];
  const conditions = queriedConditions.length ? queriedConditions : EXAMPLE_CONDITIONS;

  const editingSession = useMemo(() => {
    if (!routeSessionId) return null;
    const s = getEditingSession(routeSessionId as Id<'Session'>);
    return s ? editingSessionToView(s) : null;
  }, [routeSessionId]);

  const session = editingSession ?? activeSession ?? null;
  const isEditing = Boolean(editingSession);
  const hasSession = Boolean(session?.id);

  const [showPicker, setShowPicker] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showFinish, setShowFinish] = useState(false);

  const [sessionFilters, setSessionFilters] = useState<SessionFilters>(DEFAULT_FILTERS);

  const strengthHistory = (useQuery<SessionHistoryItem[]>('session_history') ?? []) as SessionHistoryItem[];
  const cardioView = (useQuery<RecentCardioView>('recent_cardio_sessions') ?? { sessions: [] }) as RecentCardioView;
  const editingState = useQuery<EditingSessionsView>('editing_session');
  const sessionViews = (useQuery<Record<string, ActiveSessionView>>('session_views') ?? {}) as Record<string, ActiveSessionView>;
  const exerciseProgressions = useQuery<Record<string, unknown>>('exercise_progressions') ?? {};

  // sessionId → Set of exercise names (for exercise filter)
  // session_views is always seeded; editing_session only has live-command data, so overlay it on top
  const exercisesBySession = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const [id, view] of Object.entries(sessionViews)) {
      map.set(id, new Set(view.blocks.map((b) => b.exerciseName)));
    }
    if (editingState) {
      for (const s of editingState.sessions) {
        map.set(s.id, new Set(s.blocks.map((b) => b.exerciseName)));
      }
    }
    return map;
  }, [editingState, sessionViews]);

  const allExerciseNames = useMemo(() => {
    const names = new Set<string>();
    Object.keys(exerciseProgressions).forEach(n => names.add(n));
    exercisesBySession.forEach((set) => set.forEach((n) => names.add(n)));
    return Array.from(names).sort();
  }, [exerciseProgressions, exercisesBySession]);

  const combinedSessions = useMemo((): CombinedEntry[] => {
    const { type, exercise, dateRange } = sessionFilters;
    const now = Date.now();
    const cutoff =
      dateRange === '7d'
        ? now - 7 * 86_400_000
        : dateRange === '30d'
          ? now - 30 * 86_400_000
          : 0;

    const result: CombinedEntry[] = [];

    if (type === 'all' || type === 'strength') {
      for (const s of strengthHistory) {
        if (s.startedAt < cutoff) continue;
        if (exercise) {
          const names = exercisesBySession.get(s.id);
          if (!names?.has(exercise)) continue;
        }
        result.push({ kind: 'strength', session: s, matchedExercise: exercise || undefined });
      }
    }

    if (type !== 'strength' && !exercise) {
      for (const s of cardioView.sessions) {
        if (s.startedAt < cutoff) continue;
        if (type !== 'all' && s.sport !== type) continue;
        result.push({ kind: 'cardio', session: s });
      }
    }

    return result.sort((a, b) => b.session.startedAt - a.session.startedAt);
  }, [strengthHistory, cardioView, sessionFilters, exercisesBySession]);

  const filteredSessions = useMemo((): CombinedEntry[] => {
    let result: CombinedEntry[] = combinedSessions;
    if (sessionFilters.view === 'list' && sessionFilters.dateRange !== 'all') {
      const days = sessionFilters.dateRange === '7d' ? 7 : 30;
      const cutoff = Date.now() - days * 86_400_000;
      result = result.filter(entry => entry.session.startedAt >= cutoff);
    }
    if (sessionFilters.sort === 'oldest') result = [...result].reverse();
    return result;
  }, [combinedSessions, sessionFilters]);

  const { dispatch: addBlock } = useCommand(handleAddBlock);
  const { dispatch: addToSuperset } = useCommand(handleAddToSuperset);
  const { dispatch: updateStartTime } = useCommand(handleUpdateSessionStartTime);

  const timer = useSessionTimer(session?.startedAt ?? null);
  const timerNotStarted = session?.startedAt == null;

  useEffect(() => {
    if (!showAddMenu) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setShowAddMenu(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [showAddMenu]);

  const handlePickerCommit = async (
    selections: Array<{ name: string; category: ExerciseCategory }>,
    blockType: typeof BT_OPTIONS[number],
  ) => {
    if (!session?.id) return;
    const isGrouped = (blockType === 'Superset' || blockType === 'Circuit') && selections.length >= 2;

    if (isGrouped) {
      const groupId = cryptoIdGenerator.next<'SupersetGroup'>();
      const blockIds = selections.map(() => cryptoIdGenerator.next<'Block'>());
      for (let i = 0; i < selections.length; i++) {
        await addBlock({
          type: 'AddBlock',
          sessionId: session.id,
          exerciseName: selections[i].name,
          exerciseCategory: selections[i].category,
          blockId: blockIds[i],
        });
      }
      for (const blockId of blockIds) {
        await addToSuperset({ type: 'AddToSuperset', sessionId: session.id, blockId, groupId });
      }
    } else {
      for (const s of selections) {
        await addBlock({ type: 'AddBlock', sessionId: session.id, exerciseName: s.name, exerciseCategory: s.category });
      }
    }
  };

  if (!hasSession && !isEditing) {
    return (
      <UndoToastProvider>
        <div className="column">
          <div className="row space-between align-center compact">
            <h2>Workout</h2>
            <button className="primary sm" onClick={() => navigate('/new-session')}>
              ＋ Add
            </button>
          </div>

          <SessionFilterBar
            filters={sessionFilters}
            onChange={setSessionFilters}
          />

          {sessionFilters.view === 'month' && (
            <MonthCalendar
              sessions={combinedSessions}
              typeFilter={sessionFilters.type}
            />
          )}
          {sessionFilters.view === 'week' && (
            <WeekCalendar
              sessions={combinedSessions}
              typeFilter={sessionFilters.type}
            />
          )}

          <SessionTypeExerciseFilter
            filters={sessionFilters}
            onChange={setSessionFilters}
            exerciseOptions={allExerciseNames}
          />

          <WorkoutFilterLayer
            sessionType={sessionFilters.type}
            exercise={sessionFilters.exercise}
            dateRange={sessionFilters.dateRange}
            onClearType={() => setSessionFilters(prev => ({ ...prev, type: 'all' }))}
            onClearExercise={() => setSessionFilters(prev => ({ ...prev, exercise: '' }))}
            onClearDateRange={() => setSessionFilters(prev => ({ ...prev, dateRange: 'all' }))}
          />

          {sessionFilters.view === 'list' && (() => {
            if (filteredSessions.length === 0) {
              return <p className="caption">No sessions found</p>;
            }
            const groups = new Map<number, CombinedEntry[]>();
            for (const entry of filteredSessions) {
              const yr = new Date(entry.session.startedAt).getFullYear();
              groups.set(yr, [...(groups.get(yr) ?? []), entry]);
            }
            const years = Array.from(groups.keys()).sort((a, b) =>
              sessionFilters.sort === 'oldest' ? a - b : b - a
            );
            return (
              <div className="column">
                {years.map(yr => (
                  <div key={yr} className="column">
                    <p className="eyebrow compact">{yr}</p>
                    {groups.get(yr)!.map((entry, i) =>
                      entry.kind === 'strength'
                        ? <StrengthSessionItem
                            key={i}
                            session={entry.session}
                            matchedExercise={entry.matchedExercise}
                          />
                        : <CardioSessionItem
                            key={i}
                            session={entry.session}
                          />
                    )}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </UndoToastProvider>
    );
  }

  if (isEditing && session) {
    return (
      <UndoToastProvider>
        <FinishedView session={session} />
      </UndoToastProvider>
    );
  }

  if (showPicker) {
    return (
      <UndoToastProvider>
        <ExercisePicker
          onClose={() => setShowPicker(false)}
          onCommit={async (selections, bt) => {
            await handlePickerCommit(selections, bt);
            setShowPicker(false);
          }}
        />
      </UndoToastProvider>
    );
  }

  return (
    <UndoToastProvider>
      <WorkoutView
        session={session}
        conditions={conditions}
        isActive={hasSession && !isEditing}
        isPaused={timer.isPaused}
        timerDisplay={timer.display}
        onPause={timer.pause}
        onResume={timer.resume}
        onAddExercise={() => setShowPicker(true)}
        onFinish={() => setShowFinish(true)}
        timerNotStarted={timerNotStarted}
        onStartTimer={() => {
          if (session?.id) {
            void updateStartTime({
              type: 'UpdateSessionStartTime',
              sessionId: session.id,
              startedAt: Date.now(),
            });
          }
        }}
      />
      {showFinish && session && (
        <FinishSessionModal session={session} onClose={() => setShowFinish(false)} />
      )}
    </UndoToastProvider>
  );
}
