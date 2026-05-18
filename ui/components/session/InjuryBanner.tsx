import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import type { UICondition } from '@features/training_log/projections/viewTypes';
import { worstActiveCondition } from '@features/training_log/projections/mappers';

export function InjuryBanner({ conditions }: { conditions: UICondition[] }) {
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
