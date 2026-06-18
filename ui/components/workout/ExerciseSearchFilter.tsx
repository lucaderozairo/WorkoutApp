import { useState } from 'react';
import { Check, X } from 'lucide-react';
import type { SessionFilters } from '@ui/components/log/SessionFilterBar';
import { Row, Layered } from '@ui/layout';
import { Text, Chip } from '@ui/atoms';
import { Button, FloatingPanel, Input } from '@ui/molecules';

interface ExerciseSearchFilterProps {
  filters: SessionFilters;
  onChange: (f: SessionFilters) => void;
  exerciseOptions: string[];
}

export function ExerciseSearchFilter({ filters, onChange, exerciseOptions }: ExerciseSearchFilterProps) {
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [exerciseFocused, setExerciseFocused] = useState(false);

  const matchingExercises = exerciseOptions.filter(n =>
    n.toLowerCase().includes(exerciseSearch.toLowerCase())
  );

  return (
    <>
      <Text size="caption" color="muted">Exercise</Text>
      <Layered className="min-w-0">
        <Row gap={1} align="center">
          <Input
            className="min-w-0"
            placeholder="Search exercises…"
            value={exerciseSearch}
            onChange={e => setExerciseSearch(e.target.value)}
            onFocus={() => setExerciseFocused(true)}
            onBlur={() => setTimeout(() => setExerciseFocused(false), 150)}
          />
        </Row>
        {exerciseFocused && exerciseSearch && matchingExercises.length > 0 && (
          <FloatingPanel pin="below-left" z="fixed" pad="sm" className="exercise-suggestions">
            {matchingExercises.slice(0, 6).map(name => (
              <Button
                key={name}
                variant="ghost"
                block
                onMouseDown={() => {
                  onChange({ ...filters, exercise: name });
                  setExerciseSearch('');
                }}
              >
                <Row justify="between" align="center">
                  {name}
                  {filters.exercise === name && <Check size={12} />}
                </Row>
              </Button>
            ))}
            {filters.exercise && (
              <Button
                variant="ghost"
                size="sm"
                block
                onMouseDown={() => onChange({ ...filters, exercise: '' })}
              >
                Clear ✕
              </Button>
            )}
          </FloatingPanel>
        )}
      </Layered>
      {filters.exercise && (
        <Chip active trailing={<X size={9} />} onClick={() => onChange({ ...filters, exercise: '' })}>
          {filters.exercise}
        </Chip>
      )}
    </>
  );
}
