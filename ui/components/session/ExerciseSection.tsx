import { AlertTriangle } from 'lucide-react';
import { SetRow } from './SetRow';
import { SetsBarChart } from './SetsBarChart';
import { CommentLine } from './CommentLine';
import { LetterBadge } from './LetterBadge';
import { getWarnings } from '@features/training_log/projections/mappers';
import type { UIExercise, UICondition } from '@features/training_log/contract';
import type { SetMode } from '@data/static/exercises';
import { Row, Column } from '@ui/layout';
import { Text } from '@ui/atoms';
import { Button } from '@ui/molecules';

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
    <Column gap={1}>
      <Row align="center" justify="between">
        <Row gap={1} align="center" className="grow">
          {ex.label && <LetterBadge letter={ex.label} />}
          <Text as="h3" className="grow">{ex.name}</Text>
          <Text size="caption" color="faint">{currentMode}</Text>
          {warnings.length > 0 && (
            <AlertTriangle size={11} className="muted" />
          )}
        </Row>
      </Row>

      {warnings.length > 0 && !isAcked && (
        <Column gap={1}>
          {warnings.map(w => (
            <Row key={w.id} align="center" gap={1}>
              <Text size="caption" className="grow">{w.advice}</Text>
              <Button type="button" variant="ghost" size="icon" onClick={() => onAcknowledge(ex.name)}>
                <AlertTriangle size={10} className="faint" />
              </Button>
            </Row>
          ))}
        </Column>
      )}

      {ex.comment && <CommentLine text={ex.comment} indent={Boolean(ex.label)} />}
      {ex.sets && (
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
      </Column>

      <Button type="button" variant="ghost" className="surface pad-sm" onClick={onAddSet}>+ Add Set</Button>
    </Column>
  );
}
