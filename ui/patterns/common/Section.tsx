import { useId, type ReactNode } from 'react';
import { Column, Row } from '@ui/layout';
import type { Gap } from '@ui/layout/_classes';
import { Skeleton, Surface, Text, type SurfaceVariant } from '@ui/atoms';
import { Button } from '@ui/molecules';

interface SectionAction {
  label: string;
  onClick: () => void;
}

interface SectionProps {
  label: string;
  labelSurface?: SurfaceVariant;
  action?: SectionAction;
  gap?: Gap;
  children: ReactNode;
}

interface SectionSkeletonProps {
  labelSurface?: SurfaceVariant;
  action?: boolean;
  gap?: Gap;
  rows?: number;
  children?: ReactNode;
}

function SectionSkeleton({
  labelSurface,
  action = false,
  gap = 3,
  rows = 2,
  children,
}: SectionSkeletonProps) {
  const label = <Skeleton size="line" short className="text-9" />;

  return (
    <Column as="section" gap={gap} aria-hidden>
      <Row justify="between" align="center">
        {labelSurface ? (
          <Surface variant={labelSurface} pad="xs">
            {label}
          </Surface>
        ) : label}
        {action ? <Skeleton size="line" short className="text-9" /> : null}
      </Row>
      {children ?? (
        <Column gap={2} aria-hidden>
          {Array.from({ length: rows }, (_, index) => (
            <Skeleton key={index} size="line" short={index === rows - 1} />
          ))}
        </Column>
      )}
    </Column>
  );
}

function SectionImpl({ label, labelSurface, action, gap = 3, children }: SectionProps) {
  const labelId = useId();
  const labelContent = <Text size="eyebrow" id={labelId}>{label}</Text>;

  return (
    <Column as="section" gap={gap} aria-labelledby={labelId}>
      <Row justify="between" align="center">
        {labelSurface ? (
          <Surface variant={labelSurface} pad="xs">
            {labelContent}
          </Surface>
        ) : labelContent}
        {action ? (
          <Button variant="ghost" size="sm" onClick={action.onClick}>
            {action.label}
          </Button>
        ) : null}
      </Row>
      {children}
    </Column>
  );
}

export const Section = Object.assign(SectionImpl, { Skeleton: SectionSkeleton });
