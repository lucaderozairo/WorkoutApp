interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <span
      className={['spinner', size, className].filter(Boolean).join(' ')}
      role="status"
      aria-label="Loading"
    />
  );
}
