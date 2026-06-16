import { Row } from '@ui/layout';
import { Text } from '@ui/atoms';
import type { ProgressiveOverloadHint } from '@shared/contracts';

export interface OverloadHintLineProps {
  hint: ProgressiveOverloadHint;
}

export function OverloadHintLine({ hint }: OverloadHintLineProps) {
  if (hint.kind === 'no_history') {
    return (
      <Row align="center">
        <Text size="caption" color="faint">{hint.message}</Text>
      </Row>
    );
  }

  if (hint.kind === 'increase_weight') {
    return (
      <Row align="center" gap={1}>
        <Text size="caption" color="muted">{hint.message}</Text>
      </Row>
    );
  }

  return (
    <Row align="center">
      <Text size="caption" color="muted">{hint.message}</Text>
    </Row>
  );
}
