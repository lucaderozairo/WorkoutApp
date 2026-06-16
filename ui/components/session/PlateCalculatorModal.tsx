import { useState, useCallback } from 'react';
import { Row, Column, Cluster } from '@ui/layout';
import { Surface, Text } from '@ui/atoms';
import { Button, Input, Modal } from '@ui/molecules';
import { calculatePlates } from '@features/progression';
import type { PlateCalculation } from '@shared/contracts';

export interface PlateCalculatorModalProps {
  open: boolean;
  onClose: () => void;
  initialWeightKg?: number;
}

export function PlateCalculatorModal({ open, onClose, initialWeightKg }: PlateCalculatorModalProps) {
  const [target, setTarget] = useState(String(initialWeightKg ?? ''));
  const [bar, setBar] = useState('20');
  const [result, setResult] = useState<PlateCalculation | null>(null);

  const handleCalculate = useCallback(() => {
    const t = parseFloat(target);
    const b = parseFloat(bar);
    if (!t || !b || t <= b) return;
    setResult(calculatePlates(t, b));
  }, [target, bar]);

  const handleClose = () => {
    setResult(null);
    setTarget(String(initialWeightKg ?? ''));
    setBar('20');
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Plate Calculator" size="sm">
      <Column gap={2}>
        <Column gap={1}>
          <Input
            label="Target weight (kg)"
            type="number"
            controlClassName="mono num full-width"
            value={target}
            min="1"
            step="0.5"
            placeholder="e.g. 100"
            onChange={e => setTarget(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCalculate(); }}
          />
          <Input
            label="Bar weight (kg)"
            type="number"
            controlClassName="mono num full-width"
            value={bar}
            min="0"
            step="0.5"
            onChange={e => setBar(e.target.value)}
          />
        </Column>

        <Button type="button" variant="primary" onClick={handleCalculate}>
          Calculate
        </Button>

        {result && (
          <Surface variant="flat" pad="md">
            <Column gap={1}>
              <Row justify="between">
                <Text size="caption" color="muted">Bar</Text>
                <Text size="detail" mono>{result.barWeightKg} kg</Text>
              </Row>
              <Row justify="between">
                <Text size="caption" color="muted">Per side</Text>
                <Cluster gap={1}>
                  {result.perSide.map((p, i) => (
                    <Text key={i} size="detail" mono>{p} kg</Text>
                  ))}
                  {result.perSide.length === 0 && (
                    <Text size="caption" color="faint">None</Text>
                  )}
                </Cluster>
              </Row>
              {result.remainderKg > 0 && (
                <Row justify="between">
                  <Text size="caption" color="muted">Remainder</Text>
                  <Text size="detail" mono color="negative">{result.remainderKg} kg</Text>
                </Row>
              )}
              <Row justify="between">
                <Text size="caption" color="muted">Total</Text>
                <Text size="detail" mono>{result.targetWeightKg} kg</Text>
              </Row>
            </Column>
          </Surface>
        )}

        <Button type="button" variant="ghost" onClick={handleClose}>
          Close
        </Button>
      </Column>
    </Modal>
  );
}
