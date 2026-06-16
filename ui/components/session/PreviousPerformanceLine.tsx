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
    <Row align="center" gap={1} className="surface pad-xs">
      <Text size="caption" color="muted">Last session:</Text>
      {maxW != null && <Text size="caption" mono>{maxW} kg</Text>}
      {e1rm != null && e1rm > 0 && (
        <Text size="caption" color="faint">(e1RM {e1rm} kg)</Text>
      )}
      <Text size="caption" color="faint">{performance.sets.length} sets</Text>
    </Row>
  );
}
