import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import type { UICondition } from '@features/training_log/projections/viewTypes';
import { worstActiveCondition } from '@features/training_log/projections/mappers';
import { Row, Column } from '@ui/layout';
import { Surface, Text } from '@ui/atoms';
import { Badge, Button } from '@ui/molecules';

export function InjuryBanner({ conditions }: { conditions: UICondition[] }) {
  const [open, setOpen] = useState(false);
  const active = conditions.filter(c => c.active);
  if (!active.length) return null;

  const top = worstActiveCondition(conditions)!;
  const sevClass = top.severity === 'severe' ? 'warning' : 'caution';

  return (
    <Surface className={sevClass}>
      <Column>
        <Button type="button" variant="ghost" block onClick={() => setOpen(v => !v)}>
          <Row align="center" justify="between">
            <Row gap={1} align="center">
              <AlertTriangle size={13} />
              <Text size="detail">
                {active.length} injury warning{active.length > 1 ? 's' : ''} active
              </Text>
              {!open && <Text size="caption">· tap to review</Text>}
            </Row>
            {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </Row>
        </Button>

        {open && (
          <Column gap={1}>
            {active.map(inj => {
              const badgeTone = inj.severity === 'severe' ? 'bad' : 'warn';
              return (
                <Column key={inj.id} gap={1}>
                  <Row gap={1} align="center">
                    <Text size="detail" className="min-w-0">{inj.fullName}</Text>
                    <Badge tone={badgeTone}>{inj.severity}</Badge>
                  </Row>
                  <Text size="caption">{inj.advice}</Text>
                  <Row gap={1}>
                    {inj.affectedExercises.map(ex => (
                      <Badge key={ex}>{ex}</Badge>
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
