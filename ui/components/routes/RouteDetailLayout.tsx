import type { ReactNode } from 'react';
import { Column, Grid } from '@ui/layout';
import { Surface } from '@ui/atoms';

interface RouteDetailLayoutProps {
  header: ReactNode;
  mapSlot: ReactNode;
  children?: ReactNode;
  aside: ReactNode;
}

export function RouteDetailLayout({ header, mapSlot, children, aside }: RouteDetailLayoutProps) {
  return (
    <Grid gap={4} className="route-detail-screen">
      {header}
      <Grid cols="minmax(0, 1.25fr) minmax(320px, .75fr)" gap={4} className="route-detail-grid">
        <Column gap={3}>
          <Surface pad="none" className="route-detail-map">
            {mapSlot}
          </Surface>
          {children}
        </Column>
        <Column gap={3}>
          {aside}
        </Column>
      </Grid>
    </Grid>
  );
}

interface RouteProfileIconProps {
  children: ReactNode;
  className?: string;
}

export function RouteProfileIcon({ children, className }: RouteProfileIconProps) {
  const cls = ['row align-center justify-center route-card-icon', className].filter(Boolean).join(' ');
  return (
    <span className={cls} aria-hidden>
      {children}
    </span>
  );
}
