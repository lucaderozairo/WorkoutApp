interface DividerProps {
  size?: 'sm' | 'md';
  className?: string;
}

export function Divider({ size = 'md', className }: DividerProps) {
  const classes = ['list-divider', size === 'sm' ? 'list-divider-sm' : '', className]
    .filter(Boolean).join(' ');
  return <hr className={classes} />;
}
