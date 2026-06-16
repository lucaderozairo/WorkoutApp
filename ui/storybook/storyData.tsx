import type { ReactNode } from 'react';
import { Activity, BarChart3, CalendarDays, Dumbbell, Map, MoreHorizontal, Upload } from 'lucide-react';
import { Badge } from '@ui/molecules/Badge';
import { Button } from '@ui/molecules/Button';
import { Row } from '@ui/layout/Row';
import { Column } from '@ui/layout/Column';

export const noop = () => {};

export function StoryPanel({ children, maxWidth = 520 }: { children: ReactNode; maxWidth?: number }) {
  return (
    <div style={{ maxWidth, padding: 'var(--space-4)' }}>
      {children}
    </div>
  );
}

export const commandItems = [
  { id: 'start-session', label: 'Start planned session', keywords: ['workout', 'training'], onSelect: noop },
  { id: 'log-readiness', label: 'Log readiness score', keywords: ['hrv', 'sleep'], onSelect: noop },
  { id: 'open-routes', label: 'Open route planner', keywords: ['map', 'run'], onSelect: noop },
  { id: 'disabled-export', label: 'Export pending sync', keywords: ['csv'], disabled: true, onSelect: noop },
];

export const menuItems = [
  { label: 'Edit session', icon: <Dumbbell size={16} aria-hidden="true" />, onClick: noop },
  { label: 'Duplicate plan', icon: <CalendarDays size={16} aria-hidden="true" />, onClick: noop },
  { label: 'Delete entry', destructive: true, onClick: noop },
];

export const trainingRows = [
  { id: 'tempo', session: 'Tempo run', duration: '48:00', load: 74, status: 'Complete' },
  { id: 'lift', session: 'Strength A', duration: '62:00', load: 88, status: 'Planned' },
  { id: 'recovery', session: 'Recovery spin', duration: '35:00', load: 22, status: 'Optional' },
];

export const toolbarButtons = (
  <>
    <Button variant="ghost" size="icon" aria-label="Open analytics"><BarChart3 size={18} aria-hidden="true" /></Button>
    <Button variant="ghost" size="icon" aria-label="Open routes"><Map size={18} aria-hidden="true" /></Button>
    <Button variant="primary" size="sm" leading={<Activity size={14} aria-hidden="true" />}>Start</Button>
  </>
);

export const uploadPrompt = (
  <Column align="center" gap={2}>
    <Upload size={24} aria-hidden="true" />
    <Column align="center" gap={0}>
      <strong>Import FIT or CSV files</strong>
      <span className="caption muted">Drop files here or choose from disk</span>
    </Column>
  </Column>
);

export const settingsRows = (
  <Column gap={2}>
    <Row justify="between" align="center">
      <span>Training units</span>
      <Badge tone="plain">Metric</Badge>
    </Row>
    <Row justify="between" align="center">
      <span>Device sync</span>
      <Badge tone="ok">Connected</Badge>
    </Row>
  </Column>
);

export const moreButton = (
  <Button variant="ghost" size="icon" aria-label="More actions">
    <MoreHorizontal size={18} aria-hidden="true" />
  </Button>
);
