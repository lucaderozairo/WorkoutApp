import { Button } from '@ui/molecules/Button';
import { Row } from '@ui/layout/Row';

interface PainScaleProps {
  value: number;
  max?: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
}

export function PainScale({ value, max = 10, onChange, readOnly = false }: PainScaleProps) {
  return (
    <Row gap={1} align="center">
      {Array.from({ length: max }, (_, i) => (
        <Button
          key={i}
          type="button"
          variant="ghost"
          className="dot pain pain-control"
          data-active={i < value ? 'true' : undefined}
          disabled={readOnly}
          onClick={() => onChange?.(i + 1)}
          aria-label={`Pain level ${i + 1}`}
        />
      ))}
    </Row>
  );
}
