import { useState } from 'react';
import type { PlannedExercise } from '@features/planning';

interface StepGymProps {
  sessionName: string;
  exercises: PlannedExercise[];
  onSessionNameChange: (name: string) => void;
  onExercisesChange: (exercises: PlannedExercise[]) => void;
}

const EXERCISE_SUGGESTIONS = [
  'Bench Press', 'Overhead Press', 'Squat', 'Deadlift', 'Pull-up',
  'Bent Over Row', 'Incline DB Press', 'Lateral Raise', 'Bicep Curl',
  'Tricep Extension', 'Leg Press', 'Romanian Deadlift',
];

function ExerciseRow({
  ex,
  onChange,
  onRemove,
}: {
  ex: PlannedExercise;
  onChange: (updated: PlannedExercise) => void;
  onRemove: () => void;
}) {
  return (
    <div className="row align-center">
      <div className="column compact grow">
        <span className="detail">{ex.name}</span>
        <div className="row compact align-center">
          <input
            type="number"
            min={1}
            max={20}
            value={ex.sets}
            onChange={e => onChange({ ...ex, sets: Math.max(1, Number(e.target.value)) })}
            aria-label="Sets"
            className="input-count"
          />
          <span className="caption muted">sets ×</span>
          <input
            type="number"
            min={1}
            max={100}
            value={ex.reps}
            onChange={e => onChange({ ...ex, reps: Math.max(1, Number(e.target.value)) })}
            aria-label="Reps"
            className="input-count"
          />
          <span className="caption muted">reps</span>
          <input
            type="number"
            min={0}
            step={2.5}
            value={ex.weightKg}
            onChange={e => onChange({ ...ex, weightKg: Math.max(0, Number(e.target.value)) })}
            aria-label="Weight kg"
            className="input-weight"
          />
          <span className="caption muted">kg</span>
        </div>
      </div>
      <button type="button" className="ghost icon sm" onClick={onRemove} aria-label="Remove">
        ×
      </button>
    </div>
  );
}

export function StepGym({ sessionName, exercises, onSessionNameChange, onExercisesChange }: StepGymProps) {
  const [search, setSearch] = useState('');
  const [showPicker, setShowPicker] = useState(false);

  const filtered = EXERCISE_SUGGESTIONS.filter(
    name => name.toLowerCase().includes(search.toLowerCase()) &&
      !exercises.some(e => e.name === name),
  );

  function addExercise(name: string) {
    onExercisesChange([...exercises, { name, sets: 3, reps: 8, weightKg: 0 }]);
    setSearch('');
    setShowPicker(false);
  }

  function updateExercise(idx: number, updated: PlannedExercise) {
    onExercisesChange(exercises.map((e, i) => (i === idx ? updated : e)));
  }

  function removeExercise(idx: number) {
    onExercisesChange(exercises.filter((_, i) => i !== idx));
  }

  return (
    <div className="column">
      <div className="column compact">
        <label className="caption">Session name</label>
        <input
          type="text"
          value={sessionName}
          onChange={e => onSessionNameChange(e.target.value)}
          placeholder="e.g. Morning Workout"
        />
      </div>

      <div className="surface column compact">
        {exercises.length === 0 && (
          <p className="caption muted">No exercises added yet.</p>
        )}
        {exercises.map((ex, idx) => (
          <ExerciseRow
            key={idx}
            ex={ex}
            onChange={updated => updateExercise(idx, updated)}
            onRemove={() => removeExercise(idx)}
          />
        ))}

        {showPicker ? (
          <div className="column compact">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search exercises…"
              autoFocus
            />
            <div className="column compact">
              {filtered.slice(0, 8).map(name => (
                <button
                  key={name}
                  type="button"
                  className="ghost"
                  onClick={() => addExercise(name)}
                >
                  {name}
                </button>
              ))}
            </div>
            <button type="button" className="ghost sm" onClick={() => setShowPicker(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <button type="button" className="secondary sm" onClick={() => setShowPicker(true)}>
            + Add exercise
          </button>
        )}
      </div>
    </div>
  );
}
