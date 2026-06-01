import { useState, useEffect } from 'react';
import { Surface, Text } from '@ui/atoms';
import { Grid, Row, Column } from '@ui/layout';
import type { UICardioSet } from '@features/training_log/projections/viewTypes';

export const CARDIO_FIELDS: Array<{
  key: keyof UICardioSet;
  label: string;
  unit: string;
  step: number;
  toDisplay: (v: number) => string;
  fromDisplay: (s: string) => number;
}> = [
  { key: 'durationSeconds', label: 'Duration', unit: 'min', step: 0.5, toDisplay: v => v > 0 ? String(Math.round(v / 60 * 10) / 10) : '', fromDisplay: s => Math.round((parseFloat(s) || 0) * 60) },
  { key: 'distanceMeters', label: 'Distance', unit: 'km', step: 0.01, toDisplay: v => v > 0 ? String(Math.round(v / 10) / 100) : '', fromDisplay: s => Math.round((parseFloat(s) || 0) * 1000) },
  { key: 'avgPowerWatts', label: 'Avg Power', unit: 'W', step: 1, toDisplay: v => v > 0 ? String(v) : '', fromDisplay: s => Math.round(parseFloat(s) || 0) },
  { key: 'resistance', label: 'Resistance', unit: 'level', step: 1, toDisplay: v => v > 0 ? String(v) : '', fromDisplay: s => Math.round(parseFloat(s) || 0) },
];

export function CardioEditor({ cardioSet, onUpdate }: {
  cardioSet: UICardioSet | null;
  onUpdate: (field: keyof UICardioSet, value: number) => void;
}) {
  const defaults: UICardioSet = cardioSet ?? { setNumber: 0, durationSeconds: 0, distanceMeters: 0, avgPowerWatts: 0, resistance: 0 };
  const [vals, setVals] = useState(() =>
    CARDIO_FIELDS.reduce<Record<string, string>>((acc, f) => ({ ...acc, [f.key]: f.toDisplay(defaults[f.key] as number) }), {})
  );

  useEffect(() => {
    setVals(CARDIO_FIELDS.reduce<Record<string, string>>((acc, f) => ({ ...acc, [f.key]: f.toDisplay(defaults[f.key] as number) }), {}));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardioSet?.durationSeconds, cardioSet?.distanceMeters, cardioSet?.avgPowerWatts, cardioSet?.resistance]);

  return (
    <Surface pad="sm"><Grid variant="double" gap={1}>
      {CARDIO_FIELDS.map(f => (
        <Column key={f.key} gap={1}>
          <Text size="eyebrow">{f.label}</Text>
          <Row gap={1} align="center">
            <input
              type="number"
              className="mono num"
              value={vals[f.key]}
              placeholder="—"
              min="0"
              step={f.step}
              onChange={e => setVals(prev => ({ ...prev, [f.key]: e.target.value }))}
              onBlur={e => onUpdate(f.key, f.fromDisplay(e.target.value))}
            />
            <Text size="caption" color="muted">{f.unit}</Text>
          </Row>
        </Column>
      ))}
    </Grid></Surface>
  );
}
