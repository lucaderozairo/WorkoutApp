import type { PlanType } from '@features/planning';

interface StepTypeProps {
  selected: PlanType | null;
  onSelect: (type: PlanType) => void;
}

const TYPE_OPTIONS: Array<{ type: PlanType; emoji: string; label: string; desc: string }> = [
  { type: 'gym',   emoji: '🏋️', label: 'Gym session',  desc: 'Exercises, sets & reps' },
  { type: 'run',   emoji: '🏃', label: 'Run',           desc: 'Route, pace & markers' },
  { type: 'cycle', emoji: '🚴', label: 'Cycle',         desc: 'Route, pace & markers' },
  { type: 'swim',  emoji: '🏊', label: 'Swim',          desc: 'Distance & pace' },
];

export function StepType({ selected, onSelect }: StepTypeProps) {
  return (
    <div className="column">
      {TYPE_OPTIONS.map(opt => (
        <button
          key={opt.type}
          type="button"
          className={`surface row align-center interactive${selected === opt.type ? ' selected' : ''}`}
          onClick={() => onSelect(opt.type)}
        >
          <span aria-hidden>{opt.emoji}</span>
          <div className="column compact">
            <span className="detail">{opt.label}</span>
            <span className="caption muted">{opt.desc}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
