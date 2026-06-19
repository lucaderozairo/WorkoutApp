import { Row } from '@ui/layout';
import { Surface, Text } from '@ui/atoms';
import type { PreviousExercisePerformance } from '@shared/contracts';

export interface PreviousPerformanceLineProps {
  performance: PreviousExercisePerformance;
}

export function PreviousPerformanceLine({ performance }: PreviousPerformanceLineProps) {
  const maxW = performance.maxWeightKg;
  const e1rm = performance.estimatedOneRepMax;
  return (
    <Row align="center" gap={2}>
      <Text size="caption" color="muted">Last session:</Text>
      {maxW != null && <Text size="caption" mono>{maxW} kg</Text>}
      <Text size="caption" color="faint">{performance.sets.length} sets</Text>
      {e1rm != null && e1rm > 0 && (
        <Text size="caption" color="faint">(Estimated 1RM {e1rm.toFixed(1)} kg)</Text>
      )}
    </Row>
  );
}
