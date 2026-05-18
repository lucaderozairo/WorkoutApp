import { AlertTriangle } from 'lucide-react';
import { SetRow } from './SetRow';
import { SetsBarChart } from './SetsBarChart';
import { CommentLine } from './CommentLine';
import { LetterBadge } from './LetterBadge';
import { getWarnings } from '@features/training_log/projections/mappers';
import type { UIExercise, UICondition } from '@features/training_log/projections/viewTypes';
import type { SetMode } from '@data/static/exercises';

export interface ExerciseSectionProps {
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
  currentMode: SetMode;
  availableModes: SetMode[];
  onSetModeChange: (mode: SetMode) => void;
}

export function ExerciseSection({
  ex, openMenu, onOpenMenu, onToggleWarmup, onToggleDone, onDeleteRequest, onAddSet, onUpdateSet, onCommentSet,
  injuries, acknowledged, onAcknowledge, currentMode, availableModes, onSetModeChange,
}: ExerciseSectionProps) {
  const warnings = getWarnings(ex.name, injuries);
  const isAcked = acknowledged.has(ex.name);

  return (
    <div className="column compact">
      <div className="row align-center space-between">
        <div className="row compact grow align-center">
          <button className="icon ghost" disabled>
            {ex.label && <LetterBadge letter={ex.label} />}
          </button>
          <h3 className="grow">{ex.name}</h3>
          <span className="caption muted faint">{currentMode}</span>
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
                <AlertTriangle size={10} className="faint" />
              </button>
            </div>
          ))}
        </div>
      )}

      {ex.comment && <CommentLine text={ex.comment} indent={Boolean(ex.label)} />}
      {ex.sets && (
        <SetsBarChart sets={ex.sets} />
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
              currentMode={currentMode}
              availableModes={availableModes}
              onSetModeChange={onSetModeChange}
            />
          );
        })}
      </div>

      <button type="button" className="ghost surface tight" onClick={onAddSet}>+ Add Set</button>
    </div>
  );
}
