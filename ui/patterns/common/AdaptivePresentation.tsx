import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Surface, Text } from '@ui/atoms';
import { Stack, Row } from '@ui/layout';
import { Button } from '@ui/molecules/Button';

type AdaptivePresentationKind = 'screen' | 'sheet' | 'dialog' | 'drawer' | 'popover' | 'inline';

interface AdaptivePresentationProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  mobile: AdaptivePresentationKind;
  tablet?: AdaptivePresentationKind;
  desktop: AdaptivePresentationKind;
  children: ReactNode;
}

const ROLE_BY_KIND: Record<AdaptivePresentationKind, 'dialog' | 'region'> = {
  screen: 'dialog',
  sheet: 'dialog',
  dialog: 'dialog',
  drawer: 'dialog',
  popover: 'dialog',
  inline: 'region',
};

export function AdaptivePresentation({
  open,
  onClose,
  title,
  mobile,
  tablet,
  desktop,
  children,
}: AdaptivePresentationProps) {
  if (!open) return null;

  const tabletKind = tablet ?? desktop;
  const role = ROLE_BY_KIND[desktop];
  const classes = [
    'adaptive-presentation',
    `adaptive-mobile-${mobile}`,
    `adaptive-tablet-${tabletKind}`,
    `adaptive-desktop-${desktop}`,
  ].join(' ');

  return (
    <div className={classes} role={role} aria-modal={role === 'dialog' ? true : undefined} aria-label={title}>
      <Surface className="adaptive-presentation-panel">
        <Stack gap={4}>
          {title ? (
            <Row align="center" justify="between" gap={2}>
              <Text as="h2">{title}</Text>
              <Button type="button" variant="ghost" size="icon" aria-label="Close panel" onClick={onClose}>
                <X size={16} aria-hidden="true" />
              </Button>
            </Row>
          ) : null}
          <div className="adaptive-presentation-body">{children}</div>
        </Stack>
      </Surface>
    </div>
  );
}

export type { AdaptivePresentationKind };
