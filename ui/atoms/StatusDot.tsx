import { Dot } from './Dot';

type StatusTone = 'neutral' | 'live' | 'online' | 'offline' | 'idle' | 'syncing' | 'error' | 'success' | 'warning';

interface StatusDotProps {
  tone?: StatusTone;
  size?: 'sm' | 'md';
  label?: string;
  className?: string;
}

const TONE_CLASS: Record<StatusTone, string> = {
  neutral: '',
  live: 'status-live',
  online: 'status-online',
  offline: 'status-offline',
  idle: 'status-idle',
  syncing: 'status-syncing',
  error: 'status-error',
  success: 'status-success',
  warning: 'status-warning',
};

export function StatusDot({ tone = 'neutral', size = 'md', label, className }: StatusDotProps) {
  const classes = ['status-dot', TONE_CLASS[tone], className].filter(Boolean).join(' ');

  return (
    <span className={classes} aria-label={label}>
      <span aria-hidden={label ? true : undefined}>
        <Dot size={size} active />
      </span>
    </span>
  );
}
