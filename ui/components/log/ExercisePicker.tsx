import { useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { EXERCISES } from '@data/static/exercises';
import type { ExerciseCategory } from '@features/training_log';
import { EXERCISE_GROUPS, BT_OPTIONS } from '@features/training_log/projections/viewTypes';
import { Row, Column, Cluster } from '@ui/layout';
import { Surface } from '@ui/atoms';

export interface ExercisePickerProps {
  onClose: () => void;
  onCommit: (selections: Array<{ name: string; category: ExerciseCategory }>, blockType: typeof BT_OPTIONS[number]) => void;
}

export function ExercisePicker({ onClose, onCommit }: ExercisePickerProps) {
  const [search, setSearch] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<typeof EXERCISE_GROUPS[number]>('All');
  const [blockType, setBlockType] = useState<typeof BT_OPTIONS[number]>('Standard');
  const [pending, setPending] = useState<string[]>([]);

  const isMulti = blockType === 'Superset' || blockType === 'Circuit';

  const filtered = EXERCISES.filter(ex => {
    const groupOk = muscleGroup === 'All'
      || (muscleGroup === 'Cardio' && ex.category === 'cardio')
      || (muscleGroup === 'Mobility' && ex.category === 'mobility')
      || ex.muscleGroup === muscleGroup;
    const searchOk = !search
      || ex.name.toLowerCase().includes(search.toLowerCase())
      || ex.muscle.toLowerCase().includes(search.toLowerCase());
    return groupOk && searchOk;
  });

  const groupKeys = filtered.reduce<string[]>((acc, ex) => {
    const key = ex.muscleGroup ?? (ex.category === 'cardio' ? 'Cardio' : 'Mobility');
    if (!acc.includes(key)) acc.push(key);
    return acc;
  }, []);

  const handleSelect = (name: string) => {
    const ex = EXERCISES.find(e => e.name === name);
    const category = ex?.category ?? 'strength';
    if (isMulti) {
      setPending(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
    } else {
      onCommit([{ name, category }], blockType);
      onClose();
    }
  };

  const handleCommit = () => {
    if (pending.length === 0) return;
    onCommit(pending.map(name => ({ name, category: EXERCISES.find(e => e.name === name)?.category ?? 'strength' })), blockType);
    onClose();
  };

  return (
    <Surface>
      <Column>
        <Row align="center" justify="between">
          <h3 className="detail">Add Exercise</h3>
          <button type="button" className="icon sm secondary" onClick={onClose}>
            <X size={14} />
          </button>
        </Row>

        <Cluster>
          {BT_OPTIONS.map(bt => (
            <button
              key={bt}
              type="button"
              className={`chip${blockType === bt ? ' active' : ''}`}
              onClick={() => { setBlockType(bt); setMuscleGroup('All'); setPending([]); }}
            >
              {bt}
            </button>
          ))}
        </Cluster>

        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search exercises…"
        />

        <Cluster>
          {EXERCISE_GROUPS.map(g => (
            <button
              key={g}
              type="button"
              className={`chip${muscleGroup === g ? ' active' : ''}`}
              onClick={() => setMuscleGroup(g)}
            >
              {g}
            </button>
          ))}
        </Cluster>

        {isMulti && (
          <p className="caption faint">
            Select 2 or more exercises, then tap Add.
          </p>
        )}

        <Column>
          {groupKeys.map(grp => (
            <Column key={grp}>
              <span className="eyebrow">{grp}</span>
              {filtered
                .filter(ex => (ex.muscleGroup ?? (ex.category === 'cardio' ? 'Cardio' : 'Mobility')) === grp)
                .map((ex, i, arr) => {
                  const isSelected = pending.includes(ex.name);
                  return (
                    <button
                      key={i}
                      type="button"
                      className={`surface row space-between${isSelected ? ' active' : ''}${i < arr.length - 1 ? ' bordered-bottom' : ''}`}
                      onClick={() => handleSelect(ex.name)}
                    >
                      <Column gap={1} align="start" className="grow">
                        <span className="detail">{ex.name}</span>
                        <span className="caption">{ex.muscle}</span>
                      </Column>
                      {isSelected
                        ? <Check size={14} className="accent" />
                        : <span className="pill"><span className="dot" />{ex.defaultEquip}</span>
                      }
                    </button>
                  );
                })
              }
            </Column>
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
        </Column>
      </Column>
    </Surface>
  );
}
