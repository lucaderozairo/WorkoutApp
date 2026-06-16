import { Row } from '@ui/layout';

interface PageControlProps {
  count: number;
  index: number;
  onChange?: (index: number) => void;
  label?: string;
}

export function PageControl({ count, index, onChange, label = 'Pages' }: PageControlProps) {
  if (count <= 1) return null;

  return (
    <Row as="nav" gap={1} align="center" justify="center" className="page-control" aria-label={label}>
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          className="page-control-dot"
          aria-label={`Go to page ${i + 1}`}
          aria-current={i === index ? 'page' : undefined}
          disabled={!onChange}
          onClick={() => onChange?.(i)}
        />
      ))}
    </Row>
  );
}
