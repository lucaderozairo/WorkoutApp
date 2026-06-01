import { useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { EXERCISES } from '@data/static/exercises';
import type { ExerciseCategory } from '@features/training_log';
import { EXERCISE_GROUPS, BT_OPTIONS } from '@features/training_log/projections/viewTypes';
import { Row, Column, Cluster } from '@ui/layout';
import { Surface, Button, Text, Badge, Chip } from '@ui/atoms';

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
          <Text as="h3" size="detail">Add Exercise</Text>
          <Button type="button" variant="secondary" size="icon" onClick={onClose}>
            <X size={14} />
          </Button>
        </Row>

        <Cluster>
          {BT_OPTIONS.map(bt => (
            <Chip
              key={bt}
              active={blockType === bt}
              onClick={() => { setBlockType(bt); setMuscleGroup('All'); setPending([]); }}
            >
              {bt}
            </Chip>
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
            <Chip
              key={g}
              active={muscleGroup === g}
              onClick={() => setMuscleGroup(g)}
            >
              {g}
            </Chip>
          ))}
        </Cluster>

        {isMulti && (
          <Text size="caption" color="faint">
            Select 2 or more exercises, then tap Add.
          </Text>
        )}

        <Column>
          {groupKeys.map(grp => (
            <Column key={grp}>
              <Text size="eyebrow">{grp}</Text>
              {filtered
                .filter(ex => (ex.muscleGroup ?? (ex.category === 'cardio' ? 'Cardio' : 'Mobility')) === grp)
                .map((ex, i, arr) => {
                  const isSelected = pending.includes(ex.name);
                  return (
                    <Surface
                      key={i}
                      interactive
                      selected={isSelected}
                      onClick={() => handleSelect(ex.name)}
                      className={i < arr.length - 1 ? 'bordered-bottom' : undefined}
                    >
                      <Row justify="between" align="center">
                        <Column gap={1} align="start" className="grow">
                          <Text size="detail">{ex.name}</Text>
                          <Text size="caption">{ex.muscle}</Text>
                        </Column>
                        {isSelected
                          ? <Check size={14} className="accent" />
                          : <Badge dot>{ex.defaultEquip}</Badge>
                        }
                      </Row>
                    </Surface>
                  );
                })
              }
            </Column>
          ))}

          {filtered.length === 0 && (
            <Text size="caption" color="muted">No exercises found</Text>
          )}

          {isMulti && pending.length >= 2 && (
            <Button variant="secondary" onClick={handleCommit}>
              Add {pending.length} exercises to {blockType}
            </Button>
          )}

          {isMulti && pending.length === 1 && (
            <Text size="caption" color="muted">Select at least one more exercise.</Text>
          )}

          {!isMulti && (
            <Button variant="secondary">
              <Plus size={12} /> Create exercise
            </Button>
          )}
        </Column>
      </Column>
    </Surface>
  );
}
