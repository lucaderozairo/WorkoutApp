import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import type { UICondition } from '@features/training_log/projections/viewTypes';
import { worstActiveCondition } from '@features/training_log/projections/mappers';
import { Row, Column } from '@ui/layout';
import { Surface } from '@ui/atoms';

export function InjuryBanner({ conditions }: { conditions: UICondition[] }) {
  const [open, setOpen] = useState(false);
  const active = conditions.filter(c => c.active);
  if (!active.length) return null;

  const top = worstActiveCondition(conditions)!;
  const sevClass = top.severity === 'severe' ? 'warning' : 'caution';

  return (
    <Surface className={sevClass}>
      <Column>
        <div
          role="button"
          tabIndex={0}
          onClick={() => setOpen(v => !v)}
          onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && setOpen(v => !v)}
        >
        <Row align="center" justify="between">
          <Row gap={1} align="center">
            <AlertTriangle size={13} />
            <span className="detail">
              {active.length} injury warning{active.length > 1 ? 's' : ''} active
            </span>
            {!open && <span className="caption">· tap to review</span>}
          </Row>
          {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </Row>
        </div>

        {open && (
          <Column gap={1}>
            {active.map(inj => {
              const badgeCls = inj.severity === 'severe' ? 'warning' : 'caution';
              return (
                <Column key={inj.id} gap={1}>
                  <Row gap={1} align="center">
                    <span className="detail grow">{inj.fullName}</span>
                    <span className={`badge ${badgeCls}`}>{inj.severity}</span>
                  </Row>
                  <p className="caption">{inj.advice}</p>
                  <Row gap={1}>
                    {inj.affectedExercises.map(ex => (
                      <span key={ex} className="badge">{ex}</span>
                    ))}
                  </Row>
                </Column>
              );
            })}
          </Column>
        )}
      </Column>
    </Surface>
  );
}
