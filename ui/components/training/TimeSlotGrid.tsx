import type { ReactNode } from 'react';
import { Grid } from '@ui/layout';

export function TimeSlotGrid({ children }: { children: ReactNode }) {
  return (
    <Grid cols="40px repeat(7, 1fr)" gap={1} className="time-slot-grid">
      {children}
    </Grid>
  );
}
